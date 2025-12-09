import { calculateSmartGrade } from '../services/gradingService';
import { DietaryPreferences } from '../types/user';

// Mock ProductData locally to avoid importing 'use server' files
interface ProductData {
    id: string;
    name: string;
    brand: string;
    image: string;
    ingredients: string[];
    nutrition_grades: string;
    nutriments: any;
    description: string;
    categories?: string[];
}

// Mock Data
const mockProduct: ProductData = {
    id: '123',
    name: 'Test Cookie',
    brand: 'TestBrand',
    image: '',
    ingredients: ['Enriched Flour', 'Sugar', 'Palm Oil', 'Peanuts', 'Milk'],
    nutrition_grades: 'D',
    nutriments: { sugars_100g: 40, proteins_100g: 2 },
    description: 'A test cookie',
    categories: ['Snacks']
};

const mockPreferences: DietaryPreferences = {
    isKeto: false,
    isVegan: false,
    isDiabetic: false,
    lowSodium: false,
    glutenFree: false,
    isHalal: false,
    allergens: ['Peanuts'],
    avoidIngredients: ['Palm Oil'],
    healthGoals: ['High Protein']
};

async function runTest() {
    console.log('--- Starting Smart Grading Test ---');
    console.log('Product:', mockProduct.name);
    console.log('Ingredients:', mockProduct.ingredients);
    console.log('Base Grade:', mockProduct.nutrition_grades);
    console.log('\nPreferences:', {
        allergens: mockPreferences.allergens,
        avoid: mockPreferences.avoidIngredients
    });

    const result = calculateSmartGrade(mockProduct, mockPreferences);

    console.log('\n--- Result ---');
    console.log('New Grade:', result.grade);
    console.log('Score:', result.score);
    console.log('Warnings:', result.warnings);
    console.log('Reasons:', result.reasons);

    // Assertions
    let passed = true;
    if (result.grade !== 'F') {
        console.error('FAIL: Grade should be F due to Allergen (Peanuts)');
        passed = false;
    }
    if (!result.warnings.some(w => w.includes('Allergen'))) {
        console.error('FAIL: Missing allergen warning');
        passed = false;
    }
    if (!result.warnings.some(w => w.includes('avoided ingredient'))) {
        console.error('FAIL: Missing avoid ingredient warning (Palm Oil)');
        passed = false;
    }

    if (passed) {
        console.log('\n✅ TEST PASSED');
    } else {
        console.log('\n❌ TEST FAILED');
    }
}

runTest();
