'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, IconButton, Avatar, InputBase, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TierBadge from '@/components/subscription/TierBadge';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HistoryIcon from '@mui/icons-material/History';
import RecommendIcon from '@mui/icons-material/Recommend';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StaggerList, { StaggerItem } from '@/components/animation/StaggerList';
import AnimatedCard from '@/components/ui/AnimatedCard';
import ScrollReveal from '@/components/animation/ScrollReveal';
import { motion, AnimatePresence } from 'framer-motion';
import { searchProductsAction, EnhancedProductData } from '@/app/actions';
import { generateDynamicGreeting } from '@/services/aiService';
import ProductCard from '@/components/features/ProductCard';
import { addToHistory } from '@/services/historyService';
import { calculateSmartGrade } from '@/services/gradingService';

export default function UserHome() {
    const { user, isPro, features: tierFeatures, dietaryPreferences } = useAuth();
    const router = useRouter();

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EnhancedProductData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        try {
            const data = await searchProductsAction(query);
            setResults(data);

            if (user && data.length > 0) {
                try {
                    await addToHistory(user.uid, {
                        type: 'search',
                        title: `Search: "${query}"`,
                        grade: undefined, // Service handles this by converting to null
                    });
                } catch (historyError) {
                    console.error('[SEARCH] ❌ Failed to save to history:', historyError);
                }
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
    };

    const features = [
        {
            title: 'Scan Product',
            icon: <QrCodeScannerIcon sx={{ fontSize: 40, color: '#6C63FF' }} />,
            path: '/scan',
            color: 'rgba(108, 99, 255, 0.1)',
            desc: 'Instant analysis',
            gradient: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(108, 99, 255, 0.05) 100%)'
        },
        {
            title: 'AI Chat',
            icon: <SmartToyIcon sx={{ fontSize: 40, color: '#9333EA' }} />,
            path: '/ai-chat',
            color: 'rgba(147, 51, 234, 0.1)',
            desc: 'Ask anything',
            gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)'
        },
        {
            title: 'History',
            icon: <HistoryIcon sx={{ fontSize: 40, color: '#00F0FF' }} />,
            path: '/history',
            color: 'rgba(0, 240, 255, 0.1)',
            desc: 'Past scans',
            gradient: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%)'
        },
        {
            title: 'Global Search',
            icon: <PublicIcon sx={{ fontSize: 40, color: '#00E676' }} />,
            path: '/global-search',
            color: 'rgba(0, 230, 118, 0.1)',
            desc: 'Ultimate Only',
            gradient: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1) 0%, rgba(0, 230, 118, 0.05) 100%)'
        },
        {
            title: 'For You',
            icon: <RecommendIcon sx={{ fontSize: 40, color: '#FCD34D' }} />,
            path: '/recommendations',
            color: 'rgba(252, 211, 77, 0.1)',
            desc: 'Smart picks',
            gradient: 'linear-gradient(135deg, rgba(252, 211, 77, 0.1) 0%, rgba(252, 211, 77, 0.05) 100%)'
        },
        {
            title: 'Favorites',
            icon: <FavoriteIcon sx={{ fontSize: 40, color: '#FF4081' }} />,
            path: '/favorites',
            color: 'rgba(255, 64, 129, 0.1)',
            desc: 'Saved items',
            gradient: 'linear-gradient(135deg, rgba(255, 64, 129, 0.1) 0%, rgba(255, 64, 129, 0.05) 100%)'
        },
        {
            title: 'My Profile',
            icon: <PersonIcon sx={{ fontSize: 40, color: '#10B981' }} />,
            path: '/profile',
            color: 'rgba(16, 185, 129, 0.1)',
            desc: 'Settings & account',
            gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
        },
        {
            title: 'Upgrade',
            icon: <StarIcon sx={{ fontSize: 40, color: '#F59E0B' }} />,
            path: '/upgrade',
            color: 'rgba(245, 158, 11, 0.1)',
            desc: 'Get Pro features',
            gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
        },
        {
            title: 'Support Chat',
            icon: <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: '#3B82F6' }} />,
            path: '/support',
            color: 'rgba(59, 130, 246, 0.1)',
            desc: 'Talk to us',
            gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
        }
    ];

    const [greeting, setGreeting] = useState('Hello');

    useEffect(() => {
        const hour = new Date().getHours();
        const name = user?.displayName?.split(' ')[0] || 'Explorer';

        // Late Night: 00:00 - 06:00 (AI Powered)
        if (hour >= 0 && hour < 6) {
            setGreeting('Up late? 🌙'); // Immediate placeholder
            generateDynamicGreeting(name, 'late_night').then((aiMsg) => {
                if (aiMsg) setGreeting(aiMsg);
            });
        }
        // Standard Hours: Simple Greeting
        else if (hour < 12) {
            setGreeting('Good Morning ☀️');
        } else if (hour < 18) {
            setGreeting('Good Afternoon 🌤️');
        } else {
            setGreeting('Good Evening 🌙');
        }
    }, [user]);

    return (
        <Box sx={{ pb: 12, minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header Section */}
            <Box
                component={motion.div}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                sx={{
                    pt: { xs: 3, sm: 4 },
                    pb: { xs: 5, sm: 6 },
                    px: { xs: 2, sm: 3 },
                    background: 'linear-gradient(135deg, #6C63FF 0%, #5a52d5 100%)',
                    borderRadius: '0 0 24px 24px',
                    color: 'white',
                    mb: 3,
                    boxShadow: '0 4px 20px rgba(108, 99, 255, 0.3)'
                }}
            >
                <Container maxWidth="sm" disableGutters>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box>
                            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500, mb: 0.5, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {greeting}
                            </Typography>
                            <Typography variant="h3" fontWeight={800} sx={{
                                fontSize: { xs: '2rem', sm: '2.5rem' },
                                letterSpacing: '-0.02em',
                                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }}>
                                {user?.displayName?.split(' ')[0] || 'Explorer'}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                                <TierBadge tier={useAuth().tier} size="small" />
                            </Box>
                        </Box>

                        {/* Profile & Chat Icons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* Chat Icon */}
                            <IconButton
                                component={motion.button}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/support')}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                                }}
                            >
                                <ChatBubbleOutlineIcon />
                            </IconButton>

                            {/* Profile Avatar */}
                            <Avatar
                                component={motion.div}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                src={user?.photoURL || '/icons/icon-192x192.png'}
                                sx={{
                                    width: { xs: 44, sm: 48 },
                                    height: { xs: 44, sm: 48 },
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                onClick={() => router.push('/profile')}
                            />
                        </Box>
                    </Box>

                    {/* Search Bar */}
                    <Paper
                        component="form"
                        onSubmit={handleSearch}
                        elevation={0}
                        sx={{
                            p: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 4,
                            bgcolor: 'rgba(255, 255, 255, 0.95)',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover, &:focus-within': {
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                bgcolor: 'white'
                            }
                        }}
                    >
                        <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        <InputBase
                            sx={{ ml: 1, flex: 1, fontSize: { xs: '0.95rem', sm: '1rem' } }}
                            placeholder="Search products..."
                            inputProps={{ 'aria-label': 'search products' }}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <IconButton size="small" onClick={clearSearch} sx={{ mr: 0.5 }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                        <IconButton
                            type="submit"
                            sx={{
                                bgcolor: '#6C63FF',
                                borderRadius: 2,
                                p: 0.5,
                                color: 'white',
                                transition: 'all 0.3s',
                                '&:hover': { bgcolor: '#5a52d5' }
                            }}
                        >
                            {loading ? <CircularProgress size={20} color="inherit" /> : <KeyboardArrowRightIcon fontSize="small" />}
                        </IconButton>
                    </Paper>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
                <AnimatePresence mode="wait">
                    {hasSearched ? (
                        <ScrollReveal key="results">
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Search Results
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {results.length} found
                                </Typography>
                            </Box>

                            {results.length > 0 ? (
                                <Grid container spacing={2}>
                                    {results.map((product) => {
                                        // Apply Smart Grading if Pro
                                        let displayGrade = product.grades.nutri_score;
                                        if (isPro && tierFeatures.smartGrading) {
                                            // Adapter for legacy grading service
                                            const legacyProduct: any = {
                                                id: product.id,
                                                name: product.identity.name,
                                                brand: product.identity.brand,
                                                image: product.media.front_image,
                                                ingredients: product.ingredients,
                                                nutrition_grades: product.grades.nutri_score,
                                                nutriments: product.nutrition.nutriments_raw || {},
                                                description: product.identity.description
                                            };
                                            const smartResult = calculateSmartGrade(legacyProduct, dietaryPreferences);
                                            displayGrade = smartResult.grade;
                                        }

                                        return (
                                            // Mobile: 2 per row (6), Tablet: 3 per row (4), Desktop: 4 per row (3)
                                            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={product.id}>
                                                <ProductCard
                                                    id={product.id}
                                                    name={product.identity.name}
                                                    image={product.media.thumbnail || product.media.front_image}
                                                    description={product.identity.description}
                                                    grade={displayGrade || '?'}
                                                />
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                !loading && (
                                    <Box sx={{ textAlign: 'center', py: 8, opacity: 0.7 }}>
                                        <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary">
                                            No products found
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Try searching for something else
                                        </Typography>
                                    </Box>
                                )
                            )}
                        </ScrollReveal>
                    ) : (
                        <Box key="features">
                            <ScrollReveal>
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                        mb: 2.5,
                                        px: 0.5,
                                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                    }}
                                >
                                    Quick Actions
                                </Typography>
                            </ScrollReveal>

                            <StaggerList>
                                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                    {features.map((item, index) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                            <StaggerItem>
                                                <AnimatedCard
                                                    onClick={() => router.push(item.path)}
                                                    sx={{
                                                        p: { xs: 2, sm: 2.5 },
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        borderRadius: 3,
                                                        cursor: 'pointer',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        background: item.gradient,
                                                        transition: 'all 0.3s',
                                                        '&:hover': {
                                                            borderColor: 'primary.main',
                                                            boxShadow: '0 4px 12px rgba(108, 99, 255, 0.15)'
                                                        }
                                                    }}
                                                >
                                                    <Box
                                                        component={motion.div}
                                                        whileHover={{ rotate: 5 }}
                                                        sx={{
                                                            width: { xs: 56, sm: 60 },
                                                            height: { xs: 56, sm: 60 },
                                                            borderRadius: 2.5,
                                                            bgcolor: item.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            mr: 2,
                                                            transition: 'all 0.3s'
                                                        }}
                                                    >
                                                        {item.icon}
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            variant="h6"
                                                            fontWeight="bold"
                                                            sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
                                                        >
                                                            {item.title}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
                                                        >
                                                            {item.desc}
                                                        </Typography>
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            transition: 'transform 0.3s',
                                                            '&:hover': { transform: 'translateX(4px)' }
                                                        }}
                                                    >
                                                        <KeyboardArrowRightIcon color="action" />
                                                    </IconButton>
                                                </AnimatedCard>
                                            </StaggerItem>
                                        </Grid>
                                    ))}
                                </Grid>
                            </StaggerList>
                        </Box>
                    )}
                </AnimatePresence>
            </Container>
        </Box>
    );
}
