# UpSkin Website - Simplified

This is the simplified version of the UpSkin website, containing only the essential functionality:

## Features

- **Root Page** (`/`): Welcome page for UpSkin
- **New Page** (`/new`): CharmChat content generator

## Project Structure

```
upskinwebsite/
├── app/
│   ├── api/
│   │   ├── get-images/     # Image fetching API
│   │   ├── setup/          # Database setup API
│   │   └── topic/          # Topic generation API
│   ├── new/                # CharmChat generator page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Welcome page
├── components/
│   ├── newcharmchat/       # CharmChat components
│   └── ui/                 # Shadcn UI components
├── lib/
│   ├── store/              # Zustand stores
│   ├── supabase/           # Supabase configuration
│   ├── generate-new-charmchat.ts
│   └── utils.ts
├── hooks/
│   └── use-toast.ts        # Toast hook
└── public/
    └── charmchat/          # CharmChat assets
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your Supabase credentials in `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `BUCKET_NAME`: Storage bucket name (optional, defaults to 'files')
- `FOLDER_NAME`: Image folder name (optional, defaults to 'charmtool2')

## Usage

1. Visit the root page for the welcome screen
2. Navigate to `/new` to generate CharmChat content
3. Click "Generate EN" to create content with AI
4. Preview and download generated images

## Technology Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- Zustand (state management)
- Shadcn/ui components