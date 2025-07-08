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
    prompt["Message Prompt"] = fallback(
      replyMessage,
      "Refer the title to write extremely short and extremely concise prompt which can generate these messages"
    )
    prompt["Tone"] = fallback(tone, "Choose from Dating, Flirty, or Sassy")

    for (let i = 1; i <= 3; i++) {
      prompt[`Message ${i}`] = `Fill the blank based on the context`
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
    prompt["Message Prompt"] = fallback(
      replyMessage,
      "Refer the title to write extremely short and extremely concise prompt which can generate these messages"
    )
    prompt["Tone"] = fallback(tone, "Choose from Dating, Flirty, or Sassy")

    // Use messages from pages 2 to N-1 (excluding app screen)
    const totalUsablePages = totalImages - 2
    const messageCount = Math.max(3, totalUsablePages)

    for (let i = 1; i <= messageCount; i++) {
      const page = pageInputs[i] // pageInputs[1] = page 2, and so on
      prompt[`Message ${i}`] = fallback(
        page?.line1,
        `Fill the blank based on the context`
      )
      prompt[`Message ${i} Description`] = fallback(
        page?.line2,
        `Fill the blank based on the context`
      )
    }
  }

  // Final AI prompt string (JSON embedded in instructions)
  return `You are writing a TikTok post teaching women how to text with men and providing native texting messages. Here is the structure of your post. If content is provided, you must not change the content in that field. If you need to fill in blanks, fill them based on the overall context of the post. Here are some examples of extremely viral post. Learn from them and write a viral post. In terms of the messages generated, they should be VERY impressive and must not use any emoji.
Example 1:
{
  "Title": "Words that break his ego",
  "Subtitle": "(in the right way) & bring out his best behavior",
  "Message 1": "Let me know when you're ready to treat me right.",
  "Message 1 Description": "(Confident. Calm. Unbothered.)",
  "Message 2": "I'm not here to teach you how to love a woman.",
  "Message 2 Description": "(It makes him realize you're not his therapist.)",
  "Message 3": "Actions show me everything. Words don't impress me.",
  "Message 3 Description": "(Makes him step up instead of talk.)",
  "Message 4": "I don't chase. I choose.",
  "Message 4 Description": "(It puts the power back in your hands -- where it belongs.)"
}
Example 2:
{
  "Title": "5 FLIERTY replies to 'How are you?'",
  "Message Prompt": "How are you?",
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
Example 3:
{
  "Title": "Too much silence between you two?",
  "Subtitle": "These 5 texts can break it without chasing",
  "Message 1": "Not expecting anything from this... just felt like being honest about the part of me that still cares. That's all.",
  "Message 1 Description": "Grown, Not Desperate",
  "Message 2": "This isn't me trying to fix anything - just saying, if you ever want peace, I'd be open to that.",
  "Message 2 Description": "Open, But Guarded",
  "Message 3": "I'm not reaching out to be chosen. I'm reaching out because pretending I didn't care never felt right.",
  "Message 3 Description": "Real, Not Needy",
  "Message 4": "If you're not ready, that's okay. But if you ever wonder if I still wish you well - I do.",
  "Message 4 Description": "Strong, Still Soft"
}
Example 4:
{
  "Title": "Texts that make him chase you",
  "Message 1": "I've been so busy lately, haven't even had time to think.",
  "Message 1 Description": "It signals independence. No chasing = he starts.",
  "Message 2": "Last night was fun.",
  "Message 2 Description": "No over-excitement. Casual. He's left wondering what was fun, and if you felt the same.",
  "Message 3": "I'll let you know if I'm free.",
  "Message 3 Description": "Control the pace. You're the one with options",
  "Message 4": "You looked good today.",
  "Message 4 Description": "Just enough to spark his ego, but not too much to feed it."
}
Example 5:
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
Example 6:
{
  "Title": "Feminine Ways to Express Disappointment",
  "Subtitle": "(Without Attacking)",
  "Message 1": "It's okay... I've kind of learned not to expect too much anymore.",
  "Message 1 Description": "Subtle, yet heavy - it makes him reflect without a direct confrontation.",
  "Message 2": "I wasn't surprised... I've been trying to lower my hopes lately.",
  "Message 2 Description": "Sounds calm, but cuts deep. It makes him think about how he's shown up.",
  "Message 3": "I didn't really count on it happening - I've gotten used to letting things go.",
  "Message 3 Description": "Subtle detachment that makes him feel the distance growing."
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
