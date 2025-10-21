const SUPABASE_FUNCTION_URL =
  "https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai"

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface GenerateProductsCarouselPayload {
  topic: string
  productImages: { url: string; name: string; type: string }[]
}

interface ProductsResponse {
  data: any
  error: string | null
}

interface ProductAnalysisPayload {
  topic: string
  productImage: { url: string; name: string; type: string }
  previousRating?: {
    emoji?: string
    score?: string
    isPositive?: boolean
  }
}

interface ProductAnalysisResponse {
  data: any
  error: string | null
}

/* ------------------------ GENERATE TEXT OVERLAYS ------------------------ */
export async function generateProductTextOverlays({
  topic,
  productImages,
}: GenerateProductsCarouselPayload): Promise<ProductsResponse> {
  
  const prompt = `You are creating a product comparison carousel for skincare. The topic is: "${topic}"

Your job is to analyze each product and give it an engaging, honest rating that matches the vibe of the topic.

Guidelines:
- Read the topic carefully - is it about things they'll NEVER use again? Rating products? Honest opinions on viral products?
- Mix up your ratings - some products should be hits (8-10/10, or even 100/10 for dramatic effect ✅), others should be misses (1-3/10, or even -5/10 ❌)
- For general rating topics like "Rating all my products", aim for a mix: roughly half positive, half negative
- For negative topics like "Things I'll never use again", all products should have low ratings with ❌
- For topics about "honest opinions" or "viral products", be real - some work, some don't

I will show you ${productImages.length} product images. For each product image, you need to:
1. Identify the FULL product name (brand + product name) from the image
2. Give a rating that fits the narrative (can be exaggerated like TikTok: -5/10, 2/10, 10/10, 500/10, etc.)
3. Add ✅ (for good) or ❌ (for bad) emoji
4. Write 2-3 punchy bullet points explaining why

CRITICAL: Your bullet points should NOT include the product name. The product name will be displayed separately.

Focus your bullet points on:
- Skin type compatibility (oily, dry, sensitive, combination)
- Texture, absorption, finish
- Actual skin concerns it addresses (acne, hyperpigmentation, barrier health, etc.)
- Fungal acne safety, comedogenicity
- Potential irritants or actives
- Real experience notes (e.g., "gave me closed comedones", "saved my moisture barrier")

Keep the language casual and genuine - like a friend or esthetician giving real advice.

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


Topic: "${topic}"

Now analyze these ${productImages.length} products and give me your honest takes:`

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

/* ------------------------ ANALYZE PRODUCT FOR MOCKUP ------------------------ */
export async function analyzeProductForMockup({
  topic,
  productImage,
  previousRating,
}: ProductAnalysisPayload): Promise<ProductAnalysisResponse> {
  
  // Build consistency guidance based on previous rating
  let consistencyGuidance = ''
  if (previousRating?.emoji && previousRating?.score) {
    const isPositive = previousRating.emoji === '✅'
    consistencyGuidance = `
**CRITICAL - CONSISTENCY REQUIREMENT:**
This product was previously rated as: ${previousRating.emoji} ${previousRating.score}

YOU MUST MAINTAIN CONSISTENCY:
${isPositive 
  ? '- Since it was rated POSITIVELY (✅), your scores MUST be HIGH (85-98 range)'
  : '- Since it was rated NEGATIVELY (❌), your scores MUST be LOW (10-30 range)'}
- Both Overall Score and Compatibility must match this sentiment
- Your Key Takeaway points must align with this rating
- DO NOT contradict the previous rating!
`
  }
  
  const prompt = `You are analyzing a skincare product for an app mockup. The carousel topic is: "${topic}"
${consistencyGuidance}
${!consistencyGuidance ? `
Based on the topic, determine if this product should be presented positively or negatively, then give EXTREME scores to grab attention.

Guidelines:
- For general rating/opinion topics: vary the scores - some products get high scores (85-98), others get low scores (10-30)
- For negative topics (e.g., "never use again"): give low scores (10-30 range)
- For positive topics (e.g., "best products"): give high scores (85-98 range)
` : ''}
- NO medium scores (40-70) - we want extreme reactions!

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

Now analyze this product:`

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
