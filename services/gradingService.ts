import { DietaryPreferences } from '@/types/user';
import { ProductData } from './productService';

/**
 * Smart Grading Service - Personalized grading for Pro users
 * Adjusts product grades based on dietary preferences
 */

export interface SmartGradeResult {
    grade: string; // A, B, C, D, E, F
    score: number; // 0-100
    reasons: string[];
    warnings: string[];
    isPersonalized: boolean;
}

/**
 * Calculate smart grade based on dietary preferences
 * Only available for Pro users
 */
import { calculateSmartGrade as advancedSmartGrade } from './smartGradingService';

export const calculateSmartGrade = (
    product: ProductData,
    preferences: DietaryPreferences
): SmartGradeResult => {
    return advancedSmartGrade(product, preferences);
};

/**
 * Convert letter grade to base score
 */
function getBaseScore(grade: string): number {
    const gradeMap: Record<string, number> = {
        'A': 90,
        'B': 75,
        'C': 60,
        'D': 45,
        'E': 30,
        '?': 50, // Unknown
    };
    return gradeMap[grade.toUpperCase()] || 50;
}

/**
 * Convert score to letter grade
 */
function scoreToGrade(score: number): string {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    if (score >= 25) return 'E';
    return 'F';
}

/**
 * Get generic grade (for Free users)
 */
export const getGenericGrade = (product: ProductData): SmartGradeResult => {
    const baseScore = getBaseScore(product.nutrition_grades);

    return {
        grade: product.nutrition_grades,
        score: baseScore,
        reasons: ['Standard nutrition grade from Open Food Facts'],
        warnings: [],
        isPersonalized: false,
    };
};
