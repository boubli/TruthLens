'use client';

import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Button, Box, Chip, Alert, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Grid } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DiamondIcon from '@mui/icons-material/Diamond';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createPaymentRequest, getPendingPaymentRequest, cancelPaymentRequest } from '@/services/paymentService';
import { createCheckoutSession } from '@/app/actions/stripe';
import { PaymentRequest } from '@/types/payment';
import PageTransition from '@/components/animation/PageTransition';
import ScrollReveal from '@/components/animation/ScrollReveal';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { UserTier } from '@/types/user';

export default function UpgradePage() {
    const router = useRouter();
    const { user, tier, refreshProfile, tierConfig } = useAuth();
    const [loading, setLoading] = useState(false);
    const [pendingRequest, setPendingRequest] = useState<PaymentRequest | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [billingCycle, setBillingCycle] = useState<'monthly' | 'lifetime'>('monthly');

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        checkPendingRequest();
    }, [user, router]);

    const checkPendingRequest = async () => {
        if (!user) return;
        const request = await getPendingPaymentRequest(user.uid);
        setPendingRequest(request);
    };

    const handleUpgradeRequest = async (targetTier: 'plus' | 'pro' | 'ultimate', type: 'manual' | 'paid') => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            if (type === 'manual') {
                await createPaymentRequest(user.uid, user.email || '', user.displayName || 'User', targetTier, 'manual', billingCycle);
                setSuccess(true);
                setTimeout(() => {
                    checkPendingRequest();
                }, 1000);
            } else {
                // Real Stripe Flow
                const { url } = await createCheckoutSession({
                    userId: user.uid,
                    userEmail: user.email || '',
                    tier: targetTier,
                    billingCycle
                });

                if (url) {
                    window.location.href = url; // Redirect to Stripe
                } else {
                    throw new Error('Failed to start checkout');
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to process request');
            setLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!pendingRequest || !pendingRequest.id) return;
        if (confirm('Are you sure you want to cancel this upgrade request?')) {
            setLoading(true);
            try {
                await cancelPaymentRequest(pendingRequest.id);
                setPendingRequest(null);
                setSuccess(false); // Reset success state if any
            } catch (err) {
                console.error('Failed to cancel request:', err);
                setError('Failed to cancel request');
            } finally {
                setLoading(false);
            }
        }
    };

    if (!user) return <LoadingSpinner fullScreen />;

    if (pendingRequest) {
        return (
            <PageTransition>
                <Container maxWidth="md" sx={{ mt: 10, mb: 10 }}>
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Upgrade Request Pending</Typography>
                            <Typography variant="body2">
                                Your upgrade request for <strong>{pendingRequest.tier.toUpperCase()}</strong> ({pendingRequest.billingCycle || 'monthly'}) is awaiting admin approval.
                            </Typography>
                        </Alert>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 4 }}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleCancelRequest}
                                disabled={loading}
                            >
                                {loading ? 'Cancelling...' : 'Cancel Request'}
                            </Button>

                            <Button
                                variant="text"
                                onClick={() => router.push('/')}
                                sx={{ color: 'text.secondary' }}
                            >
                                Back to Home
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            </PageTransition>
        );
    }

    const tiers = tierConfig ? (['plus', 'pro', 'ultimate'] as const).map(id => {
        const def = tierConfig[id];
        // Helper to format feature list based on config flags
        const featureList = [];
        if (def.features.dailyScanLimit === -1) featureList.push('Unlimited Scans');
        else featureList.push(`${def.features.dailyScanLimit} Daily Scans`);

        if (def.features.multiScanLimit > 1) featureList.push(`${def.features.multiScanLimit} Product Multi-Scan`);

        featureList.push(def.features.aiAnalysis === 'premium' ? 'Premium AI Analysis' : (def.features.aiAnalysis === 'advanced' ? 'Advanced AI Insights' : 'Basic AI'));

        if (def.features.historyLimit === -1) featureList.push('Unlimited History');
        else featureList.push(`${def.features.historyLimit} History Items`);

        if (def.features.exportFormats.length > 0) featureList.push(`${def.features.exportFormats.join('/').toUpperCase()} Export`);
        if (def.features.aiTruthDetector) featureList.push('AI Truth Detector');
        if (def.features.smartGrading) featureList.push('Smart Grading');
        if (def.features.whiteLabel) featureList.push('White Label Reports');
        if (def.features.prioritySupport) featureList.push('Priority Support');
        if (!def.features.adsEnabled) featureList.push('Ad-Free Experience');

        return {
            id: def.id,
            name: def.name,
            price: billingCycle === 'monthly' ? `$${def.pricing.monthly}` : `$${def.pricing.lifetime}`,
            originalPrice: billingCycle === 'lifetime' && def.metadata.originalPriceLifetime ? `$${def.metadata.originalPriceLifetime}` : null,
            period: billingCycle === 'monthly' ? '/mo' : '/once',
            color: def.id === 'pro' ? '#FFD700' : (def.id === 'ultimate' ? '#E040FB' : 'primary.main'),
            icon: def.id === 'pro' ? <WorkspacePremiumIcon fontSize="large" /> : (def.id === 'ultimate' ? <DiamondIcon fontSize="large" /> : <StarIcon fontSize="large" />),
            features: featureList,
            isPopular: def.metadata.isPopular || false,
        };
    }) : [
        {
            id: 'plus',
            name: 'Plus',
            price: billingCycle === 'monthly' ? '$3.99' : '$19.99',
            originalPrice: billingCycle === 'lifetime' ? '$39.99' : null,
            period: billingCycle === 'monthly' ? '/mo' : '/once',
            color: 'primary.main',
            icon: <StarIcon fontSize="large" />,
            features: [
                '20 Daily Scans',
                'Advanced AI Insights',
                '3 Product Multi-Scan',
                '50 History Items',
                'CSV Export',
                'Ad-Free Experience'
            ],
            isPopular: false,
        },
        {
            id: 'pro',
            name: 'Pro',
            price: billingCycle === 'monthly' ? '$7.99' : '$49.99',
            originalPrice: billingCycle === 'lifetime' ? '$99.99' : null,
            period: billingCycle === 'monthly' ? '/mo' : '/once',
            color: '#FFD700', // Gold
            icon: <WorkspacePremiumIcon fontSize="large" />,
            features: [
                'Unlimited Scans',
                'Premium AI Analysis',
                '10 Product Multi-Scan',
                'Unlimited History',
                'PDF & CSV Export',
                'AI Truth Detector',
                'Smart Grading'
            ],
            isPopular: true,
        },
        {
            id: 'ultimate',
            name: 'Ultimate',
            price: billingCycle === 'monthly' ? '$14.99' : '$79.99',
            originalPrice: billingCycle === 'lifetime' ? '$159.99' : null,
            period: billingCycle === 'monthly' ? '/mo' : '/once',
            color: '#E040FB', // Purple detail
            icon: <DiamondIcon fontSize="large" />,
            features: [
                'Everything in Pro',
                'Unlimited Multi-Scan',
                'White Label Reports',
                'Priority Support (Fast Lane)',
                'Early Beta Access',
                'Custom Health Alerts',
                'Export to Excel (XLSX)',
                'Dedicated Account Support'
            ],
            isPopular: false,
        }
    ];

    return (
        <PageTransition>
            <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        Choose Your Plan
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Unlock the power of AI food analysis with our flexible pricing tiers.
                    </Typography>
                </Box>

                {/* Billing Cycle Toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 8 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            display: 'flex',
                            p: 0.5,
                            borderRadius: 10,
                            bgcolor: 'grey.100',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Button
                            onClick={() => setBillingCycle('monthly')}
                            variant={billingCycle === 'monthly' ? 'contained' : 'text'}
                            sx={{
                                borderRadius: 10,
                                px: 4,
                                py: 1,
                                boxShadow: billingCycle === 'monthly' ? 2 : 0,
                                bgcolor: billingCycle === 'monthly' ? 'white' : 'transparent',
                                color: billingCycle === 'monthly' ? 'primary.main' : 'text.secondary',
                                '&:hover': { bgcolor: billingCycle === 'monthly' ? 'white' : 'transparent' }
                            }}
                        >
                            Monthly
                        </Button>
                        <Button
                            onClick={() => setBillingCycle('lifetime')}
                            variant={billingCycle === 'lifetime' ? 'contained' : 'text'}
                            sx={{
                                borderRadius: 10,
                                px: 4,
                                py: 1,
                                boxShadow: billingCycle === 'lifetime' ? 2 : 0,
                                bgcolor: billingCycle === 'lifetime' ? 'primary.main' : 'transparent',
                                color: billingCycle === 'lifetime' ? 'white' : 'text.secondary',
                                '&:hover': { bgcolor: billingCycle === 'lifetime' ? 'primary.main' : 'transparent' }
                            }}
                        >
                            Lifetime (Launch Sale)
                        </Button>
                    </Paper>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>{error}</Alert>}

                <Grid container spacing={4} alignItems="stretch" justifyContent="center">
                    {(() => {
                        const tierLevels: Record<string, number> = { free: 0, plus: 1, pro: 2, ultimate: 3 };
                        const currentLevel = tierLevels[tier || 'free'] || 0;
                        const visibleTiers = tiers.filter((plan) => (tierLevels[plan.id] || 0) > currentLevel);

                        if (visibleTiers.length === 0) {
                            return (
                                <Grid size={{ xs: 12 }}>
                                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper' }}>
                                        <DiamondIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                                            You're on the Top Tier!
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                            You have access to all features. Thank you for being an Ultimate member.
                                        </Typography>
                                        <Button variant="outlined" onClick={() => router.push('/profile')}>
                                            Go to Profile
                                        </Button>
                                    </Paper>
                                </Grid>
                            );
                        }

                        return visibleTiers.map((plan) => {
                            const isCurrent = tier === plan.id;
                            const isPopular = plan.isPopular;

                            return (
                                <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
                                    <ScrollReveal delay={0.1 * (plan.id === 'plus' ? 1 : plan.id === 'pro' ? 2 : 3)} className="h-full">
                                        <Paper
                                            elevation={isPopular ? 8 : 2}
                                            sx={{
                                                p: 4,
                                                height: '100%',
                                                borderRadius: 4,
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'transform 0.2s',
                                                border: isPopular ? '2px solid' : '1px solid',
                                                borderColor: isPopular ? 'warning.main' : 'divider',
                                                transform: isPopular ? { md: 'scale(1.05)' } : 'none',
                                                zIndex: isPopular ? 2 : 1,
                                                '&:hover': {
                                                    transform: isPopular ? { md: 'scale(1.06)' } : 'translateY(-4px)',
                                                    boxShadow: 8
                                                }
                                            }}
                                        >
                                            {isPopular && (
                                                <Chip
                                                    label="MOST POPULAR"
                                                    color="warning"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: -16,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        fontWeight: 'bold',
                                                        boxShadow: 2
                                                    }}
                                                />
                                            )}

                                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                                <Box sx={{ color: plan.color, mb: 2 }}>
                                                    {plan.icon}
                                                </Box>
                                                <Typography variant="h5" fontWeight="bold">
                                                    {plan.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mt: 2, flexDirection: 'column' }}>
                                                    {plan.originalPrice && (
                                                        <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary', mb: -0.5 }}>
                                                            {plan.originalPrice}
                                                        </Typography>
                                                    )}
                                                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', width: '100%' }}>
                                                        <Typography variant="h3" fontWeight="bold" color={plan.originalPrice ? 'error.main' : 'inherit'}>
                                                            {plan.price}
                                                        </Typography>
                                                        <Typography variant="subtitle1" color="text.secondary">
                                                            {plan.period}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <List sx={{ mb: 4, flex: 1 }}>
                                                {plan.features.map((feature, idx) => (
                                                    <ListItem key={idx} disablePadding sx={{ mb: 1.5 }}>
                                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                                            <CheckCircleIcon fontSize="small" color={plan.id === 'free' ? 'disabled' : 'success'} />
                                                        </ListItemIcon>
                                                        <ListItemText primary={feature} secondaryTypographyProps={{ variant: 'caption' }} />
                                                    </ListItem>
                                                ))}
                                            </List>

                                            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <AnimatedButton
                                                    variant="contained"
                                                    color={isPopular ? 'warning' : 'primary'}
                                                    fullWidth
                                                    size="large"
                                                    onClick={() => handleUpgradeRequest(plan.id as any, 'paid')}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Processing...' : billingCycle === 'lifetime' ? 'Get Lifetime Access' : `Subscribe Monthly`}
                                                </AnimatedButton>
                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    disabled={loading}
                                                    onClick={() => handleUpgradeRequest(plan.id as any, 'manual')}
                                                    sx={{ color: 'text.secondary' }}
                                                >
                                                    Request Free Access
                                                </Button>
                                            </Box>
                                        </Paper>
                                    </ScrollReveal>
                                </Grid>
                            );
                        });
                    })()}
                </Grid>

                <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <Button onClick={() => router.push('/')} color="inherit">
                        Maybe Later
                    </Button>
                </Box>
            </Container>
        </PageTransition>
    );
}
