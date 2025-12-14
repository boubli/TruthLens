'use client';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Camera, Lock } from 'lucide-react';

export default function QuickActionSearchButton() {
    const { isPro, userProfile } = useAuth();

    const hasAccess = isPro || userProfile?.hasBetaAccess;

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700 opacity-70">
                <div className="relative mb-2">
                    <div className="p-3 bg-gray-200 dark:bg-zinc-700 rounded-full">
                        <Camera className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-amber-500 p-1 rounded-full shadow-sm">
                        <Lock className="w-3 h-3 text-white" />
                    </div>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Search by Photo</span>
                <Link
                    href="/pricing"
                    className="mt-2 text-xs text-amber-600 dark:text-amber-500 font-semibold hover:underline"
                >
                    Upgrade to Unlock
                </Link>
            </div>
        );
    }

    return (
        <Link
            href="/search/photo"
            className="group flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500/50 transition-all active:scale-95"
        >
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Camera className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Search by Photo</span>
        </Link>
    );
}
