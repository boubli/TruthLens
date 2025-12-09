import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { generateMealPlan, MealPlanDay } from './aiService';
import { getUserHistory } from './historyService';

export const createWeeklyMealPlan = async (userId: string): Promise<MealPlanDay[]> => {
    try {
        // 1. Get User's Scanned Foods (Inventory)
        const history = await getUserHistory(userId);
        // Extract unique product names (last 30)
        const inventory = Array.from(new Set(history.slice(0, 30).map(h => h.title)));

        if (inventory.length < 5) {
            // Not enough data fallback
            inventory.push("Eggs", "Spinach", "Chicken Breast", "Rice", "Apples");
        }

        console.log("👨‍🍳 [MealPlanner] Generating plan with inventory:", inventory);

        // 2. Generate Plan with AI (Gemini/Sambanova)
        const plan = await generateMealPlan(inventory);

        if (plan) {
            // 3. Save to Firestore (optional, if we want to retrieve it later)
            await addDoc(collection(db, 'users', userId, 'meal_plans'), {
                createdAt: new Date(),
                plan: plan
            });
            return plan;
        }

        return [];
    } catch (error) {
        console.error("Error creating meal plan:", error);
        return [];
    }
};

export const getLatestMealPlan = async (userId: string): Promise<MealPlanDay[] | null> => {
    try {
        const q = query(
            collection(db, 'users', userId, 'meal_plans'),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data().plan as MealPlanDay[];
        }
        return null;
    } catch (error) {
        console.error("Error fetching meal plan:", error);
        return null;
    }
};
