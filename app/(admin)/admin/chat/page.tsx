'use client';

import React, { useEffect, useState } from 'react';
import { listenForAdminChatList, clearAllChats, deleteChat } from '@/services/supportService';
import AdminChatWindow from '@/components/admin/AdminChatWindow';
import UserAvatarWithStatus from '@/components/admin/UserAvatarWithStatus';
import { useAuth } from '@/context/AuthContext';
import { Chat } from '@/types/chat';
import { Trash2, Search, Filter, MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, useTheme, alpha } from '@mui/material';

export default function AdminChatPage() {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isClearing, setIsClearing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsubscribe = listenForAdminChatList((newChats) => {
            setChats(newChats);
        });
        return () => unsubscribe();
    }, []);

    const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this conversation?")) return;

        try {
            if (selectedChatId === chatId) setSelectedChatId(null);
            await deleteChat(chatId);
        } catch (error) {
            console.error("Failed to delete chat:", error);
            alert("Failed to delete chat.");
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to DELETE ALL chats and messages? This cannot be undone.")) return;

        setIsClearing(true);
        try {
            await clearAllChats();
            setSelectedChatId(null);
        } catch (error) {
            console.error("Failed to clear chats:", error);
            alert("Failed to clear chats.");
        } finally {
            setIsClearing(false);
        }
    };

    const selectedChat = chats.find(c => c.id === selectedChatId);

    if (!user) return null;

    const theme = useTheme();

    // View A: The Chat List
    const ChatListView = (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider'
        }}>
            {/* Header - Search Only (Title Removed) */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-all font-medium text-sm"
                        style={{ color: theme.palette.text.primary }}
                    />
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Recent Chats</span>
                    <button
                        onClick={handleClearAll}
                        disabled={isClearing}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full transition-all"
                        title="Clear History"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </Box>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {chats.filter(c =>
                    (c.userName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (c.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    c.id.includes(searchQuery)
                ).length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                        <p>No conversations found</p>
                    </div>
                ) : (
                    chats
                        .filter(c =>
                            (c.userName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (c.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            c.id.includes(searchQuery)
                        )
                        .map(chat => (
                            <motion.div
                                key={chat.id}
                                role="button"
                                tabIndex={0}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedChatId(chat.id)}
                                onKeyDown={(e) => e.key === 'Enter' && setSelectedChatId(chat.id)}
                                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group cursor-pointer relative`}
                                style={{
                                    backgroundColor: selectedChatId === chat.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                }}
                            >
                                <UserAvatarWithStatus
                                    userId={chat.userId}
                                    name={chat.userName || ''}
                                    email={chat.userEmail}
                                    isSelected={selectedChatId === chat.id}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="font-semibold truncate" style={{ color: theme.palette.text.primary }}>
                                            {chat.userName || chat.userEmail || "Anonymous User"}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {chat.updatedAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs truncate" style={{ color: theme.palette.text.secondary }}>
                                        {chat.lastMessage?.text || "Started a new conversation"}
                                    </p>
                                </div>

                                {/* Delete Hover Action */}
                                <button
                                    onClick={(e) => handleDeleteChat(chat.id, e)}
                                    className="absolute right-2 top-2 p-1.5 hover:bg-red-500 hover:text-white text-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))
                )}
            </div>
        </Box>
    );

    return (
        // Full screen negative margin container to override AdminLayout padding
        <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            // Calculate height to fill remaining screen exactly (100vh - AppBar height)
            height: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 72px)' },
            // Negative margins to stretch to edges
            mx: { xs: -2.5, sm: -4, md: -5 },
            my: { xs: -2.5, sm: -4, md: -5 },
            width: { xs: 'calc(100% + 20px)', sm: 'calc(100% + 32px)', md: 'calc(100% + 40px)' },
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden'
        }}>
            {/* Desktop: Sidebar (List) */}
            <Box sx={{
                width: { md: 320, lg: 360 },
                display: { xs: selectedChatId ? 'none' : 'block', md: 'block' },
                borderRight: 1,
                borderColor: 'divider',
                height: '100%'
            }}>
                {ChatListView}
            </Box>

            {/* Desktop & Mobile: Main Content (Conversation) */}
            <div className={`
                ${selectedChatId ? 'block' : 'hidden md:flex'} 
                flex-1 bg-white relative
            `}>
                <AnimatePresence mode="wait">
                    {selectedChatId ? (
                        <motion.div
                            key="window"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full w-full"
                        >
                            <AdminChatWindow
                                chatId={selectedChatId}
                                currentUserId={user.uid}
                                chatPartnerEmail={selectedChat?.userEmail || 'User'}
                                chatPartnerName={selectedChat?.userName || selectedChat?.userEmail || 'User'} // Add this prop
                                onBack={() => setSelectedChatId(null)}
                            />
                        </motion.div>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center w-full h-full text-center p-8 bg-gray-50/50">
                            <div className="w-64 h-64 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center">
                                    <MessageSquare size={80} className="text-blue-500 opacity-50" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Conversation</h2>
                            <p className="text-gray-500 max-w-sm">
                                Choose a chat from the sidebar to start messaging your users.
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </Box>
    );
}

