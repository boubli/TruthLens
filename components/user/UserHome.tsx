'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Grid, Paper, IconButton, Avatar, InputBase, CircularProgress } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
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
    const { user, tier, isPro, features: tierFeatures, dietaryPreferences } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EnhancedProductData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Auto-search from URL (e.g. from Scanner)
    useEffect(() => {
        const urlQuery = searchParams.get('search');
        if (urlQuery && urlQuery !== query) {
            setQuery(urlQuery);
            // Trigger search
            performSearch(urlQuery);
        }
    }, [searchParams]);

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setHasSearched(true);
        try {
            const data = await searchProductsAction(searchQuery);
            setResults(data);
            // History saving logic duplicated here or extracted? 
            // Better to extract handleSearch logic.
            // For now, I will just call the action and set results to be safe/fast.
            // History saving:
            if (user && data.length > 0) {
                addToHistory(user.uid, {
                    type: 'search',
                    title: `Search: "${searchQuery}"`,
                    grade: undefined,
                }).catch(e => console.error(e));
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };


    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        performSearch(query);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
    };

    const { t } = useTranslation();

    const features = [
        {
            title: t('feature_scan_title'),
            icon: <QrCodeScannerIcon sx={{ fontSize: 40, color: '#6C63FF' }} />,
            path: '/scan',
            color: 'rgba(108, 99, 255, 0.1)',
            desc: t('feature_scan_desc'),
            gradient: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(108, 99, 255, 0.05) 100%)'
        },
        {
            title: t('feature_chat_title'),
            icon: <SmartToyIcon sx={{ fontSize: 40, color: '#9333EA' }} />,
            path: '/ai-chat',
            color: 'rgba(147, 51, 234, 0.1)',
            desc: t('feature_chat_desc'),
            gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)'
        },
        {
            title: t('feature_history_title'),
            icon: <HistoryIcon sx={{ fontSize: 40, color: '#00F0FF' }} />,
            path: '/history',
            color: 'rgba(0, 240, 255, 0.1)',
            desc: t('feature_history_desc'),
            gradient: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%)'
        },
        {
            title: t('feature_globalsearch_title'),
            icon: <PublicIcon sx={{ fontSize: 40, color: '#00E676' }} />,
            path: '/global-search',
            color: 'rgba(0, 230, 118, 0.1)',
            desc: t('feature_globalsearch_desc'),
            gradient: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1) 0%, rgba(0, 230, 118, 0.05) 100%)'
        },
        {
            title: t('feature_foryou_title'),
            icon: <RecommendIcon sx={{ fontSize: 40, color: '#FCD34D' }} />,
            path: '/recommendations',
            color: 'rgba(252, 211, 77, 0.1)',
            desc: t('feature_foryou_desc'),
            gradient: 'linear-gradient(135deg, rgba(252, 211, 77, 0.1) 0%, rgba(252, 211, 77, 0.05) 100%)'
        },
        {
            title: t('feature_favorites_title'),
            icon: <FavoriteIcon sx={{ fontSize: 40, color: '#FF4081' }} />,
            path: '/favorites',
            color: 'rgba(255, 64, 129, 0.1)',
            desc: t('feature_favorites_desc'),
            gradient: 'linear-gradient(135deg, rgba(255, 64, 129, 0.1) 0%, rgba(255, 64, 129, 0.05) 100%)'
        },
        {
            title: t('feature_profile_title'),
            icon: <PersonIcon sx={{ fontSize: 40, color: '#10B981' }} />,
            path: '/profile',
            color: 'rgba(16, 185, 129, 0.1)',
            desc: t('feature_profile_desc'),
            gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
        },
        {
            title: t('feature_upgrade_title'),
            icon: <StarIcon sx={{ fontSize: 40, color: '#F59E0B' }} />,
            path: '/upgrade',
            color: 'rgba(245, 158, 11, 0.1)',
            desc: t('feature_upgrade_desc'),
            gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
        },
        {
            title: t('feature_support_title'),
            icon: <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: '#3B82F6' }} />,
            path: '/support',
            color: 'rgba(59, 130, 246, 0.1)',
            desc: t('feature_support_desc'),
            gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
        }
    ];

    const [greeting, setGreeting] = useState('Hello');

    useEffect(() => {
        const hour = new Date().getHours();
        const name = user?.displayName?.split(' ')[0] || 'Explorer';

        // Late Night: 00:00 - 06:00 (AI Powered)
        if (hour >= 0 && hour < 6) {
            setGreeting(t('greeting_late_night')); // Immediate placeholder
            generateDynamicGreeting(name, 'late_night').then((aiMsg) => {
                if (aiMsg) setGreeting(aiMsg);
            });
        }
        // Standard Hours: Simple Greeting
        else if (hour < 12) {
            setGreeting(t('greeting_morning'));
        } else if (hour < 18) {
            setGreeting(t('greeting_afternoon'));
        } else {
            setGreeting(t('greeting_evening'));
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
                            placeholder={t('home_search_placeholder')}
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
                                    {t('home_search_results')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {results.length} {t('home_found')}
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
                                            {t('home_no_results')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('home_try_searching')}
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
                                    {t('home_quick_actions')}
                                </Typography>
                            </ScrollReveal>

                            <StaggerList>
                                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                    {features.filter(item => {
                                        // Global Search: Only for Pro and Ultimate
                                        if (item.path === '/global-search') {
                                            return tier === 'pro' || tier === 'ultimate';
                                        }
                                        // Upgrade: Hide for Ultimate (highest tier)
                                        if (item.path === '/upgrade') {
                                            return tier !== 'ultimate';
                                        }
                                        return true;
                                    }).map((item, index) => (
                                        <Grid size={{ xs: 6, sm: 6, md: 4 }} key={index}>
                                            <StaggerItem>
                                                <AnimatedCard
                                                    onClick={() => router.push(item.path)}
                                                    sx={{
                                                        p: { xs: 2, sm: 2.5 },
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: { xs: 'column', sm: 'row' },
                                                        alignItems: 'center',
                                                        justifyContent: { xs: 'center', sm: 'flex-start' },
                                                        textAlign: { xs: 'center', sm: 'left' },
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
                                                            width: { xs: 48, sm: 60 },
                                                            height: { xs: 48, sm: 60 },
                                                            borderRadius: 2.5,
                                                            bgcolor: item.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            mr: { xs: 0, sm: 2 },
                                                            mb: { xs: 1.5, sm: 0 },
                                                            transition: 'all 0.3s'
                                                        }}
                                                    >
                                                        {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: { xs: 28, sm: 40 }, color: (item.icon as any).props?.sx?.color } } as any)}
                                                    </Box>
                                                    <Box sx={{ flex: 1, width: '100%' }}>
                                                        <Typography
                                                            variant="h6"
                                                            fontWeight="bold"
                                                            sx={{
                                                                fontSize: { xs: '0.9rem', sm: '1.1rem' },
                                                                lineHeight: 1.2,
                                                                mb: { xs: 0.5, sm: 0 }
                                                            }}
                                                        >
                                                            {item.title}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                fontSize: { xs: '0.75rem', sm: '0.9rem' },
                                                                display: { xs: 'none', sm: 'block' } // Clean 2x2 grid on mobile
                                                            }}
                                                        >
                                                            {item.desc}
                                                        </Typography>
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            transition: 'transform 0.3s',
                                                            '&:hover': { transform: 'translateX(4px)' },
                                                            display: { xs: 'none', sm: 'inline-flex' } // Hide arrow on mobile, redundant
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
        </Box >
    );
}
