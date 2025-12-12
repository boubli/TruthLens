
import axios from 'axios';
import { EnhancedProductData } from '@/services/productMapper';
import { getSystemSettings } from './systemService';

// Waterfall Priority:
// 1. Azure VM (Ollama) - Local, Fast, Privacy (if available)
// 2. GitHub Models - Reliable Cloud Fallback
// 3. Groq - Performant Cloud Fallback

const OLLAMA_TIMEOUT = 3000; // 3s timeout for local VM to ensure speed

interface WebContext {
    title?: string;
    snippet?: string;
    image?: string;
    sourceUrl?: string;
}

export async function generateProductInfoAI(query: string, webContext?: WebContext): Promise<EnhancedProductData | null> {
    try {
        console.log(`[SearchAI] Attempting to generate info for: ${query}${webContext ? ' (with Web Context)' : ''}`);

        // 1. Try Azure VM (Ollama)
        const ollamaResult = await tryOllama(query, webContext);
        if (ollamaResult) return ollamaResult;

        // 2. Try GitHub Models
        const githubResult = await tryGitHubModels(query, webContext);
        if (githubResult) return githubResult;

        // 3. Try Groq
        const groqResult = await tryGroq(query, webContext);
        if (groqResult) return groqResult;

        return null; // All failed
    } catch (error) {
        console.error('[SearchAI] All providers failed:', error);
        return null;
    }
}

// --- Providers ---

async function tryOllama(query: string, context?: WebContext): Promise<EnhancedProductData | null> {
    const settings = await getSystemSettings();
    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || settings.aiConfig?.ollamaUrl;

    if (!ollamaUrl) return null;

    try {
        console.log('[SearchAI] Trying Ollama...');
        const prompt = buildPrompt(query, context);

        const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model: "mistral", // or configured model
            prompt: prompt,
            stream: false,
            format: "json"
        }, { timeout: OLLAMA_TIMEOUT });

        if (response.data.response) {
            return parseAIResponse(response.data.response, query, 'Azure AI (Ollama)', context?.image);
        }
    } catch (err) {
        console.warn('[SearchAI] Ollama failed (skipping):', err);
    }
    return null;
}

async function tryGitHubModels(query: string, context?: WebContext): Promise<EnhancedProductData | null> {
    const settings = await getSystemSettings();
    const token = settings.apiKeys?.githubModelsToken;
    const model = settings.apiKeys?.githubModelsModel || 'openai/gpt-4o'; // Use fast model

    if (!token) return null;

    try {
        console.log('[SearchAI] Trying GitHub Models...');
        const prompt = buildPrompt(query, context);

        const response = await fetch('https://models.github.ai/inference/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: 'You are a product database API. Return valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.3
            })
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
            return parseAIResponse(content, query, 'GitHub Models', context?.image);
        }
    } catch (err) {
        console.warn('[SearchAI] GitHub Models failed:', err);
    }
    return null;
}

async function tryGroq(query: string, context?: WebContext): Promise<EnhancedProductData | null> {
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!groqKey) return null;

    try {
        console.log('[SearchAI] Trying Groq...');
        const prompt = buildPrompt(query, context);

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama3-8b-8192',
            messages: [
                { role: 'system', content: 'You are a product database API. Return valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` }
        });

        const content = response.data.choices[0]?.message?.content;
        if (content) {
            return parseAIResponse(content, query, 'Groq Llama-3', context?.image);
        }
    } catch (err) {
        console.warn('[SearchAI] Groq failed:', err);
    }
    return null;
}

// --- Helpers ---

// --- Helpers ---

function buildPrompt(query: string, context?: WebContext): string {
    let promptContext = "";
    if (context) {
        promptContext = `
        CONTEXT FROM WEB SEARCH:
        - Title: "${context.title || 'N/A'}"
        - Snippet/Description: "${context.snippet || 'N/A'}"
        
        Using this context, reconstruct the most accurate product data possible.
        `;
    }

    return `User Query: "${query}"
    ${promptContext}

    Role: You are an expert product analyst AI (Antigravity AI).
    
    Determine the category of the input query:
    A. FOOD/MEDICINE:
       - Generate Nutrition/Ingredients.
       - Category: Food, Medicine, Beverage, etc.
    
    B. TECH/HARDWARE/ELECTRONICS (e.g. GPU, Phone, Laptop):
       - DO NOT generate nutrition/ingredients.
       - Brand: YOU MUST INFER THE BRAND. (e.g. "Galaxy S22" -> "Samsung", "RTX 3060" -> "NVIDIA", "Pixel" -> "Google"). Never return "Unknown".
       - Specs: Generate key technical specs (e.g. { "VRAM": "12GB", "Power": "170W", "Chipset": "NVIDIA" }).
       - Analysis: Provide Pros, Cons, and a Buying Verdict.
       - Score: A score from 0-100 based on modern standards (e.g. RTX 3060 is decent = 75, RTX 4090 is top = 95).
       - Price Analysis: Is it good value?
    
    C. QUESTION/TOPIC:
       - Summary answer as description.
       - Category: Information.

    Respond ONLY with this JSON schema:
    {
      "name": "Product Name",
      "brand": "Brand Name",
      "category": "Food/Tech/Info/Other",
      "description": "Detailed description",
      "ingredients": ["ing1"] (Food only, else []),
      "nutrition": {"energy_kcal": 0} (Food only, else {}),
      "specs": {"Spec Name": "Value"} (Tech only),
      "analysis": {
         "pros": ["pro1", "pro2"],
         "cons": ["con1", "con2"],
         "verdict": "Buy" | "Pass" | "Wait",
         "verdict_text": "Short explanation",
         "price_analysis": "Good value/Overpriced",
         "score": 85
      }
    }`;
}

function parseAIResponse(jsonString: string, query: string, sourceName: string, imageUrl?: string): EnhancedProductData {
    try {
        const cleanJson = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);

        return {
            id: `ai_${Date.now()}`,
            identity: {
                name: data.name || query,
                brand: data.brand || 'Unknown',
                barcode: 'AI_GENERATED',
                category: data.category || 'Unknown',
                description: data.description || 'Details generated by AI.',
            },
            media: {
                front_image: imageUrl || '/images/ai-product-placeholder.png', // Use web image if available
                thumbnail: imageUrl || '/images/ai-product-placeholder.png'
            },
            grades: {
                nutri_score: '?',
                eco_score: '?',
                processing_score: '?'
            },
            nutrition: {
                nutriments_raw: data.nutrition || {}
            },
            sensory_profile: { flavors: [] },
            ingredients: (data.ingredients || []).map((ing: string) => ({
                id: ing.toLowerCase().replace(/\s+/g, '_'),
                name: ing,
                percent: 0,
                rank: 0,
                has_sub_ingredients: false
            })),
            source: sourceName as any,
            // New Tech Fields
            specs: data.specs || {},
            analysis: data.analysis || {}
        };
    } catch (e) {
        console.error('[SearchAI] Parse error:', e);
        throw new Error('Failed to parse AI response');
    }
}
