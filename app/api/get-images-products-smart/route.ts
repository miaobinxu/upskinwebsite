import { supabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const BUCKET_NAME = 'files';
const FOLDER_BECOMEX1 = 'becomex1';
const FOLDER_FIRSTPAGE = 'becomex_firstpage';
const FOLDER_SOFT_AD = 'becomex_soft_ad';
const EXPIRY_SECONDS = 60 * 15; // 15 minutes

/**
 * Get all available tags from database
 */
async function getAvailableTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('image_tags')
      .select('tags')
      .eq('folder', FOLDER_BECOMEX1);
    
    if (error || !data) {
      console.warn('Failed to fetch available tags');
      return [];
    }

    // Flatten and deduplicate all tags
    const allTags = new Set<string>();
    data.forEach(row => {
      row.tags.forEach((tag: string) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  } catch (error) {
    console.warn('Error fetching available tags:', error);
    return [];
  }
}

/**
 * Extract keywords from text using AI for better semantic understanding
 * Uses Supabase Edge Function for better security and error handling
 * AI chooses from actual database tags to guarantee matches
 */
async function extractTagsFromText(text: string, availableTags: string[]): Promise<string[]> {
  const SUPABASE_FUNCTION_URL = 'https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai-v2';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fallback: simple keyword extraction
  const fallbackExtract = () => {
    const lowerText = text.toLowerCase();
    const matches = availableTags.filter(tag => lowerText.includes(tag));
    if (matches.length > 0) {
      return matches.slice(0, 3);
    }
    // If no matches, return most common tags
    return availableTags.slice(0, 3);
  };

  // If no tags available, use fallback
  if (availableTags.length === 0) {
    console.warn('No tags available, using fallback');
    return fallbackExtract();
  }

  // If Supabase key not available, use fallback
  if (!SUPABASE_ANON_KEY) {
    console.warn('Supabase key not found, using fallback');
    return fallbackExtract();
  }

  try {
    const prompt = `From the following list of available image tags, select 2-3 tags that best match the content of this text:

Available tags: ${availableTags.join(', ')}

Text: "${text}"

Choose tags that represent the main objects, locations, or activities mentioned in the text.

Return ONLY 2-3 tags as a comma-separated list (must be from the available tags list above).
Example: "shower, bathroom, water"`;

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      console.warn('AI keyword extraction failed, using fallback');
      return fallbackExtract();
    }

    const data = await response.json();
    
    // Check which provider was used
    if (data._metadata?.usedFallback) {
      console.log('   ℹ️  Used OpenAI fallback (Azure content filter triggered)');
    }
    
    const keywords = data.choices[0].message.content
      .trim()
      .toLowerCase()
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0 && availableTags.includes(k)); // 只保留在 availableTags 中的

    if (keywords.length === 0) {
      return fallbackExtract();
    }

    return keywords;
  } catch (error) {
    console.warn('Error extracting keywords with AI:', error);
    return fallbackExtract();
  }
}

/**
 * Get image URL from path
 */
