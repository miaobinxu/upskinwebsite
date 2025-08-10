import { supabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET_NAME = process.env.BUCKET_NAME || 'files';
const FOLDER_NAME = 'charmtool3'; // Hardcoded to always use charmtool3
const EXCLUDE_FILE = process.env.EXCLUDE_FILE || '__keep.txt';
const RANDOM_LIMIT = 5;
const EXPIRY_SECONDS = 60 * 15; // 15 minutes

export async function GET() {
  try {
    // List all files in the folder
    const { data: allFiles, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(FOLDER_NAME, { limit: 1000 });

    if (error) throw new Error(`Failed to list files: ${error.message}`);

    // Filter image files
    const imageFiles = (allFiles ?? []).filter(
      file =>
        file.name !== EXCLUDE_FILE &&
        file.name.match(/\.(jpg|jpeg|JPEG|png|webp|gif)$/i)
    );

    // Randomly select N images
    const randomImages = imageFiles
      .sort(() => 0.5 - Math.random())
      .slice(0, RANDOM_LIMIT);

    // Generate signed URLs
    const signedUrls = await Promise.all(
      randomImages.map(async file => {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(`${FOLDER_NAME}/${file.name}`, EXPIRY_SECONDS);

        if (error || !data) return null;
        return { name: file.name, url: data.signedUrl };
      })
    );

    const filteredUrls = signedUrls.filter(Boolean).map(i=>i?.url); // Remove nulls

    return NextResponse.json({ images: filteredUrls });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
