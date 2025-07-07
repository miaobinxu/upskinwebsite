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
      "educated guess the message based on the context"
    )
    prompt["Tone"] = fallback(tone, "Choose from Dating, Flirty, or Sassy")

    for (let i = 1; i <= 3; i++) {
      prompt[`Message ${i}`] = `Generate ${ordinal(i)} message to fill the blank`
      prompt[`Message ${i} Description`] = `Fill the blank based on the context`
    }
  } else {
    // First image = title + subtitle
    prompt["Title"] = fallback(
      pageInputs[0]?.line1,
      "fill the blank based on the context"
    )
    prompt["Subtitle"] = fallback(
      pageInputs[0]?.line2,
      "fill the blank based on the context"
    )
    prompt["Reply content"] = fallback(
      replyMessage,
      "educated guess the message based on the context"
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
  prompt["Post description and hashtag"] = "Include all content in the post and 5 hashtags"

  // Final AI prompt string (JSON embedded in instructions)
  return `You are writing a TikTok post teaching women how to text with men and providing them with texting messages. Here is the structure of your post. If content is provided, you must not change anything. If you need to fill in blanks, fill them based on the overall context of the post. Here are some examples of extremely viral post. Learn from them and write a viral post.
Example 1:
{
  "Title": "5 FLIERTY replies to 'How are you?'",
  "Reply content": "How are you?",
  "Tone": "Flirty",
  "Message 1": "Better now that you're talking to me.",
  "Message 1 Description": "Makes him feel special and important instantly.",
  "Message 2": "Missing something... maybe you.",
  "Message 2 Description": "Creates mystery and playful emotional connection.",
  "Message 3": "I'm good... but seeing you would make it even better.",
  "Message 3 Description": "Shows independence but invites him closer.",
  "Message 4": "I was fine... until you distracted me.",
  "Message 4 Description": "Playful and teasing, it flatters him while also making the conversation more flirty and engaging."
}
Example 2:
{
  "Title": "Words that break his ego",
  "Subtitle": "(in the right way) & bring out his best behavior >>>",
  "Message 1": "Let me know when you're ready to treat me right.",
  "Message 1 Description": "(Confident. Calm. Unbothered.)",
  "Message 2": "I'm not here to teach you how to love a woman.",
  "Message 2 Description": "(It makes him realize you're not his therapist.)",
  "Message 3": "Actions show me everything. Words don't impress me.",
  "Message 3 Description": "(Makes him step up instead of talk.)",
  "Message 4": "I don't chase. I choose.",
  "Message 4 Description": "(It puts the power back in your hands -- where it belongs.)"
}
Example 3:
{
  "Title": "Words that break his ego",
  "Subtitle": "(But Make Him Rise for You)>>>",
  "Message 1": "You're better than that.",
  "Message 1 Description": "Not an attack. A challenge. And men rise to challenges.",
  "Message 2": "I don't argue with men I respect.",
  "Message 2 Description": "Let that one sit. Watch him choose his tone wisely next time.",
  "Message 3": "I know my worth -- do you?",
  "Message 3 Description": "It's not a threat. It's a mirror.",
  "Message 4": "Peace is more attractive to me than proving a point.",
  "Message 4 Description": "You keep your feminine energy. He learns to meet you there."
}
Example 4:
{
  "Title": "Text him this and watch how he changes.",
  "Subtitle": "No chasing. No begging. Just power.",
  "Message 1": "I love when a man knows exactly what he wants.",
  "Message 1 Description": "triggers his masculine side to step up.",
  "Message 2": "It's okay, I don't repeat myself twice.",
  "Message 2 Description": "sets standards without sounding needy.",
  "Message 3": "I'm not upset. I just know what I deserve.",
  "Message 3 Description": "shows emotional control (rare = attractive).",
  "Message 4": "I'm not here to convince, I'm here to be chosen.",
  "Message 4 Description": "makes him realize he could lose you."
}
Example 5:
{
  "Title": "4 texts to make him terrified of losing you >>>",
  "Message 1": "I've been pouring so much into this... I just hope it's mutual.",
  "Message 1 Description": "-> Makes him reflect on what he's giving back.",
  "Message 2": "I've started realizing what I truly deserve.",
  "Message 2 Description": "-> Plants the seed that you won't settle.",
  "Message 3": "I miss how things used to feel.",
  "Message 3 Description": "-> Hits nostalgia. And fear.",
  "Message 4": "I need to feel chosen, not tolerated.",
  "Message 4 Description": "-> Forces him to step up -- or lose you."
}
Respond strictly in the following JSON format:
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
