#!/usr/bin/env node

/**
 * Find images that exist locally but not in Supabase
 * and move them to a separate folder for upload
 * 
 * Usage:
 *   node scripts/find-missing-images.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, basename } from 'path'

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
        const commentIndex = value.indexOf('#')
        if (commentIndex !== -1) {
          value = value.substring(0, commentIndex).trim()
        }
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

const BUCKET_NAME = 'files'
const SUPABASE_FOLDER = 'upskin_products'
const LOCAL_FOLDER = '/Users/pshiyi/Downloads/skincare_upskin_products'
const OUTPUT_FOLDER = '/Users/pshiyi/Downloads/missing_images_to_upload'

// ================= SETUP =================
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ================= HELPER FUNCTIONS =================

/**
 * Get all image files from Supabase
 */
async function getSupabaseImages(folderName) {
  console.log(`📦 Fetching images from Supabase: ${folderName}...`)
  
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderName, { limit: 2000 })

  if (error) {
    console.error(`❌ Error listing files:`, error.message)
    return []
  }

  const imageFiles = files
    .filter(file => 
      file.name !== '__keep.txt' && 
      file.name.match(/\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG)$/i)
    )
    .map(file => file.name.toLowerCase()) // Normalize to lowercase for comparison

  console.log(`   Found ${imageFiles.length} images in Supabase\n`)
  return imageFiles
}

/**
 * Get all image files from local folder
 */
function getLocalImages(folderPath) {
  console.log(`📁 Scanning local folder: ${folderPath}...`)
  
  if (!existsSync(folderPath)) {
    console.error(`❌ Local folder does not exist: ${folderPath}`)
    return []
  }

  const files = readdirSync(folderPath)
  
  const imageFiles = files
    .filter(file => 
      file.match(/\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG)$/i)
    )

  console.log(`   Found ${imageFiles.length} images locally\n`)
  return imageFiles
}

/**
 * Find missing images (in local but not in Supabase)
 */
function findMissingImages(localImages, supabaseImages) {
  console.log('🔍 Comparing local and Supabase images...\n')
  
  // Normalize both lists to lowercase for comparison
  const supabaseSet = new Set(supabaseImages.map(name => name.toLowerCase()))
  
  const missing = localImages.filter(localFile => {
    const normalizedName = localFile.toLowerCase()
    return !supabaseSet.has(normalizedName)
  })
  
  return missing
}

/**
 * Move missing images to output folder
 */
function moveMissingImages(missingImages, sourceFolder, outputFolder) {
  if (missingImages.length === 0) {
    console.log('✅ No missing images! All local images are already in Supabase.')
    return
  }

  console.log(`📋 Found ${missingImages.length} images that need to be uploaded:\n`)
  
  // Create output folder if it doesn't exist
  if (!existsSync(outputFolder)) {
    mkdirSync(outputFolder, { recursive: true })
    console.log(`✅ Created output folder: ${outputFolder}\n`)
  }
  
  // Copy (not move) files to preserve originals
  let successCount = 0
  let failCount = 0
  
  console.log('📦 Copying missing images to output folder...\n')
  
  missingImages.forEach((filename, index) => {
    try {
      const sourcePath = join(sourceFolder, filename)
      const destPath = join(outputFolder, filename)
      
      copyFileSync(sourcePath, destPath)
      console.log(`   ${index + 1}. ✅ ${filename}`)
      successCount++
    } catch (error) {
      console.error(`   ${index + 1}. ❌ ${filename} - Error: ${error.message}`)
      failCount++
    }
  })
  
  console.log('\n' + '='.repeat(80))
  console.log('📊 Summary:')
  console.log('='.repeat(80))
  console.log(`✅ Successfully copied: ${successCount} images`)
  console.log(`❌ Failed: ${failCount} images`)
  console.log(`📂 Output folder: ${outputFolder}`)
  console.log('='.repeat(80))
  
  console.log('\n💡 Next steps:')
  console.log(`1. Review images in: ${outputFolder}`)
  console.log(`2. Upload them to Supabase Storage: ${BUCKET_NAME}/${SUPABASE_FOLDER}/`)
  console.log(`3. Run the auto-tag script: node scripts/auto-tag-products.mjs`)
}

/**
 * Show detailed comparison
 */
function showDetailedComparison(localImages, supabaseImages, missingImages) {
  console.log('\n' + '='.repeat(80))
  console.log('📊 Detailed Comparison:')
  console.log('='.repeat(80))
  console.log(`📁 Local images: ${localImages.length}`)
  console.log(`📦 Supabase images: ${supabaseImages.length}`)
  console.log(`❌ Missing in Supabase: ${missingImages.length}`)
  console.log(`✅ Already uploaded: ${localImages.length - missingImages.length}`)
  console.log('='.repeat(80))
  
  if (missingImages.length > 0 && missingImages.length <= 20) {
    console.log('\n📋 Missing images:')
    missingImages.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`)
    })
  } else if (missingImages.length > 20) {
    console.log('\n📋 First 20 missing images:')
    missingImages.slice(0, 20).forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`)
    })
    console.log(`   ... and ${missingImages.length - 20} more`)
  }
  
  console.log('')
}

// ================= MAIN SCRIPT =================

async function main() {
  console.log('🚀 Find Missing Images Script')
  console.log('='.repeat(80))
  console.log(`📁 Local folder: ${LOCAL_FOLDER}`)
  console.log(`📦 Supabase folder: ${BUCKET_NAME}/${SUPABASE_FOLDER}`)
  console.log(`📂 Output folder: ${OUTPUT_FOLDER}`)
  console.log('='.repeat(80))
  console.log('')
  
  // Step 1: Get Supabase images
  const supabaseImages = await getSupabaseImages(SUPABASE_FOLDER)
  
  // Step 2: Get local images
  const localImages = getLocalImages(LOCAL_FOLDER)
  
  if (localImages.length === 0) {
    console.error('❌ No images found in local folder')
    process.exit(1)
  }
  
  // Step 3: Find missing images
  const missingImages = findMissingImages(localImages, supabaseImages)
  
  // Step 4: Show comparison
  showDetailedComparison(localImages, supabaseImages, missingImages)
  
  // Step 5: Move missing images
  if (missingImages.length > 0) {
    moveMissingImages(missingImages, LOCAL_FOLDER, OUTPUT_FOLDER)
  }
  
  console.log('\n✅ Done!')
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

