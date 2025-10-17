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
  const prompt = `Eres un experto en comparaciones de productos para el cuidado de la piel. Basándote en el siguiente tema, determina la estructura de un carrusel de comparación de productos.

Tema: "${topic}"

Tu tarea es determinar qué 4 productos deberían destacarse (imágenes 2-5 del carrusel). Cada producto debe ser "luxury" (caro/alta gama) o "affordable" (económico/asequible).

Analiza el tema y decide:
- Si se trata de comparar rangos de precios, alterna entre luxury y affordable
- Si se trata de preocupaciones específicas, elige productos que demuestren mejor el punto
- Considera el flujo narrativo y qué tiene sentido para la comparación

Responde SOLO con un array JSON de 4 elementos, cada uno siendo "luxury" o "affordable".

Ejemplo 1 - Tema: "Mi rutina de skincare de $5000 vs la rutina de $50 de mi compañero de cuarto"
Respuesta: ["luxury", "affordable", "luxury", "affordable"]

Ejemplo 2 - Tema: "Alternativas económicas para skincare de lujo"
Respuesta: ["luxury", "affordable", "luxury", "affordable"]

Ejemplo 3 - Tema: "Gasté $5K en skincare antes de darme cuenta de que ESTO me causaba brotes"
Respuesta: ["luxury", "luxury", "luxury", "luxury"]

Ahora analiza este tema y responde con el array de estructura:
Tema: "${topic}"

Respuesta (solo array JSON):`

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
      return { structure: [], error: 'No se recibió contenido de la IA' }
    }

    // Parse the JSON array
    const jsonString = rawContent.replace(/^```json/, '').replace(/```$/, '').trim()
    const structure = JSON.parse(jsonString)

    if (!Array.isArray(structure) || structure.length !== 4) {
      return { structure: [], error: 'Formato de estructura inválido - se esperaban 4 elementos' }
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
  const prompt = `Estás creando un carrusel de comparación de productos para el cuidado de la piel. El tema es: "${topic}"

CRÍTICO: Analiza el tema cuidadosamente para entender la narrativa:
- Si el tema trata de productos que causaron brotes/problemas → TODOS los productos deben tener calificaciones BAJAS (1-3/10) con ❌
- Si el tema trata de productos caros que no funcionaron → Califica productos luxury BAJO, alternativas affordable ALTO
- Si el tema trata de comparar caro vs barato → Mezcla calificaciones según cuál realmente funciona mejor
- Si el tema es positivo (ej., "mejores productos para...") → Da calificaciones ALTAS (8+, o incluso 100/10, 2800/10, etc.) con ✅

Las calificaciones y emojis DEBEN alinearse con la narrativa del tema. ¡No des puntuaciones altas al azar si el tema es negativo!

Te mostraré ${productImages.length} imágenes de productos (imágenes 2-5 del carrusel). Para cada imagen de producto, necesitas:
1. Identificar qué es el producto (de la imagen)
2. Dar una calificación sobre 10 que COINCIDA CON LA NARRATIVA DEL TEMA (puede ser exagerada como TikTok: -5/10, 1/10, 100/10, etc.)
3. Agregar emoji ✅ (para bueno) o ❌ (para malo) - DEBE coincidir con la postura del tema
4. Escribir 2-3 puntos impactantes explicando por qué

IMPORTANTE: Enfoca tus puntos en:
- Ingredientes específicos y sus efectos
- Compatibilidad con tipo de piel (grasa, seca, sensible, mixta)
- Textura, absorción, acabado
- Problemas reales de piel que aborda (acné, hiperpigmentación, salud de la barrera, etc.)
- Seguridad para acné fúngico, comedogenicidad
- Posibles irritantes o activos

EVITA enfocarte en el precio en los puntos. Incluso si el tema menciona el precio, tus puntos deben explicar POR QUÉ el producto es bueno/malo según la formulación y compatibilidad con la piel, no solo que es barato o caro.

El lenguaje debe ser casual y directo - como un amigo presentándote un producto. TODO EN ESPAÑOL.

Formatea tu respuesta como JSON con esta estructura exacta. IMPORTANTE: Incluye un campo "Title" con la traducción al español del tema:

Ejemplo para tema NEGATIVO ("Esto me causó brotes"):
{
  "Title": "Esto me causó brotes",
  "Product 1": {
    "emoji": "❌",
    "score": "1/10",
    "points": [
      "Tapa los poros como loco",
      "No es seguro para acné fúngico",
      "Empeoró mis brotes 10x"
    ]
  },
  "Product 2": {
    "emoji": "❌",
    "score": "-5/10",
    "points": [
      "ARRUINA la barrera cutánea",
      "Aumenta hiperpigmentación y daño UV",
      "Me dio comedones cerrados"
    ]
  },
  "Product 3": {
    "emoji": "❌",
    "score": "2/10",
    "points": [
      "HORRIBLE para piel seca",
      "Demasiado abrasivo para piel sensible",
      "Riesgo de sobreexfoliación, causa problemas de barrera"
    ]
  },
  "Product 4": {
    "emoji": "❌",
    "score": "0/10",
    "points": [
      "Causa quemaduras químicas, no vale la pena",
      "Causa descamación y costras en la piel"
    ]
  }
}

Ejemplo para tema POSITIVO ("Mejores productos para..."):
{
  "Title": "Mejores productos para piel sensible",
  "Product 1": {
    "emoji": "✅",
    "score": "10/10",
    "points": [
      "Elimina congestión efectivamente, reduce puntos negros",
      "Adecuado para la mayoría de tipos de piel, cuando se introduce gradualmente"
    ]
  },
  "Product 2": {
    "emoji": "✅",
    "score": "9/10",
    "points": [
      "Económico",
      "Funciona mejor que marcas de lujo",
      "Sin irritación"
    ]
  },
  "Product 3": {
    "emoji": "✅",
    "score": "100/10",
    "points": [
      "Excelente durante brotes de sensibilidad",
      "Hidratación profunda"
    ]
  },
  "Product 4": {
    "emoji": "✅",
    "score": "8/10",
    "points": [
      "Suave y sin fragancia",
      "Profundamente restaurador y amigable con la barrera"
    ]
  }
}

Tema: "${topic}"

Ahora analiza estos ${productImages.length} productos y genera las superposiciones de texto apropiadas EN ESPAÑOL:`

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
  
  const prompt = `Estás analizando un producto de skincare para mostrarlo en un mockup de aplicación. El tema del carrusel es: "${topic}"

CRÍTICO: ¡Las puntuaciones DEBEN ser EXTREMAS para captar la atención!
- Si el tema es NEGATIVO (causando brotes, malos productos) → Da puntuaciones MUY BAJAS (rango 10-30)
- Si el tema es POSITIVO (mejores productos, funciona bien) → Da puntuaciones MUY ALTAS (rango 85-98)

NO des puntuaciones medias (40-70). ¡Queremos reacciones extremas!

Analiza la imagen del producto y proporciona:
1. Nombre del producto (identifícalo de la imagen)
2. Puntuación General (0-100) - DEBE SER EXTREMA (o <30 o >85)
3. Recomendación de tipo de piel (ej., "Grasa", "Seca", "Mixta", "Sensible", "Normal")
4. Puntuación de compatibilidad (0-100) - DEBE SER EXTREMA (o <30 o >85)
5. 2 ingredientes clave con descripciones CORTAS (máx 3-4 palabras cada una)
6. 2 puntos clave de conclusión (una oración cada uno, enfócate en por qué las puntuaciones son extremas)

TODO EN ESPAÑOL.

Formatea tu respuesta como JSON:
{
  "name": "Nombre del Producto",
  "overallScore": 92,
  "skinType": "Grasa",
  "compatibility": 89,
  "ingredients": [
    { "name": "Ácido Hialurónico", "description": "Hidratación profunda" },
    { "name": "Niacinamida", "description": "Reduce inflamación" }
  ],
  "keyTakeaway": [
    "Este producto es excepcional para piel grasa con ingredientes probados que equilibran la producción de sebo.",
    "Formulación altamente compatible que no tapa poros ni causa brotes."
  ]
}

Tema: "${topic}"

Ahora analiza esta imagen de producto:`

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

