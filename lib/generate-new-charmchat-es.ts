const SUPABASE_FUNCTION_URL =
  "https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai-v2"

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface GenerateCarouselPayload {
  topic: string
  tone?: string
  textStyle?: string
}

interface CharmChatResponse {
  data: any & {
    _metadata?: {
      usedFallback: boolean
      provider: 'azure' | 'openai'
    }
  }
  error: string | null
}

/* ------------------------- UTILS -------------------------- */
const fallback = (val: string | undefined, placeholder: string) =>
  val?.trim() ? val : placeholder

/* ------------------------ PROMPT BUILDER ------------------------ */
export const buildCharmPromptEs = (topic: string, tone = ""): string => {
  const prompt: Record<string, string> = {}

  prompt["Título"] = "Traduce al español de forma natural: " + topic
  prompt["Subtítulo"] = "completa el vacío basándote en el contexto"
  prompt["Prompt de Mensaje"] = `Refiriéndote al título, escribe una frase. No parafrasees innecesariamente - si el Título ya es una frase de acción clara, úsala tal como está. Si no, crea una frase de acción concisa que capture la intención del Título.`
  prompt["Tono"] = fallback(tone, "Elige entre Ligoteo, Coqueto o Adulto")

  for (let i = 1; i <= 3; i++) {
    prompt[`No Digas Mensaje ${i}`] = `Completa el vacío basándote en el contexto`
    prompt[`Di Mensaje ${i}`] = `Completa el vacío basándote en el contexto`
  }

  return `Estás escribiendo una publicación de TikTok enseñando a los hombres cómo enviar mensajes de texto a las mujeres y proporcionando mensajes de "no digas" y "di". Aquí está la estructura de tu publicación. Si se proporciona contenido, no debes cambiar el contenido en ese campo. Si necesitas completar espacios en blanco, complétalos basándote en el contexto general de la publicación. Aquí tienes algunos ejemplos de publicaciones extremadamente virales. Aprende de ellos y escribe una publicación viral. En términos de los mensajes generados, no deben usar ningún emoji. Estudia cuidadosamente los **patrones matizados** en estos ejemplos. Los mensajes 'Di' demuestran diferentes texturas encantadoras de un hombre - a veces misterioso y juguetón, a veces asertivo y directo, a veces oscuro y psicológico, a veces sutilmente sofisticado. Los mejores mensajes son simples pero un poco inesperados, creando intriga a través del ingenio y la confianza, no con vocabulario poético o elegante. Aprende estos matices de los ejemplos. Los mensajes 'No Digas' representan mensajes típicos débiles que envían los hombres. Cada par 'No Digas' y 'Di' debe abordar el mismo contexto (como ambos siendo cumplidos, ambos invitándola a salir, ambos siendo coquetos) - la diferencia está en la entrega y el impacto emocional. Si el título es sobre 'jugoso', 'picante', 'atrevido', o 'salvaje' - crea mensajes extremadamente picantes y NSFW, con carga sexual.

Ejemplo 1:
{
  "Título": "4 movimientos de texto que la hacen pensar en ti todo el día",
  "Subtítulo": "Domina el arte de la intriga",
  "Prompt de Mensaje": "Haz que piense en mí",
  "Tono": "Coqueto",
  "No Digas Mensaje 1": "¿Cómo está tu día?",
  "Di Mensaje 1": "Trata de no extrañarme demasiado hoy.",
  "No Digas Mensaje 2": "Estás buena.",
  "Di Mensaje 2": "Tienes el tipo de sonrisa que me hace olvidar lo que estaba diciendo.",
  "No Digas Mensaje 3": "Sería divertido ir al karaoke juntos.",
  "Di Mensaje 3": "Tú y yo nunca deberíamos estar cerca de una máquina de karaoke.",
  "No Digas Mensaje 4": "Eres tan linda, me gustas.",
  "Di Mensaje 4": "Eres problemática. Y me gustan los problemas."
}

Ejemplo 2:
{
  "Título": "4 mensajes sucios que ella no puede ignorar",
  "Subtítulo": "Sube la temperatura",
  "Prompt de Mensaje": "Envía mensajes sucios que llamen su atención",
  "Tono": "Adulto",
  "No Digas Mensaje 1": "Estoy pensando en ti en la cama.",
  "Di Mensaje 1": "Acabo de tener un pensamiento sobre ti... pero lo guardaré para cuando seas lo suficientemente valiente como para preguntar.",
  "No Digas Mensaje 2": "¿Quieres hablar de algo picante?",
  "Di Mensaje 2": "Esta conversación se está volviendo demasiado segura. ¿Debería arruinarla o comportarme?",
  "No Digas Mensaje 3": "Sé que no eres tan inocente como pareces.",
  "Di Mensaje 3": "Estás actuando demasiado bien como inocente... No me lo creo.",
  "No Digas Mensaje 4": "Quiero hacerte cosas.",
  "Di Mensaje 4": "Si te dijera lo que acabo de imaginar... o me bloquearías o vendrías corriendo."
}

Ejemplo 3:
{
  "Título": "Cómo escribirle como un hombre, no como un niño",
  "Prompt de Mensaje": "escríbele como un hombre, no como un niño",
  "Tono": "Ligoteo",
  "No Digas Mensaje 1": "¿Estás enojada conmigo?",
  "Di Mensaje 1": "Siento que algo está mal - ¿quieres hablar de ello?",
  "No Digas Mensaje 2": "¿Estás ocupada?",
  "Di Mensaje 2": "Haré tiempo para ti si estás libre.",
  "No Digas Mensaje 3": "Oye, ¿quieres salir?",
  "Di Mensaje 3": "Voy a salir el viernes - ven conmigo si estás libre.",
  "No Digas Mensaje 4": "¿Puedo llamarte?",
  "Di Mensaje 4": "Te llamaré esta noche. Hazme saber si te parece bien."
}

Ejemplo 4:
{
  "Título": "Mensajes oscuros a los que las mujeres siempre responden",
  "Subtítulo": "Crea misterio y profundidad",
  "Prompt de Mensaje": "Envía mensajes misteriosos y oscuros",
  "Tono": "Ligoteo",
  "No Digas Mensaje 1": "Necesito decirte algo importante.",
  "Di Mensaje 1": "Hay algo que necesito decir, pero no estoy seguro de si estás lista para escucharlo...",
  "No Digas Mensaje 2": "A todos les debe encantar estar contigo",
  "Di Mensaje 2": "¿Alguna vez te preguntas qué piensan realmente las personas de ti?",
  "No Digas Mensaje 3": "Eres tan misteriosa jaja",
  "Di Mensaje 3": "Tienes este lado tuyo que no puedo descifrar del todo...",
  "No Digas Mensaje 4": "¿Entonces qué haces para divertirte?",
  "Di Mensaje 4": "¿Crees que todo pasa por una razón, o piensas que la vida es solo aleatoria?"
}

Ejemplo 5:
{
  "Título": "Cómo coquetear sin ser ridículo",
  "Prompt de Mensaje": "Coquetea sin ser ridículo",
  "Tono": "Coqueto",
  "No Digas Mensaje 1": "Estás tan buena",
  "Di Mensaje 1": "Hay algo sobre tu energía... es peligrosa.",
  "No Digas Mensaje 2": "¿Puedo invitarte a salir alguna vez?",
  "Di Mensaje 2": "Estoy libre el jueves. Vamos por esa bebida en la que has estado pensando toda la semana.",
  "No Digas Mensaje 3": "Eres diferente.",
  "Di Mensaje 3": "No puedo decidir si eres problemática... o solo finges serlo.",
  "No Digas Mensaje 4": "Eres linda cuando estás enojada",
  "Di Mensaje 4": "Esta actitud te va a meter en problemas..."
}

Responde estrictamente en el siguiente formato JSON, PERO todos los mensajes generados deben estar en ESPAÑOL:
${JSON.stringify(prompt, null, 2)}`
}

/* ------------------------ API CALLER ------------------------ */
export async function generateNewCharmChatCarouselEs({
  topic,
  tone = "",
  textStyle = "style1",
}: GenerateCarouselPayload): Promise<CharmChatResponse> {
  const finalPrompt = buildCharmPromptEs(topic, tone)

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
    
    // Log fallback usage for monitoring
    if (data._metadata) {
      console.log(`🤖 AI Provider: ${data._metadata.provider}`)
      if (data._metadata.usedFallback) {
        console.log('🔄 Azure OpenAI failed (filtered or empty content), used OpenAI fallback')
        // You can also send this to your analytics service
        // analytics.track('azure_fallback_triggered', { topic, tone })
      } else {
        console.log('✅ Azure OpenAI worked without filtering')
      }
    }
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: String(error) }
  }
} 