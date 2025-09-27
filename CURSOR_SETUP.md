# Language-Specific Topic Cursor Setup

## Database Setup Required

To support separate topic cursors for English and Spanish versions, you need to create a new cursor table in your Supabase database:

### Create Spanish Cursor Table

```sql
-- Create the Spanish cursor table (copy structure from existing EN table)
CREATE TABLE topic_charmchat_male_es_cursor (
    id integer PRIMARY KEY,
    current_index integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert initial record
INSERT INTO topic_charmchat_male_es_cursor (id, current_index) VALUES (1, 0);
```

## How It Works

- **English version** (`/male`): Uses `topic_charmchat_male_cursor`
- **Spanish version** (`/male-es`): Uses `topic_charmchat_male_es_cursor`
- **Shared topic pool**: Both languages use the same `topics_charmchat_male` table
- **Independent rotation**: Each language maintains its own position in the topic sequence

## API Usage

- English: `GET /api/topic?lang=en` (or just `/api/topic`)
- Spanish: `GET /api/topic?lang=es`

This ensures users in each language get fresh topics without overlap, while both versions cover the same dating scenarios in their respective languages. 