
import { GoogleGenAI } from "@google/genai";

// This service is set up for future AI integration (e.g., an AI health assistant or package recommender).
// It respects the coding guidelines for the Gemini API.

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export const generateHealthTip = async (topic: string): Promise<string> => {
    if (!ai) return "AI Service not configured.";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Give a one sentence health tip regarding ${topic}.`,
        });
        return response.text || "Stay healthy!";
    } catch (error) {
        console.error("Error generating content:", error);
        return "Stay hydrated and sleep well.";
    }
};

export const recommendPackage = async (symptoms: string): Promise<string> => {
    if (!ai) return "Please consult a doctor for recommendations.";

    try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: `Based on these symptoms: "${symptoms}", suggest a general type of medical screening. Keep it brief.`,
        });
        return response.text || "Consult a general physician.";
    } catch (error) {
        console.error("Error recommending package:", error);
        return "Consult a general physician.";
    }
}
