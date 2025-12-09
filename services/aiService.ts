import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserTier } from '@/types/user';
import Groq from "groq-sdk";
import axios from 'axios';

// Environment Variables
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';
const CEREBRAS_API_KEY = process.env.NEXT_PUBLIC_CEREBRAS_API_KEY || '';
const SAMBANOVA_API_KEY = process.env.NEXT_PUBLIC_SAMBANOVA_API_KEY || '';
const SERPAPI_API_KEY = process.env.NEXT_PUBLIC_SERPAPI_API_KEY || '';
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

// Initialize Clients lazily or per-request to support dynamic keys
import { getSystemSettings } from './systemService';

// Interfaces for key caching
let cachedApiKeys: Record<string, string> | null = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute cache

const getDynamicKey = async (keyName: string, envVar: string): Promise<string> => {
    const now = Date.now();
    if (!cachedApiKeys || (now - lastFetch > CACHE_TTL)) {
        try {
            const settings = await getSystemSettings();
            // @ts-ignore
            cachedApiKeys = settings.apiKeys || {};
            lastFetch = now;
        } catch (e) {
            console.warn("Failed to fetch dynamic keys, using env only");
        }
    }
    // @ts-ignore
    return (cachedApiKeys && cachedApiKeys[keyName]) ? cachedApiKeys[keyName] : envVar;
};

// --- Clients Wrappers ---

const getGeminiClient = async () => {
    const key = await getDynamicKey('gemini', GEMINI_API_KEY);
    if (!key) throw new Error("Gemini Key Missing");
    return new GoogleGenerativeAI(key);
};

const getGroqClient = async () => {
    const key = await getDynamicKey('groq', GROQ_API_KEY);
    if (!key) throw new Error("Groq Key Missing");
    return new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
};

const getOpenAIClient = async () => {
    const key = await getDynamicKey('openai', OPENAI_API_KEY);
    if (!key) throw new Error("OpenAI Key Missing");
    return { apiKey: key, baseUrl: 'https://api.openai.com/v1' };
};

// --- Interfaces ---

export interface AIAnalysis {
    grade: string;
    summary: string;
    pros: string[];
    cons: string[];
    healthScore: number; // 0-100
}

export interface HarmfulIngredient {
    name: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
}

export interface AITruthDetectorResult {
    harmfulIngredients: HarmfulIngredient[];
    overallRisk: 'low' | 'medium' | 'high';
    recommendation: string;
}

export interface RecommendedProduct {
    name: string;
    brand: string;
    reason: string; // concise reason for recommendation
}

export interface SustainabilityAnalysis {
    ecoScore: number; // 0-100
    carbonFootprint: string; // e.g. "Low", "1.2kg"
    packagingRating: 'good' | 'fair' | 'poor';
    sustainabilityTips: string[];
}

export interface ARProductDetails {
    dimensions: { length: number; width: number; height: number; unit: string };
    shape: 'box' | 'cylinder' | 'bottle' | 'bag' | 'pouch';
    color: string;
    texture: string;
    estimatedRealWorldSize: string; // e.g. "Size of a soda can"
}

export interface MealPlanDay {
    day: string;
    meals: {
        breakfast: string;
        lunch: string;
        dinner: string;
        snacks: string[];
    };
    nutritionalSummary: string;
}

// --- Helper Functions for AI Providers ---

const callGemini = async (prompt: string): Promise<string> => {
    const genAI = await getGeminiClient();
    // Gemini 1.5 Flash is the best free-tier model (multimodal, fast, 1M context)
    // If this 404s again, fallback to "gemini-pro"
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
};

const callGroq = async (prompt: string): Promise<string> => {
    const groq = await getGroqClient();
    const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile", // Latest Llama 3.3 (Performant & Free on Groq)
        temperature: 0.5,
    });
    return completion.choices[0]?.message?.content || "";
};

