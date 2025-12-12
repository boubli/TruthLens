'use client';

import React, { useState, useEffect, useRef } from 'react';
import { listenForMessages, sendMessage, markChatAsRead, listenForChatMetadata } from '@/services/supportService';
import { ChatMessage } from '@/types/chat';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatWindowProps {
    chatId: string;
    currentUserId: string;
    role: 'user' | 'admin';
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, currentUserId, role }) => {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);

    const [adminVisible, setAdminVisible] = useState(false);

    useEffect(() => {
        if (!chatId) return;

        // Mark as read immediately when opening
        markChatAsRead(chatId, role);

        // Listen for messages
        const unsubscribeMessages = listenForMessages(chatId, (msgs) => {
            setMessages(msgs);
            markChatAsRead(chatId, role);
        });

        // Listen for chat metadata (for admin visibility)
        const unsubscribeMetadata = listenForChatMetadata(chatId, (data) => {
            if (role === 'user') {
                setAdminVisible(data.adminVisible || false);
            }
        });

        return () => {
            unsubscribeMessages();
            unsubscribeMetadata();
        };
    }, [chatId, role]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await sendMessage(chatId, currentUserId, newMessage, role);
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0A0A0A]">
            {/* Header - Fixed & Glassy */}
            <div className="flex items-center justify-between px-4 py-4 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-[#6C63FF]"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex flex-col">
                        <h3 className="font-semibold text-white text-lg leading-tight">
                            {role === 'admin' ? 'Support Chat' : 'Customer Support'}
                        </h3>
                        {/* Only show "Online" if admin has enabled visibility for this user */}
                        {role === 'user' && adminVisible && (
                            <span className="text-xs text-green-400 font-medium animate-pulse">Online</span>
                        )}
                        {role === 'user' && !adminVisible && (
                            <span className="text-xs text-gray-500 font-medium">Offline</span>
                        )}
                        {role === 'admin' && (
                            <span className="text-xs text-gray-400 font-medium">Admin View</span>
                        )}
                    </div>
                </div>
                {/* Optional Menu Icon for future actions */}
                <button className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                        <div className="w-16 h-16 bg-[#1F1F1F] rounded-full flex items-center justify-center mb-4">
                            <Send className="text-[#6C63FF]" size={24} />
                        </div>
                        <p className="text-gray-400 text-sm">Send a message to start chatting</p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUserId;
                    const showTime = index === 0 ||
                        (messages[index - 1] && (msg.createdAt?.toMillis() - messages[index - 1].createdAt?.toMillis() > 300000)); // 5 mins

                    return (
                        <div key={msg.id} className="w-full flex flex-col">
                            {showTime && msg.createdAt && (
                                <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider mb-4 font-medium">
                                    {msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}

                            <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`relative max-w-[75%] px-5 py-3 text-[15px] leading-relaxed break-words shadow-sm transition-all ${isMe
                                        ? 'bg-[#6C63FF] text-white rounded-[22px] rounded-br-[4px]'
                                        : 'bg-[#1F1F1F] text-gray-100/90 rounded-[22px] rounded-bl-[4px]'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#0A0A0A] border-t border-white/5 pb-6">
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 bg-[#1F1F1F] rounded-[26px] pl-5 pr-2 py-2 border border-white/5 focus-within:border-[#6C63FF]/50 transition-colors"
                >
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="iMessage..."
                        className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder-gray-500 text-[16px]" // 16px prevents iOS zoom
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className={`p-2 rounded-full transition-all duration-200 ${newMessage.trim()
                            ? 'bg-[#6C63FF] text-white scale-100'
                            : 'bg-transparent text-gray-500 scale-90'
                            }`}
                    >
                        <Send size={20} fill={newMessage.trim() ? "currentColor" : "none"} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
