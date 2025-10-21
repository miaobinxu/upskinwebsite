#!/usr/bin/env node

/**
 * Auto-tag skincare product images using Azure OpenAI Vision API
 * This script analyzes all product images in Supabase storage and automatically tags them
 * with 4 dimensions: Product Type, Benefit/Concern, Skin Type, Price Range
 * 
 * Usage:
 *   1. Make sure .env.local has: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AZURE_OPENAI_*
 *   2. Run: node scripts/auto-tag-products.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ================= LOAD .env.local =================
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

try {
  const envPath = join(projectRoot, '.env.local')
  const envFile = readFileSync(envPath, 'utf8')
  
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim()
        // Remove inline comments
        const commentIndex = value.indexOf('#')
        if (commentIndex !== -1) {
          value = value.substring(0, commentIndex).trim()
        }
        // Remove quotes
        const cleanValue = value.replace(/^["']|["']$/g, '')
        process.env[key.trim()] = cleanValue
      }
    }
  })
  console.log('✅ Loaded .env.local\n')
} catch (error) {
  console.log('⚠️  .env.local not found, using system environment variables\n')
}

// ================= CONFIGURATION =================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Azure OpenAI Configuration
let AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT
const AZURE_API_BASE = process.env.AZURE_OPENAI_API_BASE

// Extract endpoint from API_BASE if needed
if (!AZURE_ENDPOINT && AZURE_API_BASE) {
  const match = AZURE_API_BASE.match(/https?:\/\/([^.]+)\.openai\.azure\.com/)
  if (match) {
    AZURE_ENDPOINT = match[1]
    console.log(`ℹ️  Extracted endpoint from AZURE_OPENAI_API_BASE: ${AZURE_ENDPOINT}`)
  }
}

const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY
const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME
const AZURE_API_VERSION = '2024-02-15-preview'

const BUCKET_NAME = 'files'
// Update this to your product image folders
const FOLDERS_TO_TAG = ['upskin_products']  // Change to your actual folder names
const BATCH_SIZE = 5 // Process 5 images at a time to avoid rate limits

// ================= TAG DEFINITIONS =================
const PRODUCT_TYPE_TAGS = [
  'cleanser', 'oil-cleanser', 'foam-cleanser', 'gel-cleanser',
  'toner', 'essence', 'serum', 'ampoule',
  'moisturizer', 'cream', 'gel-cream', 'sleeping-mask',
  'eye-cream', 'eye-serum',
  'sunscreen', 'spf',
  'mask', 'sheet-mask', 'clay-mask', 'peel-off-mask',
  'exfoliator', 'scrub', 'peeling-gel',
  'spot-treatment', 'acne-patch',
  'oil', 'facial-oil',
  'mist', 'spray'
]

const BENEFIT_TAGS = [
  // Benefits / Effects
  'hydrating', 'moisturizing',
  'anti-aging', 'anti-wrinkle', 'firming',
  'brightening', 'dark-spot', 'hyperpigmentation',
  'acne-treatment', 'acne-fighting', 'sebum-control',
  'soothing', 'calming', 'redness-relief',
  'exfoliating', 'resurfacing',
  'barrier-repair', 'strengthening',
  'pore-refining', 'pore-minimizing',
  'oil-control', 'mattifying',
  'anti-inflammatory',
  'texture-smoothing', 'glow-boosting',
  'plumping', 'lifting',
  
  // Key Ingredients (moved from product types)
  'vitamin-c', 'l-ascorbic-acid',
  'retinol', 'retinoid',
  'niacinamide',
  'hyaluronic-acid',
  'aha', 'bha', 'aha-bha',
  'peptides',
  'ceramides',
  'snail-mucin',
  'centella',
  'salicylic-acid',
  'glycolic-acid',
  'lactic-acid'
]

const SKIN_TYPE_TAGS = [
  'oily', 'dry', 'combination', 'sensitive', 'normal',
  'all-types', 'acne-prone', 'mature', 'dehydrated'
]

const PRICE_TAGS = [
  'affordable',  // < $30
  'mid-range',   // $30-80
  'luxury'       // > $80
]

// Tag guidelines for AI
const TAG_GUIDELINES = `
**Available Tags by Category:**

1. PRODUCT TYPE (choose 1):
${PRODUCT_TYPE_TAGS.join(', ')}

2. BENEFIT/CONCERN (choose 1):
${BENEFIT_TAGS.join(', ')}

3. SKIN TYPE (choose 1):
${SKIN_TYPE_TAGS.join(', ')}

4. PRICE RANGE (choose 1):
${PRICE_TAGS.join(', ')}

**Examples:**
- CeraVe Moisturizing Cream: ["moisturizer", "hydrating", "dry", "affordable"]
- SK-II Facial Treatment Essence: ["essence", "brightening", "all-types", "luxury"]
- Paula's Choice 2% BHA: ["exfoliator", "bha", "oily", "mid-range"]
- The Ordinary Niacinamide 10%: ["serum", "niacinamide", "oily", "affordable"]
- The Ordinary Vitamin C: ["serum", "vitamin-c", "all-types", "affordable"]
- Drunk Elephant Retinol: ["serum", "retinol", "normal", "luxury"]
- Cosrx Snail Mucin Essence: ["essence", "snail-mucin", "dry", "affordable"]
- La Mer Crème: ["moisturizer", "anti-aging", "dry", "luxury"]

**Note:** 
- Product Type = the format (serum, toner, cream, etc.)
- Benefit = the main ingredient OR effect (vitamin-c, retinol, OR hydrating, brightening)
`

// ================= SETUP =================
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!AZURE_ENDPOINT || !AZURE_API_KEY || !AZURE_DEPLOYMENT) {
  console.error('❌ Missing Azure OpenAI credentials')
  console.log('Please set these environment variables in .env.local:')
  console.log('  - AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_BASE')
  console.log('  - AZURE_OPENAI_API_KEY')
  console.log('  - AZURE_OPENAI_DEPLOYMENT_NAME (should be gpt-4o or gpt-4-vision deployment)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ================= HELPER FUNCTIONS =================

/**
 * Get all image files from a folder
 */
