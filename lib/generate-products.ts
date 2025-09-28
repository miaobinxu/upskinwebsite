const SUPABASE_FUNCTION_URL =
  "https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai"

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface GenerateProductsCarouselPayload {
  topic: string
  tone?: string
  textStyle?: string
}

interface ProductsResponse {
  data: any
  error: string | null
}

/* ------------------------- UTILS -------------------------- */
const fallback = (val: string | undefined, placeholder: string) =>
  val?.trim() ? val : placeholder

/* ------------------------ PROMPT BUILDER ------------------------ */
export const buildProductsPrompt = (topic: string, tone = ""): string => {
  const prompt: Record<string, string> = {}

  prompt["Title"] = topic
  prompt["Subtitle"] = "fill the blank based on the context"
  prompt["Message Prompt"] = `Refer the title to write a phrase`
  prompt["Tone"] = fallback(tone, "Choose from Educational, Informative, or Professional")

  for (let i = 1; i <= 5; i++) {
    prompt[`Content Message ${i}`] = `Fill the blank based on the context - educational content about the topic`
  }

  return `You are writing educational content about skincare and beauty products. Here is the structure of your post. If content is provided, you must not change the content in that field. If you need to fill in blanks, fill them based on the overall context of the post. Create informative, educational content that helps people understand skincare better. The content should be professional and helpful.

Example:
{
  "Title": "Understanding Your Skin Type",
  "Subtitle": "The Foundation of Great Skincare",
  "Message Prompt": "Learn about your skin type",
  "Tone": "Educational",
  "Content Message 1": "Oily skin produces excess sebum, making it prone to enlarged pores and breakouts but also more resilient to aging.",
  "Content Message 2": "Dry skin lacks natural oils, often feeling tight and rough, requiring rich moisturizers and gentle cleansing.",
  "Content Message 3": "Combination skin has both oily and dry areas, typically an oily T-zone with drier cheeks.",
  "Content Message 4": "Sensitive skin reacts easily to products and environmental factors, requiring fragrance-free, gentle formulations.",
  "Content Message 5": "Normal skin is well-balanced with few concerns, maintaining proper hydration and minimal sensitivity."
}

Respond strictly in the following JSON format:
${JSON.stringify(prompt, null, 2)}`
}

/* ------------------------ API CALLER ------------------------ */
export async function generateProductsCarousel({
  topic,
  tone = "",
  textStyle = "style1",
}: GenerateProductsCarouselPayload): Promise<ProductsResponse> {
  const finalPrompt = buildProductsPrompt(topic, tone)

  const messages = [
    {
      role: "user",
      content: [{ type: "text", text: finalPrompt }],
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