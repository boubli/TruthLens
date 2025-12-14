'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Paper, TextField, InputAdornment, Avatar, Chip, IconButton, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PublicIcon from '@mui/icons-material/Public';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import LockIcon from '@mui/icons-material/Lock';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchProductsAction, EnhancedProductData } from '@/app/actions';
import { useAuth } from '@/context/AuthContext';
import { addToHistory } from '@/services/historyService';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import PageTransition from '@/components/animation/PageTransition';
import StaggerList from '@/components/animation/StaggerList';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SearchingAnimation from '@/components/ui/SearchingAnimation';
import EmptyState from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';

export default function GlobalSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EnhancedProductData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { features, tier, loading: authLoading } = useAuth(); // Use tier-based feature flag

    // Auto-search from URL
    React.useEffect(() => {
        const urlQuery = searchParams.get('search') || searchParams.get('q');
        if (urlQuery && !hasSearched) {
            setQuery(urlQuery);
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
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while auth is initializing
    if (authLoading) {
        return (
            <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingSpinner />
            </Box>
        );
    }

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        performSearch(query);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        // Optional: clear URL param?
        router.replace('/global-search');
    };

    // Debug logging
    console.log('[Global Search] Access check:', {
        tier,
        'features.globalSearch': features?.globalSearch,
        'full features': features
    });

    // 🚫 Restricted Access View - Use tier feature flag
    if (!features?.globalSearch) {
        return (
            <PageTransition>
                <Box sx={{
                    minHeight: '80vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle at center, rgba(108,99,255,0.05) 0%, transparent 70%)'
                }}>
                    <Container maxWidth="sm">
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Avatar sx={{
                                width: 80, height: 80,
                                bgcolor: 'rgba(255,255,255,0.05)',
                                color: '#6C63FF',
                                margin: '0 auto',
                                mb: 2,
                                border: '1px solid rgba(108,99,255,0.3)'
                            }}>
                                <LockIcon sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                {'Global Product Search'}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {'This feature is available to Pro and Ultimate users only. Upgrade to unlock unlimited global product search.'}
                            </Typography>
                        </Box>
                        <UpgradePrompt feature={'Global Search'} variant="full" />
                    </Container>
                </Box>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <Box sx={{
                minHeight: '100vh',
                bgcolor: '#050505',
                color: 'white',
                pt: 8,
                pb: 12,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decoration */}
                <Box sx={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-20%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    zIndex: 0
                }} />

                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '50%', bgcolor: 'rgba(108,99,255,0.1)', mb: 2 }}>
                                <PublicIcon sx={{ fontSize: 40, color: '#6C63FF' }} />
                            </Box>
                        </motion.div>
                        <Typography variant="h3" fontWeight="900" sx={{
                            mb: 1,
                            background: 'linear-gradient(135deg, #fff 0%, #aaa 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {'Global Product Search'}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {'Search across millions of products worldwide'}
                        </Typography>
                    </Box>

                    <Paper
                        component="form"
                        onSubmit={handleSearch}
                        elevation={0}
                        sx={{
                            p: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            mb: 6,
                            borderRadius: '24px',
                            bgcolor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s',
                            '&:hover, &:focus-within': {
                                bgcolor: 'rgba(255,255,255,0.08)',
                                borderColor: 'rgba(108, 99, 255, 0.5)',
                                boxShadow: '0 0 30px rgba(108, 99, 255, 0.15)'
                            }
                        }}
                    >
                        <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)', mr: 2 }} />
                        <TextField
                            fullWidth
                            placeholder={'Search for products, brands, or categories...'}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                style: { fontSize: '1.2rem', color: 'white' }
                            }}
                            sx={{
                                '& input::placeholder': {
                                    color: 'rgba(255,255,255,0.3)',
                                    fontStyle: 'italic'
                                }
                            }}
                        />
                        {query && (
                            <IconButton onClick={handleClear} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                        <AnimatedButton
                            type="submit"
                            variant="contained"
                            disabled={loading || !query.trim()}
                            sx={{
                                ml: 2,
                                borderRadius: '16px',
                                px: 4,
                                py: 1,
                                background: 'linear-gradient(135deg, #6C63FF 0%, #5a52d5 100%)',
                                boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)'
                            }}
                        >
                            {'Search'}
                        </AnimatedButton>
                    </Paper>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <SearchingAnimation />
                        </Box>
                    ) : (
                        <StaggerList>
                            {results.map((product) => (
                                <Paper
                                    key={product.id}
                                    onClick={() => router.push(`/product/${product.id}?source=global-search&q=${encodeURIComponent(query)}`)}
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        borderRadius: 4,
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            bgcolor: 'rgba(255,255,255,0.06)',
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        }
                                    }}
                                >
                                    <Avatar
                                        variant="rounded"
                                        src={product.media.thumbnail}
                                        sx={{
                                            width: 70,
                                            height: 70,
                                            mr: 2.5,
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            borderRadius: 3
                                        }}
                                    >
                                        {product.identity.name.charAt(0)}
                                    </Avatar>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                            <Typography variant="h6" fontWeight="bold" noWrap sx={{ color: 'white', maxWidth: '70%' }}>
                                                {product.identity.name}
                                            </Typography>
                                            <Chip
                                                label={product.grades.nutri_score?.toUpperCase() || '?'}
                                                size="small"
                                                sx={{
                                                    fontWeight: '900',
                                                    borderRadius: 1.5,
                                                    height: 24,
                                                    bgcolor: ['A', 'B'].includes(product.grades.nutri_score) ? '#00C853' :
                                                        product.grades.nutri_score === 'C' ? '#FFD600' : '#FF3D00',
                                                    color: 'black'
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5 }}>
                                            <Box component="span" fontWeight="500" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                                {product.identity.brand || 'Unknown Brand'}
                                            </Box>
                                            {" • "}{product.identity.category?.split(',')[0]}
                                        </Typography>
                                    </Box>

                                    <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}>
                                        <ArrowForwardIosIcon fontSize="small" />
                                    </IconButton>
                                </Paper>
                            ))}
                        </StaggerList>
                    )}

                    {hasSearched && results.length === 0 && !loading && (
                        <EmptyState
                            title={`No results found for "${query}"`}
                            description={'Try adjusting your search terms or check your spelling'}
                            actionLabel={'Clear Search'}
                            onAction={handleClear}
                        />
                    )}
                </Container>
            </Box>
        </PageTransition>
    );
}
