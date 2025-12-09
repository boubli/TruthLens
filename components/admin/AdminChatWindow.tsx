'use client';

import React, { useState, useEffect, useRef } from 'react';
import { listenForMessages, sendMessage, markChatAsRead } from '@/services/supportService';
import { ChatMessage } from '@/types/chat';
import { Send, MoreVertical, ChevronDown, Paperclip, Smile } from 'lucide-react';
import { Box } from '@mui/material'; // Keeping imports clean, although using Tailwind mainly
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminChatWindowProps {
    chatId: string;
    currentUserId: string;
    chatPartnerEmail?: string; // To show in header if name missing
    chatPartnerName?: string;
    onBack: () => void; // For mobile back
}

const EMOJIS = ['👍', '👋', '🎉', '😊', '😂', '❤️', '🔥', '🤔', '👀', '✅', '🙏', '🚀'];

const AdminChatWindow: React.FC<AdminChatWindowProps> = ({ chatId, currentUserId, chatPartnerEmail, chatPartnerName, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [userUnreadCount, setUserUnreadCount] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatId) return;

        // Mark as read for admin
        markChatAsRead(chatId, 'admin');

        // Listen for messages
        const unsubscribeMessages = listenForMessages(chatId, (msgs) => {
            setMessages(msgs);
            markChatAsRead(chatId, 'admin');
        });

        // Listen for chat metadata (to check if user has read messages)
        const unsubscribeChat = onSnapshot(doc(db, 'chats', chatId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setUserUnreadCount(data.unreadCountUser);
            }
        });

        return () => {
            unsubscribeMessages();
            unsubscribeChat();
        };
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await sendMessage(chatId, currentUserId, newMessage, 'admin');
            setNewMessage('');
            setShowEmojiPicker(false);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const addEmoji = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Header - Tidio Style */}
            <div className="bg-gradient-to-r from-[#007bff] to-[#00c6ff] p-4 text-white relative">
                <div className="flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-3">
                        {/* Mobile Back Button */}
                        <button
                            onClick={onBack}
                            className="md:hidden text-white/80 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>

                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold border-2 border-white/30">
                                {(chatPartnerName || chatPartnerEmail || 'U')[0]?.toUpperCase()}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#007bff] rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm md:text-base leading-tight">
                                {chatPartnerName || chatPartnerEmail || 'User'}
                            </h3>
                            <p className="text-xs text-blue-100/90">We are online!</p>
                        </div>
                    </div>
                </div>
                {/* Wave Shape at bottom - using CSS clip-path or simple absolute SVG */}
                <div className="absolute -bottom-1 left-0 w-full h-4 bg-white" style={{ clipPath: 'ellipse(50% 100% at 50% 100%)', display: 'none' }}></div>
                {/* CSS Curve hack or SVG... keeping it simple clean line for now or SVG if possible */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                    <svg className="relative block w-[calc(110%+1.3px)] h-[20px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white opacity-20 hidden"></path>
                    </svg>
                </div>
            </div>
            {/* Curved separator */}
            <div className="h-6 bg-gradient-to-r from-[#007bff] to-[#00c6ff] rounded-b-[50px] mb-[-10px] z-0"></div>


            {/* Messages Area - Light Grey Background */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 z-10 pt-6">
                {/* Greeting Placeholder */}
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm my-4">
                        This is the beginning of the conversation.
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUserId; // Current User is Admin
                    const isLastMessage = index === messages.length - 1;

                    return (
                        <div key={msg.id} className="flex flex-col">
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                                <div
                                    className={`max-w-[80%] px-5 py-3 text-sm shadow-sm relative ${isMe
                                        ? 'bg-[#007bff] text-white rounded-2xl rounded-br-sm'
                                        : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'
                                        }`}
                                >
                                    {msg.text}
                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </div>
                            </div>

                            {/* Seen Indicator */}
                            {isLastMessage && isMe && userUnreadCount === 0 && (
                                <div className="flex justify-end pr-1">
                                    <span className="text-[10px] text-gray-400 font-medium">Seen</span>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - White with floating button */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 relative">
                <div className="flex gap-2 text-gray-400 relative">
                    <button type="button" className="hover:text-[#007bff] transition-colors"><Paperclip size={20} /></button>
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`hover:text-[#007bff] transition-colors ${showEmojiPicker ? 'text-[#007bff]' : ''}`}
                    >
                        <Smile size={20} />
                    </button>

                    {/* Simple Custom Emoji Picker */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-10 left-0 bg-white shadow-xl border border-gray-100 rounded-xl p-2 grid grid-cols-4 gap-2 w-48 z-50">
                            {EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => addEmoji(emoji)}
                                    className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter your message..."
                    className="flex-1 py-3 px-2 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                />

                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3.5 rounded-full bg-gradient-to-r from-[#007bff] to-[#00c6ff] text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                    <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                </button>
            </form>
        </div>
    );
};

export default AdminChatWindow;
