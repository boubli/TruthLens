import { searchProducts } from './productService';

/**
 * Service to handle external product databases (USDA, FooDB, etc.)
 * This acts as an aggregator for product data outside of OpenFoodFacts.
 */

// Placeholder for USDA API Key (should be in env vars)
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Placeholder for FooDB (no public API easily accessible without key/download, but simulating structure)
const FOODB_BASE_URL = 'https://foodb.ca/api/v1';

export interface ExternalProductResult {
    id: string;
    name: string;
    brand: string;
    image: string;
    source: 'usda' | 'foodb' | 'off' | 'generic';
    grade?: string;
}

/**
 * Search USDA FoodData Central
 */
export const searchUSDA = async (query: string): Promise<ExternalProductResult[]> => {
    try {
        if (!query) return [];
        // Note: USDA search determines foods, but often lacks brand/image data compared to OFF.
        // This is a fallback.
        const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=3`);

        if (!response.ok) return [];

        const data = await response.json();
        return data.foods.map((food: any) => ({
            id: `usda-${food.fdcId}`,
            name: food.description,
            brand: food.brandOwner || 'Unknown',
            image: '', // USDA rarely provides public image URLs directly in search list
            source: 'usda',
            grade: undefined // USDA doesn't have Nutri-Score
        }));
    } catch (error) {
        console.error("USDA Search Error:", error);
        return [];
    }
};

/**
 * Search FooDB (Mock/Placeholder as FooDB works differently)
 */
export const searchFooDB = async (query: string): Promise<ExternalProductResult[]> => {
    // FooDB doesn't have a standard open CORS-friendly API for simple search without setup.
    // We will leave this as a stub that can be expanded if the user provides a specific endpoint or key.
    return [];
};

/**
 * Meta-searcher that tries multiple sources
 */
export const searchAllSources = async (query: string): Promise<ExternalProductResult[]> => {
    // 1. Try Open Food Facts (Best for images & grades)
    const offResults = await searchProducts(query);
    if (offResults.length > 0 && offResults[0].image) {
        return offResults.map(p => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            image: p.image,
            source: 'off',
            grade: p.nutrition_grades
        }));
    }

    // 2. Try USDA as fallback for data
    const usdaResults = await searchUSDA(query);
    if (usdaResults.length > 0) return usdaResults;

    // 3. Fallback to generic OFF result even if no image, just to have data
    if (offResults.length > 0) {
        return offResults.map(p => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            image: p.image || '',
            source: 'off',
            grade: p.nutrition_grades
        }));
    }

    return [];
};
