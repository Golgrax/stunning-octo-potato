import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAiRecommendation = async (
  userPreference: string,
  menuItems: string[]
): Promise<string> => {
  try {
    const prompt = `
      You are an expert barista at a high-end café called Lumina.
      The customer says: "${userPreference}".
      
      Available Menu Items: ${menuItems.join(", ")}.
      
      Based on their preference, recommend exactly ONE item from the menu.
      Explain why in one short, elegant sentence (max 20 words).
      Return the response in JSON format: { "recommendation": "Item Name", "reason": "Reasoning text" }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return JSON.stringify({ 
      recommendation: "Latte", 
      reason: "A classic choice is always reliable when the connection is fuzzy." 
    });
  }
};