'use server';

import axios from 'axios';
import { fetchFromFooDB } from '@/services/external/foodbService';

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product';

import { EnhancedProductData, mapOpenFoodFactsToEnhanced } from '@/services/productMapper';

const apiClient = axios.create({
    headers: {
        'User-Agent': 'TruthLens - Web - 0.1.0'
    }
});

export type { EnhancedProductData }; // Re-export type if needed by consumers who import from here, though updating consumers is better. 

// ... (rest of the file content) - wait, replace_file_content replaces the chunk. 
// I need to replace lines 8-142 with the import.


import { searchFDA } from '@/services/external/fdaService';
import { generateProductInfoAI } from '@/services/searchAiService';
import { findProductImages, searchWithSearXNG } from '@/services/searxngService';

export const searchProductsAction = async (query: string): Promise<EnhancedProductData[]> => {
    try {
        console.log(`[Global Search] Initiating multi-source search for: ${query}`);

        // 1. Parallel Execution: OpenFoodFacts + FDA
        const [offResponse, fdaResults] = await Promise.allSettled([
            apiClient.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=20&fields=_id,code,product_name,brands,generic_name,image_small_url,image_front_small_url,image_url,nutrition_grades,ecoscore_grade,nova_group`, { timeout: 8000 }),
            searchFDA(query)
        ]);

        let rawResults: EnhancedProductData[] = [];

        // 2. Process OpenFoodFacts Results
        if (offResponse.status === 'fulfilled' && offResponse.value.data.products) {
            const offProducts = offResponse.value.data.products
                .map((p: any) => mapOpenFoodFactsToEnhanced(p))
                .filter((p: EnhancedProductData) => p.identity.name !== 'Unknown Product');
            rawResults = [...rawResults, ...offProducts];
        } else {
            console.warn('[Global Search] OpenFoodFacts request failed or timed out.');
        }

        // 3. Process FDA Results
        if (fdaResults.status === 'fulfilled') {
            rawResults = [...rawResults, ...fdaResults.value];
        }

        // 4. Deduplication
        const seen = new Set<string>();
        let results = rawResults.filter((product: EnhancedProductData) => {
            const normalizedName = product.identity.name.trim().toLowerCase();
            const brandKey = (product.identity.brand || '').toLowerCase().split(',')[0].trim();
            const uniqueKey = `${brandKey}|${normalizedName}`;

            if (seen.has(uniqueKey)) return false;
            seen.add(uniqueKey);
            return true;
        });

        // 5. Augment Missing Images via SearXNG
        const finalResults = await Promise.all(results.map(async (p) => {
            // If image is placeholder or missing, try to find one
            if ((!p.media.front_image || p.media.front_image.includes('placeholder')) && p.identity.name) {
                const images = await findProductImages(`${p.identity.name} ${p.identity.brand || ''}`, 1);
                if (images.length > 0) {
                    console.log(`[Global Search] Augmented missing image for ${p.identity.name}`);
                    return {
                        ...p,
                        media: {
                            ...p.media,
                            front_image: images[0],
                            thumbnail: images[0]
                        }
                    };
                }
            }
            return p;
        }));

        if (finalResults.length > 0) {
            return finalResults;
        }

        // 6. DB Failed? Fallback to Advanced Web Synthesis
        // This handles "Fanta" if not in DB, or random questions
        console.log('[Global Search] No DB results. Triggering Web-Augmented AI Fallback...');

        // Search for Web Info + Images in parallel
        const [webResults, imageResults] = await Promise.all([
            searchWithSearXNG(query, 'general'),
            findProductImages(query, 1)
        ]);

        const topWeb = webResults[0];
        // Only use web image if imageResults failed AND web image is high quality (not a logo)
        let topImage = imageResults[0];

        if (!topImage && topWeb?.img_src) {
            const url = topWeb.img_src.toLowerCase();
            const isSuspicious = url.includes('logo') || url.includes('icon') || url.includes('assets') || url.includes('favicon') || url.includes('svg');
            if (!isSuspicious) {
                topImage = topWeb.img_src;
            } else {
                console.log('[Global Search] Filtered out suspicious fallback image:', url);
            }
        }

        const webContext = {
            title: topWeb?.title,
            snippet: topWeb?.content,
            image: topImage,
            sourceUrl: topWeb?.url
        };

        const aiResult = await generateProductInfoAI(query, webContext);
        if (aiResult) {
            return [aiResult];
        }

        return [];

    } catch (error: any) {
        console.error("[Global Search] Aggregation Error:", error.message);
        // Crisis Fallback to AI if everything explodes
        const aiResult = await generateProductInfoAI(query);
        return aiResult ? [aiResult] : [];
    }
};

export const getAIProductAction = async (query: string): Promise<EnhancedProductData | null> => {
    // Perform Web Search to get context for re-generation
    try {
        const [webResults, imageResults] = await Promise.all([
            searchWithSearXNG(query, 'general'),
            findProductImages(query, 1) // Now highly optimized
        ]);

        const topWeb = webResults[0];
        // Only use web image if imageResults failed AND web image is high quality (not a logo)
        let topImage = imageResults[0];

        if (!topImage && topWeb?.img_src) {
            const url = topWeb.img_src.toLowerCase();
            const isSuspicious = url.includes('logo') || url.includes('icon') || url.includes('assets') || url.includes('favicon');
            if (!isSuspicious) {
                topImage = topWeb.img_src;
            }
        }

        const webContext = {
            title: topWeb?.title,
            snippet: topWeb?.content,
            image: topImage,
            sourceUrl: topWeb?.url
        };

        return generateProductInfoAI(query, webContext);
    } catch (e) {
        return generateProductInfoAI(query);
    }
};

export const getProductAction = async (barcode: string): Promise<EnhancedProductData | null> => {
    try {
        // 1. Try FooDB First
        const foodbResult = await fetchFromFooDB(barcode);
        if (foodbResult) {
            console.log(`[ProductAction] Found in FooDB: ${foodbResult.name}`);
            // Map FooDB ProductData to EnhancedProductData
            return {
                id: foodbResult.id,
                identity: {
                    name: foodbResult.name,
                    brand: foodbResult.brand,
                    barcode: barcode,
                    category: 'Unknown',
                    description: foodbResult.description
                },
                media: {
                    front_image: foodbResult.image,
                    thumbnail: foodbResult.image,
                },
                grades: {
                    nutri_score: '?', // FooDB doesn't typically have NutriScore
                    eco_score: '?',
                    processing_score: '?'
                },
                nutrition: {}, // FooDB structure is complex, leaving empty for generic view
                sensory_profile: { flavors: [] },
                ingredients: []
            };
        }

        // 2. Fallback to OpenFoodFacts
        const response = await apiClient.get(`${OFF_API_URL}/${barcode}.json`);

        if (response.data.status === 1) {
            return mapOpenFoodFactsToEnhanced(response.data.product);
        }

        // 3. Fallback to SearXNG (Azure VM)
        console.log(`[ProductAction] Fallback: Searching SearXNG for ${barcode}...`);
        const { searchWithSearXNG } = await import('@/services/searxngService'); // Dynamic import to avoid circular dep if any
        const query = `${barcode} product details`;
        const searchResults = await searchWithSearXNG(query, 'general');

        if (searchResults && searchResults.length > 0) {
            const topResult = searchResults[0];

            // Extract Name/Brand logic (Simplified vs API route for now, or match it)
            let name = topResult.title;
            let brand = 'Unknown Brand';

            if (name.includes(' - ')) {
                const parts = name.split(' - ');
                brand = parts[0];
                name = parts.slice(1).join(' - ');
            } else {
                // Heuristic: Assume first word is brand if no separator found, or use "Generic"
                const parts = name.split(' ');
                if (parts.length > 1) {
                    brand = parts[0]; // e.g. "Samsung Galaxy S21" -> Brand: Samsung
                }
            }

            const enhancedData: EnhancedProductData = {
                id: barcode,
                identity: {
                    name: name,
                    brand: brand,
                    barcode: barcode,
                    category: 'Scanned Product',
                    description: topResult.content || 'Details found via web search.'
                },
                media: {
                    front_image: topResult.img_src || topResult.thumbnail || '',
                    thumbnail: topResult.thumbnail || topResult.img_src || '',
                },
                grades: {
                    nutri_score: '?', // Calculate in component or service if needed
                    eco_score: '?',
                    processing_score: '?'
                },
                nutrition: { nutriments_raw: {} },
                sensory_profile: { flavors: [] },
                ingredients: []
            };
            return enhancedData;
        }

        return null;

    } catch (error) {
        console.error("Error fetching product data:", error);
        return null;
    }
};

// --- RECAPTCHA & REGISTRATION ---
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const RECAPTCHA_SECRET_KEY = '6LeYMiYsAAAAAKBrlgVd2DgpCa1NO285uPI8Jvib'; // v2 Secret Key

interface RegisterResponse {
    success: boolean;
    token?: string; // Custom Firebase Token
    error?: string;
}

export async function registerUser(formData: FormData, token: string): Promise<RegisterResponse> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !token) {
        return { success: false, error: 'Missing required fields.' };
    }

    try {
        // 1. Verify reCAPTCHA
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${token}`;
        const recaptchaRes = await axios.post(verificationUrl);

        const { success } = recaptchaRes.data;

        console.log('reCAPTCHA Verification:', { success, email });

        if (!success) {
            console.warn('Blocked suspicious signup request:', email);
            return { success: false, error: 'Security check failed. Please try again.' };
        }

        // 2. Create User in Firebase Admin
        if (!adminAuth) {
            console.error('Firebase Admin SDK not initialized.');
            return { success: false, error: 'Internal server error.' };
        }

        const userRecord = await adminAuth.createUser({
            email,
            password,
            emailVerified: false,
            disabled: false,
        });

        // 3. Create Custom Token for immediate login
        const customToken = await adminAuth.createCustomToken(userRecord.uid);

        return { success: true, token: customToken };

    } catch (error: any) {
        console.error('Registration Error:', error);
        // Map Firebase errors to user-friendly messages
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'Email is already in use.' };
        }
        if (error.code === 'auth/invalid-password') {
            return { success: false, error: 'Password is too weak.' };
        }
        return { success: false, error: error.message || 'Failed to create account.' };
    }
}

