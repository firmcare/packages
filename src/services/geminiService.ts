
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

// ── Curated fallback tips (used when AI is not configured) ───────────────────
const CURATED_TIPS: Record<string, string[]> = {
  nutrition: [
    "Eat a rainbow of vegetables daily — each colour provides different essential nutrients your body needs.",
    "Replace refined carbs with whole grains to maintain steady energy levels throughout the day.",
    "Include a protein source in every meal to support muscle repair and keep you feeling fuller for longer.",
    "Limit added sugars to under 10% of your daily calorie intake for better metabolic health.",
    "Healthy fats from avocados, nuts, and olive oil support brain function and hormone balance.",
  ],
  hydration: [
    "Aim for at least 8 glasses of water daily — more if you exercise or live in a hot climate.",
    "Start your morning with a glass of water before coffee to kick-start your metabolism.",
    "Thirst is often mistaken for hunger; drink a glass of water before reaching for a snack.",
    "Herbal teas count toward your daily fluid intake and can add beneficial antioxidants.",
    "Carry a reusable water bottle to make staying hydrated throughout the day effortless.",
  ],
  sleep: [
    "Consistent sleep and wake times, even on weekends, strengthen your body's natural sleep cycle.",
    "Avoid screens for at least 30 minutes before bed — blue light suppresses melatonin production.",
    "Keep your bedroom cool and dark; the ideal sleep temperature is between 16–19 °C.",
    "Adults need 7–9 hours of quality sleep for immune function, memory consolidation, and mood.",
    "Limit caffeine after 2 pm to prevent it from disrupting your ability to fall asleep at night.",
  ],
  "stress management": [
    "Even five minutes of deep breathing can activate your parasympathetic nervous system and reduce stress.",
    "Regular physical activity is one of the most effective natural stress relievers available.",
    "Writing down three things you are grateful for each day can measurably improve mental wellbeing.",
    "Set clear boundaries between work and personal time to protect your mental and emotional health.",
    "Spending time in nature, even a short walk in a park, significantly lowers cortisol levels.",
  ],
  "cardio exercise": [
    "Just 30 minutes of brisk walking five times a week reduces the risk of heart disease significantly.",
    "Interval training — alternating fast and slow bursts — burns more calories in less time.",
    "Swimming is a full-body, low-impact cardio workout ideal for people with joint concerns.",
    "Regular aerobic exercise improves lung capacity, heart efficiency, and overall endurance.",
    "Dancing counts as cardio — find an activity you enjoy and you will stick with it far longer.",
  ],
  "preventive care": [
    "Annual health screenings can detect silent conditions like hypertension and diabetes before symptoms appear.",
    "Know your numbers: blood pressure, blood sugar, and cholesterol are key indicators of your health status.",
    "Vaccines are not just for children — adults need certain boosters to maintain immunity over time.",
    "Regular dental check-ups are linked to better cardiovascular health, not just oral hygiene.",
    "Early detection through routine tests dramatically improves treatment outcomes for most conditions.",
  ],
};

const DEFAULT_TIPS = [
  "Small, consistent lifestyle changes deliver far greater long-term health benefits than short-term fixes.",
  "Regular health screenings are the simplest investment you can make in your future wellbeing.",
  "Wash your hands frequently — it remains one of the most effective disease-prevention habits known.",
  "Limit processed foods and prioritise whole, minimally processed ingredients in your daily meals.",
  "Move your body for at least 30 minutes every day; it benefits your mind as much as your body.",
];

export function getCuratedHealthTip(topic: string): string {
  const tips = CURATED_TIPS[topic] ?? DEFAULT_TIPS;
  // Rotate daily so the tip changes each day and repeats in a cycle
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return tips[dayIndex % tips.length];
}

export const generateHealthTip = async (topic: string): Promise<string> => {
    if (!ai) return getCuratedHealthTip(topic);
    
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
