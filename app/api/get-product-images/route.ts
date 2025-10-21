import { supabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const BUCKET_NAME = 'files';
const FOLDER_PRODUCTS = 'upskin_products'; // Main product images folder
const EXPIRY_SECONDS = 60 * 15; // 15 minutes
const MAX_QUERY_LIMIT = 1000; // Maximum products to fetch from database (increase if you have more products)

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
 * Diversified selection: picks items from different prefix groups to increase variety
 * This ensures visual diversity by avoiding consecutive similar filenames
 */
function diversifiedShuffle(array: any[]): any[] {
  if (array.length === 0) return array;
  
  // Group by filename prefix (first 5 chars)
  const groups: Record<string, any[]> = {};
  array.forEach(item => {
    const prefix = item.image_name ? item.image_name.substring(0, 5) : item.name?.substring(0, 5) || 'other';
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(item);
  });
  
  // Shuffle each group internally
  Object.keys(groups).forEach(prefix => {
    groups[prefix] = shuffleArray(groups[prefix]);
  });
  
  // Round-robin selection from different groups
  const result: any[] = [];
  const groupKeys = shuffleArray(Object.keys(groups)); // Randomize group order
  let groupIndex = 0;
  
  while (result.length < array.length) {
    const currentGroup = groupKeys[groupIndex];
    if (groups[currentGroup].length > 0) {
      result.push(groups[currentGroup].shift());
    }
    // Move to next group (round-robin)
    groupIndex = (groupIndex + 1) % groupKeys.length;
    
    // Remove empty groups
    if (groups[groupKeys[groupIndex]]?.length === 0) {
      groupKeys.splice(groupIndex, 1);
      if (groupKeys.length === 0) break;
      groupIndex = groupIndex % groupKeys.length;
    }
  }
  
  return result;
}

/**
 * Product search criteria extracted from topic
 */
interface ProductCriteria {
  productTypes: string[];    // e.g., ["toner", "serum"]
  benefits: string[];         // e.g., ["acne-treatment", "hydrating"]
  skinTypes: string[];        // e.g., ["sensitive", "oily"]
  priceRanges: string[];      // e.g., ["affordable", "luxury"]
  count: number;              // How many products needed
  structure?: Array<{        // Optional: specific structure for each product
    productType?: string;
    benefit?: string;
    skinType?: string;
    priceRange?: string;
    sentiment?: 'positive' | 'negative';  // For good vs bad comparisons
  }>;
}

/**
 * Extract search criteria from topic using AI
 */
async function extractProductCriteria(topic: string): Promise<ProductCriteria> {
  const SUPABASE_FUNCTION_URL = 'https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai-v2';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_ANON_KEY) {
    console.warn('⚠️  Supabase key not found, using default criteria');
    return {
      productTypes: [],
      benefits: [],
      skinTypes: [],
      priceRanges: [],
      count: 4
    };
  }

  const prompt = `Analyze this skincare carousel topic and extract product selection criteria.

Topic: "${topic}"

**Your task:**
1. Identify which product TYPES are mentioned or implied (e.g., toner, serum, moisturizer, cleanser)
2. Identify which BENEFITS/CONCERNS are mentioned (e.g., acne-treatment, hydrating, brightening)
3. Identify which SKIN TYPES are mentioned or targeted (e.g., sensitive, oily, dry)
4. Identify if specific PRICE RANGES are mentioned (affordable, mid-range, luxury)
5. Determine how many products should be featured (default is 4, only increase for special comparison topics)
6. If topic involves comparison, specify structure:
   - Price comparison (e.g., "luxury vs affordable") → use priceRange in structure
   - Good vs bad comparison (e.g., "what worked vs what didn't") → use sentiment: "positive" or "negative"
   - Mixed comparisons are possible (e.g., luxury products with sentiment)

**Available tags:**
- Product types: cleanser, toner, essence, serum, moisturizer, eye-cream, sunscreen, mask, exfoliator, spot-treatment, oil, mist, retinol, vitamin-c-serum, niacinamide-serum, aha-bha-product
- Benefits: hydrating, anti-aging, brightening, acne-treatment, soothing, exfoliating, barrier-repair, pore-refining, oil-control, anti-inflammatory, texture-smoothing, plumping
- Skin types: oily, dry, combination, sensitive, normal, all-types, acne-prone, mature, dehydrated
- Price ranges: affordable, mid-range, luxury

**Important:**
- Only include tags that are explicitly mentioned or strongly implied in the topic
- If topic doesn't mention a dimension, leave that array empty
- For "best products" or "review" topics without specifics, keep most arrays empty (AI will match based on what's available)
- Default count should always be 4 products unless topic explicitly requires more

**Response format (JSON only):**
{
  "productTypes": ["toner"],
  "benefits": [],
  "skinTypes": ["sensitive"],
  "priceRanges": [],
  "count": 4
}

**Example 1:**
Topic: "As a sensitive skin, my honest review of toners"
Response: {
  "productTypes": ["toner"],
  "benefits": [],
  "skinTypes": ["sensitive"],
  "priceRanges": [],
  "count": 4
}

**Example 2:**
Topic: "My $5000 skincare routine vs my roommate's $50"
Response: {
  "productTypes": [],
  "benefits": [],
  "skinTypes": [],
  "priceRanges": ["luxury", "affordable"],
  "count": 4,
  "structure": [
    {"priceRange": "luxury"},
    {"priceRange": "affordable"},
    {"priceRange": "luxury"},
    {"priceRange": "affordable"}
  ]
}

**Example 3:**
Topic: "Affordable moisturizers for dry skin that actually work"
Response: {
  "productTypes": ["moisturizer"],
  "benefits": ["hydrating"],
  "skinTypes": ["dry"],
  "priceRanges": ["affordable"],
  "count": 4
}

**Example 4:**
Topic: "What healed my acne vs what didn't"
Response: {
  "productTypes": [],
  "benefits": ["acne-treatment"],
  "skinTypes": ["acne-prone"],
  "priceRanges": [],
  "count": 4,
  "structure": [
    {"benefit": "acne-treatment", "sentiment": "positive"},
    {"benefit": "acne-treatment", "sentiment": "positive"},
    {"benefit": "acne-treatment", "sentiment": "negative"},
    {"benefit": "acne-treatment", "sentiment": "negative"}
  ]
}

Now analyze this topic and return ONLY the JSON:
Topic: "${topic}"`;

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.warn('AI criteria extraction failed, using defaults');
      return {
        productTypes: [],
        benefits: [],
        skinTypes: [],
        priceRanges: [],
        count: 4
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    const jsonString = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const criteria = JSON.parse(jsonString);

    console.log('✅ Extracted criteria:', criteria);
    return criteria;
  } catch (error) {
    console.warn('Error extracting criteria:', error);
    return {
      productTypes: [],
      benefits: [],
      skinTypes: [],
      priceRanges: [],
      count: 4
    };
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
 * Search products by criteria using flexible tag matching
 */
async function searchProductsByCriteria(
  criteria: {
    productType?: string;
    benefit?: string;
    skinType?: string;
    priceRange?: string;
  },
  excludeImagePaths: string[] = []
): Promise<any[]> {
  try {
    // Build query - start with all products
    let query = supabase
      .from('product_tags')
      .select('image_path, image_name, tags, folder');

    // Add filters for each criterion if specified
    const filters: string[] = [];
    
    if (criteria.productType) {
      filters.push(criteria.productType);
    }
    if (criteria.benefit) {
      filters.push(criteria.benefit);
    }
    if (criteria.skinType) {
      filters.push(criteria.skinType);
    }
    if (criteria.priceRange) {
      filters.push(criteria.priceRange);
    }

    // If we have any filters, use containedBy to require ALL of them
    if (filters.length > 0) {
      query = query.contains('tags', filters);
    }

    // Exclude already selected images - we'll filter in memory instead
    // (Supabase NOT IN syntax is complex, filtering after fetch is simpler)

    // Get ALL matching products to ensure true randomness across entire database
    const { data, error } = await query.limit(MAX_QUERY_LIMIT);

    if (error) {
      console.warn('Failed to search products:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`   ⚠️  No products found for criteria:`, criteria);
      return [];
    }

    // 🔍 DEBUG: Analyze filename distribution
    const prefixCount: Record<string, number> = {};
    data.forEach((item: any) => {
      const prefix = item.image_name.substring(0, 5); // e.g., "IMG_1", "IMG_8"
      prefixCount[prefix] = (prefixCount[prefix] || 0) + 1;
    });
    
    console.log(`   📦 Supabase returned ${data.length} products with prefix distribution:`);
    Object.entries(prefixCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([prefix, count]) => {
        console.log(`      ${prefix}*: ${count} files`);
      });
    console.log(`   📝 First 5: ${data.slice(0, 5).map((i: any) => i.image_name).join(', ')}`);
    console.log(`   📝 Last 5: ${data.slice(-5).map((i: any) => i.image_name).join(', ')}`);

    // Filter out already selected images (do this in memory after fetch)
    const filteredData = excludeImagePaths.length > 0
      ? data.filter(item => !excludeImagePaths.includes(item.image_path))
      : data;

    if (filteredData.length === 0) {
      console.log(`   ⚠️  All matching products already selected`);
      return [];
    }

    // Shuffle with diversification to ensure variety
    const shuffledData = diversifiedShuffle(filteredData);

    // 🔍 DEBUG: Show shuffle results with diversity
    console.log(`   🎲 After diversified shuffle (from ${shuffledData.length} total):`);
    console.log(`      First: ${shuffledData[0].image_name}`);
    console.log(`      Middle: ${shuffledData[Math.floor(shuffledData.length / 2)]?.image_name}`);
    console.log(`      Last: ${shuffledData[shuffledData.length - 1]?.image_name}`);
    console.log(`      Indexes [0,1,2,3]: ${shuffledData.slice(0, 4).map((i: any) => i.image_name).join(', ')}`);

    return shuffledData;
  } catch (error) {
    console.warn('Error searching products:', error);
    return [];
  }
}

/**
 * Fallback: get random product from folder
 */
async function getRandomProductFromFolder(folderName: string, excludeImagePaths: string[] = []): Promise<any | null> {
  console.log(`   📂 Fallback: Listing files from storage folder '${folderName}'...`);
  
  const { data: allFiles, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderName, { limit: 2000 });

  if (error) {
    console.warn(`⚠️ Failed to list files in ${folderName}: ${error.message}`);
    return null;
  }

  const imageFiles = (allFiles ?? []).filter(
    file =>
      file.name !== '__keep.txt' &&
      file.name.match(/\.(jpg|jpeg|JPEG|png|webp|gif)$/i) &&
      !excludeImagePaths.includes(`${folderName}/${file.name}`)
  );

  if (imageFiles.length === 0) {
    console.warn(`⚠️ No images found in ${folderName}`);
    return null;
  }

  // 🔍 DEBUG: Analyze filename distribution from storage
  const storagePrefixCount: Record<string, number> = {};
  imageFiles.forEach((file: any) => {
    const prefix = file.name.substring(0, 5); // e.g., "IMG_1", "IMG_8"
    storagePrefixCount[prefix] = (storagePrefixCount[prefix] || 0) + 1;
  });
  
  console.log(`   📦 Storage returned ${imageFiles.length} files with prefix distribution:`);
  Object.entries(storagePrefixCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([prefix, count]) => {
      console.log(`      ${prefix}*: ${count} files (${Math.round(count/imageFiles.length*100)}%)`);
    });
  console.log(`   📝 First 3: ${imageFiles.slice(0, 3).map((f: any) => f.name).join(', ')}`);
  console.log(`   📝 Last 3: ${imageFiles.slice(-3).map((f: any) => f.name).join(', ')}`);

  // Shuffle with diversification for variety
  const shuffledFiles = diversifiedShuffle(imageFiles);
  const randomImage = shuffledFiles[0];  // Take first from shuffled array
  
  console.log(`   🎲 Selected after diversified shuffle: ${randomImage.name}`);
  console.log(`   📊 Sample of shuffled list [0,1,2,3]: ${shuffledFiles.slice(0, 4).map((f: any) => f.name).join(', ')}`);
  
  return {
    image_path: `${folderName}/${randomImage.name}`,
    image_name: randomImage.name,
    tags: []
  };
}

/**
 * Select one product based on criteria, with fallback
 */
async function selectProduct(
  criteria: {
    productType?: string;
    benefit?: string;
    skinType?: string;
    priceRange?: string;
    sentiment?: 'positive' | 'negative';  // For AI to know how to rate it
  },
  excludeImagePaths: string[]
): Promise<{ url: string; name: string; type: string; imagePath: string; sentiment?: 'positive' | 'negative' }> {
  console.log(`\n🔍 Searching for product:`, criteria);
  console.log(`   📝 Already selected (excluded): ${excludeImagePaths.length} products`);
  
  // Try exact match first
  let matches = await searchProductsByCriteria(criteria, excludeImagePaths);
  
  // If no exact matches and we have multiple criteria, try relaxing them one by one
  if (matches.length === 0 && Object.keys(criteria).length > 1) {
    console.log(`   ⚠️  No exact matches, trying relaxed criteria...`);
    
    // Try without benefit
    if (criteria.benefit) {
      const relaxedCriteria = { ...criteria };
      delete relaxedCriteria.benefit;
      matches = await searchProductsByCriteria(relaxedCriteria, excludeImagePaths);
    }
    
    // Try without skin type
    if (matches.length === 0 && criteria.skinType) {
      const relaxedCriteria = { ...criteria };
      delete relaxedCriteria.skinType;
      delete relaxedCriteria.benefit;
      matches = await searchProductsByCriteria(relaxedCriteria, excludeImagePaths);
    }
  }
  
  // If still no matches, use random fallback
  if (matches.length === 0) {
    console.log(`   ⚠️  No matches found, trying random product fallback`);
    const randomProduct = await getRandomProductFromFolder(FOLDER_PRODUCTS, excludeImagePaths);
    
    if (!randomProduct) {
      throw new Error(`No products available. Please upload product images to the '${FOLDER_PRODUCTS}' folder in Supabase Storage or run the auto-tagging script to populate the product_tags table.`);
    }
    
    const url = await getImageUrl(randomProduct.image_path);
    return {
      url,
      name: randomProduct.image_name,
      type: criteria.priceRange || 'unknown',
      imagePath: randomProduct.image_path,
      sentiment: criteria.sentiment  // Pass through sentiment for text generation
    };
  }
  
  // Select first from shuffled matches (already randomized in searchProductsByCriteria)
  const selected = matches[0];
  console.log(`   🎯 Selected: ${selected.image_name} (from ${matches.length} shuffled candidates)`);
  
  const url = await getImageUrl(selected.image_path);
  return {
    url,
    name: selected.image_name,
    type: criteria.priceRange || 'unknown',
    imagePath: selected.image_path,
    sentiment: criteria.sentiment  // Pass through sentiment for text generation
  };
}

/**
 * POST endpoint: Smart product selection based on topic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🚀 Smart Product Selection');
    console.log('='.repeat(80));
    console.log(`Topic: "${topic}"`);
    
    // Step 1: Extract criteria from topic
    const criteria = await extractProductCriteria(topic);
    console.log('\n📋 Search Criteria:', criteria);
    
    // Step 2: Select products based on criteria
    const selectedImages: { url: string; name: string; type: string }[] = [];
    const usedImagePaths: string[] = [];
    
    if (criteria.structure && criteria.structure.length > 0) {
      // Use specific structure if provided (for comparison topics)
      console.log('\n🎯 Using structured selection...');
      
      for (let i = 0; i < criteria.structure.length; i++) {
        const structureItem = criteria.structure[i];
        console.log(`\n--- Product ${i + 1}/${criteria.structure.length} ---`);
        
        const product = await selectProduct(structureItem, usedImagePaths);
        selectedImages.push(product);
        usedImagePaths.push(product.imagePath); // ✅ Track full image path to avoid duplicates
      }
    } else {
      // Use general criteria for all products
      console.log('\n🎯 Using general criteria selection...');
      
      for (let i = 0; i < criteria.count; i++) {
        console.log(`\n--- Product ${i + 1}/${criteria.count} ---`);
        
        const searchCriteria: any = {};
        
        if (criteria.productTypes.length > 0) {
          searchCriteria.productType = criteria.productTypes[0]; // Use first one
        }
        if (criteria.benefits.length > 0) {
          searchCriteria.benefit = criteria.benefits[0];
        }
        if (criteria.skinTypes.length > 0) {
          searchCriteria.skinType = criteria.skinTypes[0];
        }
        if (criteria.priceRanges.length > 0) {
          // Alternate between price ranges if multiple
          searchCriteria.priceRange = criteria.priceRanges[i % criteria.priceRanges.length];
        }
        
        const product = await selectProduct(searchCriteria, usedImagePaths);
        selectedImages.push(product);
        usedImagePaths.push(product.imagePath); // ✅ Track full image path to avoid duplicates
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Successfully selected ${selectedImages.length} products`);
    console.log('='.repeat(80));
    
    return NextResponse.json({ images: selectedImages });
  } catch (err: any) {
    console.error('❌ Error in get-product-images:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET endpoint: Fallback to random selection (for testing)
 */
export async function GET() {
  try {
    console.log('⚠️  Using GET fallback (random selection)');
    
    const images: { url: string; name: string; type: string }[] = [];
    const usedImagePaths: string[] = [];
    
    for (let i = 0; i < 4; i++) {
      const product = await getRandomProductFromFolder(FOLDER_PRODUCTS, usedImagePaths);
      const url = await getImageUrl(product.image_path);
      images.push({
        url,
        name: product.image_name,
        type: 'random'
      });
      usedImagePaths.push(product.image_path);
    }
    
    return NextResponse.json({ images });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
