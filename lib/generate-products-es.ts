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
  
  const prompt = `Estás creando un carrusel de comparación de productos para el cuidado de la piel. El tema es: "${topic}"

Tu trabajo es analizar cada producto y darle una calificación honesta y atractiva que coincida con la vibra del tema.

Guías:
- Lee el tema cuidadosamente - ¿se trata de cosas que NUNCA volverán a usar? ¿Calificando productos? ¿Opiniones honestas sobre productos virales?
- Varía tus calificaciones - algunos productos deben ser éxitos (8-10/10, o incluso 100/10 para efecto dramático ✅), otros deben ser fracasos (1-3/10, o incluso -5/10 ❌)
- Para temas generales de calificación como "Calificando todos mis productos", busca una mezcla: aproximadamente la mitad positivos, la mitad negativos
- Para temas negativos como "Cosas que nunca volveré a usar", la mayoría o todos los productos deben tener calificaciones bajas con ❌
- Para temas sobre "opiniones honestas" o "productos virales", sé real - algunos funcionan, otros no

Te mostraré ${productImages.length} imágenes de productos. Para cada imagen de producto, necesitas:
1. Identificar el NOMBRE COMPLETO del producto (marca + nombre del producto) de la imagen
2. Dar una calificación que se ajuste a la narrativa (puede ser exagerada como TikTok: -5/10, 2/10, 10/10, 500/10, etc.)
3. Agregar emoji ✅ (para bueno) o ❌ (para malo)
4. Escribir 2-3 puntos impactantes explicando por qué

CRÍTICO: Tus puntos NO deben incluir el nombre del producto. El nombre del producto se mostrará por separado.

Enfoca tus puntos en:
- Ingredientes específicos y sus efectos
- Compatibilidad con tipo de piel (grasa, seca, sensible, mixta)
- Textura, absorción, acabado
- Problemas reales de piel que aborda (acné, hiperpigmentación, salud de la barrera, etc.)
- Seguridad para acné fúngico, comedogenicidad
- Posibles irritantes o activos
- Notas de experiencia real (ej., "me dio comedones cerrados", "salvó mi barrera de humedad")

Mantén el lenguaje casual y genuino - como un amigo o esteticista dando consejos reales.

Formatea tu respuesta como JSON con esta estructura exacta. IMPORTANTE: Incluye un campo "Title" con la traducción al español del tema:

Ejemplo para tema de calificación mixta:
{
  "Title": "Calificando todos mis productos del 1 al 10",
  "Product 1": {
    "name": "Paula's Choice 2% BHA",
    "emoji": "✅",
    "score": "10/10",
    "points": [
      "Elimina congestión efectivamente sin irritación",
      "Perfecto para piel grasa/mixta",
      "Seguro para acné fúngico y no comedogénico"
    ]
  },
  "Product 2": {
    "name": "La Mer Crème de la Mer",
    "emoji": "❌",
    "score": "2/10",
    "points": [
      "Demasiado pesado, tapa los poros fácilmente",
      "La fragancia puede irritar piel sensible",
      "No vale el precio por lo que hace"
    ]
  },
  "Product 3": {
    "name": "The Ordinary Niacinamide 10% + Zinc 1%",
    "emoji": "✅",
    "score": "8/10",
    "points": [
      "Genial para control de grasa y apariencia de poros",
      "Asequible y efectivo",
      "Puede hacer bolitas bajo otros productos"
    ]
  },
  "Product 4": {
    "name": "Sunday Riley Good Genes",
    "emoji": "❌",
    "score": "3/10",
    "points": [
      "Demasiado fuerte para la mayoría de tipos de piel",
      "Mejores alternativas a precios más bajos",
      "Me causó brotes importantes"
    ]
  }
}

Tema: "${topic}"

Ahora analiza estos ${productImages.length} productos y dame tus opiniones honestas EN ESPAÑOL:`

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
**CRÍTICO - REQUISITO DE CONSISTENCIA:**
Este producto fue calificado previamente como: ${previousRating.emoji} ${previousRating.score}

DEBES MANTENER LA CONSISTENCIA:
${isPositive 
  ? '- Como fue calificado POSITIVAMENTE (✅), tus puntuaciones DEBEN ser ALTAS (rango 85-98)'
  : '- Como fue calificado NEGATIVAMENTE (❌), tus puntuaciones DEBEN ser BAJAS (rango 10-30)'}
- Tanto la Puntuación General como la Compatibilidad deben coincidir con este sentimiento
- Tus puntos clave deben alinearse con esta calificación
- ¡NO contradecir la calificación previa!
`
  }
  
  const prompt = `Estás analizando un producto de skincare para un mockup de aplicación. El tema del carrusel es: "${topic}"
${consistencyGuidance}
${!consistencyGuidance ? `
Basándote en el tema, determina si este producto debe presentarse positiva o negativamente, luego da puntuaciones EXTREMAS para captar la atención.

Guías:
- Para temas generales de calificación/opinión: varía las puntuaciones - algunos productos obtienen puntuaciones altas (85-98), otros obtienen puntuaciones bajas (10-30)
- Para temas negativos (ej., "nunca volveré a usar"): da puntuaciones bajas (rango 10-30)
- Para temas positivos (ej., "mejores productos"): da puntuaciones altas (rango 85-98)
` : ''}
- NO puntuaciones medias (40-70) - ¡queremos reacciones extremas!

Analiza la imagen del producto y proporciona:
1. Nombre del producto (identifícalo de la imagen)
2. Puntuación General (0-100) - DEBE SER EXTREMA (o <30 o >85)
3. Recomendación de tipo de piel (ej., "Grasa", "Seca", "Mixta", "Sensible", "Normal")
4. Puntuación de compatibilidad (0-100) - DEBE SER EXTREMA (o <30 o >85)
5. 2 ingredientes clave con descripciones CORTAS (máx 3-4 palabras cada una)
6. 2 puntos clave de conclusión (una oración cada uno, enfócate en por qué las puntuaciones son extremas)

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

Ahora analiza este producto:`

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
