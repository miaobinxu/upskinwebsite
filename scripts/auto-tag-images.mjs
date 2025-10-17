#!/usr/bin/env node

/**
 * Auto-tag images using Azure OpenAI Vision API
 * This script analyzes all images in Supabase storage and automatically tags them
 * 
 * Usage:
 *   1. Make sure .env.local has: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AZURE_OPENAI_*
 *   2. Run: node scripts/auto-tag-images.mjs
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
        // 移除行内注释（# 之后的部分）
        const commentIndex = value.indexOf('#')
        if (commentIndex !== -1) {
          value = value.substring(0, commentIndex).trim()
        }
        // 移除引号
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

// Azure OpenAI Configuration - 支持两种格式
let AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT
const AZURE_API_BASE = process.env.AZURE_OPENAI_API_BASE

// 如果有 API_BASE，从中提取 endpoint
if (!AZURE_ENDPOINT && AZURE_API_BASE) {
  // 从 https://xxx.openai.azure.com 提取 xxx
  const match = AZURE_API_BASE.match(/https?:\/\/([^.]+)\.openai\.azure\.com/)
  if (match) {
    AZURE_ENDPOINT = match[1]
    console.log(`ℹ️  Extracted endpoint from AZURE_OPENAI_API_BASE: ${AZURE_ENDPOINT}`)
  }
}

const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY
const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME // Should be gpt-4o or gpt-4-vision
const AZURE_API_VERSION = '2024-02-15-preview'

const BUCKET_NAME = 'files'
// 修改这里来指定要处理的文件夹
const FOLDERS_TO_TAG = ['becomex1']  // 先只处理 becomex1，之后可以添加其他的
const BATCH_SIZE = 5 // Process 5 images at a time to avoid rate limits

// Tag guidelines (not strict requirements, just examples for AI)
const TAG_EXAMPLES = `
Examples of good tags:
- Specific objects: chair, mirror, shower, bed, coffee, ice
- Locations: office, beach, bathroom, kitchen, bedroom
- Actions: working, relaxing, meditating, sleeping
- Themes: wellness, career, luxury, confidence
- Atmosphere: peaceful, cozy, vibrant, minimal
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
  console.log('  - AZURE_OPENAI_ENDPOINT (e.g., "your-resource-name")')
  console.log('    OR')
  console.log('  - AZURE_OPENAI_API_BASE (e.g., "https://your-resource-name.openai.azure.com")')
  console.log('  - AZURE_OPENAI_API_KEY')
  console.log('  - AZURE_OPENAI_DEPLOYMENT_NAME (should be gpt-4o or gpt-4-vision deployment)')
  console.log('\nCurrent values:')
  console.log(`  AZURE_ENDPOINT: ${AZURE_ENDPOINT || '(not set)'}`)
  console.log(`  AZURE_API_BASE: ${AZURE_API_BASE || '(not set)'}`)
  console.log(`  AZURE_API_KEY: ${AZURE_API_KEY ? '***' + AZURE_API_KEY.slice(-4) : '(not set)'}`)
  console.log(`  AZURE_DEPLOYMENT: ${AZURE_DEPLOYMENT || '(not set)'}`)
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
 * Get signed URL for an image (works for both public and private buckets)
 */
async function getImageUrl(imagePath) {
  // Use signed URL with 1 hour expiry
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(imagePath, 3600) // 1 hour
  
  if (error || !data) {
    throw new Error(`Failed to create signed URL for ${imagePath}: ${error?.message}`)
  }
  
  return data.signedUrl
}

/**
 * Analyze image using Azure OpenAI Vision API
 */
