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

  prompt["Title"] = topic
  prompt["Subtitle"] = "fill the blank based on the context"
  prompt["Message Prompt"] = `Refer the title to write a phrase. Don't paraphrase unnecessarily - if the Title is already a clear action phrase, use it as-is. If not, create a concise action phrase that captures the Title's intent.`
  prompt["Tone"] = fallback(tone, "Choose from Dating, Flirty, or Adult")

  for (let i = 1; i <= 3; i++) {
    prompt[`Don't Say Message ${i}`] = `Fill the blank based on the context`
    prompt[`Say Message ${i}`] = `Fill the blank based on the context`
  }

  return `You are writing a TikTok post teaching men how to text with women and providing "don't say" messages and "say" messages. Here is the structure of your post. If content is provided, you must not change the content in that field. If you need to fill in blanks, fill them based on the overall context of the post. Here are some examples of extremely viral post. Learn from them and write a viral post. In terms of the messages generated, they must not use any emoji. Study the **nuanced patterns** in these examples carefully. The 'Say' messages demonstrate different charming textures of a man - sometimes mysterious and playful, sometimes assertive and direct, sometimes dark and psychological, sometimes subtly sophisticated. The best messages are simple but a bit unexpected, creating intrigue through wit and confidence, not poetic fancy vocabulary. "For topics about 'juicy', 'spicy', or 'dirty' - lean into playful tension and edge, but subtle. Create questions that reveal her wild side, not her feelings." Learn these nuances from the examples. The 'Don't Say' messages represent typical weak texts men send.Each 'Don't Say' and 'Say' pair should address the same context (like both being compliments, both asking her out, both being flirty) - the difference is in the delivery and emotional impact.
Example 1:
{
  "Title": "4 Text moves that make her think about you all day",
  "Subtitle": "Master the art of intrigue",
  "Message Prompt": "Make her think about me",
  "Tone": "Flirty",
  "Don't Say Message 1": "How's your day?",
  "Say Message 1": "Try not to miss me too much today.",
  "Don't Say Message 2": "You are hot.",
  "Say Message 2": "You have the kind of smile that makes me forget what I was saying.",
  "Don't Say Message 3": "It would be fun to go to karaoke together.",
  "Say Message 3": "You and I should never be allowed near a karaoke machine.",
  "Don't Say Message 4": "You are so cute, I like you.",
  "Say Message 4": "You're trouble. And I like trouble."
}
Example 2:
{
  "Title": "4 dirty texts she can't ignore",
  "Subtitle": "Turn up the heat",
  "Message Prompt": "Send dirty texts that get her attention",
  "Tone": "Adult",
  "Don't Say Message 1": "I'm thinking about you in bed.",
  "Say Message 1": "I just had a thought about you... but I'll save it for when you're bold enough to ask.",
  "Don't Say Message 2": "Want to talk about something spicy?",
  "Say Message 2": "This convo is getting too safe. Should I ruin it or behave?",
  "Don't Say Message 3": "I know you're not as innocent as you seem.",
  "Say Message 3": "You're playing innocent way too well... I'm not buying it.",
  "Don't Say Message 4": "I want to do things to you.",
  "Say Message 4": "If I told you what I just imagined... you'd either block me or pull up."
}
Example 3:
{
  "Title": "How to text her like a man not a boy",
  "Message Prompt": "text her like a man not a boy",
  "Tone": "Dating",
  "Don't Say Message 1": "Are you mad at me?",
  "Say Message 1": "I feel like something's off - want to talk about it?",
  "Don't Say Message 2": "You busy?",
  "Say Message 2": "I will make time for you if you're free.",
  "Don't Say Message 3": "Hey, wanna hang out?",
  "Say Message 3": "I'm going out Friday - come with me if you're free.",
  "Don't Say Message 4": "Can I call you?",
  "Say Message 4": "I will call you tonight. Let me know that works for you."
}
Example 4:
{
  "Title": "Dark texts women always reply to",
  "Subtitle": "Create mystery and depth",
  "Message Prompt": "Send dark mysterious texts",
  "Tone": "Dating",
  "Don't Say Message 1": "I need to tell you something important.",
  "Say Message 1": "There's something I need to say, but I'm not sure if you're ready to hear it...",
  "Don't Say Message 2": "Everyone must love being around you",
  "Say Message 2": "Do you ever wonder what people really think of you?",
  "Don't Say Message 3": "You're so mysterious lol",
  "Say Message 3": "You have this side of you that I can't quite figure out...",
  "Don't Say Message 4": "So what do you do for fun?",
  "Say Message 4": "Do you believe everything happens for a reason, or do you think life's just random?",
}
Example 5:
{
  "Title": "How to flirt without being cringe",
  "Message Prompt": "Flirt without being cringe",
  "Tone": "Flirty",
  "Don't Say Message 1": "You're so hot",
  "Say Message 1": "There's something about your energy... it's dangerous.",
  "Don't Say Message 2": "Can I take you out sometime?",
  "Say Message 2": "I'm free Thursday. Let's grab the drink you've been thinking about all week.",
  "Don't Say Message 3": "You're different.",
  "Say Message 3": "I can't decide if you're trouble... or just pretending to be.",
  "Don't Say Message 4": "You're cute when you're mad",
  "Say Message 4": "This attitude's gonna get you in trouble...",
}
Respond strictly in the following JSON format:
${JSON.stringify(prompt, null, 2)}`
}

/* ------------------------ API CALLER ------------------------ */
export async function generateNewCharmChatCarousel({
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
