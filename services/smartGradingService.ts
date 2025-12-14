import { DietaryPreferences } from '@/types/user';
import { ProductData } from './productService';

export interface SmartGradeResult {
    grade: string; // A, B, C, D, E, F
    score: number; // 0-100
    reasons: string[];
    warnings: string[];
    isPersonalized: boolean;
}

/**
 * Advanced Smart Grading Algorithms
 * Parses ingredients and nutrition data to provide hyper-personalized scores.
 */
export const calculateSmartGrade = (
    product: ProductData,
    preferences: DietaryPreferences
): SmartGradeResult => {
    // 1. Establish Base Score (Nutrition Grade A-E)
    let score = getBaseScore(product.nutrition_grades);
    const reasons: string[] = [];
    const warnings: string[] = [];
    const ingredientsText = (product.ingredients || []).join(' ').toLowerCase();

    // Helper to check ingredient presence
    const contains = (keywords: string[]) => {
        return keywords.some(k => ingredientsText.includes(k.toLowerCase()));
    };

    // 2. Critical Exclusions (Allergens & Avoid List) - IMMEDIATE RED FLAGS
    // These drastically reduce score regardless of nutritional value

    // Check Allergens
    if (preferences.allergens && preferences.allergens.length > 0) {
        const foundAllergens = preferences.allergens.filter(allergen =>
            ingredientsText.includes(allergen.toLowerCase())
        );

        if (foundAllergens.length > 0) {
            score = 0; // Immediate Failure
            warnings.push(`⚠️ Contains Allergen: ${foundAllergens.join(', ')}`);
        }
    }

    // Check Avoid List (e.g., "Sulfates", "Palm Oil")
    if (preferences.avoidIngredients && preferences.avoidIngredients.length > 0) {
        const foundAvoids = preferences.avoidIngredients.filter(item =>
            ingredientsText.includes(item.toLowerCase())
        );

        if (foundAvoids.length > 0) {
            score -= 40;
            warnings.push(`🚫 Contains avoided ingredient: ${foundAvoids.join(', ')}`);
        }
    }

    // 3. Lifestyle Checks (Keto, Vegan, etc.)
    if (preferences.isKeto) {
        const carbs = product.nutriments?.carbohydrates_100g || 0;
        if (carbs > 10) {
            score -= 20;
            warnings.push(`High Carbs (${carbs}g) - Not ideal for Keto`);
        } else if (carbs < 5) {
            score += 10;
            reasons.push('Low Carbs - Keto Friendly');
        }
    }

    if (preferences.isVegan) {
        const nonVeganKeywords = ['milk', 'egg', 'honey', 'gelatin', 'whey', 'casein', 'lactose', 'beef', 'chicken', 'pork'];
        const foundNonVegan = nonVeganKeywords.filter(k => ingredientsText.includes(k));

        if (foundNonVegan.length > 0) {
            score -= 30;
            warnings.push(`Contains non-vegan ingredients: ${foundNonVegan.join(', ')}`);
        } else {
            // Only boost if explicitly confirmed vegan source (hard to do with just text, but we can give small boost for absence of obvious flags)
            score += 5;
        }
    }

    // 4. Goal Boosting (e.g. "High Protein")
    if (preferences.healthGoals && preferences.healthGoals.length > 0) {
        // High Protein Goal
        if (preferences.healthGoals.includes('High Protein')) {
            const protein = product.nutriments?.proteins_100g || 0;
            if (protein > 10) {
                score += 15;
                reasons.push(`💪 High Protein (${protein}g)`);
            }
        }

        // Muscle Gain / Hair Growth (Look for specific nutrients/ingredients)
        // Simple keyword matching for now
        if (preferences.healthGoals.includes('Hair Growth')) {
            if (contains(['biotin', 'collagen', 'vitamin e', 'zinc'])) {
                score += 10;
                reasons.push('✨ Contains ingredients for Hair Growth');
            }
        }
    }

    // 5. Normalizing Score
    score = Math.max(0, Math.min(100, score));

    return {
        grade: scoreToGrade(score),
        score,
        reasons: unique(reasons),
        warnings: unique(warnings),
        isPersonalized: true
    };
};

// --- Helpers ---

function getBaseScore(grade: string): number {
    const map: Record<string, number> = {
        'a': 90, 'b': 75, 'c': 60, 'd': 45, 'e': 30,
        'A': 90, 'B': 75, 'C': 60, 'D': 45, 'E': 30
    };
    return map[grade] || 50;
}

function scoreToGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    if (score >= 20) return 'E';
    return 'F';
}

function unique(arr: string[]): string[] {
    return Array.from(new Set(arr));
}
