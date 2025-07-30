// /app/api/proxy-image/route.ts
import { supabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET_NAME = process.env.BUCKET_NAME || 'files'
const FOLDER_NAME = process.env.FOLDER_NAME || 'charmtool2'
const EXPIRY_SECONDS = 60 * 15

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get('name')

  if (!filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(`${FOLDER_NAME}/${filename}`, EXPIRY_SECONDS)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }

  const proxiedRes = await fetch(data.signedUrl)

  const contentType = proxiedRes.headers.get('Content-Type') || 'image/jpeg'

  return new NextResponse(proxiedRes.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  })
}