// --- AI SUGGESTIONS ---

const FALLBACK_SUGGESTIONS = [
    // Food & Nutrition
    "What are healthy snacks for energy?",
    "Is oatmeal good for weight loss?",
    "How much water should I drink daily?",
    "Does spinach have more iron than steak?",
    "What's a good post-workout meal?",

    // Tech & PC Building
    "Best budget GPU for 1080p gaming?",
    "How much RAM do I really need?",
    "Is the RTX 4060 worth it?",
    "How to check my PC specs?",
    "Difference between SSD and NVMe?",

    // General Help
    "How do I reset my password?",
    "How does the barcode scanner work?",
    "Who created this AI?",
    "Can you explain the Eco-Score?",
    "What features are in Pro mode?"
];

function getRandomSuggestions(count: number = 3): string[] {
    const shuffled = [...FALLBACK_SUGGESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export async function generateChatSuggestions(): Promise<string[]> {
    try {
        console.log('[AI Action] Generating chat suggestions...');
        let groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

        // 1. Try to fetch secure key from Admin Storage (if available)
        if (adminDb) {
            try {
                const secretDoc = await adminDb.collection('_system_secrets').doc('ai_config').get();
                if (secretDoc.exists) {
                    const data = secretDoc.data();
                    if (data?.groq) {
                        groqKey = data.groq;
                        console.log('[AI Action] Using Secure Admin Key for Groq');
                    }
                }
            } catch (err) {
                console.warn('[AI Action] Failed to fetch admin secrets:', err);
            }
        }

        if (groqKey) {
            try {
                // 2. Try Groq API
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama3-8b-8192',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an AI Expert for Food, Nutrition, Tech & PC Building. Generate 3 short, engaging, diverse questions a user might ask you. ONE about nutrition, ONE about tech/PC building, and ONE generic. Return ONLY a JSON array of strings. Example: ["Healthy snack ideas?", "Best GPU for 1080p?", "How to reset password?"]'
                            },
                            {
                                role: 'user',
                                content: 'Generate 3 suggestions.'
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 100
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${groqKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const content = response.data.choices[0]?.message?.content;
                if (content) {
                    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
                    const parsed = JSON.parse(cleanContent);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed.slice(0, 3);
                    }
                }
            } catch (err) {
                console.warn('[AI Action] Groq failed, trying fallback...', err);
            }
        }

        // 3. Try GitHub Models Fallback
        // Fetch key again if needed or use env
        const ghToken = process.env.GITHUB_MODELS_TOKEN; // Or fetch from adminDb logic if we stored it there

        // Check admin secrets for GitHub Token if not in env
        let secureGhToken = ghToken;
        if (!secureGhToken && adminDb) {
            const secretDoc = await adminDb.collection('_system_secrets').doc('ai_config').get();
            if (secretDoc.exists) {
                secureGhToken = secretDoc.data()?.githubModelsToken;
            }
        }

        if (secureGhToken) {
            console.log('[AI Action] Trying GitHub Models Fallback...');
            try {
                const response = await fetch('https://models.github.ai/inference/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${secureGhToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28',
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-4o', // or another reliable model available
                        messages: [
                            { role: 'system', content: 'Generate 3 short, diverse questions a user might ask an AI assistant (Food, Tech, General). Return ONLY a JSON array of strings.' },
                            { role: 'user', content: 'Generate suggestions.' }
                        ],
                        max_tokens: 100
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content) {
                        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
                        const parsed = JSON.parse(cleanContent);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed.slice(0, 3);
                        }
                    }
                }
            } catch (ghErr) {
                console.warn('[AI Action] GitHub Models fallback failed:', ghErr);
            }
        }

        console.warn('[AI Action] All AI providers failed. Using randomized static fallback.');
        return getRandomSuggestions();

    } catch (error: any) {
        console.error('[AI Action] Error generating suggestions:', error.message);
        return getRandomSuggestions();
    }
}
