'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        // Capture the event
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

        // Also check if we should show iOS instructions
        if (isIosDevice) {
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
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-[9999] md:hidden"
                >
                    <div className="bg-black/90 backdrop-blur-md border border-gray-800 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
                        <div className="bg-yellow-500 rounded-xl p-2 shrink-0">
                            <Download className="w-6 h-6 text-black" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-sm">Install TruthLens</h3>
                            <p className="text-xs text-gray-400 truncate">Get the full app experience</p>
                        </div>

                        {isIOS ? (
                            <div className="text-xs text-gray-400 pr-2">
                                Tap share <span className='text-lg'>⎋</span> then "Add to Home Screen"
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="bg-yellow-500 text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 active:scale-95 transition"
                            >
                                Install
                            </button>
                        )}

                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1 -mr-2 text-gray-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
