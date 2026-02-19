import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateQuizFromAI = async (description) => {
  // curlの結果に基づき、確実に存在する最新モデルを指定
  const model = genAI.getGenerativeModel({ model: "models/gemini-3-flash-preview" });

  const prompt = `
    Input Text: "${description}"
    Task: 
    1. Detect the language of the Input Text.
    2. Return the language as a 2-letter ISO 639-1 code ONLY (e.g., "ja" for Japanese, "en" for English).
    3. Create a 3-choice quiz in that same language.
    
    Return ONLY JSON:
    {
        "question": "string",
        "options": ["string", "string", "string"],
        "answerIndex": number,
        "detectedLanguage": "ja" // 必ず2文字で出力するように指示
    }
 `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // クリーニング処理
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Quiz Generation Error:", error);
    throw error;
  }
};