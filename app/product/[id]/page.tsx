'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Chip, LinearProgress, Tooltip, Dialog, DialogTitle, DialogContent, Alert } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PublicIcon from '@mui/icons-material/Public';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getProductAction, EnhancedProductData } from '@/app/actions';
import { analyzeProductByTier, AIAnalysis, analyzeIngredientsForHarmfulCompounds, AITruthDetectorResult, SustainabilityAnalysis, ARProductDetails, getARProductDetails, repairProductMetadata } from '@/services/aiService';
import { getProductEcoScore } from '@/services/sustainabilityService';
import { calculateSmartGrade, getGenericGrade, SmartGradeResult } from '@/services/gradingService';
import { useAuth } from '@/context/AuthContext';
import { addToHistory } from '@/services/historyService';
import { addToFavorites, removeFromFavorites, checkIsFavorite } from '@/services/favoriteService';
import AITruthDetector from '@/components/product/AITruthDetector';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import AdBanner from '@/components/ads/AdBanner';
import PageTransition from '@/components/animation/PageTransition';
import ScrollReveal from '@/components/animation/ScrollReveal';
import StaggerList from '@/components/animation/StaggerList';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GradeDisplay from '@/components/features/GradeDisplay';
import ARProductVisualizer from '@/components/features/ARProductVisualizer';
import ProAnalysisView from '@/components/features/ProAnalysisView';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    // UI States
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<EnhancedProductData | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [truthDetectorResult, setTruthDetectorResult] = useState<AITruthDetectorResult | null>(null);
    const [ecoScoreData, setEcoScoreData] = useState<SustainabilityAnalysis | null>(null);
    const [arData, setArData] = useState<ARProductDetails | null>(null);
    const [smartGrade, setSmartGrade] = useState<SmartGradeResult | null>(null);

    // Analysis Loading States
    const [analyzing, setAnalyzing] = useState(false);
    const [ecoAnalyzing, setEcoAnalyzing] = useState(false);
    const [arAnalyzing, setArAnalyzing] = useState(false);

    // Interaction States
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);
    const [showAR, setShowAR] = useState(false);

    // History Persistence State
    const historySavedRef = useRef(false);

    const { user, isPro, isFree, tier, features, dietaryPreferences } = useAuth();
    const searchParams = useSearchParams();
    const source = searchParams.get('source');

    // Check Favorites Status
    useEffect(() => {
        if (user && id) {
            checkIsFavorite(user.uid, String(id)).then(setIsFavorite);
        }
    }, [user, id]);

    const handleToggleFavorite = async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (!product) return;

        setFavLoading(true);
        try {
            if (isFavorite) {
                await removeFromFavorites(user.uid, String(id));
                setIsFavorite(false);
            } else {
                await addToFavorites(user.uid, {
                    id: String(id),
                    product_name: product.identity.name,
                    image_front_small_url: product.media.thumbnail || product.media.front_image,
                    brands: product.identity.brand,
                });
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Failed to toggle favorite', error);
        } finally {
            setFavLoading(false);
        }
    };

    // 1. Load Product Data (Independent of Auth)
    useEffect(() => {
        if (id) {
            loadProduct(id as string);
        }
    }, [id]);

    // 2. Save History (Dependent on Auth AND Product)
    useEffect(() => {
        if (user && product && !historySavedRef.current) {
            const saveToHistory = async () => {
                historySavedRef.current = true; // Prevent double saves
                try {
                    const type = (source === 'scan') ? 'scan' : 'search';
                    console.log(`[History] Saving view type: ${type} for product: ${product.identity.name}`);

                    await addToHistory(user.uid, {
                        type: type as 'scan' | 'search',
                        title: product.identity.name,
                        grade: product.grades.nutri_score,
                        productId: product.id
                    });
                } catch (e) {
                    console.error("History Save Error:", e);
                    historySavedRef.current = false;
                }
            };
            saveToHistory();
        }
    }, [user, product, source]);

    const loadProduct = async (barcode: string) => {
        setLoading(true);
        // Cast to any locally or update usages - The action returns EnhancedProductData now
        const data: any = await getProductAction(barcode);
        if (data) {
            setProduct(data);

            // --- AI Auto-Repair Logic ---
            if ((data.identity.brand === 'Unknown Brand' || data.identity.name === 'Unknown Product') && data.media.front_image) {
                console.log("🔍 [AI Repair] Detected unknown metadata. Attempting vision repair...");
                repairProductMetadata(data.media.front_image, data.identity.name).then(repaired => {
                    if (repaired && repaired.brand && repaired.name) {
                        console.log("✅ [AI Repair] Success:", repaired);
                        setProduct((prev: any) => prev ? ({
                            ...prev,
                            identity: {
                                ...prev.identity,
                                brand: repaired.brand,
                                name: repaired.name
                            }
                        }) : null);
                    }
                });
            }
            // -----------------------------

            performAiAnalysis(data);
            // fetchEcoScore is less needed if we have data.grades.eco_score, but we might want detailed data:
            // fetchEcoScore(data); 
            // Updating fetchEcoScore usage below to match new structure if strictly needed
        }
        setLoading(false);
    };

    const performAiAnalysis = async (productData: any) => {
        setAnalyzing(true);
        try {
            const analysis = await analyzeProductByTier(tier, productData.identity.name, productData.ingredients, productData.nutrition.nutriments_raw || {});
            setAiAnalysis(analysis);

            if (isPro && features.aiTruthDetector) {
                const truthResult = await analyzeIngredientsForHarmfulCompounds(productData.ingredients);
                setTruthDetectorResult(truthResult);
            }

            // Smart Grade might need refactoring or we adapter it
            // Passing flattened structure or adapting inside service. 
            // For now, let's skip strict Smart Grade calculation if it relies on old ProductData shape strictly,
            // OR construct a compat object:
            const compatProduct = {
                ...productData,
                name: productData.identity.name,
                brand: productData.identity.brand,
                nutrition_grades: productData.grades.nutri_score,
                nutriments: productData.nutrition.nutriments_raw
            };

            if (isPro && features.smartGrading) {
                setSmartGrade(calculateSmartGrade(compatProduct, dietaryPreferences));
            } else {
                setSmartGrade(getGenericGrade(compatProduct));
            }
        } catch (error) { console.error(error); }
        setAnalyzing(false);
    };

    const handleARClick = async () => {
        setShowAR(true);
        if (!arData && product) {
            setArAnalyzing(true);
            try {
                // @ts-ignore
                const data = await getARProductDetails(product.identity.name, product.identity.category || 'Food');
                setArData(data);
            } catch (e) { console.error("AR Error", e); }
            setArAnalyzing(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;
    if (!product) return <Container sx={{ mt: 10 }}>Product not found.</Container>;

    // @ts-ignore
    const currentGrade = smartGrade?.grade || product.grades.nutri_score || '?';

    return (
        <PageTransition>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 10 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <AnimatedButton startIcon={<ArrowBackIcon />} onClick={() => router.back()} variant="text" color="inherit">
                        Back
                    </AnimatedButton>
                    {/* AR Button */}
                    {isPro && (
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<ViewInArIcon />}
                            onClick={handleARClick}
                            sx={{ borderRadius: 3 }}
                        >
                            View in Space
                        </Button>
                    )}
                </Box>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <ScrollReveal>
                            <Paper elevation={4} sx={{ p: 2, borderRadius: 4, bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, overflow: 'hidden' }}>
                                {/* @ts-ignore */}
                                <img
                                    src={product.media.front_image || 'https://via.placeholder.com/400'}
                                    alt={product.identity.name}
                                    style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '450px', objectFit: 'contain' }}
                                />
                            </Paper>
                        </ScrollReveal>
                        <Box sx={{ mt: 3 }}>
                            <AnimatedButton
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                onClick={handleToggleFavorite}
                                color={isFavorite ? 'error' : 'primary'}
                                disabled={favLoading}
                                sx={{
                                    py: 1.5,
                                    fontWeight: 'bold',
                                    borderRadius: 3,
                                    boxShadow: isFavorite ? '0 8px 16px rgba(244, 67, 54, 0.3)' : '0 8px 16px rgba(108, 99, 255, 0.3)',
                                    background: isFavorite ? undefined : 'linear-gradient(45deg, #6C63FF 30%, #5a52d5 90%)'
                                }}
                            >
                                {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
                            </AnimatedButton>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                        <StaggerList staggerDelay={0.1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                <Box>
                                    {/* @ts-ignore */}
                                    <Typography variant="overline" color="text.secondary">{product.identity.brand} • {product.identity.category}</Typography>
                                    {/* @ts-ignore */}
                                    <Typography variant="h3" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{product.identity.name}</Typography>
                                </Box>
                                <GradeDisplay grade={currentGrade} size="medium" showDescription={false} />
                            </Box>

                            {/* Smart Grade Details */}
                            {smartGrade?.isPersonalized && (smartGrade.warnings.length > 0 || smartGrade.reasons.length > 0) && (
                                <Box sx={{ mb: 3 }}>
                                    {smartGrade.warnings.map((w, i) => (
                                        <Alert key={`warn-${i}`} severity="warning" sx={{ mb: 1, borderRadius: 2 }}>{w}</Alert>
                                    ))}
                                    {smartGrade.reasons.map((r, i) => (
                                        <Alert key={`reason-${i}`} severity="success" sx={{ mb: 1, borderRadius: 2 }}>{r}</Alert>
                                    ))}
                                </Box>
                            )}

                            {/* NUTRITION & SENSORY SECTION (NEW) */}
                            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'background.paper', borderColor: 'divider' }}>
                                <Typography variant="h6" gutterBottom>Nutrition Facts</Typography>
                                <Grid container spacing={2}>
                                    {/* @ts-ignore */}
                                    <Grid size={{ xs: 6, sm: 3 }}><Typography variant="subtitle2" color="text.secondary">Energy</Typography><Typography variant="body1" fontWeight="bold">{product.nutrition.calories_100g ? `${product.nutrition.calories_100g} kcal` : 'N/A'}</Typography></Grid>
                                    {/* @ts-ignore */}
                                    <Grid size={{ xs: 6, sm: 3 }}><Typography variant="subtitle2" color="text.secondary">Protein</Typography><Typography variant="body1" fontWeight="bold">{product.nutrition.proteins_100g ? `${product.nutrition.proteins_100g}g` : 'N/A'}</Typography></Grid>
                                    {/* @ts-ignore */}
                                    <Grid size={{ xs: 6, sm: 3 }}><Typography variant="subtitle2" color="text.secondary">Carbs</Typography><Typography variant="body1" fontWeight="bold">{product.nutrition.carbs_100g ? `${product.nutrition.carbs_100g}g` : 'N/A'}</Typography></Grid>
                                    {/* @ts-ignore */}
                                    <Grid size={{ xs: 6, sm: 3 }}><Typography variant="subtitle2" color="text.secondary">Fat</Typography><Typography variant="body1" fontWeight="bold">{product.nutrition.fat_100g ? `${product.nutrition.fat_100g}g` : 'N/A'}</Typography></Grid>
                                </Grid>
                            </Paper>

                            {/* Eco Score (Legacy Display, updated to pull from grades if available) */}
                            {/* @ts-ignore */}
                            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <PublicIcon color="success" />
                                    <Typography variant="h6" fontWeight="bold" color="success.dark">Sustainability Impact</Typography>
                                </Box>
                                {/* We can use product.grades.eco_score directly now */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2">Eco-Score Grade</Typography>
                                    {/* @ts-ignore */}
                                    <Chip label={product.grades.eco_score} color={product.grades.eco_score === 'A' || product.grades.eco_score === 'B' ? 'success' : 'warning'} size="small" />
                                </Box>
                                {/* @ts-ignore */}
                                <Typography variant="caption" color="text.secondary">NOVA Group: {product.grades.processing_score}</Typography>
                            </Paper>

                            {/* Deep Analysis (Antigravity AI) */}
                            {/* @ts-ignore */}
                            {isPro && <ProAnalysisView productName={product.identity.name} productBrand={product.identity.brand} />}

                            {isPro && truthDetectorResult && <ScrollReveal><Box sx={{ mb: 3 }}><AITruthDetector result={truthDetectorResult} loading={analyzing} /></Box></ScrollReveal>}
                            {isFree && <ScrollReveal><Box sx={{ mb: 3 }}><UpgradePrompt feature="AI Truth Detector" variant="compact" /></Box></ScrollReveal>}

                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mt: 4, bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                    <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', display: 'flex' }}>
                                        <RestaurantMenuIcon />
                                    </Box>
                                    <Typography variant="h6" fontWeight="bold">Ingredients Breakdown</Typography>
                                </Box>

                                {product.ingredients && product.ingredients.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {/* @ts-ignore */}
                                        {product.ingredients.map((ingredient: string, i: number) => (
                                            <Chip
                                                key={i}
                                                label={ingredient}
                                                sx={{
                                                    bgcolor: i % 2 === 0 ? 'rgba(108, 99, 255, 0.05)' : 'rgba(0, 240, 255, 0.05)',
                                                    color: 'text.primary',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    '&:hover': {
                                                        bgcolor: 'primary.light',
                                                        color: 'white',
                                                        borderColor: 'primary.main'
                                                    },
                                                    transition: 'all 0.2s'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                                        <Typography variant="body2" color="text.secondary">No ingredients details available</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </StaggerList>
                    </Grid>
                </Grid>

                {/* AR Dialog */}
                <Dialog open={showAR} onClose={() => setShowAR(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, bgcolor: '#1a1a2e', color: 'white' } }}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ViewInArIcon color="secondary" /> AR Spatial Preview
                    </DialogTitle>
                    <DialogContent>
                        {/* @ts-ignore */}
                        <ARProductVisualizer data={arData} loading={arAnalyzing} imageUrl={product.media.front_image} />
                        <Typography variant="caption" color="gray" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                            Powered by Sambanova & Cerebras Vision AI
                        </Typography>
                    </DialogContent>
                </Dialog>

                {isFree && features.adsEnabled && <AdBanner position="bottom" />}
            </Container>
        </PageTransition>
    );
}
