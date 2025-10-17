import { supabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET_NAME = process.env.BUCKET_NAME || 'files';
const EXCLUDE_FILE = process.env.EXCLUDE_FILE || '__keep.txt';
const EXPIRY_SECONDS = 60 * 15; // 15 minutes

export async function POST(req: Request) {
  try {
    const { structure } = await req.json();
    
    console.log('📦 Received structure:', structure);
    
    // structure should be an array like ['luxury', 'affordable', 'luxury', 'affordable']
    if (!Array.isArray(structure) || structure.length === 0) {
      return NextResponse.json({ error: 'Invalid structure array' }, { status: 400 });
    }

    // Pre-fetch all images from both folders
    const luxuryFiles = await fetchImagesFromFolder('upskin_products_luxury');
    const affordableFiles = await fetchImagesFromFolder('upskin_products_affordable');

    // Shuffle both arrays to ensure randomness
    const shuffledLuxury = luxuryFiles.sort(() => 0.5 - Math.random());
    const shuffledAffordable = affordableFiles.sort(() => 0.5 - Math.random());

    const selectedImages: { url: string; name: string; type: string }[] = [];
    const usedImages = new Set<string>(); // Track used image names to prevent duplicates

    let luxuryIndex = 0;
    let affordableIndex = 0;

    // For each item in structure, select a unique image
    for (const type of structure) {
      const folderName = type === 'luxury' ? 'upskin_products_luxury' : 'upskin_products_affordable';
      const imagePool = type === 'luxury' ? shuffledLuxury : shuffledAffordable;
      let currentIndex = type === 'luxury' ? luxuryIndex : affordableIndex;

      console.log(`🔍 Selecting from folder: ${folderName}`);

      if (imagePool.length === 0) {
        throw new Error(`No images found in ${folderName}. Please upload images to this folder.`);
      }

      // Find the next unused image in this pool
      let selectedImage;
      let attempts = 0;
      const maxAttempts = imagePool.length;

      while (attempts < maxAttempts) {
        const candidate = imagePool[currentIndex % imagePool.length];
        const imageKey = `${folderName}/${candidate.name}`;

        if (!usedImages.has(imageKey)) {
          selectedImage = candidate;
          usedImages.add(imageKey);
          break;
        }

        currentIndex++;
        attempts++;
      }

      if (!selectedImage) {
        throw new Error(`Not enough unique images in ${folderName} for this carousel.`);
      }

      console.log(`🎲 Selected unique image: ${selectedImage.name}`);

      // Update the index for next time
      if (type === 'luxury') {
        luxuryIndex = currentIndex + 1;
      } else {
        affordableIndex = currentIndex + 1;
      }

      // Generate signed URL
      const { data, error: urlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(`${folderName}/${selectedImage.name}`, EXPIRY_SECONDS);

      if (urlError || !data) {
        console.error(`❌ Error creating signed URL for ${selectedImage.name}:`, urlError);
        throw new Error(`Failed to create signed URL for ${selectedImage.name}: ${urlError?.message || 'Unknown error'}`);
      }

      selectedImages.push({
        url: data.signedUrl,
        name: selectedImage.name,
        type: type
      });
    }

    console.log(`✅ Successfully selected ${selectedImages.length} unique product images`);
    return NextResponse.json({ images: selectedImages });
  } catch (err: any) {
    console.error('🚨 Error in get-product-images:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Helper function to fetch and filter images from a folder
async function fetchImagesFromFolder(folderName: string) {
  const BUCKET_NAME = process.env.BUCKET_NAME || 'files';
  const EXCLUDE_FILE = process.env.EXCLUDE_FILE || '__keep.txt';

  const { data: allFiles, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderName, { limit: 2000 });

  if (error) {
    console.error(`❌ Error listing files from ${folderName}:`, error);
    throw new Error(`Failed to list files from ${folderName}: ${error.message}`);
  }

  console.log(`📁 Found ${allFiles?.length || 0} files in ${folderName}`);

  // Filter image files
  const imageFiles = (allFiles ?? []).filter(
    file =>
      file.name !== EXCLUDE_FILE &&
      file.name.match(/\.(jpg|jpeg|JPEG|png|webp|gif)$/i)
  );

  console.log(`🖼️  Filtered to ${imageFiles.length} image files in ${folderName}`);

  return imageFiles;
}

