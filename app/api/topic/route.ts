import { supabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    // Parse URL to get language parameter
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || 'en';
    
    // Determine cursor table based on language
    const cursorTable = lang === 'es' 
      ? 'topic_charmchat_male_es_cursor' 
      : 'topic_charmchat_male_cursor';
    
    // Fetch current index from cursor
    const { data: cursorData, error: cursorError } = await supabase
      .from(cursorTable)
      .select('current_index')
      .eq('id', 1)
      .single();

    if (cursorError) throw cursorError;

    let currentIndex = cursorData.current_index;

    // Try to fetch the next topic
    let { data: nextTopic, error: topicError } = await supabase
      .from('topics_charmchat_male')
      .select('*')
      .gt('order_index', currentIndex)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    // If no topic found, reset index to 0 and try again
    if (topicError || !nextTopic) {
      // Reset cursor to 0
      await supabase
        .from(cursorTable)
        .update({ current_index: 0, updated_at: new Date().toISOString() })
        .eq('id', 1);

      // Fetch first topic again after reset
      const { data: resetTopic, error: resetError } = await supabase
        .from('topics_charmchat_male')
        .select('*')
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      if (resetError || !resetTopic) throw resetError || new Error('No topics_charmchat_male found after reset.');

      // Update cursor with new index
      await supabase
        .from(cursorTable)
        .update({ current_index: resetTopic.order_index, updated_at: new Date().toISOString() })
        .eq('id', 1);

      return new Response(JSON.stringify({ topic: resetTopic }), { status: 200 });
    }

    // Normal flow, topic found
    await supabase
      .from(cursorTable)
      .update({ current_index: nextTopic.order_index, updated_at: new Date().toISOString() })
      .eq('id', 1);

    return new Response(JSON.stringify({ topic: nextTopic }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
