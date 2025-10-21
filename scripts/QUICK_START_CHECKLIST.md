# ✅ Quick Start Checklist

Follow these steps in order to set up the intelligent product tagging system.

---

## 📋 Pre-requisites

- [ ] Supabase account with storage bucket set up
- [ ] Azure OpenAI account with gpt-4o (vision) deployment
- [ ] Node.js installed (for running scripts)
- [ ] Product images ready to upload

---

## 🚀 Setup Steps

### Step 1: Database Setup (5 minutes)

- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy contents of `scripts/setup-product-tags-database.sql`
- [ ] Run the SQL script
- [ ] Verify table created: Check Tables → `product_tags` should exist

**Test:**
```sql
SELECT * FROM product_tags LIMIT 1;
```
Should return empty table (or error if table doesn't exist).

---

### Step 2: Environment Variables (2 minutes)

- [ ] Open `.env.local` in your project root
- [ ] Add/verify these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=your-resource-name
# OR
AZURE_OPENAI_API_BASE=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_KEY=abc123...
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

- [ ] Save the file

---

### Step 3: Upload Product Images (10 minutes)

- [ ] Go to Supabase Dashboard → Storage
- [ ] Create/navigate to bucket: `files`
- [ ] Create folder: `products` (or your preferred name)
- [ ] Upload product images (JPG, PNG, WebP)
  - Recommended: Clear product packaging photos
  - Minimum: 10-20 products for good variety
  - Ideal: 50+ products covering different types/prices

**Naming tip:** Use descriptive names like:
- `cerave-moisturizing-cream.jpg`
- `the-ordinary-niacinamide.jpg`
- `skii-facial-treatment-essence.jpg`

---

### Step 4: Configure Auto-Tagging Script (2 minutes)

- [ ] Open `scripts/auto-tag-products.mjs`
- [ ] Update folder name (line 72):

```javascript
const FOLDERS_TO_TAG = ['products']  // Change 'products' to your folder name
```

- [ ] (Optional) Customize batch size if needed:

```javascript
const BATCH_SIZE = 5  // Process 5 images at a time
```

- [ ] Save the file

---

### Step 5: Run Auto-Tagging (Time varies by product count)

- [ ] Open terminal in project root
- [ ] Run the tagging script:

```bash
node scripts/auto-tag-products.mjs
```

- [ ] Watch the output:
  - ✅ See "Found X images"
  - ✅ See "Analyzing: product-name.jpg"
  - ✅ See "Tags: [type, benefit, skin, price]"
  - ✅ See "Successfully tagged: X products"

**Expected time:**
- 10 products ≈ 2-3 minutes
- 50 products ≈ 10-15 minutes
- 100 products ≈ 20-30 minutes

**Common issues:**
- ⚠️ "Azure OpenAI API error" → Check credentials in `.env.local`
- ⚠️ "No images found" → Check folder name matches
- ⚠️ "Failed to create signed URL" → Check Supabase credentials

---

### Step 6: Verify Tags in Database (1 minute)

- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Run this query:

```sql
-- Check tag statistics
SELECT * FROM get_tag_statistics();
```

- [ ] Verify you see:
  - Product Type tags (cleanser, serum, moisturizer, etc.)
  - Benefit tags (hydrating, acne-treatment, etc.)
  - Skin Type tags (oily, dry, sensitive, etc.)
  - Price Range tags (affordable, mid-range, luxury)

- [ ] Run this query:

```sql
-- View some tagged products
SELECT image_name, tags FROM product_tags LIMIT 10;
```

- [ ] Verify each product has exactly 4 tags

---

### Step 7: Test the API (2 minutes)

- [ ] Start your development server:

```bash
npm run dev
```

- [ ] Test the API endpoint:

```bash
curl -X POST http://localhost:3000/api/get-product-images \
  -H "Content-Type: application/json" \
  -d '{"topic": "Affordable moisturizers for dry skin"}'
```

- [ ] Expected response:

```json
{
  "images": [
    {
      "url": "https://...",
      "name": "cerave-moisturizing-cream.jpg",
      "type": "affordable"
    },
    // ... more products
  ]
}
```

---

### Step 8: Test Full Carousel Generation (5 minutes)

- [ ] Open browser: `http://localhost:3000/products`
- [ ] Wait for page to load
- [ ] Click "Generate" (or your generate button)
- [ ] Watch console logs:
  - ✅ See "Selected X products for: [topic]"
  - ✅ See product names listed
  - ✅ See carousel generation complete

- [ ] Verify carousel:
  - Image 1: Title page
  - Images 2-N: Product reviews with relevant images
  - Last image: Detailed product analysis

---

## 🎉 Success Criteria

You've successfully set up the system if:

✅ Database has `product_tags` table with your products
✅ Each product has exactly 4 tags
✅ API returns relevant products for test topics
✅ Carousel generation works end-to-end
✅ Products match the topic semantically

---

## 🔄 Next Steps (Optional)

### Improve Tag Quality

- [ ] Review sample tags: Do they make sense?
- [ ] If tags are inaccurate, edit prompt in `auto-tag-products.mjs`
- [ ] Delete old tags: `DELETE FROM product_tags;`
- [ ] Re-run tagging script

### Add More Products

- [ ] Upload new product images to Supabase
- [ ] Re-run tagging script (it skips already-tagged images)
- [ ] New products will be automatically tagged

### Monitor Performance

- [ ] Check which topics work best
- [ ] Look for patterns in product selection
- [ ] Adjust tags or add more products as needed

---

## 🐛 Troubleshooting

### Script runs but no tags saved

**Check:**
```sql
SELECT COUNT(*) FROM product_tags;
```

If 0:
- Check Supabase service role key in `.env.local`
- Check table permissions
- Review script console output for errors

### API returns random products instead of matching

**Check:**
```bash
# Enable detailed logging in route.ts
console.log('Search criteria:', criteria)
```

Possible causes:
- No products with matching tags
- Topic extraction failed
- Need more variety in product tags

### Carousel shows duplicate products

**This shouldn't happen**, but if it does:
- Check `usedImagePaths` tracking in API
- Verify products have unique `image_path`
- Clear cache and try again

---

## 📞 Need Help?

1. **Check console logs** - They're very detailed!
2. **Review README** - `scripts/PRODUCT_TAGGING_README.md`
3. **Check implementation** - `IMPLEMENTATION_SUMMARY.md`
4. **SQL queries** - Test database functions manually

---

## ✨ Tips for Best Results

1. **Product Image Quality**
   - Use clear photos showing product packaging
   - Brand name and product name should be readable
   - Avoid blurry or low-res images

2. **Product Variety**
   - Mix of affordable, mid-range, and luxury
   - Cover different skin types (oily, dry, sensitive)
   - Include various product types (cleanser, serum, etc.)

3. **Topic Crafting**
   - Be specific: "Affordable toners for oily skin"
   - Or broad: "My honest skincare reviews"
   - Both work, but specific = better matches

4. **Maintenance**
   - Periodically review tag statistics
   - Add new products regularly
   - Re-tag if you improve the prompt

---

**Ready to start?** Begin with Step 1! 🚀