async function getImageUrl(imagePath: string): Promise<string> {
  const { data, error: urlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(imagePath, EXPIRY_SECONDS);

  if (urlError || !data) {
    throw new Error(`Failed to create signed URL for ${imagePath}`);
  }

  return data.signedUrl;
}

/**
 * Search images by tags using database function
 */
async function searchImagesByTags(
  tags: string[], 
  folder: string, 
  count: number = 1
): Promise<string[]> {
  const { data, error } = await supabase
    .rpc('search_images_by_tags', {
      search_tags: tags,
      target_folder: folder,
      match_count: count * 3 // Get more results to ensure variety
    });

  if (error) {
    console.warn(`Failed to search by tags:`, error.message);
    return [];
  }

  if (!data || data.length === 0) {
    console.log(`   ⚠️  No images found matching tags: ${tags.join(', ')}`);
    return [];
  }

  console.log(`   ✅ Found ${data.length} images matching tags: ${tags.join(', ')}`);
  // Show top 3 matches with scores
  data.slice(0, 3).forEach((row: any, index: number) => {
    console.log(`      ${index + 1}. ${row.image_name} (score: ${row.match_score}, tags: ${row.tags.join(', ')})`);
  });

  // Get the highest score
  const highestScore = data[0].match_score;
  
  // Filter all images with the highest score
  const topMatches = data.filter((row: any) => row.match_score === highestScore);
  
  // Randomly select one from images with the highest score
  const randomIndex = Math.floor(Math.random() * topMatches.length);
  const selected = [topMatches[randomIndex]];
  
  if (topMatches.length > 1) {
    console.log(`   🎲 ${topMatches.length} images with highest score (${highestScore}), randomly selected: ${selected[0].image_name}`);
  } else {
    console.log(`   🎯 Selected: ${selected[0].image_name} (score: ${selected[0].match_score})`);
  }
  
  // Get signed URLs for selected images
  const urls = await Promise.all(
    selected.map(async (row: any) => {
      try {
        return await getImageUrl(row.image_path);
      } catch (err) {
        console.error(`Error getting URL for ${row.image_path}:`, err);
        return null;
      }
    })
  );

  return urls.filter(url => url !== null) as string[];
}

/**
 * Fallback: get random image from folder
 */
async function getRandomImageFromFolder(folderName: string): Promise<string> {
  const { data: allFiles, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderName, { limit: 2000 });

  if (error) throw new Error(`Failed to list files in ${folderName}: ${error.message}`);

  const imageFiles = (allFiles ?? []).filter(
    file =>
      file.name !== '__keep.txt' &&
      file.name.match(/\.(jpg|jpeg|JPEG|png|webp|gif)$/i)
  );

  if (imageFiles.length === 0) {
    throw new Error(`No images found in ${folderName}`);
  }

  const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
  return await getImageUrl(`${folderName}/${randomImage.name}`);
}

/**
 * Get image with smart tag matching, fallback to random
 */
async function getSmartImage(tags: string[], folder: string): Promise<string> {
  // Try tag-based search first
  const taggedImages = await searchImagesByTags(tags, folder, 1);
  
  if (taggedImages.length > 0) {
    console.log(`   🎨 Selected image based on tag match`);
    return taggedImages[0];
  }
  
  // Fallback to random selection
  console.log(`   ⚠️  No tagged images found for ${tags.join(', ')}, using random`);
  return await getRandomImageFromFolder(folder);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bulletPoints } = body;
    
    // We need 6 images total:
    // Image 1: from becomex_firstpage (always random, it's the title page)
    // Image 2, 3: from becomex1 (matched to bullet points 1, 2)
    // Image 4: from becomex_soft_ad (always random, it's the product mention)
    // Image 5, 6: from becomex1 (matched to bullet points 4, 5)
    
    const images: string[] = [];
    
    // Image 1: Title page - always random
    images[0] = await getRandomImageFromFolder(FOLDER_FIRSTPAGE);
    
    // If bulletPoints provided, use smart matching
    if (bulletPoints && Array.isArray(bulletPoints) && bulletPoints.length >= 5) {
      // Get all available tags from database (once for all bullet points)
      const availableTags = await getAvailableTags();
      console.log(`📋 Found ${availableTags.length} unique tags in database`);
      
      // Image 2: Match to bullet point 1
      console.log(`\n🎯 Image 2 - Bullet 1: "${bulletPoints[0].substring(0, 60)}..."`);
      const tags1 = await extractTagsFromText(bulletPoints[0], availableTags);
      console.log(`   AI selected tags: ${tags1.join(', ')}`);
      images[1] = await getSmartImage(tags1, FOLDER_BECOMEX1);
      
      // Image 3: Match to bullet point 2
      console.log(`\n🎯 Image 3 - Bullet 2: "${bulletPoints[1].substring(0, 60)}..."`);
      const tags2 = await extractTagsFromText(bulletPoints[1], availableTags);
      console.log(`   AI selected tags: ${tags2.join(', ')}`);
      images[2] = await getSmartImage(tags2, FOLDER_BECOMEX1);
      
      // Image 4: Product page - always random
      console.log(`\n🎯 Image 4 - Product page (random from becomex_soft_ad)`);
      images[3] = await getRandomImageFromFolder(FOLDER_SOFT_AD);
      
      // Image 5: Match to bullet point 4
      console.log(`\n🎯 Image 5 - Bullet 4: "${bulletPoints[3].substring(0, 60)}..."`);
      const tags4 = await extractTagsFromText(bulletPoints[3], availableTags);
      console.log(`   AI selected tags: ${tags4.join(', ')}`);
      images[4] = await getSmartImage(tags4, FOLDER_BECOMEX1);
      
      // Image 6: Match to bullet point 5
      console.log(`\n🎯 Image 6 - Bullet 5: "${bulletPoints[4].substring(0, 60)}..."`);
      const tags5 = await extractTagsFromText(bulletPoints[4], availableTags);
      console.log(`   AI selected tags: ${tags5.join(', ')}`);
      images[5] = await getSmartImage(tags5, FOLDER_BECOMEX1);
    } else {
      // Fallback to random if no bullet points provided
      images[1] = await getRandomImageFromFolder(FOLDER_BECOMEX1);
      images[2] = await getRandomImageFromFolder(FOLDER_BECOMEX1);
      images[3] = await getRandomImageFromFolder(FOLDER_SOFT_AD);
      images[4] = await getRandomImageFromFolder(FOLDER_BECOMEX1);
      images[5] = await getRandomImageFromFolder(FOLDER_BECOMEX1);
    }

    return NextResponse.json({ images });
  } catch (err: any) {
    console.error('Error in get-images-becomex-smart:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Also support GET for backwards compatibility (random selection)
export async function GET() {
  try {
    const images: string[] = [];
    
    images[0] = await getRandomImageFromFolder(FOLDER_FIRSTPAGE);
    images[1] = await getRandomImageFromFolder(FOLDER_BECOMEX1);
    images[2] = await getRandomImageFromFolder(FOLDER_BECOMEX1);
    images[3] = await getRandomImageFromFolder(FOLDER_SOFT_AD);
    images[4] = await getRandomImageFromFolder(FOLDER_BECOMEX1);
    images[5] = await getRandomImageFromFolder(FOLDER_BECOMEX1);

    return NextResponse.json({ images });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

