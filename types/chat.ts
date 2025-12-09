import { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderRole: 'user' | 'admin';
    createdAt: Timestamp;
}

export interface Chat {
    id: string;
    userId: string;
    adminId?: string;
    lastMessage?: {
        text: string;
        createdAt: Timestamp;
        senderRole: 'user' | 'admin';
    };
    updatedAt: Timestamp;
    unreadCountUser: number;
    unreadCountAdmin: number;
    lastReadBy?: {
        [userId: string]: Timestamp;
    };
    userEmail?: string;
}
