
import axios from 'axios';
import { EnhancedProductData } from '@/services/productMapper';

const USDA_API_KEY = '1y9SZmWjZZrLLc6FlydP2ofW2Q82T8fxlK1ulS17';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export const searchFDA = async (query: string): Promise<EnhancedProductData[]> => {
    try {
        const response = await axios.get(USDA_API_URL, {
            params: {
                api_key: USDA_API_KEY,
                query: query,
                pageSize: 5,
                dataType: ['Branded', 'Foundation', 'Survey (FNDDS)', 'SR Legacy']
            },
            timeout: 8000
        });

        if (response.data.foods) {
            return response.data.foods.map((item: any) => mapUSDAToEnhanced(item));
        }

        return [];
    } catch (error: any) {
        console.error('[USDA Service] Search error:', error.message);
        return [];
    }
};

const mapUSDAToEnhanced = (item: any): EnhancedProductData => {
    return {
        id: `usda_${item.fdcId}`,
        identity: {
            name: item.description,
            brand: item.brandOwner || 'USDA Food',
            barcode: item.gtinUpc || '',
            category: item.foodCategory || 'Generic Food',
            description: item.ingredients ? `Ingredients: ${item.ingredients}` : 'USDA Verified Food Data'
        },
        media: {
            front_image: '/api/placeholder/400/400?text=USDA',
            thumbnail: '/api/placeholder/200/200?text=USDA'
        },
        grades: {
            nutri_score: '?',
            eco_score: '?',
            processing_score: '?'
        },
        nutrition: {
            nutriments_raw: item.foodNutrients?.reduce((acc: any, n: any) => {
                const name = n.nutrientName.toLowerCase();
                // Simple mapping for demonstration
                if (name.includes('energy')) acc.energy_kcal = n.value;
                if (name.includes('protein')) acc.proteins = n.value;
                if (name.includes('carbohydrate')) acc.carbohydrates = n.value;
                if (name.includes('total lipid')) acc.fat = n.value;
                return acc;
            }, {}) || {}
        },
        sensory_profile: { flavors: [] },
        ingredients: item.ingredients ? item.ingredients.split(',').map((i: string) => i.trim()) : [],
        source: 'USDA'
    };
};
