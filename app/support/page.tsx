'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { startNewChat } from '@/services/supportService';
import ChatWindow from '@/components/features/support/ChatWindow';

export default function UserChatPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [chatId, setChatId] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && !chatId && !initializing) {
            const initChat = async () => {
                setInitializing(true);
                try {
                    const id = await startNewChat(user.uid, user.email || 'Anonymous', user.displayName || 'User');
                    setChatId(id);
                } catch (error) {
                    console.error("Failed to start chat:", error);
                } finally {
                    setInitializing(false);
                }
            };
            initChat();
        }
    }, [user, chatId, initializing]);

    if (loading || !user || !chatId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
                    Customer Support
                </h1>
                <ChatWindow chatId={chatId} currentUserId={user.uid} role="user" />
            </div>
        </div>
    );
}
