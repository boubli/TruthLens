'use client';

import React, { useEffect, useState } from 'react';
import { listenForAdminChatList, clearAllChats, deleteChat } from '@/services/supportService';
import AdminChatWindow from '@/components/admin/AdminChatWindow';
import UserAvatarWithStatus from '@/components/admin/UserAvatarWithStatus';
import { useAuth } from '@/context/AuthContext';
import { Chat } from '@/types/chat';
import { Trash2, Search, Filter, MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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

    // View A: The Chat List
    const ChatListView = (
        <div className="flex flex-col h-full bg-[#f5f7f9]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#007bff] to-[#00c6ff] p-6 pb-12 rounded-b-[2.5rem] shadow-lg mb-[-2rem] z-10 relative">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white tracking-wide">Messages</h1>
                    <button
                        onClick={handleClearAll}
                        disabled={isClearing}
                        className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
                        title="Clear History"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/20 backdrop-blur-md text-white placeholder-blue-100 border border-white/30 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:bg-white/30 transition-all font-medium"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pt-10 px-4 space-y-3 z-0">
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
                            <motion.button
                                key={chat.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedChatId(chat.id)}
                                className={`w-full text-left p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-4 group ${selectedChatId === chat.id
                                    ? 'bg-white border-blue-400 shadow-blue-100'
                                    : 'bg-white border-transparent hover:border-gray-200'
                                    }`}
                            >
                                <UserAvatarWithStatus
                                    userId={chat.userId}
                                    name={chat.userName || ''}
                                    email={chat.userEmail}
                                    isSelected={selectedChatId === chat.id}
                                />

                                {/* Delete Button - Visible on Group Hover */}
                                <button
                                    onClick={(e) => handleDeleteChat(chat.id, e)}
                                    className="absolute right-2 top-2 p-2 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                                    title="Delete Conversation"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={`font-bold truncate ${selectedChatId === chat.id ? 'text-blue-900' : 'text-gray-800'}`}>
                                            {chat.userName || chat.userEmail || "Anonymous User"}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {chat.updatedAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${selectedChatId === chat.id ? 'text-blue-600/80' : 'text-gray-500'}`}>
                                        {chat.lastMessage?.text || "Started a new conversation"}
                                    </p>
                                </div>
                            </motion.button>
                        ))
                )}
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-[#f5f7f9] rounded-3xl overflow-hidden shadow-2xl max-w-[1600px] mx-auto">
            {/* Desktop: Sidebar (List) */}
            <div className={`
                ${selectedChatId ? 'hidden md:block' : 'block'} 
                w-full md:w-[350px] lg:w-[400px] border-r border-gray-100 bg-[#f5f7f9]
            `}>
                {ChatListView}
            </div>

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
        </div>
    );
}

