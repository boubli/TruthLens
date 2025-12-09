import axios from 'axios';
import { ProductData } from '../productService';

// Use standard API key or demo key if env not set (though we just set it)
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

export const fetchFromUSDA = async (barcode: string): Promise<ProductData | null> => {
    if (!USDA_API_KEY) {
        console.warn('USDA API Key missing. Skipping USDA fetch.');
        return null;
    }

    try {
        console.log(`[USDA] Fetching data for barcode: ${barcode}`);
        // 1. Search for the food item by UPC (barcode)
        const searchResponse = await axios.get(`${USDA_API_URL}/foods/search`, {
            params: {
                query: barcode,
                dataType: ['Branded'], // Filter for branded foods which usually have GTIN/UPC
                pageSize: 1,
                api_key: USDA_API_KEY
            }
        });

        if (searchResponse.data.foods && searchResponse.data.foods.length > 0) {
            const food = searchResponse.data.foods[0];
            console.log(`[USDA] Found product: ${food.description}`);

            // Map nutrients (USDA format is different)
            // We need to map USDA nutrientIds/names to our 'nutriments' object keys
            const nutriments: any = {};
            food.foodNutrients.forEach((n: any) => {
                const name = n.nutrientName.toLowerCase();
                if (name.includes('protein')) nutriments.proteins_100g = n.value;
                if (name.includes('total lipid (fat)')) nutriments.fat_100g = n.value;
                if (name.includes('carbohydrate')) nutriments.carbohydrates_100g = n.value;
                if (name.includes('sugars, total')) nutriments.sugars_100g = n.value;
                if (name.includes('sodium')) nutriments.sodium_100g = n.value / 1000; // usually mg in USDA
                if (name.includes('energy')) nutriments.energy_100g = n.value; // kcal or kJ
            });

            // Infer Nutrition Grade (Basic Logic as USDA doesn't provide it)
            // This is a placeholder; real Nutri-Score calc is complex
            const nutrition_grades = 'unknown';

            return {
                id: String(food.fdcId),
                name: food.description,
                brand: food.brandOwner || 'Unknown Brand',
                image: '', // USDA often doesn't have images
                ingredients: food.ingredients ? food.ingredients.split(',').map((i: string) => i.trim()) : [],
                nutrition_grades,
                nutriments,
                description: food.foodCategory || 'USDA Food Data',
                source: 'USDA'
            };
        }

        console.log('[USDA] No product found for barcode.');
        return null;
    } catch (error: any) {
        console.error('USDA Fetch Error:', error.message);
        return null;
    }
};
