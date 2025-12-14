import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    writeBatch,
    increment
} from 'firebase/firestore';
import { Chat, ChatMessage } from '@/types/chat';

const CHATS_COLLECTION = 'chats';
const MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Starts a new chat for a user if one doesn't exist, or returns the existing one.
 */
export const startNewChat = async (userId: string, userEmail?: string, userName?: string): Promise<string> => {
    // Check if chat already exists for this user
    const q = query(collection(db, CHATS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    let finalName = userName || '';

    // If name is missing, try to fetch from User Profile
    if (!finalName) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                finalName = userDoc.data().displayName || '';
            }
        } catch (e) { console.error("Error fetching user name for chat:", e); }
    }

    if (!snapshot.empty) {
        const chatDoc = snapshot.docs[0];
        // UPDATE existing chat with latest user details (Name sync)
        if (finalName && chatDoc.data().userName !== finalName) {
            await updateDoc(chatDoc.ref, { userName: finalName });
        }
        return chatDoc.id;
    }

    // Create new chat
    const chatData = {
        userId,
        userEmail: userEmail || '',
        userName: finalName,
        updatedAt: serverTimestamp(),
        unreadCountUser: 0,
        unreadCountAdmin: 0
    };

    const docRef = await addDoc(collection(db, CHATS_COLLECTION), chatData);
    return docRef.id;
};

/**
 * Sends a message to a specific chat.
 */
export const sendMessage = async (chatId: string, senderId: string, text: string, senderRole: 'user' | 'admin') => {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const messagesRef = collection(chatRef, MESSAGES_SUBCOLLECTION);

    // Add message to subcollection
    await addDoc(messagesRef, {
        text,
        senderId,
        senderRole,
        createdAt: serverTimestamp()
    });

    const updates: any = {
        lastMessage: {
            text,
            createdAt: new Date(),
            senderRole
        },
        updatedAt: serverTimestamp()
    };

    if (senderRole === 'admin') {
        updates.unreadCountUser = increment(1);
    } else {
        updates.unreadCountAdmin = increment(1);
    }

    await updateDoc(chatRef, updates);

    // If Admin is sending, try to send Push Notification to User
    if (senderRole === 'admin') {
        try {
            // 1. Get Chat Metadata to find target User ID
            const chatSnap = await getDoc(chatRef);
            if (chatSnap.exists()) {
                const chatData = chatSnap.data();
                const targetUserId = chatData.userId;

                if (targetUserId) {
                    // Call new Web Push API
                    fetch('/api/notifications/send-chat-push', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: targetUserId,
                            messageText: text,
                            senderName: 'Support Team'
                        })
                    }).catch(err => console.error("API Call Failed", err));
                }
            }
        } catch (error) {
            console.error("Failed to trigger notification flow:", error);
        }
    }
};

export const markChatAsRead = async (chatId: string, role: 'user' | 'admin') => {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const updates = role === 'user' ? { unreadCountUser: 0 } : { unreadCountAdmin: 0 };
    await updateDoc(chatRef, updates);
};

export const listenForUnreadForUser = (userId: string, callback: (count: number) => void) => {
    const q = query(
        collection(db, CHATS_COLLECTION),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            totalUnread += (data.unreadCountUser || 0);
        });
        callback(totalUnread);
    });
};

export const listenForAdminUnreadCount = (callback: (count: number) => void) => {
    const q = query(
        collection(db, CHATS_COLLECTION),
        where('unreadCountAdmin', '>', 0)
    );

    return onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            totalUnread += (data.unreadCountAdmin || 0);
        });
        callback(totalUnread);
    });
};

/**
 * Listen for messages in a chat.
 */
export const listenForMessages = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatMessage));
        callback(messages);
    });
};

/**
 * Listen for all chats (for Admin Dashboard).
 */
export const listenForAdminChatList = (callback: (chats: Chat[]) => void) => {
    const q = query(collection(db, CHATS_COLLECTION), orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Chat));
        callback(chats);
    });
};

/**
 * Get all chats (one-off)
 */
export const getAdminChatList = async (): Promise<Chat[]> => {
    const q = query(collection(db, CHATS_COLLECTION), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Chat));
};

/**
 * Helper to delete a collection/query in batches of 400 to match Firebase limits.
 */
async function deleteQueryBatch(db: any, query: any, resolve: any) {
    const snapshot = await getDocs(query);
    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid stack overflows
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

/**
 * Deletes a single chat and all its messages safely.
 */
export const deleteChat = async (chatId: string) => {
    // 1. Delete all messages (subcollection)
    const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);

    // We need to delete all messages. If there are > 500, we need to batch.
    // Simple approach: fetch all and batch delete in chunks.
    const messagesSnapshot = await getDocs(messagesRef);

    // Split into chunks of 400
    const chunks: any[] = [];
    let currentChunk: any[] = [];

    messagesSnapshot.docs.forEach((doc) => {
        currentChunk.push(doc.ref);
        if (currentChunk.length >= 400) {
            chunks.push(currentChunk);
            currentChunk = [];
        }
    });
    if (currentChunk.length > 0) chunks.push(currentChunk);

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((ref: any) => batch.delete(ref));
        await batch.commit();
    }

    // 2. Delete the chat document itself
    await deleteDoc(doc(db, CHATS_COLLECTION, chatId));
};

/**
 * Clears all chats and messages (Admin only).
 */
export const clearAllChats = async () => {
    const chatsQuery = query(collection(db, CHATS_COLLECTION));
    const chatsSnapshot = await getDocs(chatsQuery);

    for (const chatDoc of chatsSnapshot.docs) {
        await deleteChat(chatDoc.id);
    }
};
export const listenForChatMetadata = (chatId: string, callback: (data: any) => void) => {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    return onSnapshot(chatRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        }
    });
};
export const toggleAdminVisibility = async (chatId: string, isVisible: boolean) => {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    await updateDoc(chatRef, { adminVisible: isVisible });
};
