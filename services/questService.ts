import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { Quest, QuestHistoryItem } from '@/types/quest';

/**
 * Saves a completed or skipped quest to the user's history.
 */
export const saveQuestHistory = async (userId: string, quest: Quest, action: 'completed' | 'skipped' | 'ignored') => {
    try {
        const historyRef = collection(db, `users/${userId}/questHistory`);
        await addDoc(historyRef, {
            questId: quest.id,
            title: quest.title,
            description: quest.description,
            type: quest.type,
            difficulty: quest.difficulty,
            action: action,
            timestamp: serverTimestamp()
        });
        console.log(`[QuestService] Saved quest history: ${action}`);
    } catch (error) {
        console.error("Error saving quest history:", error);
    }
};

/**
 * Fetches the user's last few quests to prevent repetition.
 */
export const getRecentQuests = async (userId: string, count: number = 5): Promise<string[]> => {
    try {
        const historyRef = collection(db, `users/${userId}/questHistory`);
        const q = query(historyRef, orderBy('timestamp', 'desc'), limit(count));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data().title);
    } catch (error) {
        console.error("Error fetching recent quests:", error);
        return [];
    }
};