async function analyzeImageWithAzureOpenAI(imageUrl, imageName) {
  const prompt = `Analyze this image and provide exactly 3 tags for categorizing it.

**Context:**
This image will be used as a background for motivational/personal development content. 
The content might say things like "talk to an empty chair", "stand in your shower", "put ice on your wrists", etc.

**Tag Selection:**
Choose 3 tags that best describe what's IN the image. Focus on:
1. Specific objects (chair, mirror, bed, coffee, ice, phone, etc.)
2. Locations/settings (bathroom, office, beach, bedroom, kitchen, etc.)
3. Actions or themes (relaxing, working, meditating, wellness, luxury, etc.)

**Format requirements:**
- Use lowercase, singular form when possible (use "chair" not "chairs", "bedroom" not "bedrooms")
- Use hyphens for compound words (use "living-room" not "living room")
- Be specific and concrete (prefer "shower" over "bathroom" if shower is visible)
- NO emoji, NO explanations, ONLY 3 tags

**Response format:** 
Return ONLY 3 comma-separated tags, nothing else.

${TAG_EXAMPLES}

**Good examples:**
- Image of bathroom with shower: "shower, bathroom, water"
- Image of woman at desk: "office, desk, working"
- Image of empty chair by window: "chair, home, peaceful"
- Image of person with coffee: "coffee, relaxing, cozy"
- Image of bed with morning light: "bed, bedroom, morning"
- Image of person looking at mirror: "mirror, reflection, beauty"

Analyze the image and return exactly 3 tags:`

  const url = `https://${AZURE_ENDPOINT}.openai.azure.com/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`

  // Debug: 只在第一次调用时打印 URL
  if (!analyzeImageWithAzureOpenAI._debugPrinted) {
    console.log(`\n🔍 DEBUG: Azure OpenAI Request URL:`)
    console.log(`   ${url}`)
    console.log(`   Deployment: ${AZURE_DEPLOYMENT}`)
    console.log(`   Endpoint: ${AZURE_ENDPOINT}\n`)
    analyzeImageWithAzureOpenAI._debugPrinted = true
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
        max_tokens: 50,  // 只需要 3 个标签，50 tokens 足够
        temperature: 0.3  // 低温度保证一致性
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const tagsText = data.choices[0].message.content.trim()
    
    // Parse tags from response (expecting exactly 3)
    const tags = tagsText
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 3)  // 确保最多 3 个标签

    // 如果少于 3 个标签，添加默认标签
    if (tags.length < 3) {
      console.warn(`   ⚠️  Only got ${tags.length} tags, expected 3`)
      while (tags.length < 3) {
        tags.push('lifestyle')  // 默认标签
      }
    }

    return tags
  } catch (error) {
    console.error(`   ⚠️  Error analyzing ${imageName}:`, error.message)
    return ['untagged', 'lifestyle', 'aesthetic'] // Fallback tags (保持 3 个)
  }
}

/**
 * Check if table exists, create if not
 */
async function ensureTableExists() {
  console.log('\n🔧 Ensuring image_tags table exists...')
  
  const { error } = await supabase.rpc('create_image_tags_table_if_not_exists', {})
  
  if (error && !error.message.includes('does not exist')) {
    // If the function doesn't exist, create the table directly
    const { error: createError } = await supabase.from('image_tags').select('id').limit(1)
    
    if (createError && createError.message.includes('does not exist')) {
      console.log('   Creating table via SQL...')
      // We'll create it using a direct query
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS image_tags (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          image_path TEXT NOT NULL UNIQUE,
          image_name TEXT NOT NULL,
          folder TEXT NOT NULL,
          tags TEXT[] NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_image_tags_folder ON image_tags(folder);
        CREATE INDEX IF NOT EXISTS idx_image_tags_tags ON image_tags USING GIN(tags);
      `
      
      console.log('⚠️  Please run this SQL in your Supabase dashboard:')
      console.log('─'.repeat(60))
      console.log(createTableSQL)
      console.log('─'.repeat(60))
      console.log('\nThen run this script again.')
      process.exit(0)
    }
  }
  
  console.log('   ✅ Table ready')
}

/**
 * Save tags to database
 */
async function saveTags(imagePath, imageName, folder, tags) {
  const { error } = await supabase
    .from('image_tags')
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
    .from('image_tags')
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
          
          const tags = await analyzeImageWithAzureOpenAI(imageUrl, image.name)
          console.log(`      Tags: ${tags.join(', ')}`)
          
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
  console.log('🚀 Starting Auto-Tag Images Script')
  console.log('=' .repeat(60))
  
  // Print configuration
  console.log('\n📋 Configuration:')
  console.log(`   Azure Endpoint: ${AZURE_ENDPOINT}`)
  console.log(`   Azure Deployment: ${AZURE_DEPLOYMENT}`)
  console.log(`   Azure API Version: ${AZURE_API_VERSION}`)
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
    console.log('\n' + '─'.repeat(60))
    console.log(`📁 Processing folder: ${folder}`)
    console.log('─'.repeat(60))
    
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
  console.log('\n' + '='.repeat(60))
  console.log('✅ COMPLETE - Summary:')
  console.log('='.repeat(60))
  console.log(`   ✅ Successfully tagged: ${stats.totalProcessed} images`)
  console.log(`   ⏭️  Skipped (already tagged): ${stats.totalSkipped} images`)
  console.log(`   ❌ Failed: ${stats.totalFailed} images`)
  console.log('='.repeat(60))
  
  // Step 5: Show sample tags
  console.log('\n📊 Sample of tagged images:')
  const { data: sampleData } = await supabase
    .from('image_tags')
    .select('image_name, folder, tags')
    .limit(5)
  
  if (sampleData) {
    sampleData.forEach(row => {
      console.log(`   📸 ${row.image_name} (${row.folder})`)
      console.log(`      Tags: ${row.tags.join(', ')}`)
    })
  }
  
  console.log('\n🎉 Done! Your images are now tagged and ready to use.')
  console.log('💡 Next step: Update the get-images-becomex API to use these tags.')
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

