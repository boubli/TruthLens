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
export const startNewChat = async (userId: string, userEmail?: string): Promise<string> => {
    // Check if chat already exists for this user
    const q = query(collection(db, CHATS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    // Create new chat
    const chatData = {
        userId,
        userEmail: userEmail || '',
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
 * Clears all chats and messages (Admin only).
 */
export const clearAllChats = async () => {
    const chatsQuery = query(collection(db, CHATS_COLLECTION));
    const chatsSnapshot = await getDocs(chatsQuery);

    for (const chatDoc of chatsSnapshot.docs) {
        const messagesQuery = query(collection(db, CHATS_COLLECTION, chatDoc.id, MESSAGES_SUBCOLLECTION));
        const messagesSnapshot = await getDocs(messagesQuery);

        const batch = writeBatch(db);
        let count = 0;

        messagesSnapshot.docs.forEach((msgDoc) => {
            batch.delete(msgDoc.ref);
            count++;
        });

        // Delete chat doc
        batch.delete(chatDoc.ref);
        count++;

        await batch.commit();
    }
};
