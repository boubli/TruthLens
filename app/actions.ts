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


export const searchProductsAction = async (query: string): Promise<EnhancedProductData[]> => {
    try {
        console.log(`Server Action Searching for: ${query}`);
        const response = await apiClient.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=24&fields=_id,code,product_name,brands,generic_name,image_small_url,image_front_small_url,image_url,nutrition_grades,ecoscore_grade,nova_group`, { timeout: 10000 });

        if (response.data.products) {
            // Map to new schema
            const rawResults = response.data.products.map((p: any) => mapOpenFoodFactsToEnhanced(p))
                .filter((p: EnhancedProductData) => p.identity.name !== 'Unknown Product');

            // --- Smart Deduplication ---
            const seen = new Set<string>();
            const results = rawResults.filter((product: EnhancedProductData) => {
                const normalizedName = product.identity.name
                    .replace(/\s*(\d+(\.\d+)?\s*(l|ml|dl|cl|g|kg|oz|lb|fl\.?\s*oz))\b/gi, '')
                    .replace(/\s*x\s*\d+\b/gi, '')
                    .replace(/\s*pack\s*of\s*\d+/gi, '')
                    .replace(/[-_]/g, ' ')
                    .trim().toLowerCase();

                const brandKey = (product.identity.brand || '').toLowerCase().split(',')[0].trim();
                const uniqueKey = `${brandKey}|${normalizedName}`;

                if (seen.has(uniqueKey)) return false;
                seen.add(uniqueKey);
                return true;
            });
            // ---------------------------

            return results;
        }
        return [];
    } catch (error: any) {
        console.error("Error searching products:", error.message);
        return [];
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

export async function generateChatSuggestions(): Promise<string[]> {
    try {
        console.log('[AI Action] Generating chat suggestions...');
        let groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

        // 1. Try to fetch secure key from Admin Storage if available
        if (adminDb) {
            const secretDoc = await adminDb.collection('_system_secrets').doc('ai_config').get();
            if (secretDoc.exists) {
                const data = secretDoc.data();
                if (data?.groq) {
                    groqKey = data.groq;
                    console.log('[AI Action] Using Secure Admin Key for Groq');
                }
            }
        }

        if (!groqKey) {
            console.warn('[AI Action] No Groq API Key found. Returning defaults.');
            return [
                'What are healthy snacks for energy?',
                'Is oatmeal good for weight loss?',
                'How much water should I drink daily?'
            ];
        }

        // 2. Call Groq API
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-8b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful nutritionist assistant. Generate 3 short, engaging, diverse questions a user might ask you about food, health, or nutrition. Return ONLY a JSON array of strings. Example: ["Question 1?", "Question 2?", "Question 3?"]'
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
        console.log('[AI Action] Raw Groq Response:', content);

        if (content) {
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanContent);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.slice(0, 3);
            }
        }

        throw new Error('Invalid AI response format');

    } catch (error: any) {
        console.error('[AI Action] Error generating suggestions:', error.message);
        return [
            'What are healthy snacks for energy?',
            'Is oatmeal good for weight loss?',
            'How much water should I drink daily?'
        ];
    }
}
