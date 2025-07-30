import { supabase } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const BUCKET_NAME = process.env.BUCKET_NAME || 'files'
const FOLDER_NAME = process.env.FOLDER_NAME || 'charmtool2'
const EXCLUDE_FILE = process.env.EXCLUDE_FILE || '__keep.txt'
const RANDOM_LIMIT = 5


export async function GET() {
  try {
    const { data: allFiles, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(FOLDER_NAME, { limit: 1000 })

    if (error) throw new Error(`Failed to list files: ${error.message}`)

    const imageFiles = (allFiles ?? []).filter(
      file =>
        file.name !== EXCLUDE_FILE &&
        file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    )

    const randomImages = imageFiles
      .sort(() => 0.5 - Math.random())
      .slice(0, RANDOM_LIMIT)

    const filenames = randomImages.map(file => file.name)

    return NextResponse.json({ images: filenames })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
