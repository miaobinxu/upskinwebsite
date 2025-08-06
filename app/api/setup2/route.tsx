import { supabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const setupSqlScript = `

-- Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cursor Table
CREATE TABLE IF NOT EXISTS public.topic_cursor (
  id INT PRIMARY KEY DEFAULT 1,
  current_index INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Cursor
INSERT INTO topic_cursor (id, current_index)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_cursor ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
-- Note: Supabase SQL API does not allow IF EXISTS for DROP POLICY, so skip if fails manually

-- Recreate optimized policies
DROP POLICY IF EXISTS "Public read" ON topics;
CREATE POLICY "Public read" ON topics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role only" ON topic_cursor;
CREATE POLICY "Service role only" ON topic_cursor
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- ✅ Insert seed topics only if table is empty
WITH existing AS (
  SELECT COUNT(*) as count FROM public.topics
)
INSERT INTO public.topics (title, order_index)
SELECT * FROM (
  VALUES
    ('Do You Communicate Like a Feminine Woman or a Masculine Woman in your relationship?', 1),
    ('How to go from getting bare minimum in relationships', 2),
    ('Here''s how to handle no contact in a situationship — without breaking down.', 3),
    ('How to handle a man in his feminine energy', 4),
    ('Post-Breakup Talks: Signs you''re with an emotionally immature partner', 5),
    ('Stop asking ''What Are We''', 6),
    ('Intimacy is not just SEX...it''s also…', 7),
    ('Texts to humble a Narcissist', 8),
    ('Feminine energy quotes to live by…', 9),
    ('How to Move On from a Breakup (Soft Girl Edition)', 10),
    ('How to Be a Mysterious Feminine Woman', 11),
    ('Signs He Likes You (But won''t say it)', 12),
    ('What having an anxious attachment style looks like in dating', 13),
    ('Feminine Ways To Speak To Him And Have Him Spoil You', 14),
    ('Out of a woman''s womb came everyone on this planet', 15),
    ('Psychology Tricks to Make Him Chase You', 16),
    ('How to Practice Detachment', 17),
    ('You are the divine feminine', 18),
    ('Savage Feminine Responses to Men', 19),
    ('Signs You''re a High Value Woman', 20),
    ('signs a woman is mostly in her masculine energy …', 21),
    ('Feminine Ways To Accept An Apology', 22),
    ('Things To Say When He''s Acting Like a Boyfriend...but won''t claim you', 23),
    ('Send Him These Texts When He''s Getting Too Comfortable', 24),
    ('Feminine ways to speak to him when setting boundaries', 25),
    ('Woman, You are never lost You have your intuition', 26),
    ('Signs of an emotionally damaged man', 27),
    ('How to know you''re in love', 28)
) AS seed(title, order_index)
WHERE (SELECT count FROM existing) = 0;

`;


const BUCKET_NAME = process.env.BUCKET_NAME || 'files'
const FOLDER_NAME = 'charmtool3' // Hardcoded to always use charmtool3
const DUMMY_FILE_CONTENT = 'init-folder';

export async function GET() {
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;

    const bucketExists = buckets?.some((b: { name: string; }) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
      });
      if (createBucketError) throw createBucketError;
    }

    const filePath = `${FOLDER_NAME}/__keep.txt`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, DUMMY_FILE_CONTENT, {
        upsert: true,
        contentType: 'text/plain',
      });
    if (uploadError && !uploadError.message.includes('Duplicate')) throw uploadError;

    const { error: rpcError } = await supabase.rpc('execute_sql_script', {
      sql: setupSqlScript,
    });
    if (rpcError) throw rpcError;

    return NextResponse.json({ message: 'Setup completed successfully' });
  } catch (error: any) {
    console.error('Setup Error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