async function getImagesFromFolder(folderName) {
  console.log(`\n📂 Fetching images from ${folderName}...`)
  
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderName, { limit: 1000 })

  if (error) {
    console.error(`❌ Error listing files in ${folderName}:`, error.message)
    return []
  }

  const imageFiles = files
    .filter(file => 
      file.name !== '__keep.txt' && 
      file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    )
    .map(file => ({
      name: file.name,
      path: `${folderName}/${file.name}`,
      folder: folderName
    }))

  console.log(`   Found ${imageFiles.length} images`)
  return imageFiles
}

/**
 * Get signed URL for an image
 */
async function getImageUrl(imagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(imagePath, 3600) // 1 hour
  
  if (error || !data) {
    throw new Error(`Failed to create signed URL for ${imagePath}: ${error?.message}`)
  }
  
  return data.signedUrl
}

/**
 * Analyze product image using Azure OpenAI Vision API
 * Returns 4 tags: [product_type, benefit, skin_type, price_range]
 */
async function analyzeProductImageWithAzureOpenAI(imageUrl, imageName) {
  const prompt = `Analyze this skincare product image and provide EXACTLY 4 tags (one from each category).

**Your Task:**
1. Identify the product from the image (read brand name and product name on packaging)
2. Select EXACTLY 1 tag from each of the 4 categories below
3. Return ONLY 4 comma-separated tags in this order: [product_type, benefit, skin_type, price_range]

${TAG_GUIDELINES}

**Important Rules:**
- Use ONLY tags from the lists above (no custom tags)
- Use lowercase, hyphens for compound words
- Return EXACTLY 4 tags, one from each category
- NO explanations, NO emoji, ONLY 4 tags

**Response format:** 
product-type, benefit, skin-type, price-range

**Good examples:**
- CeraVe Moisturizing Cream → "moisturizer, hydrating, dry, affordable"
- SK-II Facial Treatment Essence → "essence, brightening, all-types, luxury"
- The Ordinary Niacinamide 10% → "serum, niacinamide, oily, affordable"
- Paula's Choice 2% BHA Liquid → "exfoliator, bha, oily, mid-range"
- Drunk Elephant C-Firma → "serum, vitamin-c, all-types, luxury"

Now analyze this product image and return exactly 4 tags:`

  const url = `https://${AZURE_ENDPOINT}.openai.azure.com/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`

  // Debug: Print URL only on first call
  if (!analyzeProductImageWithAzureOpenAI._debugPrinted) {
    console.log(`\n🔍 DEBUG: Azure OpenAI Request URL:`)
    console.log(`   ${url}`)
    console.log(`   Deployment: ${AZURE_DEPLOYMENT}`)
    console.log(`   Endpoint: ${AZURE_ENDPOINT}\n`)
    analyzeProductImageWithAzureOpenAI._debugPrinted = true
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_API_KEY
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: imageUrl,
                  detail: 'low' // Use low detail to reduce cost
                } 
              }
            ]
          }
        ],
        max_tokens: 50,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const tagsText = data.choices[0].message.content.trim()
    
    // Parse tags from response (expecting exactly 4)
    const tags = tagsText
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 4)  // Ensure max 4 tags

    // Validate we got exactly 4 tags
    if (tags.length !== 4) {
      console.warn(`   ⚠️  Got ${tags.length} tags instead of 4, using defaults`)
      return ['serum', 'hydrating', 'all-types', 'mid-range']  // Default fallback
    }

    return tags
  } catch (error) {
    console.error(`   ⚠️  Error analyzing ${imageName}:`, error.message)
    return ['serum', 'hydrating', 'all-types', 'mid-range'] // Fallback tags
  }
}

