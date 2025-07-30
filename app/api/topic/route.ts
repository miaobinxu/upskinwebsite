import { supabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    // Fetch current index from cursor
    const { data: cursorData, error: cursorError } = await supabase
      .from('topic_cursor')
      .select('current_index')
      .eq('id', 1)
      .single();

    if (cursorError) throw cursorError;

    let currentIndex = cursorData.current_index;

    // Try to fetch the next topic
    let { data: nextTopic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .gt('order_index', currentIndex)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    // If no topic found, reset index to 0 and try again
    if (topicError || !nextTopic) {
      // Reset cursor to 0
      await supabase
        .from('topic_cursor')
        .update({ current_index: 0, updated_at: new Date().toISOString() })
        .eq('id', 1);

      // Fetch first topic again after reset
      const { data: resetTopic, error: resetError } = await supabase
        .from('topics')
        .select('*')
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      if (resetError || !resetTopic) throw resetError || new Error('No topics found after reset.');

      // Update cursor with new index
      await supabase
        .from('topic_cursor')
        .update({ current_index: resetTopic.order_index, updated_at: new Date().toISOString() })
        .eq('id', 1);

      return new Response(JSON.stringify({ topic: resetTopic }), { status: 200 });
    }

    // Normal flow, topic found
    await supabase
      .from('topic_cursor')
      .update({ current_index: nextTopic.order_index, updated_at: new Date().toISOString() })
      .eq('id', 1);

    return new Response(JSON.stringify({ topic: nextTopic }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
