import { supabase } from "@/lib/supabase/server";


export async function GET(req: Request) {
  try {
    const { data: cursorData, error: cursorError } = await supabase
      .from('topic_cursor')
      .select('current_index')
      .eq('id', 1)
      .single();

    if (cursorError) throw cursorError;

    const currentIndex = cursorData.current_index;

    const { data: nextTopic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .gt('order_index', currentIndex)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    if (topicError || !nextTopic) throw topicError || new Error('No more topics.');

    await supabase
      .from('topic_cursor')
      .update({ current_index: nextTopic.order_index, updated_at: new Date().toISOString() })
      .eq('id', 1);

    return new Response(JSON.stringify({ topic: nextTopic }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