/**
 * Check if table exists, create if not
 */
async function ensureTableExists() {
  console.log('\n🔧 Ensuring product_tags table exists...')
  
  // Try to query the table
  const { error } = await supabase.from('product_tags').select('id').limit(1)
  
  if (error && error.message.includes('does not exist')) {
    console.log('⚠️  Table does not exist. Please run this SQL in your Supabase dashboard:')
    console.log('─'.repeat(80))
    console.log(`
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_path TEXT NOT NULL UNIQUE,
  image_name TEXT NOT NULL,
  folder TEXT NOT NULL,
  product_name TEXT,  -- Will be identified by AI later if needed
  brand TEXT,         -- Will be identified by AI later if needed
  tags TEXT[] NOT NULL,  -- Array of 4 tags: [type, benefit, skin_type, price]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_product_tags_folder ON product_tags(folder);
CREATE INDEX IF NOT EXISTS idx_product_tags_tags ON product_tags USING GIN(tags);

-- Function to search products by tags
CREATE OR REPLACE FUNCTION search_products_by_tags(
  search_criteria JSONB,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  image_path TEXT,
  image_name TEXT,
  tags TEXT[],
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.image_path,
    pt.image_name,
    pt.tags,
    (
      -- Score based on how many criteria match
      CASE WHEN search_criteria->>'productType' IS NOT NULL AND pt.tags @> ARRAY[search_criteria->>'productType'] THEN 1 ELSE 0 END +
      CASE WHEN search_criteria->>'benefit' IS NOT NULL AND pt.tags @> ARRAY[search_criteria->>'benefit'] THEN 1 ELSE 0 END +
      CASE WHEN search_criteria->>'skinType' IS NOT NULL AND pt.tags @> ARRAY[search_criteria->>'skinType'] THEN 1 ELSE 0 END +
      CASE WHEN search_criteria->>'priceRange' IS NOT NULL AND pt.tags @> ARRAY[search_criteria->>'priceRange'] THEN 1 ELSE 0 END
    ) AS match_score
  FROM product_tags pt
  WHERE 
    -- Must match at least one criterion
    (
      (search_criteria->>'productType' IS NULL OR pt.tags @> ARRAY[search_criteria->>'productType']) OR
      (search_criteria->>'benefit' IS NULL OR pt.tags @> ARRAY[search_criteria->>'benefit']) OR
      (search_criteria->>'skinType' IS NULL OR pt.tags @> ARRAY[search_criteria->>'skinType']) OR
      (search_criteria->>'priceRange' IS NULL OR pt.tags @> ARRAY[search_criteria->>'priceRange'])
    )
  ORDER BY match_score DESC, RANDOM()
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
    `)
    console.log('─'.repeat(80))
    console.log('\nThen run this script again.')
    process.exit(0)
  }
  
  console.log('   ✅ Table ready')
}

/**
 * Save tags to database
 */
async function saveTags(imagePath, imageName, folder, tags) {
  const { error } = await supabase
    .from('product_tags')
    .upsert({
      image_path: imagePath,
      image_name: imageName,
      folder: folder,
      tags: tags,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'image_path'
    })

  if (error) {
    console.error(`   ❌ Error saving tags for ${imageName}:`, error.message)
    return false
  }
  
  return true
}

/**
 * Get already tagged images
 */
async function getAlreadyTaggedImages() {
  const { data, error } = await supabase
    .from('product_tags')
    .select('image_path')

  if (error) {
    console.log('   No existing tags found (this might be the first run)')
    return new Set()
  }

  return new Set(data.map(row => row.image_path))
}

