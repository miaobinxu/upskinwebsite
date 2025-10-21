# 🏷️ Intelligent Product Tagging System

This system automatically tags skincare product images and uses intelligent matching to select products for carousel generation based on topics.

## 📋 Overview

The system consists of **4 dimensions** of product tags:

1. **Product Type** - What kind of product is it?
   - Examples: `cleanser`, `toner`, `serum`, `moisturizer`, `sunscreen`, `mask`, `eye-cream`

2. **Benefit/Concern** - What does it do?
   - Examples: `hydrating`, `acne-treatment`, `brightening`, `anti-aging`, `soothing`, `exfoliating`

3. **Skin Type** - Who is it for?
   - Examples: `oily`, `dry`, `combination`, `sensitive`, `normal`, `all-types`, `acne-prone`, `mature`

4. **Price Range** - How expensive is it?
   - `affordable` (< $30)
   - `mid-range` ($30-80)
   - `luxury` (> $80)

---

## 🚀 Setup Guide

### Step 1: Database Setup

1. Go to your **Supabase Dashboard** → SQL Editor
2. Run the SQL script: `scripts/setup-product-tags-database.sql`
3. This creates:
   - `product_tags` table
   - Search functions
   - Indexes for fast queries

### Step 2: Upload Product Images

1. Upload your product images to Supabase Storage
2. Recommended folder structure:
   ```
   files/
   └── products/
       ├── product1.jpg
       ├── product2.jpg
       └── ...
   ```

3. Update folder name in `scripts/auto-tag-products.mjs`:
   ```javascript
   const FOLDERS_TO_TAG = ['products']  // Change to your folder name
   ```

### Step 3: Configure Environment Variables

Make sure your `.env.local` has:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Azure OpenAI (for image analysis)
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o  # Must support vision
```

### Step 4: Run Auto-Tagging Script

```bash
node scripts/auto-tag-products.mjs
```

This will:
- Scan all images in your configured folders
- Use AI to analyze each product image
- Assign 4 tags to each product
- Save tags to the database

**Example output:**
```
🔍 Analyzing: cerave-moisturizing-cream.jpg
   Tags: [moisturizer, hydrating, dry, affordable]
   → Type: moisturizer, Benefit: hydrating, Skin: dry, Price: affordable
✅ Successfully tagged: 50 products
```

### Step 5: Test the System

Test the smart product selection API:

```bash
curl -X POST http://localhost:3000/api/get-product-images \
  -H "Content-Type: application/json" \
  -d '{"topic": "Affordable moisturizers for dry skin"}'
```

---

## 🎯 How It Works

### Topic Examples and Tag Matching

| Topic | Extracted Criteria | Selected Products |
|-------|-------------------|-------------------|
| "As a sensitive skin, my honest review of toners" | `type: toner`<br>`skinType: sensitive` | 4 toners for sensitive skin |
| "My $5000 routine vs my roommate's $50" | `priceRange: luxury, affordable` | 3 luxury + 3 affordable products |
| "Affordable moisturizers for dry skin" | `type: moisturizer`<br>`skinType: dry`<br>`price: affordable` | 4 affordable moisturizers for dry skin |
| "Products that cleared my acne" | `benefit: acne-treatment`<br>`skinType: acne-prone` | 4 acne treatment products |

### Smart Matching Logic

1. **Exact Match** - Products that match all specified criteria (highest priority)
2. **Partial Match** - Products that match some criteria (fallback)
3. **Random** - If no matches found, select randomly (last resort)

The system automatically:
- Scores products based on match quality (0-4)
- Randomizes selection within same score for variety
- Avoids duplicate products in the same carousel

---

## 🛠️ Usage in Your App

### Generate Carousel

```typescript
// 1. User provides a topic
const topic = "Affordable moisturizers for dry skin"

// 2. API automatically selects matching products
const response = await fetch('/api/get-product-images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic })
})

const { images } = await response.json()
// images: [
//   { url: "...", name: "CeraVe Moisturizing Cream", type: "affordable" },
//   { url: "...", name: "Vanicream Daily Facial Moisturizer", type: "affordable" },
//   ...
// ]

// 3. Generate text overlays with AI
const overlays = await generateProductTextOverlays({ topic, productImages: images })

// 4. Create carousel with matched products + AI-generated reviews
```

---

## 📊 Database Queries

### Check Tag Statistics

```sql
-- See distribution of tags by dimension
SELECT * FROM get_tag_statistics();
```

### Search Products

```sql
-- Find affordable toners for oily skin
SELECT * FROM search_products_by_tags(
  '{"productType": "toner", "skinType": "oily", "priceRange": "affordable"}'::jsonb,
  10
);
```

### View All Tags

```sql
-- Get all unique tags with their frequency
SELECT * FROM get_available_tags();
```

---

## 🔄 Updating Tags

To re-tag products (e.g., after improving the tagging prompt):

1. **Option A: Re-tag all products**
   ```bash
   # Delete existing tags in Supabase SQL Editor
   DELETE FROM product_tags;
   
   # Re-run the script
   node scripts/auto-tag-products.mjs
   ```

2. **Option B: Tag only new products**
   ```bash
   # Script automatically skips already-tagged images
   node scripts/auto-tag-products.mjs
   ```

---

## 🎨 Customizing Tags

Edit `scripts/auto-tag-products.mjs` to customize available tags:

```javascript
const PRODUCT_TYPE_TAGS = [
  'cleanser', 'toner', 'serum', 'moisturizer', // ... add more
]

const BENEFIT_TAGS = [
  'hydrating', 'acne-treatment', 'brightening', // ... add more
]

const SKIN_TYPE_TAGS = [
  'oily', 'dry', 'combination', 'sensitive', // ... add more
]

const PRICE_TAGS = [
  'affordable', 'mid-range', 'luxury'
]
```

---

## 🐛 Troubleshooting

### Issue: "No products found matching criteria"

**Cause:** Database doesn't have products with those tags

**Solution:**
1. Check what tags you have: `SELECT * FROM get_tag_statistics();`
2. Either add more products OR adjust the topic

### Issue: "Azure OpenAI API error"

**Cause:** Vision API credentials issue

**Solution:**
1. Check `.env.local` has correct Azure OpenAI credentials
2. Make sure deployment supports vision (gpt-4o, gpt-4-vision)
3. Check API quota/rate limits

### Issue: Products don't match topic well

**Cause:** Tags might be inaccurate

**Solution:**
1. Review sample tags: `SELECT * FROM product_tags LIMIT 10;`
2. Improve the tagging prompt in `auto-tag-products.mjs`
3. Re-tag products (see "Updating Tags" section)

---

## 📝 File Structure

```
scripts/
├── auto-tag-products.mjs              # Auto-tag products with AI
├── setup-product-tags-database.sql    # Database setup SQL
└── PRODUCT_TAGGING_README.md          # This file

app/api/
└── get-product-images/
    └── route.ts                       # Smart product selection API

lib/
└── generate-products.ts               # Text overlay generation
```

---

## 🎉 Next Steps

1. ✅ Run database setup
2. ✅ Upload product images
3. ✅ Run auto-tagging script
4. ✅ Test the API
5. 🚀 Start generating carousels!

---

## 💡 Tips

- **Tag Quality**: The better your product images (clear product packaging), the better the AI tagging
- **Variety**: Try to have a mix of affordable, mid-range, and luxury products
- **Coverage**: Make sure you have products covering different skin types and concerns
- **Batch Size**: The script processes 5 images at a time to avoid rate limits

---

Need help? Check the console logs when running the scripts - they're very detailed! 🔍

