'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Robust iOS/iPadOS detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+
        setIsIOS(isIosDevice);

        // Capture the event (Android/Desktop Chrome)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Check if already installed
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
            if (!isInstalled) {
                // Show prompt after a delay
                setTimeout(() => setIsVisible(true), 3000);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // iOS Logic
        if (isIosDevice) {
            // Check if installed (standalone mode)
            const isInstalled = (window.navigator as any).standalone === true;
            if (!isInstalled) {
                setTimeout(() => setIsVisible(true), 3000);
            }
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 150, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 150, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-6 left-4 right-4 z-[9999] md:left-auto md:right-6 md:w-96"
                >
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-start gap-4 backdrop-blur-xl">
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-3 shrink-0 shadow-lg">
                            <Download className="w-6 h-6 text-black" />
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                            <h3 className="font-bold text-white text-base">Install TruthLens</h3>
                            <p className="text-sm text-gray-400 mt-0.5 leading-snug">
                                {isIOS
                                    ? "Install specifically for iOS/iPad for the best experience."
                                    : "Add to your home screen for instant access."}
                            </p>

                            {isIOS ? (
                                <div className="mt-3 text-sm text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        1. Tap the <span className='mx-1 bg-white/20 p-1 rounded'><ShareIcon className="w-3 h-3 inline" /> Share</span> button
                                    </div>
                                    <div className="flex items-center gap-2">
                                        2. Select <span className='font-bold text-white'>Add to Home Screen</span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleInstallClick}
                                    className="mt-3 w-full bg-yellow-500 text-black text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-yellow-400 active:scale-95 transition-all shadow-md"
                                >
                                    Install App
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-2 -mr-2 -mt-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Simple Share Icon for iOS instructions
const ShareIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
);
