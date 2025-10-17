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
}

interface ProductAnalysisResponse {
  data: any
  error: string | null
}

/* ------------------------ LAYER 1: DETERMINE STRUCTURE ------------------------ */
export async function determineProductStructure(topic: string): Promise<{ structure: string[], error: string | null }> {
  const prompt = `You are an expert in skincare product comparisons. Based on the following topic, determine the structure of a product comparison carousel.

Topic: "${topic}"

Your task is to determine which 4 products should be featured (images 2-5 of the carousel). Each product should be either "luxury" (expensive/high-end) or "affordable" (budget-friendly).

Analyze the topic and decide:
- If it's about comparing price points, alternate between luxury and affordable
- If it's about specific concerns, choose products that best demonstrate the point
- Consider the narrative flow and what makes sense for the comparison

Respond with ONLY a JSON array of 4 items, each being either "luxury" or "affordable".

Example 1 - Topic: "My $5000 skincare routine vs my roommate's $50 routine"
Response: ["luxury", "affordable", "luxury", "affordable"]

Example 2 - Topic: "Affordable dupes for luxury skincare"
Response: ["luxury", "affordable", "luxury", "affordable"]

Example 3 - Topic: "I spent $5K on skincare before realizing THIS was breaking me out"
Response: ["luxury", "luxury", "luxury", "luxury"]

Now analyze this topic and respond with the structure array:
Topic: "${topic}"

Response (JSON array only):`

  const messages = [
    {
      role: "user",
      content: [{ type: "text", text: prompt }],
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
      return { structure: [], error }
    }

    const data = await res.json()
    const rawContent = data?.choices?.[0]?.message?.content?.trim()
    
    if (!rawContent) {
      return { structure: [], error: 'No content returned from AI' }
    }

    // Parse the JSON array
    const jsonString = rawContent.replace(/^```json/, '').replace(/```$/, '').trim()
    const structure = JSON.parse(jsonString)

    if (!Array.isArray(structure) || structure.length !== 4) {
      return { structure: [], error: 'Invalid structure format - expected 4 items' }
    }

    return { structure, error: null }
  } catch (error) {
    return { structure: [], error: String(error) }
  }
}

/* ------------------------ LAYER 2: GENERATE TEXT OVERLAYS ------------------------ */
export async function generateProductTextOverlays({
  topic,
  productImages,
}: GenerateProductsCarouselPayload): Promise<ProductsResponse> {
  
  // Build the prompt for text overlay generation with vision
  const prompt = `You are creating a product comparison carousel for skincare. The topic is: "${topic}"

CRITICAL: Analyze the topic carefully to understand the narrative:
- If the topic is about products that broke them out / caused issues → ALL products should be rated LOW (1-3/10) with ❌
- If the topic is about expensive products that didn't work → Rate luxury products LOW, affordable alternatives HIGH
- If the topic is about comparing expensive vs cheap → Mix ratings based on which actually works better
- If the topic is positive (e.g., "best products for...") → Give HIGH ratings (8+, or even 100/10, 2800/10, etc.) with ✅

The ratings and emojis MUST align with the topic's narrative. Don't randomly give high scores if the topic is negative!

I will show you ${productImages.length} product images (images 2-5 of the carousel). For each product image, you need to:
1. Identify what the product is (from the image)
2. Give a rating out of 10 that MATCHES THE TOPIC NARRATIVE (can be exaggerated like TikTok: -5/10, 1/10, 100/10, etc.)
3. Add ✅ (for good) or ❌ (for bad) emoji - MUST match the topic's stance
4. Write 2-3 punchy bullet points explaining why

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
    "emoji": "❌",
    "score": "1/10",
    "points": [
      "Clogs pores like crazy",
      "Not fungal acne safe",
      "Made breakouts 10x worse"
    ]
  },
  "Product 2": {
    "emoji": "❌",
    "score": "-5/10",
    "points": [
      "RUINS skin barrier",
      "Increases hyperpigmentation and UV damanage",
      "Gave me closed comedones"
    ]
  },
  "Product 3": {
    "emoji": "❌",
    "score": "2/10",
    "points": [
      "HORRIBLE for dry skin",
      "Too abrasive for sensitive skin",
      "Over exfoliation risk, causing skin barrier issues"
    ]
  },
  "Product 4": {
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
    "emoji": "✅",
    "score": "10/10",
    "points": [
      "Effectively clears congestion, reduces blackheads",
      "Suitable for most skin types, when introduced gradually"
    ]
  },
  "Product 2": {
    "emoji": "✅",
    "score": "9/10",
    "points": [
      "Budget-friendly",
      "Works better than luxury",
      "No irritation at all"
    ]
  },
  "Product 3": {
    "emoji": "✅",
    "score": "100/10",
    "points": [
      "Excellnet choice during flare-ups of sensitivity",
      "Deep hydration"
    ]
  },
  "Product 4": {
    "emoji": "✅",
    "score": "8/10",
    "points": [
      "Gentle and fragrance-free",
      "Deeply restorative & barrier-friendly"
    ]
  }
}

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
  
  const prompt = `You are analyzing a skincare product for display in an app mockup. The carousel topic is: "${topic}"

CRITICAL: The scores MUST be EXTREME to grab attention!
- If the topic is NEGATIVE (breaking out, bad products) → Give VERY LOW scores (10-30 range)
- If the topic is POSITIVE (best products, works well) → Give VERY HIGH scores (85-98 range)

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