/**
 * Process images in batches
 */
async function processImageBatch(images, alreadyTagged) {
  const toProcess = images.filter(img => !alreadyTagged.has(img.path))
  
  if (toProcess.length === 0) {
    console.log('   ✅ All images already tagged, skipping...')
    return { processed: 0, skipped: images.length }
  }

  console.log(`   Processing ${toProcess.length} images (${images.length - toProcess.length} already tagged)`)
  
  let processed = 0
  let failed = 0

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE)
    
    console.log(`\n   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)}`)
    
    const results = await Promise.all(
      batch.map(async (image) => {
        try {
          const imageUrl = await getImageUrl(image.path)
          console.log(`   🔍 Analyzing: ${image.name}`)
          
          const tags = await analyzeProductImageWithAzureOpenAI(imageUrl, image.name)
          console.log(`      Tags: [${tags.join(', ')}]`)
          console.log(`      → Type: ${tags[0]}, Benefit: ${tags[1]}, Skin: ${tags[2]}, Price: ${tags[3]}`)
          
          const saved = await saveTags(image.path, image.name, image.folder, tags)
          
          if (saved) {
            processed++
            return { success: true, image: image.name }
          } else {
            failed++
            return { success: false, image: image.name }
          }
        } catch (error) {
          console.error(`      ❌ Failed: ${error.message}`)
          failed++
          return { success: false, image: image.name }
        }
      })
    )
    
    // Rate limiting: wait 1 second between batches
    if (i + BATCH_SIZE < toProcess.length) {
      console.log('   ⏳ Waiting 1s before next batch...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return { processed, failed, skipped: images.length - toProcess.length }
}

// ================= MAIN SCRIPT =================

async function main() {
  console.log('🚀 Starting Auto-Tag Products Script')
  console.log('='.repeat(80))
  
  // Print configuration
  console.log('\n📋 Configuration:')
  console.log(`   Azure Endpoint: ${AZURE_ENDPOINT}`)
  console.log(`   Azure Deployment: ${AZURE_DEPLOYMENT}`)
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   Folders to tag: ${FOLDERS_TO_TAG.join(', ')}`)
  console.log('')
  
  // Step 1: Ensure table exists
  await ensureTableExists()
  
  // Step 2: Get already tagged images
  console.log('\n📋 Checking for already tagged images...')
  const alreadyTagged = await getAlreadyTaggedImages()
  console.log(`   Found ${alreadyTagged.size} already tagged images`)
  
  // Step 3: Process each folder
  const stats = {
    totalProcessed: 0,
    totalFailed: 0,
    totalSkipped: 0
  }
  
  for (const folder of FOLDERS_TO_TAG) {
    console.log('\n' + '─'.repeat(80))
    console.log(`📁 Processing folder: ${folder}`)
    console.log('─'.repeat(80))
    
    const images = await getImagesFromFolder(folder)
    
    if (images.length === 0) {
      console.log('   No images found, skipping...')
      continue
    }
    
    const result = await processImageBatch(images, alreadyTagged)
    stats.totalProcessed += result.processed
    stats.totalFailed += result.failed
    stats.totalSkipped += result.skipped
  }
  
  // Step 4: Show summary
  console.log('\n' + '='.repeat(80))
  console.log('✅ COMPLETE - Summary:')
  console.log('='.repeat(80))
  console.log(`   ✅ Successfully tagged: ${stats.totalProcessed} products`)
  console.log(`   ⏭️  Skipped (already tagged): ${stats.totalSkipped} products`)
  console.log(`   ❌ Failed: ${stats.totalFailed} products`)
  console.log('='.repeat(80))
  
  // Step 5: Show sample tags with breakdown
  console.log('\n📊 Sample of tagged products:')
  const { data: sampleData } = await supabase
    .from('product_tags')
    .select('image_name, folder, tags')
    .limit(5)
  
  if (sampleData) {
    sampleData.forEach(row => {
      console.log(`   📸 ${row.image_name} (${row.folder})`)
      console.log(`      Type: ${row.tags[0]}, Benefit: ${row.tags[1]}, Skin: ${row.tags[2]}, Price: ${row.tags[3]}`)
    })
  }
  
  console.log('\n🎉 Done! Your products are now tagged and ready to use.')
  console.log('💡 Next step: Use the get-product-images API to select products by criteria.')
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

