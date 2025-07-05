const SUPABASE_FUNCTION_URL =
  "https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai"

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface PageInput {
  line1?: string
  line2?: string
}

interface GenerateCarouselPayload {
  pageInputs: PageInput[]
  replyMessage?: string
  tone?: string
  textStyle?: string
}

interface CharmChatResponse {
  data: any
  error: string | null
}

/* ------------------------- UTILS -------------------------- */
const fallback = (val: string | undefined, placeholder: string) =>
  val?.trim() ? val : placeholder

const ordinal = (n: number): string => {
  const suffixes = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

/* ------------------------ PROMPT BUILDER ------------------------ */
export const buildCharmPrompt = (
  pageInputs: PageInput[],
  replyMessage = "",
  tone = ""
): string => {
  const prompt: Record<string, string> = {}
  const totalImages = pageInputs.length

  // Case: only 1 image → no title/subtitle, always 3 AI-generated messages
  if (totalImages === 1) {
    prompt["Reply content"] = fallback(
      replyMessage,
      "educated guess the message based on the context to fill the blank"
    )
    prompt["Tone"] = fallback(tone, "Use only one word to fill the blank")

    for (let i = 1; i <= 3; i++) {
      prompt[`Message ${i}`] = `Generate ${ordinal(i)} message to fill the blank`
      prompt[`Message ${i} Description`] = `Describe why the ${ordinal(i)} message is good to fill the blank`
    }
  } else {
    // First image = title + subtitle
    prompt["Title"] = fallback(
      pageInputs[0]?.line1,
      "write a viral title to fill the blank"
    )
    prompt["Subtitle"] = fallback(
      pageInputs[0]?.line2,
      "write a viral subtitle to fill the blank"
    )
    prompt["Reply content"] = fallback(
      replyMessage,
      "educated guess the message based on the context to fill the blank"
    )
    prompt["Tone"] = fallback(tone, "Use only one word to fill the blank")

    // Use messages from pages 2 to N-1 (excluding app screen)
    const totalUsablePages = totalImages - 2
    const messageCount = Math.max(3, totalUsablePages)

    for (let i = 1; i <= messageCount; i++) {
      const page = pageInputs[i] // pageInputs[1] = page 2, and so on
      prompt[`Message ${i}`] = fallback(
        page?.line1,
        `Generate ${ordinal(i)} message to fill the blank`
      )
      prompt[`Message ${i} Description`] = fallback(
        page?.line2,
        `Describe why the ${ordinal(i)} message is good to fill the blank`
      )
    }
  }

  prompt["Post description and hashtag"] = "Write a viral description with hashtag"

  // Final AI prompt string (JSON embedded in instructions)
  return `You are writing a TikTok post teaching women how to text with men and providing them with examples of texting messages. Here is the structure of your post. If content is provided, don’t change anything. If you need to fill in blanks, fill them based on the overall context of the post. Respond strictly in the following JSON format:
-Title: The topic of this TikTok post
-Subtitle: The subtitle
-Reply content: The texting message you just received. Based on this message, we have options for reply messages.
-Tone: Use only one word as the overall tone of these messages
-Message Description: Why this message is good

${JSON.stringify(prompt, null, 2)}`
}

/* ------------------------ API CALLER ------------------------ */
export async function generateCharmChatCarousel({
  pageInputs,
  replyMessage = "",
  tone = "",
  textStyle = "style1",
}: GenerateCarouselPayload): Promise<CharmChatResponse> {
  const finalPrompt = buildCharmPrompt(pageInputs, replyMessage, tone)

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
