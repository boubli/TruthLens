'use client';
import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, CircularProgress, Button, Alert, Paper, IconButton } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserPairedRecommendations, RecommendationPairResult } from '@/services/recommendationService';
import RecommendationPairCard from '@/components/features/RecommendationPairCard';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

const fadeInVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function RecommendationsPage() {
    const { user, userProfile, features } = useAuth();
    const router = useRouter();
    const [recommendations, setRecommendations] = useState<RecommendationPairResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRecommendations = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            // Artificial delay for smooth animation if loading is too fast
            const minTime = new Promise(resolve => setTimeout(resolve, 800));
            const [data] = await Promise.all([
                getUserPairedRecommendations(user.uid),
                minTime
            ]);
            setRecommendations(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load personalized recommendations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRecommendations();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ mt: 10, textAlign: 'center' }}>
                <Typography variant="h5">Please log in to view personalized recommendations.</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
            {/* Header Section */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInVariants}
            >
                <Box sx={{ mb: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <IconButton
                            onClick={() => router.back()}
                            component={motion.button}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
                            whileTap={{ scale: 0.95 }}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                color: 'white',
                                width: 44,
                                height: 44,
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>

                        <Button
                            variant="contained"
                            component={motion.button}
                            whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(255, 107, 107, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon sx={{ fontSize: 20 }} />}
                            onClick={fetchRecommendations}
                            disabled={loading}
                            sx={{
                                borderRadius: '100px',
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #FF8E53 0%, #FF6B6B 100%)',
                                boxShadow: '0 4px 14px rgba(255, 107, 107, 0.4)',
                                px: 3,
                                py: 1,
                                fontSize: '0.9rem',
                                fontWeight: 600
                            }}
                        >
                            {loading ? 'Analyzing...' : 'Refresh Info'}
                        </Button>
                    </Box>

                    <Box>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <AutoAwesomeIcon sx={{ color: '#FF8E53', fontSize: 28 }} />
                                <Typography variant="overline" sx={{ color: '#FF8E53', fontWeight: 700, letterSpacing: 1.2 }}>
                                    AI INSIGHTS
                                </Typography>
                            </Box>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            <Typography
                                variant="h3"
                                fontWeight="800"
                                sx={{
                                    fontSize: { xs: '2.5rem', md: '3rem' },
                                    background: 'linear-gradient(90deg, #FFFFFF 0%, #e0e0e0 100%)',
                                    backgroundClip: 'text',
                                    textFillColor: 'transparent',
                                    mb: 1,
                                    letterSpacing: '-0.02em',
                                    textShadow: '0 0 40px rgba(255,255,255,0.1)'
                                }}
                            >
                                Smart Swaps
                            </Typography>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '90%', lineHeight: 1.6, fontSize: '1.1rem' }}>
                                Healthier alternatives tailored to your habits.
                            </Typography>
                        </motion.div>
                    </Box>
                </Box>
            </motion.div>

            {/* Error State */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading State */}
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12 }}>
                            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CircularProgress
                                    size={80}
                                    thickness={2}
                                    sx={{
                                        color: '#FF8E53',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0
                                    }}
                                    disableShrink
                                />
                                <CircularProgress
                                    size={80}
                                    thickness={2}
                                    sx={{
                                        color: 'rgba(255, 142, 83, 0.2)',
                                    }}
                                    variant="determinate"
                                    value={100}
                                />
                            </Box>
                            <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 600, background: 'linear-gradient(135deg, #FFF 0%, #CCC 100%)', backgroundClip: 'text', textFillColor: 'transparent' }}>
                                Curating Recommendations...
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Analyzing your history to find the best matches.
                            </Typography>
                        </Box>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && !error && recommendations.length === 0 && (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                        <Paper sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: 6,
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}>
                            <Typography variant="h5" gutterBottom fontWeight="bold">No Swaps Found Yet</Typography>
                            <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 320, mx: 'auto', lineHeight: 1.6 }}>
                                We need a bit more data to find the perfect healthier alternatives for you. Start scanning items!
                            </Typography>
                            <Button
                                component={motion.button}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                variant="contained"
                                onClick={() => router.push('/scan')}
                                sx={{
                                    borderRadius: '100px',
                                    px: 5,
                                    py: 1.5,
                                    background: 'white',
                                    color: 'black',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 15px rgba(255,255,255,0.2)',
                                    '&:hover': {
                                        background: '#f0f0f0'
                                    }
                                }}
                            >
                                Start Scanning
                            </Button>
                        </Paper>
                    </motion.div>
                )}

                {/* Results Grid */}
                {!loading && !error && recommendations.length > 0 && (
                    <motion.div
                        key="results"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Grid container spacing={4}>
                            {/* Visible Recommendations */}
                            {recommendations.slice(0, features?.recommendationLimit === -1 ? undefined : features.recommendationLimit).map((pair) => (
                                <Grid key={pair.id} size={{ xs: 12 }}>
                                    <motion.div variants={itemVariants}>
                                        <RecommendationPairCard
                                            rejected={pair.rejected}
                                            recommended={pair.recommended}
                                        />
                                    </motion.div>
                                </Grid>
                            ))}

                            {/* Locked State for Free/Plus Users */}
                            {features?.recommendationLimit !== -1 && recommendations.length > features.recommendationLimit && (
                                <Grid size={{ xs: 12 }}>
                                    <motion.div variants={itemVariants}>
                                        <Paper sx={{
                                            p: 4,
                                            textAlign: 'center',
                                            borderRadius: 4,
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            border: '1px dashed rgba(255,255,255,0.2)',
                                            backdropFilter: 'blur(10px)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 2
                                        }}>
                                            <AutoAwesomeIcon sx={{ fontSize: 40, color: '#FFD700', opacity: 0.8 }} />
                                            <Typography variant="h6" fontWeight="bold">
                                                Unlock {recommendations.length - features.recommendationLimit} More Insights
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                                                Upgrade to Pro to see all your personalized swaps and unlock unlimited AI recommendations.
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                onClick={() => router.push('/upgrade')}
                                                sx={{
                                                    mt: 1,
                                                    borderRadius: '100px',
                                                    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                                                    color: 'black',
                                                    fontWeight: 'bold',
                                                    px: 4,
                                                    boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)'
                                                }}
                                            >
                                                Unlock Pro Access
                                            </Button>
                                        </Paper>
                                    </motion.div>
                                </Grid>
                            )}
                        </Grid>
                    </motion.div>
                )}
            </AnimatePresence>
        </Container>
    );
}
