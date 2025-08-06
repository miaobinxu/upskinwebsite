const SUPABASE_FUNCTION_URL =
  "https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai"

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface GenerateCarouselPayload {
  topic: string
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

/* ------------------------ PROMPT BUILDER ------------------------ */
export const buildCharmPrompt = (topic: string, tone = ""): string => {
  const prompt: Record<string, string> = {}

  prompt["Title"] = "Translate '" + topic + "' to native Japanese"
  prompt["Subtitle"] = `Fill the blank in native Japanese based on the context`
  prompt["Message Prompt"] = "Refer the title to write a phrase in native Japanese"
  prompt["Tone"] = fallback(tone, "Choose from デート, サッシー, or フラーティー")

  for (let i = 1; i <= 5; i++) {
    prompt[`Don't Say Message ${i}`] = `Fill the blank in native Japanese based on the context`
    prompt[`Say Message ${i}`] = `Fill the blank in native Japanese based on the context`
  }

  return `You are writing a TikTok post teaching women how to text with men and providing "don't say" messages and "say" messages. Here is the structure of your post. If content is provided, you must not change the content in that field unless the field requires to use Japanese. If you need to fill in blanks, fill them based on the overall context of the post. Here are some examples of extremely viral post, but they are all in English. You will need to use Japanese in some fields as required. Learn from them and write a viral post. In terms of the messages generated, they must not use any emoji. For "say" messages, they should be VERY impressive.
Example 1:
{
  "Title": "Feminine Ways to Talk to Him",
  "Subtitle": "Make Him Crave You",
  "Message Prompt": "Make him crave me",
  "Tone": "Dating",
  "Don't Say Message 1": "Why didn't you text me back?",
  "Say Message 1": "I missed hearing from you today... but I figured you were busy.",
  "Don't Say Message 2": "Where were you all day?",
  "Say Message 2": "I hope your day went well. I love hearing about it when you have time.",
  "Don't Say Message 3": "You never make time for me.",
  "Say Message 3": "I really enjoy the moments we do share... they always leave me wanting more.",
  "Don't Say Message 4": "I'm mad at you.",
  "Say Message 4": "I felt a little off earlier... I think I just needed some reassurance.",
  "Don't Say Message 5": "Are you even interested in me?",
  "Say Message 5": "I like how things feel between us... just wanted to see if you're on the same page."
}
Example 2:
{
  "Title": "How to speak to him femininely",
  "Message Prompt": "Speak to him femininely",
  "Tone": "Dating",
  "Don't Say Message 1": "Why didn't you call me?",
  "Say Message 1": "I missed hearing your voice, it would've made my day.",
  "Don't Say Message 2": "You need to listen to me.",
  "Say Message 2": "It would mean a lot if you could hear me out, I value your attention.",
  "Don't Say Message 3": "You're not doing enough.",
  "Say Message 3": "I appreciate what you do, and it would make me feel even more cared for if...",
  "Don't Say Message 4": "You don't care about my feelings.",
  "Say Message 4": "I feel safe when I know you understand how I'm feeling.",
  "Don't Say Message 5": "Why can't you just do it my way?",
  "Say Message 5": "I trust your decision, but could we try this as well?"
}
Example 3:
{
  "Title": "Texts that break his ego",
  "Message Prompt": "Break his ego!",
  "Tone": "Sassy",
  "Subtitle": "but make him rise for you",
  "Don't Say Message 1": "It's okay, I don't expect anything from you anymore.",
  "Say Message 1": "I release you.",
  "Don't Say Message 2": "I realized I was asking for the bare minimum. I'm done doing that.",
  "Say Message 2": "I've leveled up.",
  "Don't Say Message 3": "You don't have to change. I just no longer align with this,",
  "Say Message 3": "I'm the one choosing now.",
  "Don't Say Message 4": "You taught me what I'll never accept again.",
  "Say Message 4": "Thank you and goodbye."
}
Example 4:
{
  "Title": "Feminine ways to communicate when you want to exit a situationship",
  "Message Prompt": "exit a situationship",
  "Tone": "Dating",
  "Don't Say Message 1": "What are we? I need to know where this is going.",
  "Say Message 1": "I've really enjoyed our time together, but I'm looking for something more serious. I'd love to know if we're on the same page.",
  "Don't Say Message 2": "This isn't working for me anymore. We should stop seeing each other.",
  "Say Message 2": "I think we've shared some great moments, but I'm at a point where I need more clarity in my relationships. It's time for me to focus on what aligns with my future.",
  "Don't Say Message 3": "I feel like you're stringing me along, and I don't want to waste my time.",
  "Say Message 3": "I've been reflecting on what I want in a relationship, and I realize I'm looking for more stability and commitment. I'd love to hear your thoughts on where we stand.",
  "Don't Say Message 4": "Why do you keep sending me mixed signals? You need to make up your mind.",
  "Say Message 4": "I've noticed some inconsistency, and I value clarity and open communication. I need to know where we're headed to see if we're a fit moving forward.",
  "Don't Say Message 5": "This situationship isn't working. I'm done.",
  "Say Message 5": "I've enjoyed our time, but I've realized I'm ready for a relationship that offers more depth and commitment. I think it's best for us to part ways and pursue what we both truly want."
}
Example 5:
{
  "Title": "Feminine ways to speak to your man......",
  "Subtitle": "If you have an anxious attachment style",
  "Message Prompt": "Speak to him when I have an anxious attachment style",
  "Tone": "Dating",
  "Don't Say Message 1": "Why didn't you text me back? Are you mad at me?",
  "Say Message 1": "I love hearing from you -- it always brightens my day. It makes me feel closer when we stay in touch.",
  "Don't Say Message 2": "Are you losing interest? Why haven't we spent time together?",
  "Say Message 2": "I really miss our time together. I always feel so connected when we spend quality time with each other.",
  "Don't Say Message 3": "Are you going to leave me? I feel like you don't want me around anymore.",
  "Say Message 3": "I feel the most secure and happy when I know we're on the same page. It helps me feel safe when I feel that closeness.",
  "Don't Say Message 4": "Why don't you ever call me? Do you not care about how I'm feeling?",
  "Say Message 4": "I love hearing your voice, and it makes me feel so good when we talk. It really helps me feel more connected to you.",
  "Don't Say Message 5": "Why are you pulling away? Did I do something wrong?",
  "Say Message 5": "I've noticed we haven't been as close lately, and I really miss our connection. It makes me feel safe when we're in sync.",
  "Don't Say Message 6": "You don't tell me you love me enough. Do you still feel the same?",
  "Say Message 6": "I feel so loved when you tell me how much I mean to you. It makes me feel secure knowing how you feel."
}
Respond strictly in the following JSON format:
${JSON.stringify(prompt, null, 2)}`
}

/* ------------------------ API CALLER ------------------------ */
export async function generateFRCarousel({
  topic,
  tone = "",
  textStyle = "style1",
}: GenerateCarouselPayload): Promise<CharmChatResponse> {
  const finalPrompt = buildCharmPrompt(topic, tone)

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
