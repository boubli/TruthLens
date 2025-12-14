'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Clock, Search, Barcode, Image as ImageIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SearchHistoryItem {
    id: string;
    userId: string;
    timestamp: any; // Firestore Timestamp
    searchType: 'Barcode_Scan' | 'Visual_Search';
    searchQuery?: string;
    productId?: string;
    imageUrl?: string; // Optional, if we store the image URL or thumbnail
}

export default function QuickActionHistory() {
    const { user } = useAuth();
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const historyRef = collection(db, 'search_history');
                const q = query(
                    historyRef,
                    where("userId", "==", user.uid),
                    orderBy("timestamp", "desc"),
                    limit(10)
                );

                const querySnapshot = await getDocs(q);
                const items: SearchHistoryItem[] = [];
                querySnapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() } as SearchHistoryItem);
                });
                setHistory(items);
            } catch (error) {
                console.error("Error fetching search history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    if (!user) return null;

    if (loading) {
        return <div className="p-4 text-center text-gray-500 animate-pulse">Loading history...</div>;
    }

    if (history.length === 0) {
        return (
            <div className="p-6 text-center text-gray-400 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent search history</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Searches
            </h3>
            <div className="space-y-2">
                {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500 dark:text-gray-400">
                                {item.searchType === 'Barcode_Scan' ? <Barcode className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate max-w-[150px] sm:max-w-[200px]">
                                    {item.searchQuery || item.productId || 'Unknown Item'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Just now'}
                                </span>
                            </div>
                        </div>
                        {item.productId && (
                            <Link
                                href={`/product/${item.productId}`}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-all"
                                title="View Product"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
