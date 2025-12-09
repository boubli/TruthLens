import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { calculateSustainabilityScore, SustainabilityAnalysis } from './aiService';

export const getProductEcoScore = async (productId: string, name: string, brand: string, ingredients: string[]): Promise<SustainabilityAnalysis | null> => {
    try {
        // Validation
        if (!name) return null;

        // Check Cache (products/{id}/sustainability)
        const cacheRef = doc(db, 'products', productId, 'data', 'sustainability');
        const snapshot = await getDoc(cacheRef);

        if (snapshot.exists()) {
            // Simple cache check: return if exists (could add timestamp expiry logic later)
            console.log("✅ [EcoScore] Returning cached score");
            return snapshot.data() as SustainabilityAnalysis;
        }

        console.log("🌱 [EcoScore] Calculating new sustainability score...");
        // Call AI Service (which uses Cerebras/SerpApi)
        const analysis = await calculateSustainabilityScore(name, brand, ingredients);

        if (analysis) {
            // Cache result
            await setDoc(cacheRef, {
                ...analysis,
                updatedAt: serverTimestamp()
            });
        }

        return analysis;
    } catch (error) {
        console.error("Error fetching Eco-Score:", error);
        return null;
    }
};
