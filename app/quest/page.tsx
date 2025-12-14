'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { generateLogoutQuest } from '@/services/aiService';
import { saveQuestHistory, getRecentQuests } from '@/services/questService';
import { Quest } from '@/types/quest';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import BrushIcon from '@mui/icons-material/Brush';
import ShareIcon from '@mui/icons-material/Share';
import LogoutIcon from '@mui/icons-material/Logout';

// Custom styled components or consistent style objects
const pageStyle = {
    background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)',
    minHeight: '100vh',
    color: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative' as const,
};

const QUEST_ICONS = {
    physical: DirectionsRunIcon,
    social: EmojiPeopleIcon,
    mindfulness: SelfImprovementIcon,
    creative: BrushIcon,
    easy: DirectionsRunIcon
};

export default function QuestPage() {
    const { user, immediateLogout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [quest, setQuest] = useState<Quest | null>(null);
    const [step, setStep] = useState<'loading' | 'reveal' | 'accepted'>('loading');

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchQuest = async () => {
            // Artificial delay for "Scanning reality..." effect
            await new Promise(r => setTimeout(r, 1500));

            try {
                const history = await getRecentQuests(user.uid, 5);
                const newQuest = await generateLogoutQuest(user.displayName || 'Traveler', history);
                setQuest(newQuest);
                setLoading(false);
                setStep('reveal');
            } catch (error) {
                console.error("Quest generation failed", error);
                // Fallback to logout
                immediateLogout();
            }
        };

        fetchQuest();
    }, [user, router, immediateLogout]);

    const handleAccept = async () => {
        if (!user || !quest) return;
        setStep('accepted');

        await saveQuestHistory(user.uid, quest, 'completed');

        // Wait for animation then logout
        setTimeout(() => {
            immediateLogout();
        }, 2000);
    };

    const handleSkip = async () => {
        if (user && quest) {
            await saveQuestHistory(user.uid, quest, 'skipped');
        }
        immediateLogout();
    };

    const handleShare = () => {
        if (!quest) return;
        const text = `I just accepted a quest to "${quest.title}" before logging out of TruthLens! 🕵️‍♂️ #IRLSideQuest`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (!user) return null;

    const Icon = quest ? QUEST_ICONS[quest.type] || QUEST_ICONS.easy : QUEST_ICONS.easy;

    return (
        <Box sx={pageStyle}>
            {/* Background Effects */}
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>
                {/* Simple CSS Grid or Starfield could go here */}
                <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backgroundImage: 'radial-gradient(rgba(108, 99, 255, 0.2) 2px, transparent 2px)',
                    backgroundSize: '40px 40px'
                }} />
            </Box>

            <Container maxWidth="xs" sx={{ zIndex: 10, textAlign: 'center' }}>
                <AnimatePresence mode="wait">
                    {step === 'loading' && (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress size={80} sx={{ color: '#00F0FF' }} thickness={2} />
                                <Box sx={{
                                    position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <img src="/icons/icon-192x192.png" alt="logo" style={{ width: 40, height: 40, opacity: 0.8 }} onError={(e) => e.currentTarget.style.display = 'none'} />
                                </Box>
                            </Box>
                            <Typography variant="h6" sx={{ mt: 3, color: '#00F0FF', letterSpacing: 1, fontFamily: 'monospace' }}>
                                SCANNING REALITY...
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                                Generating Side Quest
                            </Typography>
                        </motion.div>
                    )}

                    {step === 'reveal' && quest && (
                        <motion.div
                            key="quest"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            transition={{ type: 'spring', damping: 20 }}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                            >
                                <Box sx={{
                                    width: 100, height: 100, borderRadius: '50%',
                                    background: 'linear-gradient(45deg, #6C63FF, #00F0FF)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    mx: 'auto', mb: 3,
                                    boxShadow: '0 0 30px rgba(108, 99, 255, 0.5)'
                                }}>
                                    <Icon sx={{ fontSize: 50, color: 'white' }} />
                                </Box>
                            </motion.div>

                            <Typography variant="overline" sx={{ color: '#00F0FF', letterSpacing: 3, fontWeight: 'bold' }}>
                                NEW OBJECTIVE DETECTED
                            </Typography>

                            <Typography variant="h4" fontWeight="900" sx={{
                                mb: 2, mt: 1,
                                background: 'linear-gradient(45deg, white, #a5a5a5)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textTransform: 'uppercase'
                            }}>
                                {quest.title}
                            </Typography>

                            <Box sx={{
                                bgcolor: 'rgba(255,255,255,0.05)',
                                p: 3, borderRadius: 4, mb: 4,
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                    {quest.description}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleAccept}
                                    sx={{
                                        py: 2,
                                        borderRadius: 3,
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        background: 'linear-gradient(90deg, #6C63FF, #00F0FF)',
                                        boxShadow: '0 0 20px rgba(108, 99, 255, 0.4)',
                                        '&:hover': {
                                            boxShadow: '0 0 30px rgba(108, 99, 255, 0.6)',
                                            transform: 'scale(1.02)'
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ACCEPT MISSION
                                </Button>

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        fullWidth variant="outlined"
                                        onClick={handleShare}
                                        startIcon={<ShareIcon />}
                                        sx={{
                                            color: 'white', borderColor: 'rgba(255,255,255,0.3)', py: 1.5, borderRadius: 3,
                                            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                                        }}
                                    >
                                        Share
                                    </Button>
                                    <Button
                                        fullWidth variant="text"
                                        onClick={handleSkip}
                                        startIcon={<LogoutIcon />}
                                        sx={{ color: 'rgba(255,255,255,0.5)', py: 1.5, borderRadius: 3 }}
                                    >
                                        Skip
                                    </Button>
                                </Box>
                            </Box>
                        </motion.div>
                    )}

                    {step === 'accepted' && (
                        <motion.div
                            key="accepted"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring' }}
                        >
                            <Box sx={{
                                width: 120, height: 120, borderRadius: '50%',
                                border: '4px solid #4CAF50',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 3
                            }}>
                                <DirectionsRunIcon sx={{ fontSize: 60, color: '#4CAF50' }} />
                            </Box>
                            <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold', mb: 1 }}>
                                QUEST ACCEPTED
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                Good luck, agent. Logging out...
                            </Typography>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Container>
        </Box>
    );
}
