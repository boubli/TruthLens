'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { Play, Volume2, ShieldCheck, Terminal } from 'lucide-react';

const TARGET_EMAIL = 'youssefboubli71@gmail.com';
const TOTAL_DURATION = 50000; // 50s failsafe check

const LETTER_TEXT = "Mer7ba bik a Titim ❤️ ... Bghit nakhod had lweqt sghir bash n-goul lik thanks ... Nti machi ghir 'First User', nti awel wa7ed knt baghito ychouf had l-khdma ... Had l'project bditou b bzaf dyal l'efforts ... Walakin l fact annaki nti hna bash tjarbih ... 3ndu m3na special bzaf 3ndi ... Ntmna ikon 3jbk l'experience kima 3jbni nswabha lik ... Welcome to TruthLens DEAD ENGINE.";

export default function SpecialWelcome() {
    const { user, loading } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [stage, setStage] = useState<'idle' | 'boot' | 'drop' | 'letter'>('idle');
    const [bootLines, setBootLines] = useState<string[]>([]);
    const [displayedText, setDisplayedText] = useState('');
    const [showButton, setShowButton] = useState(false);

    // Refs for audio and confetti dimensions
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Initial checks
        if (loading) return;

        const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('hasSeenWelcome') : false;

        if (user?.email === TARGET_EMAIL && !hasSeen) {
            setIsVisible(true);
            startSequence();
        }
    }, [user, loading]);

    useEffect(() => {
        // Window size for confetti
        if (typeof window !== 'undefined') {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    const startSequence = async () => {
        // 0s-7s: Hacker Intro
        setStage('boot');
        const lines = [
            '> SYSTEM BOOT INITIALIZED...',
            '> CONNECTING TO SECURE SERVER...',
            '> BYPASSING FIREWALL (LAYER 7)...',
            '> DECRYPTING USER DATA...',
            '> ...',
            '> ...',
            '> TARGET IDENTIFIED: VIP_USER_001',
            '> ACCESS GRANTED.'
        ];

        // Typewriter logic for boot lines
        for (let i = 0; i < lines.length; i++) {
            await new Promise(r => setTimeout(r, 800)); // Stagger lines
            setBootLines(prev => [...prev, lines[i]]);
        }

        // Wait until 7s mark exactly
        await new Promise(r => setTimeout(r, 7000 - (lines.length * 800)));

        // 7s: The Drop
        setStage('drop');
        if (audioRef.current) {
            audioRef.current.volume = 0;
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
            // Fade in volume
            const fadeAudio = setInterval(() => {
                if (audioRef.current && audioRef.current.volume < 1) {
                    audioRef.current.volume = Math.min(1, audioRef.current.volume + 0.1);
                } else {
                    clearInterval(fadeAudio);
                }
            }, 200);
        }

        // 12s: The Letter (5s after drop starts)
        setTimeout(() => {
            setStage('letter');
            startLetterTypewriter();
        }, 5000);
    };

    const startLetterTypewriter = async () => {
        const words = LETTER_TEXT.split(' ');

        // We have roughly 33 seconds (45s - 12s) to read the text.
        // Total words ~50. Roughly 0.6s per word.

        for (let i = 0; i < words.length; i++) {
            setDisplayedText(prev => prev + (i === 0 ? '' : ' ') + words[i]);
            // Vary speed slightly for natural feel
            const speed = 500 + Math.random() * 200;
            await new Promise(r => setTimeout(r, speed));
        }

        // 45s+: Show Button (Ensure it shows even if typing finishes early)
        // Calculating remaining time to hit 45s mark since start of sequence could be complex, 
        // relying on the typing duration is accurately synced is safer or a separate timeout.
        // Since we want strict 45s+, let's set a timeout from the start of the 'letter' phase.
    };

    // Strict timing for button appearance relative to sequence start
    useEffect(() => {
        if (stage === 'idle') return;

        // 45s from start (which is boot start). 
        // Boot = 0s. Drop = 7s. Letter = 12s. Button = 45s.
        // So 38s after drop starts, or 33s after letter starts.

        const timer = setTimeout(() => {
            setShowButton(true);
        }, 45000);

        return () => clearTimeout(timer);
    }, [stage]);


    const handleEnterApp = () => {
        sessionStorage.setItem('hasSeenWelcome', 'true');
        // Fade out audio
        if (audioRef.current) {
            const fadeOut = setInterval(() => {
                if (audioRef.current && audioRef.current.volume > 0) {
                    audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.1);
                } else {
                    clearInterval(fadeOut);
                    audioRef.current?.pause();
                }
            }, 200);
        }
        setIsVisible(false);
    };

    // Auto-enter when music ends
    const handleAudioEnded = () => {
        handleEnterApp();
    };

    if (!isVisible) return null;

    // Creative "TITIM" Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const letterVariants = {
        hidden: { y: 100, opacity: 0, rotate: -20, scale: 0.5 },
        visible: {
            y: 0,
            opacity: 1,
            rotate: 0,
            scale: 1,
            transition: {
                type: "spring" as const,
                damping: 10,
                stiffness: 100
            }
        }
    };

    const crownVariants = {
        hidden: { y: -50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { delay: 1.5, type: 'spring' as const, bounce: 0.5 }
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.5 } }}
                    className="fixed inset-0 z-[9999] bg-black text-white overflow-hidden flex flex-col items-center justify-center p-4"
                >
                    {/* Audio Element with Auto-Redirect */}
                    <audio
                        ref={audioRef}
                        src="/special-song.mp3"
                        preload="auto"
                        onEnded={handleAudioEnded}
                    />

                    {/* CONFETTI */}
                    {(stage === 'drop' || stage === 'letter') && (
                        <div className="absolute inset-0 pointer-events-none z-0">
                            <Confetti
                                width={windowSize.width}
                                height={windowSize.height}
                                numberOfPieces={300}
                                gravity={0.12} // Slower gravity for floats
                                colors={['#FFD700', '#FFA500', '#ffffff', '#E5E4E2']}
                            />
                        </div>
                    )}

                    {/* STAGE 1: HACKER BOOT SCREEN (Mobile Optimized) */}
                    {stage === 'boot' && (
                        <div className="w-full max-w-lg font-mono text-sm md:text-base p-4 bg-black/80 border border-green-900 rounded shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                            {bootLines.map((line, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-1 break-words whitespace-pre-wrap"
                                >
                                    <span className="text-green-500 mr-2 opacity-70">➜</span>
                                    <span className={line.includes('ACCESS GRANTED') ? 'text-green-400 font-bold' : 'text-green-700'}>
                                        {line}
                                    </span>
                                </motion.div>
                            ))}
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="inline-block w-2 h-4 bg-green-500 ml-1 translate-y-0.5"
                            />
                        </div>
                    )}

                    {/* STAGE 2: THE DROP (TITIM) */}
                    {stage !== 'boot' && (
                        <div className="absolute top-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
                            {/* TITIM Container */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="relative flex items-center justify-center gap-1 md:gap-4 z-20 mb-[30vh]" // Moved up
                            >
                                {/* Left Crown */}
                                <motion.div variants={crownVariants} className="text-4xl md:text-7xl absolute -left-8 md:-left-20 -top-8 md:-top-12 -rotate-12">
                                    👑
                                </motion.div>

                                {/* LETTERS */}
                                {['T', 'I', 'T', 'I', 'M'].map((char, index) => (
                                    <motion.span
                                        key={index}
                                        variants={letterVariants}
                                        className="text-7xl min-[400px]:text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]"
                                        style={{ fontFamily: 'Impact, sans-serif' }} // Bold impactful font
                                    >
                                        {char}
                                    </motion.span>
                                ))}

                                {/* Right Crown */}
                                <motion.div variants={crownVariants} className="text-4xl md:text-7xl absolute -right-8 md:-right-20 -top-8 md:-top-12 rotate-12">
                                    👑
                                </motion.div>
                            </motion.div>
                        </div>
                    )}

                    {/* STAGE 3: THE LETTER (Mobile Optimized Card) */}
                    <AnimatePresence>
                        {stage === 'letter' && (
                            <motion.div
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="absolute bottom-0 w-full z-30 flex justify-center pb-6 md:pb-12 px-4"
                            >
                                <div className="w-full max-w-xl backdrop-blur-md bg-black/70 border border-yellow-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                                    {/* Golden Glow Effect */}
                                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 blur-3xl rounded-full pointer-events-none" />
                                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full pointer-events-none" />

                                    <p className="text-base md:text-xl leading-relaxed text-gray-100 font-medium" style={{ fontFamily: 'Georgia, serif', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                        {displayedText}
                                        <motion.span
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.8 }}
                                            className="inline-block text-yellow-500 ml-1"
                                        >
                                            |
                                        </motion.span>
                                    </p>

                                    {/* Inline Button (Replaces floating button for better mobile UX) */}
                                    {showButton && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-6 flex justify-center w-full"
                                        >
                                            <button
                                                onClick={handleEnterApp}
                                                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold text-lg rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <span>Enter TruthLens</span>
                                                <Play className="w-4 h-4 fill-black" />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
