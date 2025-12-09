'use server';

import axios from 'axios';

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product';

// --- NEW "MAXIMUM INFO" SCHEMA ---
export interface EnhancedProductData {
    id: string; // Keep top level for ID
    identity: {
        name: string;
        brand: string;
        barcode: string;
        scientific_name?: string;
        category: string;
        description: string; // Moved details here
    };
    media: {
        front_image: string;
        thumbnail: string; // New field for search results
        ingredients_image?: string;
    };
    grades: {
        nutri_score: string; // A, B, C, D, E or ?
        eco_score: string;   // A-E or number? keeping string for now
        processing_score: string; // NOVA 1-4
        quality_comment?: string;
    };
    nutrition: {
        calories_100g?: number;
        proteins_100g?: number;
        carbs_100g?: number;
        fat_100g?: number;
        detailed_micros?: {
            lycopene?: string;
            potassium?: string;
        };
        nutriments_raw?: any;
    };
    sensory_profile: {
        flavors: string[];
        texture?: string;
    };
    // Flattened helpers for easier access during migration/search
    // (Optional, but good practice to keep some top-level specific accessors if needed by existing generic components, 
    // but the user requested strict structure. I will implement getters or just strictly use the object.)
    // For compatibility with components expecting 'ingredients', we might need to add it:
    ingredients: string[];
}

const apiClient = axios.create({
    headers: {
        'User-Agent': 'TruthLens - Web - 0.1.0'
    }
});

/**
 * ⚠️ DEVELOPER WARNING: IMAGE EXTRACTION CRITICAL
 * -----------------------------------------------------------------------------
 * When mapping OpenFoodFacts data, you MUST extract image fields from the API response.
 * 
 * Image fields available in OpenFoodFacts JSON response:
 *   - product.image_front_small_url   ✅ BEST for search bars (lightweight thumbnail)
 *   - product.image_small_url         ✅ Alternative thumbnail
 *   - product.image_thumb_url         ✅ Another thumbnail option
 *   - product.image_url               ⚠️  Full size (slower, use as fallback)
 *   - product.image_front_url         ⚠️  Full size front image
 * 
 * The mapping below extracts these into media.thumbnail and media.front_image
 * -----------------------------------------------------------------------------
 */
// Helper: Map OFF Data to New Schema
const mapOpenFoodFactsToEnhanced = (product: any): EnhancedProductData => {
    // 1. Identity
    const categories = (product.categories_tags || []).map((c: string) =>
        c.replace(/en:|fr:|es:/g, '').replace(/-/g, ' ')
    ).filter((c: string) => c.length > 0);
    const mainCategory = categories[0]
        ? categories[0].charAt(0).toUpperCase() + categories[0].slice(1)
        : 'General Grocery';

    const brand = product.brands || (product.brands_tags && product.brands_tags.length > 0 ? product.brands_tags[0].replace('brand:', '') : 'Unknown Brand');

    let description = product.generic_name;
    if (!description || description.trim() === '') {
        description = `A ${mainCategory.toLowerCase()} product`;
        if (brand !== 'Unknown Brand') description += ` by ${brand}.`;
    }

    // 2. Grades
    const nova = product.nova_group ? `NOVA ${product.nova_group}` : '?';
    const nutri = product.nutrition_grades?.toUpperCase() || '?';
    const eco = product.ecoscore_grade?.toUpperCase() || '?';

    // 3. Nutrition (Basic mapping from OFF)
    const nutrition = {
        calories_100g: product.nutriments?.['energy-kcal_100g'] || product.nutriments?.['energy-kcal'],
        proteins_100g: product.nutriments?.proteins_100g,
        carbs_100g: product.nutriments?.carbohydrates_100g,
        fat_100g: product.nutriments?.fat_100g,
        nutriments_raw: product.nutriments
    };

    // DEBUG LOGGING FOR IMAGES
    console.log(`[Image Debug] ${product.product_name}:`, {
        url: product.image_url,
        small: product.image_small_url,
        front: product.image_front_url,
        front_small: product.image_front_small_url,
        thumb: product.image_thumb_url
    });

    return {
        id: product._id,
        identity: {
            name: product.product_name || 'Unknown Product',
            brand: brand,
            barcode: product._id,
            category: mainCategory,
            description: description
        },
        media: {
            // Prioritize high-res for Detail Page
            front_image: product.image_url || product.image_front_url || product.image_small_url || '',
            // Prioritize small/thumb for Search Results
            thumbnail: product.image_small_url || product.image_front_small_url || product.image_thumb_url || product.image_front_thumb_url || product.image_url || '',
            ingredients_image: product.image_ingredients_url || ''
        },
        grades: {
            nutri_score: nutri,
            eco_score: eco,
            processing_score: nova
        },
        nutrition: nutrition,
        sensory_profile: {
            flavors: [], // Populated by FooDB ideally, or AI
            texture: undefined
        },
        ingredients: product.ingredients_text ? [product.ingredients_text] : []
    };
};

export const searchProductsAction = async (query: string): Promise<EnhancedProductData[]> => {
    try {
        console.log(`Server Action Searching for: ${query}`);
        const response = await apiClient.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=50`);

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
        // Fetch from OpenFoodFacts
        const response = await apiClient.get(`${OFF_API_URL}/${barcode}.json`);

        let productData: EnhancedProductData | null = null;

        if (response.data.status === 1) {
            productData = mapOpenFoodFactsToEnhanced(response.data.product);
        }

        return productData;

    } catch (error) {
        console.error("Error fetching product data:", error);
        return null;
    }
};
