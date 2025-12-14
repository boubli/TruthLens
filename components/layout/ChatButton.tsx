'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const ChatButton = () => {
    const pathname = usePathname();

    // Hide if already on chat page or admin pages
    if (pathname === '/chat' || pathname.startsWith('/admin')) return null;

    return (
        <Link
            href="/support"
            className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 transistion-all duration-300 z-50 group"
        >
            <MessageCircle size={28} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Support Chat
            </span>
        </Link>
    );
};

export default ChatButton;
