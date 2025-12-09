'use client';

import React, { useState, useEffect, useRef } from 'react';
import { listenForMessages, sendMessage, markChatAsRead } from '@/services/supportService';
import { ChatMessage } from '@/types/chat';
import { Send } from 'lucide-react';

interface ChatWindowProps {
    chatId: string;
    currentUserId: string;
    role: 'user' | 'admin';
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, currentUserId, role }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatId) return;

        // Mark as read immediately when opening
        markChatAsRead(chatId, role);

        const unsubscribe = listenForMessages(chatId, (msgs) => {
            setMessages(msgs);
            // Mark as read when new messages arrive if window is open
            markChatAsRead(chatId, role);
        });

        return () => unsubscribe();
    }, [chatId, role]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessage(chatId, currentUserId, newMessage, role);
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto rounded-3xl border border-white/10 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                    {role === 'admin' ? 'Support Chat' : 'Chat with Support'}
                </h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white/10 text-gray-200 border border-white/10 rounded-bl-none'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2 bg-white/5">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-xl bg-transparent border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/30 transition-all hover:bg-white/5"
                />
                <button
                    type="submit"
                    className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg active:scale-95 flex items-center justify-center"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
