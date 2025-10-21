import { supabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const BUCKET_NAME = 'files';
const FOLDER_PRODUCTS = 'upskin_products';
const EXPIRY_SECONDS = 60 * 15; // 15 minutes
const DEFAULT_PRODUCT_COUNT = 4;

/**
 * Fisher-Yates shuffle algorithm for true randomness
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get signed URL for an image
 */
async function getImageUrl(imagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(imagePath, EXPIRY_SECONDS);

  if (error || !data) {
    throw new Error(`Failed to create signed URL for ${imagePath}`);
  }

  return data.signedUrl;
}

/**
 * Get random products from upskin_products folder
 */
async function getRandomProducts(count: number = DEFAULT_PRODUCT_COUNT): Promise<any[]> {
  console.log(`📂 Fetching products from '${FOLDER_PRODUCTS}'...`);
  
  // List all files in the folder
  const { data: allFiles, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(FOLDER_PRODUCTS, { limit: 2000 });

  if (error) {
    throw new Error(`Failed to list files in ${FOLDER_PRODUCTS}: ${error.message}`);
  }

  // Filter for image files only
  const imageFiles = (allFiles ?? []).filter(
    file =>
      file.name !== '__keep.txt' &&
      file.name.match(/\.(jpg|jpeg|JPEG|png|webp|gif)$/i)
  );

  if (imageFiles.length === 0) {
    throw new Error(`No product images found in '${FOLDER_PRODUCTS}' folder. Please upload some product images.`);
  }

  console.log(`📦 Found ${imageFiles.length} product images`);

  // Shuffle and select
  const shuffled = shuffleArray(imageFiles);
  const selected = shuffled.slice(0, Math.min(count, imageFiles.length));

  console.log(`🎲 Randomly selected ${selected.length} products:`);
  selected.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file.name}`);
  });

  // Get signed URLs for each selected product
  const products = await Promise.all(
    selected.map(async (file) => {
      const imagePath = `${FOLDER_PRODUCTS}/${file.name}`;
      const url = await getImageUrl(imagePath);
      return {
        url,
        name: file.name,
        type: 'product'
      };
    })
  );

  return products;
}

/**
 * POST endpoint: Get random product images
 * Accepts optional 'count' parameter to specify how many products to return
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, count = DEFAULT_PRODUCT_COUNT } = body;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎲 Random Product Selection');
    console.log('='.repeat(80));
    if (topic) {
      console.log(`Topic: "${topic}"`);
    }
    console.log(`Requested count: ${count}`);
    
    const images = await getRandomProducts(count);
    
    console.log('='.repeat(80));
    console.log(`✅ Successfully selected ${images.length} random products`);
    console.log('='.repeat(80) + '\n');
    
    return NextResponse.json({ images });
  } catch (err: any) {
    console.error('❌ Error in get-product-images:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET endpoint: Get random products (for testing)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get('count') || String(DEFAULT_PRODUCT_COUNT));
    
    console.log('⚠️  Using GET endpoint (for testing)');
    console.log(`Requested count: ${count}`);
    
    const images = await getRandomProducts(count);
    
    return NextResponse.json({ images });
  } catch (err: any) {
    console.error('❌ Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
