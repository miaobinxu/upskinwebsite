const SUPABASE_FUNCTION_URL =
  "https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai"

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface GenerateProductsCarouselPayload {
  topic: string
  productImages: { url: string; name: string; type: string; sentiment?: 'positive' | 'negative' }[]
}

interface ProductsResponse {
  data: any
  error: string | null
}

interface ProductAnalysisPayload {
  topic: string
  productImage: { url: string; name: string; type: string; sentiment?: 'positive' | 'negative' }
}

interface ProductAnalysisResponse {
  data: any
  error: string | null
}

/* ------------------------ LAYER 1: DEPRECATED ------------------------ */
/**
 * @deprecated This function is no longer used. Product selection is now handled
 * by the /api/get-product-images endpoint which uses multi-dimensional tag matching.
 * The new system supports 4 dimensions: product type, benefit, skin type, and price range.
 */
export async function determineProductStructure(topic: string): Promise<{ structure: string[], error: string | null }> {
  console.warn('⚠️  determineProductStructure is deprecated. Use /api/get-product-images directly.')
  return { structure: [], error: 'Function deprecated - use /api/get-product-images' }
}

/* ------------------------ LAYER 2: GENERATE TEXT OVERLAYS ------------------------ */
export async function generateProductTextOverlays({
  topic,
  productImages,
}: GenerateProductsCarouselPayload): Promise<ProductsResponse> {
  
  // Check if products have sentiment markers
  const hasSentiment = productImages.some(img => img.sentiment);
  const sentimentInfo = hasSentiment 
    ? productImages.map((img, i) => `Product ${i+1}: ${img.sentiment || 'neutral'}`).join(', ')
    : '';

  // Build the prompt for text overlay generation with vision
  const prompt = `You are creating a product comparison carousel for skincare. The topic is: "${topic}"

CRITICAL: Analyze the topic carefully to understand the narrative:
- If the topic is about products that broke them out / caused issues → ALL products should be rated LOW (1-3/10) with ❌
- If the topic is about expensive products that didn't work → Rate luxury products LOW, affordable alternatives HIGH
- If the topic is rating skincare products → Mix ratings, half should be high, half should be low
- If the topic is positive (e.g., "best products for...") → Give HIGH ratings (8+, or even 100/10, 2800/10, etc.) with ✅
${hasSentiment ? `\n**IMPORTANT: Some products are marked with sentiment:**
${sentimentInfo}
- Products marked "positive" → Give HIGH ratings (8-500/10) with ✅
- Products marked "negative" → Give LOW ratings (-1000-3/10) with ❌
Follow these sentiment markers strictly!` : ''}

The ratings and emojis MUST align with the topic's narrative${hasSentiment ? ' and sentiment markers' : ''}. Don't randomly give high scores if the topic is negative!

I will show you ${productImages.length} product images. For each product image, you need to:
1. Identify the FULL product name (brand + product name) from the image
2. Give a rating out of 10 that MATCHES THE TOPIC NARRATIVE (can be exaggerated like TikTok: -5/10, 1/10, 100/10, etc.)
3. Add ✅ (for good) or ❌ (for bad) emoji - MUST match the topic's stance
4. Write 2-3 punchy bullet points explaining why

CRITICAL: Your bullet points should NOT include the product name. The product name will be displayed separately.

IMPORTANT: Focus your bullet points on:
- Specific ingredients and their effects
- Skin type compatibility (oily, dry, sensitive, combination)
- Texture, absorption, finish
- Actual skin concerns it addresses (acne, hyperpigmentation, barrier health, etc.)
- Fungal acne safety, comedogenicity
- Potential irritants or actives

AVOID focusing on price in the bullet points. Even if the topic mentions price, your points should explain WHY the product is good/bad based on formulation and skin compatibility, not just that it's cheap or expensive.

The language should be casual and on point - like a friend introducing you a product.

Format your response as JSON with this exact structure:

Example for NEGATIVE topic ("This broke me out"):
{
  "Product 1": {
    "name": "La Mer Treatment Lotion",
    "emoji": "❌",
    "score": "1/10",
    "points": [
      "Clogs pores like crazy",
      "Not fungal acne safe",
      "Made breakouts 10x worse"
    ]
  },
  "Product 2": {
    "name": "Drunk Elephant C-Firma",
    "emoji": "❌",
    "score": "-5/10",
    "points": [
      "RUINS skin barrier",
      "Increases hyperpigmentation and UV damage",
      "Gave me closed comedones"
    ]
  },
  "Product 3": {
    "name": "St. Ives Apricot Scrub",
    "emoji": "❌",
    "score": "2/10",
    "points": [
      "HORRIBLE for dry skin",
      "Too abrasive for sensitive skin",
      "Over exfoliation risk, causing skin barrier issues"
    ]
  },
  "Product 4": {
    "name": "The Ordinary AHA 30% + BHA 2%",
    "emoji": "❌",
    "score": "0/10",
    "points": [
      "Causes chemical burns, it's not worth it",
      "Causes skin peeling and scabbing"
    ]
  }
}

Example for POSITIVE topic ("Best products for..."):
{
  "Product 1": {
    "name": "Paula's Choice 2% BHA",
    "emoji": "✅",
    "score": "10/10",
    "points": [
      "Effectively clears congestion, reduces blackheads",
      "Suitable for most skin types, when introduced gradually"
    ]
  },
  "Product 2": {
    "name": "CeraVe Moisturizing Cream",
    "emoji": "✅",
    "score": "9/10",
    "points": [
      "Budget-friendly",
      "Works better than luxury",
      "No irritation at all"
    ]
  },
  "Product 3": {
    "name": "La Roche-Posay Cicaplast Baume",
    "emoji": "✅",
    "score": "100/10",
    "points": [
      "Excellent choice during flare-ups of sensitivity",
      "Deep hydration"
    ]
  },
  "Product 4": {
    "name": "Vanicream Gentle Facial Cleanser",
    "emoji": "✅",
    "score": "8/10",
    "points": [
      "Gentle and fragrance-free",
      "Deeply restorative & barrier-friendly"
    ]
  }
}

**IMPORTANT:**
- You will receive ${productImages.length} product images
- Generate exactly ${productImages.length} product entries in your JSON response
- Label them as "Product 1", "Product 2", "Product 3", etc. up to "Product ${productImages.length}"
- The number of products may vary (could be 4, 5, 6, or more)

Topic: "${topic}"

Now analyze these ${productImages.length} products and generate appropriate text overlays:`

  // Build messages array with vision support
  const contentArray: any[] = [
    { type: "text", text: prompt }
  ]

  // Add each product image to the content
  for (let i = 0; i < productImages.length; i++) {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: productImages[i].url
      }
    })
  }

  const messages = [
    {
      role: "user",
      content: contentArray,
    },
  ]

  try {
    const res = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages }),
    })

    if (!res.ok) {
      const error = await res.text()
      return { data: null, error }
    }

    const data = await res.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: String(error) }
  }
}