// Generic function for OpenAI-compatible APIs (DeepSeek, Cerebras, SambaNova)
const callOpenAICompatible = async (prompt: string, envKey: string, keyName: string, baseUrl: string, modelName: string): Promise<string> => {
    const apiKey = await getDynamicKey(keyName, envKey);

    if (!apiKey) throw new Error(`API Key Missing for ${modelName}`);
    try {
        const response = await axios.post(
            `${baseUrl}/chat/completions`,
            {
                model: modelName,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            },
            { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        return response.data.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error(`Error calling ${modelName}:`, error.message);
        throw error;
    }
};

const callDeepSeek = (prompt: string) => callOpenAICompatible(prompt, DEEPSEEK_API_KEY, 'deepseek', "https://api.deepseek.com/v1", "deepseek-chat");
const callCerebras = (prompt: string) => callOpenAICompatible(prompt, CEREBRAS_API_KEY, 'cerebras', "https://api.cerebras.ai/v1", "llama3.1-70b");
const callSambaNova = (prompt: string) => callOpenAICompatible(prompt, SAMBANOVA_API_KEY, 'sambanova', "https://api.sambanova.ai/v1", "Meta-Llama-3.1-70B-Instruct");

const callOpenAI = async (prompt: string): Promise<string> => {
    const { apiKey } = await getOpenAIClient();
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o-mini", // Optimized for free tier/efficiency
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            },
            { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        return response.data.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error("Error calling OpenAI:", error.message);
        throw error;
    }
};

// --- AI Swarm Logic (Generic) ---

const getSwarmResponse = async (prompt: string, trustedProviders: Array<{ name: string, fn: (p: string) => Promise<string> }> = []): Promise<string> => {
    // Default swarm if none provided
    const allProviders = [
        { name: 'Groq', fn: callGroq },
        { name: 'Gemini', fn: callGemini },
        { name: 'DeepSeek', fn: callDeepSeek },
        { name: 'OpenAI', fn: callOpenAI },
        { name: 'Cerebras', fn: callCerebras },
        { name: 'SambaNova', fn: callSambaNova },
    ];

    const providersToRace = trustedProviders.length > 0 ? trustedProviders : allProviders;

    // Filter out missing keys
    const activeProviders = providersToRace.filter(p => {
        if (p.name === 'Groq') return !!GROQ_API_KEY;
        if (p.name === 'Gemini') return !!GEMINI_API_KEY;
        if (p.name === 'OpenAI') return !!OPENAI_API_KEY;
        if (p.name === 'DeepSeek') return !!DEEPSEEK_API_KEY;
        if (p.name === 'Cerebras') return !!CEREBRAS_API_KEY;
        if (p.name === 'SambaNova') return !!SAMBANOVA_API_KEY;
        return false;
    });

    if (activeProviders.length === 0) throw new Error("No active AI providers available for this task");

    console.log(`🐝 [AI Swarm] Racing ${activeProviders.map(p => p.name).join(', ')}...`);

    try {
        return await Promise.any(activeProviders.map(async (provider) => {
            try {
                const res = await provider.fn(prompt);
                console.log(`✅ [AI Swarm] Winner: ${provider.name}`);
                return res;
            } catch (e: any) {
                console.error(`❌ [AI Swarm] ${provider.name} failed:`, e.message);
                throw e;
            }
        }));
    } catch (error: any) {
        console.error("☠️ [AI Swarm] All providers failed:", error);
        // Construct a readable error message from the AggregateError
        const errorDetails = error.errors ? error.errors.map((e: any) => e.message).join(' | ') : error.message;
        return `[Swarm Failed] All providers failed. Details: ${errorDetails}`;
    }
};

// --- Specialized Feature Functions ---

export const analyzeIngredientsForHarmfulCompounds = async (ingredients: string[]): Promise<AITruthDetectorResult | null> => {
    const prompt = `
      You are a food safety expert. Analyze these ingredients for harmful additives: ${ingredients.join(', ')}.
      Identify potential health risks (carcinogens, allergens, inflammatory agents).
      Return JSON ONLY:
      {
        "harmfulIngredients": [{"name": "string", "reason": "string", "severity": "low/medium/high"}],
        "overallRisk": "low/medium/high",
        "recommendation": "Safety advice"
      }
    `;

    try {
        const text = await getSwarmResponse(prompt, [
            { name: 'Groq', fn: callGroq },
            { name: 'DeepSeek', fn: callDeepSeek }
        ]);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as AITruthDetectorResult;
    } catch (e) {
        console.error("Truth Detector Error:", e);
        return null;
    }
};

export const calculateSustainabilityScore = async (productName: string, brand: string, ingredients: string[]): Promise<SustainabilityAnalysis | null> => {
    const prompt = `
        Analyze the sustainability of "${productName}" by ${brand}.
        Ingredients: ${ingredients.join(', ')}.
        Estimate carbon footprint, packaging waste, and ethical sourcing.
        Return JSON ONLY:
        {
            "ecoScore": number (0-100),
            "carbonFootprint": "string (e.g. Low)",
            "packagingRating": "good/fair/poor",
            "sustainabilityTips": ["tip1", "tip2"]
        }
    `;

    try {
        const text = await getSwarmResponse(prompt, [
            { name: 'Cerebras', fn: callCerebras },
            { name: 'SambaNova', fn: callSambaNova },
            { name: 'Gemini', fn: callGemini }
        ]);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as SustainabilityAnalysis;
    } catch (e) {
        console.error("Sustainability Error:", e);
        return null;
    }
};

export const generateMealPlan = async (inventory: string[]): Promise<MealPlanDay[] | null> => {
    const prompt = `
        Create a 3-day healthy meal plan using these ingredients available: ${inventory.join(', ')}.
        Fill in gaps with common pantry items.
        Return JSON ONLY as Array of objects:
        [
            {
                "day": "Day 1",
                "meals": { "breakfast": "", "lunch": "", "dinner": "", "snacks": [] },
                "nutritionalSummary": "Brief summary"
            }
        ]
    `;

    try {
        const text = await getSwarmResponse(prompt, [
            { name: 'Gemini', fn: callGemini },
            { name: 'SambaNova', fn: callSambaNova }
        ]);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as MealPlanDay[];
    } catch (e) {
        console.error("Meal Planner Error:", e);
        return null;
    }
};

export const getARProductDetails = async (productName: string, category: string): Promise<ARProductDetails | null> => {
    const prompt = `
        Estimate the physical dimensions and shape of this product for an AR visualizations: "${productName}" (${category}).
        Return JSON ONLY:
        {
            "dimensions": { "length": number (cm), "width": number (cm), "height": number (cm), "unit": "cm" },
            "shape": "box" | "cylinder" | "bottle" | "bag" | "pouch",
            "color": "dominant hex color",
            "texture": "matte/glossy/metallic",
            "estimatedRealWorldSize": "Comparison string (e.g. Size of a smartphone)"
        }
    `;

    try {
        const text = await getSwarmResponse(prompt, [
            { name: 'SambaNova', fn: callSambaNova },
            { name: 'Cerebras', fn: callCerebras },
            { name: 'Groq', fn: callGroq }
        ]);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as ARProductDetails;
    } catch (e) {
        console.error("AR Data Layer Error:", e);
        return null;
    }
};

export const extractDietaryEntities = async (text: string): Promise<{ allergens: string[], avoidIngredients: string[], healthGoals: string[] }> => {
    const prompt = `
        Analyze this user's dietary description: "${text}".
        Extract:
        1. "allergens": Specific allergies (e.g., Peanuts, Shellfish).
        2. "avoidIngredients": Ingredients to avoid (e.g., Sugar, Palm Oil).
        3. "healthGoals": Goals mentioned (e.g., Weight Loss, Muscle Gain).
        
        IGNORE anything not related to Food, Allergies, or Health (e.g., "I like cars").
        Return JSON ONLY: { "allergens": [], "avoidIngredients": [], "healthGoals": [] }
    `;

    try {
        const responseText = await getSwarmResponse(prompt, [
            { name: 'Groq', fn: callGroq },
            { name: 'Gemini', fn: callGemini }
        ]);
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Dietary Entity Extraction Error:", e);
        return { allergens: [], avoidIngredients: [], healthGoals: [] };
    }
};

export interface PairedProduct {
    name: string;
    brand: string;
    reason: string;
}

export interface RecommendationPair {
    rejected: PairedProduct;
    recommended: PairedProduct;
}

export const getSwarmPairedRecommendations = async (historyContext: string): Promise<RecommendationPair[]> => {
    const prompt = `
        You are a strict nutritionist. Analyze the user's recent food history:
        ${historyContext}

        Identify up to 5 "unhealthy" or mediocre products (Grade C, D, E, or high sugar/processed).
        For EACH, suggest a realistic, healthier alternative.
        CRITICAL: The recommended item MUST BE A SPECIFIC, FAMOUS BRANDED PRODUCT (e.g., "Chobani Greek Yogurt", "Tropicana Pure Premium", "Kind Bar").
        DO NOT suggest generic items (e.g., "Greek Yogurt"). It must be a scannable commercial product.

        Return JSON ONLY as an Array:
        [
            {
                "rejected": { "name": "Exact Name from History", "brand": "Brand", "reason": "Why it's unhealthy (2-3 words)" },
                "recommended": { "name": "Specific Famous Brand Product", "brand": "Brand Name", "reason": "Why it's better (2-3 words)" }
            }
        ]
        
        If history is empty or has no bad items, generate 3 generic examples of common swaps (e.g. Soda -> Sparkling Water, Chips -> Popcorn).
    `;

    try {
        const text = await getSwarmResponse(prompt);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as RecommendationPair[];
    } catch (error) {
        console.error("[getSwarmPairedRecommendations] Error:", error);
        return [];
    }
};

export const getSwarmRecommendations = async (historyContext: string): Promise<RecommendedProduct[]> => {
    const prompt = `
        You are a nutrition expert AI. Based on the user's recent food scan history:
        ${historyContext}

        Suggest 6 SPECIFIC, real-world healthy food products that would be good alternatives or complementary items.
        Return ONLY valid JSON:
        [ { "name": "Product Name", "brand": "Brand Name", "reason": "Why this is recommended" } ]
    `;

    try {
        const text = await getSwarmResponse(prompt);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as RecommendedProduct[];
    } catch (error) {
        console.error("[getSwarmRecommendations] Error:", error);
        return [];
    }
};

export const searchExternalDatabases = async (query: string): Promise<any> => {
    if (!SERPAPI_API_KEY) return null;
    try {
        const trustedSites = "site:fdc.nal.usda.gov OR site:ewg.org OR site:nutritionix.com OR site:foodb.ca";
        const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query + " " + trustedSites)}&api_key=${SERPAPI_API_KEY}`;
        if (query) {
            const response = await axios.get(searchUrl);
            if (response.data.organic_results?.length > 0) {
                const snippets = response.data.organic_results.slice(0, 3).map((r: any) => r.snippet).join("\n");
                const synthesisPrompt = `Synthesize product info from these search results for "${query}": ${snippets}. Return JSON keys: name, brand, nutrition_grades (A-E), description.`;
                const synthesis = await getSwarmResponse(synthesisPrompt);
                return JSON.parse(synthesis.replace(/```json/g, '').replace(/```/g, '').trim());
            }
        }
        return null;
    } catch (error) {
        console.error("[External Search] Error:", error);
        return null;
    }
};

// --- PRO TIER: Antigravity AI Analysis ---
export const analyzeProductProMode = async (productName: string, userAttributes: any): Promise<string> => {
    const prompt = `
    ### Role:
    You are "Antigravity AI," an elite product research analyst serving PRO tier users.
    
    ### Input:
    Product: "${productName}"
    User Profile: ${JSON.stringify(userAttributes)}

    ### Objective:
    Provide a deep, critical, and data-driven analysis.

    ### Output Format:
    Return a **SINGLE VALID JSON OBJECT** (no markdown formatting, no backticks).
    Schema:
    {
      "marketStatus": "Short availability/price summary",
      "brandReputation": "Short brand check",
      "grading": {
        "quality": { "score": number (0-100), "reason": "string" },
        "value": { "score": number (0-100), "reason": "string" },
        "satisfaction": { "score": number (0-100), "reason": "string" },
        "totalScore": number (0-100),
        "letterGrade": "A+|A|B|C|D|F"
      },
      "analysis": {
        "overview": "Concise product summary",
        "strengths": ["point 1", "point 2", "point 3"],
        "weaknesses": ["point 1", "point 2", "point 3"],
        "valueAssessment": "Is it worth it?",
        "reviewsSummary": "User consensus"
      },
      "verdict": {
        "decision": "RECOMMEND" | "DO NOT RECOMMEND" | "CONSIDER ALTERNATIVES",
        "reasoning": "Final conclusion"
      }
    }
    `;

    try {
        console.log("🚀 [Pro Analysis] Starting. Keys present:", {
            Groq: !!GROQ_API_KEY,
            DeepSeek: !!DEEPSEEK_API_KEY,
            Gemini: !!GEMINI_API_KEY
        });

        // Use Groq (Llama3-70b) or DeepSeek for high-reasoning capability, fallback to OpenAI/Gemini
        const response = await getSwarmResponse(prompt, [
            { name: 'Groq', fn: callGroq },
            { name: 'DeepSeek', fn: callDeepSeek },
            { name: 'OpenAI', fn: callOpenAI },
            { name: 'Gemini', fn: callGemini } // Robust fallback
        ]);

        if (!response || response.trim() === "" || response.startsWith("[Swarm Failed]")) {
            console.error("❌ [Pro Analysis] Invalid response:", response);
            throw new Error(response || "Empty response from AI swarm");
        }

        // Sanitize JSON if the AI wrap it in backticks
        const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return cleaned;

    } catch (e: any) {
        console.error("❌ [Pro Analysis] Critical Error:", e);
        // Return clearer error for debugging
        return `**Analysis Failed.** Debug Info: ${e.message}. (Check console for details)`;
    }
}

// --- Data Repair Feature (Vision AI) ---

const urlToGenerativePart = async (url: string) => {
    try {
        // Proxy through Next.js simple fetch if needed, 
        // but for now try direct. OFF images usually allow CORS or we might need a server action.
        // If direct fetch fails due to CORS, this feature might require a proxy route.
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");

        const blob = await response.blob();
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
        });

        return {
            inlineData: {
                data: await base64EncodedDataPromise,
                mimeType: blob.type || "image/jpeg",
            },
        };
    } catch (e) {
        console.error("Image conversion failed", e);
        return null;
    }
};

export const repairProductMetadata = async (imageUrl: string, currentName: string): Promise<{ name: string, brand: string } | null> => {
    if (!GEMINI_API_KEY) return null;
    if (!imageUrl || imageUrl.includes('placeholder')) return null;

    try {
        // 1. Get Image Data
        const imagePart = await urlToGenerativePart(imageUrl);
        if (!imagePart) return null;

        // 2. Prompt Gemini 1.5 Flash (Multimodal)
        // 2. Prompt Gemini 1.5 Flash (Multimodal)
        const genAI = await getGeminiClient();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Look at this product package.
            Extract the exact **Brand Name** and **Product Name** written on the packaging.
            Identify if the current name "${currentName}" is generic or incorrect.
            
            Return JSON ONLY:
            {
                "brand": "Exact Brand",
                "name": "Exact Product Name"
            }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response.text();
        const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);

    } catch (error) {
        console.error("AI Data Repair Failed:", error);
        return null;
    }
};

// --- IRL Quest Generation ---

export interface Quest {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'social' | 'physical' | 'mindfulness' | 'creative';
    completed: boolean;
    createdAt: Date;
}

export const generateLogoutQuest = async (userName: string, recentQuests: string[]): Promise<Quest | null> => {
    const prompt = `
    Generate a witty, fun, and harmless "IRL Side Quest" for a user named "${userName}" who is logging out of an app.
    
    Constraints:
    - The task must be doable in < 5 minutes.
    - It should be a real-world action (e.g., "High five a plant", "Drink water", "Stretch your back").
    - Be creative, slightly humorous, or wholesome.
    - Avoid these recently given quests: ${recentQuests.join(', ')}.
    - Choose a difficulty: easy, medium, or hard (subjective).
    - Choose a type: social, physical, mindfulness, or creative.

    Return JSON ONLY:
    {
        "title": "Short Title",
        "description": "The specific instruction",
        "difficulty": "easy/medium/hard",
        "type": "social/physical/mindfulness/creative"
    }
    `;

    try {
        // Prefer Groq for speed and wit (Llama 3.3)
        const text = await getSwarmResponse(prompt, [
            { name: 'Groq', fn: callGroq },
            { name: 'SambaNova', fn: callSambaNova },
            { name: 'Gemini', fn: callGemini }
        ]);

        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleaned);

        return {
            id: Date.now().toString(), // Simple ID generation
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            type: data.type,
            completed: false,
            createdAt: new Date()
        };

    } catch (e) {
        console.error("Quest Generation Error:", e);
        // Fallback Quest if AI fails
        return {
            id: 'fallback-' + Date.now(),
            title: 'Take a Break',
            description: 'Close your eyes and take 3 deep breaths.',
            difficulty: 'easy',
            type: 'mindfulness',
            completed: false,
            createdAt: new Date()
        };
    }
};

export const analyzeProductWithSwarm = async (productName: string, ingredients: string[], nutriments: any) => {
    const prompt = `Analyze: ${productName}, Ingredients: ${ingredients.join(', ')}. Return JSON: {grade, summary, pros, cons, healthScore}`;
    const text = await getSwarmResponse(prompt);
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim()) as AIAnalysis;
};
export const analyzeProductWithGemini = analyzeProductWithSwarm;
export const analyzeProductWithGroq = analyzeProductWithSwarm;
// Enhanced Tier-Aware Analysis
export const analyzeProductByTier = async (tier: UserTier, name: string, ing: string[], nutr: any): Promise<AIAnalysis> => {
    // 1. Define Tier-Specific Prompts
    let depthInstruction = "Provide a brief 2-sentence summary. List 3 key pros and 3 key cons.";
    let persona = "helpful nutrition assistant";

    if (tier === 'plus') {
        depthInstruction = "Provide a detailed paragraph summary. List 5 detailed pros and 5 cons. Focus on additives severity.";
        persona = "expert dietician";
    } else if (tier === 'pro' || tier === 'ultimate') {
        depthInstruction = "Provide a comprehensive, critical analysis (2 paragraphs). List 5-7 detailed pros and cons. rigorous health scoring.";
        persona = "senior food scientist and toxicologist";
    }

    const prompt = `
        Role: You are a ${persona}.
        Analyze this product: "${name}".
        Ingredients: ${ing.join(', ')}.
        Nutriments: ${JSON.stringify(nutr)}.

        Task:
        ${depthInstruction}
        Calculate a Health Score (0-100) based on ingredients quality and nutritional density.
        Determine a letter grade (A, B, C, D, E).

        Return JSON ONLY:
        {
            "grade": "A/B/C/D/E",
            "summary": "string",
            "pros": ["string", ...],
            "cons": ["string", ...],
            "healthScore": number
        }
    `;

    try {
        // Use Swarm with Tier-Appropriate Power
        // Pro/Ultimate get the smartest models racing. Free gets efficient ones.
        let providers = [];
        if (tier === 'free') {
            providers = [{ name: 'Gemini', fn: callGemini }, { name: 'Groq', fn: callGroq }];
        } else {
            // Plus/Pro get access to DeepSeek/OpenAI/Cerebras
            providers = [
                { name: 'Groq', fn: callGroq },
                { name: 'DeepSeek', fn: callDeepSeek },
                { name: 'Gemini', fn: callGemini }
            ];
        }

        const text = await getSwarmResponse(prompt, providers);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as AIAnalysis;

    } catch (e: any) {
        console.error("Tiered Analysis Error:", e);
        // Fallback to simple analysis if advanced fails
        if (tier !== 'free') return analyzeProductByTier('free', name, ing, nutr);
        throw e;
    }
};


export const generateDynamicGreeting = async (userName: string, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night'): Promise<string> => {
    const prompt = `
        You are a witty, friendly AI assistant for a food scanning app called "TruthLens".
        The user has opened the app during the **${timeOfDay.replace('_', ' ')}**.

        Generate a SHORT, engaging 1-sentence greeting.
        Constraints:
        - If 'late_night' (00:00-06:00): Be humorous, ask why they are up, mention late-night snacking, or tell them to sleep. (e.g. "Scanning snacks at 3AM? I won't judge... much. 🍕")
        - If regular time: Friendly and brief.
        - Max 15 words.
        - Include an emoji.
        - Do NOT include the user's name.
        - Return just the plain text string. No quotes.
    `;

    try {
        // Use Groq for speed/wit, Gemini as fallback
        const text = await getSwarmResponse(prompt, [
            { name: 'Groq', fn: callGroq },
            { name: 'Gemini', fn: callGemini }
        ]);
        return text.replace(/"/g, '').trim();
    } catch (e) {
        console.error("Greeting Gen Error", e);
        return ""; // Fallback will handle it
    }
};
