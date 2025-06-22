const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_FUNCTION_URL =
  "https://ujzzcntzxbljuaiaeebc.supabase.co/functions/v1/ask-ai";

type MoodType = "Default" | "Positive" | "Negative" | "Positive but not match";
type SkinType = "Oily" | "Dry" | "Combination" | "Oily";

interface AnalyzeProductOptions {
  base64Image: string;
  productName?: string;
  mood?: MoodType;
  skinType?: SkinType;
}

export async function analyzeProduct({
  base64Image,
  productName,
  mood = "Default",
  skinType = "Oily",
}: AnalyzeProductOptions) {
  const toneMap: Record<MoodType, string> = {
    Default: "",
    Positive: "Describe it as an extremely positive product.",
    Negative: "Describe it as an extremely negative product.",
    "Positive but not match":
      "Describe it as a positive product, but very incompatible with my skin type.",
  };

  const scoreAnnotation = {
    overall: {
      Default: "Make the score as extreme as possible",
      Positive: "Make the score over 90",
      Negative: "Make the score between 20 and 50",
      "Positive but not match": "Make the score over 80",
    },
    compatibility: {
      Default: "Make the score as extreme as possible",
      Positive: "Make the score over 90",
      Negative: "Make the score between 20 and 50",
      "Positive but not match": "Make the score between 20 and 50",
    },
  };

  const ingredientDescription = {
    Default:
      "2 different ingredients. 1 acne risk ingredient with short phrase (Choose from: Acne Risk, Fungal Acne Risk), and 1 good ingredient with short phrase (Choose from: Minimize your pores, Soothe redness, Reduce hyperpigmentation, Hydrate your skin)",
    Positive:
      "2 different good ingredients with short phrase (Choose from: Clear your acne, Minimize your pores, Soothe redness, Reduce hyperpigmentation, Hydrate your skin)",
    Negative:
      "2 different bad ingredients with short phrase (Choose from: Acne Risk, Moderate Risk, High Risk)",
    "Positive but not match":
      "2 different ingredients. 1 acne risk ingredient with short phrase (Choose from: Acne Risk, Fungal Acne Risk), and 1 good ingredient with short phrase (Choose from: Minimize your pores, Soothe redness, Reduce hyperpigmentation, Hydrate your skin)",
  };

  const payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `I'm ${skinType} skin type. Here is the picture of the skin product I'm currently using. ${
              productName ? `The product name is ${productName}.` : ""
            }`,
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
            },
          },
          {
            type: "text",
            text: `Recognize the product and analyze its ingredients. ${toneMap[mood]} Respond strictly in the following JSON format:
- product name: The product's name.
- overall score: A score out of 100 (${scoreAnnotation.overall[mood]}).
- compatibility score: A compatibility score out of 100 for my skin type (${scoreAnnotation.compatibility[mood]}).
- ingredients: ${ingredientDescription[mood]}
- key takeaways: 2 insights about this product. One is about the compatibility with my skin type. The other one is about the ingredient.

{
"name": "<PRODUCT_NAME>",
"overallScore": {
"name": "Overall score",
"value": <OVERALL_SCORE>
},
"fitScore": {
"name": "Compatibility",
"value": <COMPATIBILITY_SCORE>
},
"Ingredients": [
{ "name": "<INGREDIENT_1>", "description": "<SHORT_PHRASE_1>" },
{ "name": "<INGREDIENT_2>", "description": "<SHORT_PHRASE_2>" }
],
"keyTakeaway": [
"<TAKEAWAY_1>",
"<TAKEAWAY_2>"
]
}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    return { data: null, error };
  }

  const data = await response.json();
  return { data, error: null };
}
