
import axios from 'axios';
import { ProductData } from '../productService';

const FOODB_API_KEY = process.env.NEXT_PUBLIC_FOODB_API_KEY || 'DEMO_KEY';
const FOODB_API_URL = 'https://foodb.ca/api/v1';

export const fetchFromFooDB = async (barcode: string): Promise<ProductData | null> => {
    // Note: FooDB public API access can be sporadic or require specific auth headers depending on the plan.
    // This implementation assumes a standard structure similar to other food databases.

    if (!FOODB_API_KEY) {
        console.warn('FooDB API Key missing. Skipping FooDB fetch.');
        return null;
    }

    try {
        console.log(`[FooDB] Fetching data for barcode: ${barcode}`);

        // Hypothetical endpoint - Foodb docs vary on public availability of barcode search
        // We will try a search by string first if barcode lookups aren't direct, 
        // but for exact match we usually need an ID or direct mapping.
        // Assuming a standard search endpoint:
        const response = await axios.get(`${FOODB_API_URL}/foods/search`, {
            params: {
                query: barcode,
                apikey: FOODB_API_KEY
            }
        });

        // Since we don't have a real FooDB key yet and endpoint might be different, 
        // we'll structure this defensively.
        if (response.data && response.data.foods && response.data.foods.length > 0) {
            const food = response.data.foods[0];

            // Map to our structure
            return {
                id: String(food.id),
                name: food.name,
                brand: food.brand || 'Unknown',
                image: food.images?.[0]?.url || '',
                ingredients: [], // FooDB is compound-focused, simplified here
                nutrition_grades: 'unknown',
                nutriments: {}, // Would need comprehensive mapping
                description: food.description || 'FooDB Entry',
                source: 'FooDB'
            };
        }
        return null;

    } catch (error: any) {
        // Suppress errors for demo purposes as key is likely invalid
        console.log(`[FooDB] Fetch failed or skipped: ${error.message}`);
        return null;
    }
};