/* ------------------------ LAYER 3: ANALYZE PRODUCT FOR MOCKUP ------------------------ */
export async function analyzeProductForMockup({
  topic,
  productImage,
}: ProductAnalysisPayload): Promise<ProductAnalysisResponse> {
  
  // Use sentiment if provided, otherwise infer from topic
  const sentimentGuidance = productImage.sentiment === 'positive'
    ? '**CRITICAL: This product is marked as POSITIVE** → Give VERY HIGH scores (85-98 range)'
    : productImage.sentiment === 'negative'
    ? '**CRITICAL: This product is marked as NEGATIVE** → Give VERY LOW scores (10-30 range)'
    : 'Infer from topic whether this should be positive or negative';
  
  const prompt = `You are analyzing a skincare product for display in an app mockup. The carousel topic is: "${topic}"

${sentimentGuidance}

CRITICAL: The scores MUST be EXTREME to grab attention!
- If the topic/sentiment is NEGATIVE (breaking out, bad products, marked negative) → Give VERY LOW scores (10-30 range)
- If the topic/sentiment is POSITIVE (best products, works well, marked positive) → Give VERY HIGH scores (85-98 range)

DO NOT give medium scores (40-70). We want extreme reactions!

Analyze the product image and provide:
1. Product name (identify from the image)
2. Overall Score (0-100) - MUST BE EXTREME (either <30 or >85)
3. Skin Type recommendation (e.g., "Oily", "Dry", "Combination", "Sensitive", "Normal")
4. Compatibility score (0-100) - MUST BE EXTREME (either <30 or >85)
5. 2 key ingredients with SHORT descriptions (max 3-4 words each)
6. 2 key takeaway points (one sentence each, focus on why the scores are extreme)

Format your response as JSON:
{
  "name": "Product Name",
  "overallScore": 92,
  "skinType": "Oily",
  "compatibility": 89,
  "ingredients": [
    { "name": "Hyaluronic Acid", "description": "Deep hydration" },
    { "name": "Niacinamide", "description": "Reduces inflammation" }
  ],
  "keyTakeaway": [
    "This product is exceptional for oily skin with proven ingredients that balance sebum production.",
    "Highly compatible formulation that won't clog pores or cause breakouts."
  ]
}

Topic: "${topic}"

Now analyze this product image:`

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: productImage.url
          }
        }
      ],
    },
  ]

  try {
    const res = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages }),
    })

    if (!res.ok) {
      const error = await res.text()
      return { data: null, error }
    }

    const data = await res.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: String(error) }
  }
} 