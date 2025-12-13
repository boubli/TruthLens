'use server';

import axios from 'axios';
import { EnhancedProductData } from './productMapper';

// Dynamic key fetching
async function getDynamicKey(keyName: string): Promise<string> {
    try {
        const { getSystemSettings } = await import('./systemService');
        const settings = await getSystemSettings();
        // @ts-ignore
        return settings.apiKeys?.[keyName] || process.env[`NEXT_PUBLIC_${keyName.toUpperCase()}_API_KEY`] || '';
    } catch (e) {
        return process.env[`NEXT_PUBLIC_${keyName.toUpperCase()}_API_KEY`] || '';
    }
}

interface WebContext {
    title?: string;
    snippet?: string;
    image?: string;
    sourceUrl?: string;
}

/**
 * AI-Powered Product Info Generator
 * Intelligently detects product category and extracts relevant specs
 * Supports: Food, GPUs, Phones, Laptops, and any other product
 */
export async function generateProductInfoAI(
    query: string,
    webContext?: WebContext
): Promise<EnhancedProductData | null> {
    try {
        console.log(`[AI Search] Generating product info for: ${query}`);

        // Build enriched prompt with web context
        const contextInfo = webContext
            ? `\nWeb Search Results:\n- Title: ${webContext.title}\n- Summary: ${webContext.snippet}\n- Source: ${webContext.sourceUrl}`
            : '';

        const prompt = `You are a universal product analyzer. Given a product query, detect its category and extract ONLY the most important information.

Query: "${query}"${contextInfo}

IMPORTANT RULES:
1. **Detect Category**: food, gpu, cpu, phone, laptop, tv, headphones, or other
2. **Extract KEY specs based on category**:
   - Food: brand, calories, main ingredients, health score (A-E)
   - GPU: brand (NVIDIA/AMD), model, VRAM, avg FPS at 1080p/1440p, TDP
   - CPU: brand (Intel/AMD), cores, threads, base/boost clock, TDP
   - Phone: brand, screen size, battery mAh, camera MP, processor
   - Laptop: brand, CPU, GPU, RAM, storage, screen size
   - Other: adapt dynamically
3. **Be CONCISE**: Only include specs that matter to buyers
4. **Estimate if needed**: Use reasonable estimates based on context

Return ONLY valid JSON (no markdown):
{
  "category": "gpu|food|phone|cpu|laptop|other",
  "name": "Product full name",
  "brand": "Brand name",
  "description": "1-sentence product description",
  "key_specs": {
    // Dynamic based on category
    // Examples:
    // For GPU: { "vram": "8GB", "fps_1080p": "~85 FPS", "tdp": "215W", "architecture": "Ada Lovelace" }
    // For Food: { "calories_per_100g": "250", "main_ingredients": "sugar, wheat flour", "health_grade": "D" }
    // For Phone: { "screen": "6.7\"", "battery": "5000mAh", "camera": "108MP", "processor": "Snapdragon 8 Gen 2" }
  },
  "score": "A|B|C|D|E|?",  // Overall quality rating
  "price_estimate": "$XXX - $YYY" // Or "Unknown"
}`;

        // Try Gemini Pro first (best for reasoning)
        const geminiKey = await getDynamicKey('gemini');
        if (geminiKey) {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();

                // Extract JSON from response
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const aiData = JSON.parse(jsonMatch[0]);
                    return mapAIResponseToProduct(query, aiData, webContext);
                }
            } catch (err) {
                console.warn('[AI Search] Gemini failed, trying Groq...', err);
            }
        }

        // Fallback to Groq (fast, reliable)
        const groqKey = await getDynamicKey('groq');
        if (groqKey) {
            try {
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.3,
                        max_tokens: 800
                    },
                    { headers: { 'Authorization': `Bearer ${groqKey}` } }
                );

                const content = response.data.choices[0]?.message?.content;
                if (content) {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const aiData = JSON.parse(jsonMatch[0]);
                        return mapAIResponseToProduct(query, aiData, webContext);
                    }
                }
            } catch (err) {
                console.warn('[AI Search] Groq failed, trying Ollama...', err);
            }
        }

        // Last resort: Azure Ollama (Qwen2.5:7b - optimized for 4GB RAM)
        let ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11435';
        try {
            // Try explicit setting first
            const settings = await import('./systemService').then(m => m.getSystemSettings());
            // @ts-ignore
            if (settings.apiKeys?.ollamaUrl) ollamaUrl = settings.apiKeys.ollamaUrl;
        } catch (e) {
            // Ignore fetch error, use default
        }

        try {
            console.log(`[AI Search] Falling back to Azure Ollama (Qwen2.5:7b) at ${ollamaUrl}...`);
            const response = await axios.post(
                `${ollamaUrl}/api/generate`,
                {
                    model: 'qwen2.5:7b',  // 7B model - fast and efficient
                    prompt: prompt,
                    stream: false
                },
                { timeout: 30000 }  // Faster timeout for 7B model
            );

            if (response.data?.response) {
                const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const aiData = JSON.parse(jsonMatch[0]);
                    return mapAIResponseToProduct(query, aiData, webContext);
                }
            }
        } catch (err) {
            console.error('[AI Search] All AI providers failed:', err);
        }

        return null;

    } catch (error: any) {
        console.error('[AI Search] Error:', error.message);
        return null;
    }
}

/**
 * Maps AI-generated data to EnhancedProductData format
 */
function mapAIResponseToProduct(
    query: string,
    aiData: any,
    webContext?: WebContext
): EnhancedProductData {
    const category = aiData.category || 'other';
    const isFood = category === 'food';

    // Generate dynamic description based on specs
    let enhancedDescription = aiData.description || '';
    if (aiData.key_specs && Object.keys(aiData.key_specs).length > 0) {
        const specs = Object.entries(aiData.key_specs)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        enhancedDescription += ` | Key Specs: ${specs}`;
    }

    return {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        identity: {
            name: aiData.name || query,
            brand: aiData.brand || 'Unknown Brand',
            barcode: '',
            category: category.toUpperCase(),
            description: enhancedDescription
        },
        media: {
            front_image: webContext?.image || '/api/placeholder/400/400',
            thumbnail: webContext?.image || '/api/placeholder/200/200'
        },
        grades: {
            nutri_score: isFood ? (aiData.score || '?') : '?',
            eco_score: '?',
            processing_score: aiData.score || '?'  // Use as "quality score" for tech products
        },
        nutrition: isFood ? {
            nutriments_raw: {
                'energy-kcal_100g': aiData.key_specs?.calories_per_100g || 0,
                'sugars_100g': aiData.key_specs?.sugar || 0,
                'fat_100g': aiData.key_specs?.fat || 0,
                'proteins_100g': aiData.key_specs?.protein || 0
            }
        } : {},
        sensory_profile: {
            flavors: []
        },
        ingredients: isFood && aiData.key_specs?.main_ingredients
            ? aiData.key_specs.main_ingredients.split(',').map((i: string) => i.trim())
            : [],

        // Add tech specs as custom field (can extend type later)
        // @ts-ignore - extending with custom field
        tech_specs: !isFood ? aiData.key_specs : undefined,
        // @ts-ignore
        price_estimate: aiData.price_estimate,
        // @ts-ignore
        ai_generated: true,
        // @ts-ignore
        web_source: webContext?.sourceUrl
    };
}
