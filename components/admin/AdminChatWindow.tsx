'use client';

import React, { useState, useEffect, useRef } from 'react';
import { listenForMessages, sendMessage, markChatAsRead, toggleAdminVisibility } from '@/services/supportService';
import { ChatMessage } from '@/types/chat';
import { Send, MoreVertical, ChevronDown, Paperclip, Smile } from 'lucide-react';
import { Box, Switch, Typography } from '@mui/material'; // Keeping imports clean, although using Tailwind mainly
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@mui/material';

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
    const [adminVisible, setAdminVisible] = useState(false); // New State
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [partnerStatus, setPartnerStatus] = useState<'online' | 'offline'>('offline');
    const [lastSeen, setLastSeen] = useState<Date | null>(null);

    // Fetch Chat Data to get User ID for Presence Check
    const [targetUserId, setTargetUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!chatId) return;

        // Mark as read for admin
        markChatAsRead(chatId, 'admin');

        // Listen for messages
        const unsubscribeMessages = listenForMessages(chatId, (msgs) => {
            setMessages(msgs);
            markChatAsRead(chatId, 'admin');
        });

        // Listen for chat metadata AND User Presence
        const unsubscribeChat = onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserUnreadCount(data.unreadCountUser);
                setAdminVisible(data.adminVisible || false); // Update state
                if (data.userId) setTargetUserId(data.userId);
            }
        });

        return () => {
            unsubscribeMessages();
            unsubscribeChat();
        };
    }, [chatId]);

    const handleToggleVisibility = async (checked: boolean) => {
        setAdminVisible(checked); // Optimistic update
        await toggleAdminVisibility(chatId, checked);
    };

    // Listen for Realtime User Presence
    useEffect(() => {
        if (!targetUserId) return;

        const unsubscribeUser = onSnapshot(doc(db, 'users', targetUserId), (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const now = new Date();
                const lastSeenDate = userData.lastSeen?.toDate ? userData.lastSeen.toDate() : null;
                setLastSeen(lastSeenDate);

                // Deterministic Online Check:
                // 1. status === 'online' (from visibility API)
                // 2. lastSeen < 60 seconds ago (Heartbeat check)
                const isHeartbeatAlive = lastSeenDate && (now.getTime() - lastSeenDate.getTime() < 60000);

                if (userData.status === 'online' && isHeartbeatAlive) {
                    setPartnerStatus('online');
                } else {
                    setPartnerStatus('offline');
                }
            }
        });

        return () => unsubscribeUser();
    }, [targetUserId]);

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

    const theme = useTheme();

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: 'background.default',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <div className="flex items-center gap-3">
                    {/* Mobile Back Button */}
                    <button
                        onClick={onBack}
                        className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>

                    <div className="relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ backgroundColor: theme.palette.action.hover }}>
                            <span style={{ color: theme.palette.text.primary }}>
                                {(chatPartnerName || chatPartnerEmail || 'U')[0]?.toUpperCase()}
                            </span>
                        </div>
                        {/* Real Status Indicator */}
                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${partnerStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm md:text-base leading-tight" style={{ color: theme.palette.text.primary }}>
                            {chatPartnerName || chatPartnerEmail || 'User'}
                        </h3>
                        <p className="text-xs" style={{ color: partnerStatus === 'online' ? theme.palette.success.main : theme.palette.text.secondary }}>
                            {partnerStatus === 'online' ? 'Online' : lastSeen ? `Last seen ${lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}
                        </p>
                    </div>
                </div>

                {/* Visibility Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: adminVisible ? 'success.main' : 'text.disabled', fontWeight: 500 }}>
                        {adminVisible ? 'Visible' : 'Hidden'}
                    </Typography>
                    <Switch
                        checked={adminVisible}
                        onChange={(e) => handleToggleVisibility(e.target.checked)}
                        size="small"
                        color="success"
                    />
                </Box>
            </Box>


            {/* Messages Area */}
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}>
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
                                <Box
                                    sx={{
                                        maxWidth: '80%',
                                        px: 2,
                                        py: 1.5,
                                        fontSize: '0.875rem',
                                        boxShadow: 1,
                                        borderRadius: 2,
                                        borderBottomRightRadius: isMe ? 4 : 16,
                                        borderBottomLeftRadius: isMe ? 16 : 4,
                                        bgcolor: isMe ? 'primary.main' : 'background.paper',
                                        color: isMe ? 'primary.contrastText' : 'text.primary',
                                        border: isMe ? 'none' : '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    {msg.text}
                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'opacity-70' : 'text-gray-400'}`}>
                                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </Box>
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
            </Box>

            {/* Input Area */}
            <Box
                component="form"
                onSubmit={handleSend}
                sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                }}
            >
                <div className="flex gap-2 relative">
                    <button type="button" className="text-gray-400 hover:text-blue-500 transition-colors"><Paperclip size={20} /></button>
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`transition-colors ${showEmojiPicker ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                    >
                        <Smile size={20} />
                    </button>

                    {/* Simple Custom Emoji Picker */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-10 left-0 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl p-2 grid grid-cols-4 gap-2 w-48 z-50">
                            {EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => addEmoji(emoji)}
                                    className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
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
                    className="flex-1 py-2 px-0 bg-transparent focus:outline-none placeholder-gray-400"
                    style={{ color: theme.palette.text.primary }}
                />

                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
                >
                    <Send size={18} />
                </button>
            </Box>
        </Box>
    );
};

export default AdminChatWindow;
