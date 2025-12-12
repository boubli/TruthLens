
import axios from 'axios';
import { EnhancedProductData } from '@/services/productMapper';

const FDA_API_URL = 'https://api.fda.gov/drug/label.json';

export const searchFDA = async (query: string): Promise<EnhancedProductData[]> => {
    try {
        // FDA API: search string e.g., search=openfda.brand_name:"tylenol"
        // We use a broader search on brand_name or generic_name
        const searchQuery = `openfda.brand_name:"${query}"+OR+openfda.generic_name:"${query}"`;

        const response = await axios.get(FDA_API_URL, {
            params: {
                search: searchQuery,
                limit: 5
            },
            timeout: 5000 // 5s timeout
        });

        if (response.data.results) {
            return response.data.results.map((item: any) => mapFDAToEnhanced(item));
        }

        return [];
    } catch (error: any) {
        // FDA API returns 404 for no results, which is normal
        if (error.response?.status !== 404) {
            console.error('[FDA Service] Search error:', error.message);
        }
        return [];
    }
};

const mapFDAToEnhanced = (fdaItem: any): EnhancedProductData => {
    const openfda = fdaItem.openfda || {};
    const brand = openfda.brand_name?.[0] || 'Unknown Brand';
    const generic = openfda.generic_name?.[0] || '';
    const name = generic ? `${brand} (${generic})` : brand;
    const id = openfda.product_ndc?.[0] || fdaItem.id || 'fda_unknown';

    return {
        id: `fda_${id}`,
        identity: {
            name: name,
            brand: openfda.manufacturer_name?.[0] || 'Unknown Manufacturer',
            barcode: openfda.upc?.[0] || '', // Often missing in FDA open data
            category: 'Medicine',
            description: fdaItem.purpose?.[0] || fdaItem.indications_and_usage?.[0] || 'FDA Approved Medicine'
        },
        // FDA doesn't provide images directly in this endpoint
        media: {
            front_image: '/images/placeholder-medicine.png', // Fallback
            thumbnail: '/images/placeholder-medicine.png'
        },
        grades: {
            nutri_score: '?',
            eco_score: '?',
            processing_score: '?'
        },
        nutrition: { nutriments_raw: {} }, // Not applicable
        sensory_profile: { flavors: [] },
        ingredients: [],
        source: 'FDA' // Custom field used for UI handling if needed
    };
};
