'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Camera, Lock } from 'lucide-react';
import ImageProductSearcher from '@/components/search/ImageProductSearcher';
import QuickActionHistory from '@/components/search/QuickActionHistory';
import Link from 'next/link';

export default function SearchByPhotoPage() {
    const router = useRouter();
    const { features, userProfile, loading } = useAuth();

    // Eligibility Check - Use tier-based feature flag
    const hasAccess = features.visualSearch || userProfile?.hasBetaAccess;

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>;
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden text-center p-8">
                    <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Feature</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Search by Photo is available exclusively for Pro and Ultimate members.
                    </p>
                    <Link
                        href="/pricing"
                        className="block w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors"
                    >
                        Upgrade to Unlock
                    </Link>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4 flex items-center sticky top-0 z-30">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="ml-3 flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-md">
                        <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="font-semibold text-gray-900 dark:text-white">Search by Photo</h1>
                </div>
            </div>

            <main className="flex-1 p-4 max-w-md w-full mx-auto space-y-6">

                {/* Search Area */}
                <section>
                    <ImageProductSearcher />
                    <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                        Take a clear photo of a product or upload an image.
                        We'll look for barcodes first, then perform a visual search.
                    </p>
                </section>

                {/* History Section */}
                <section>
                    <QuickActionHistory />
                </section>

            </main>
        </div>
    );
}
