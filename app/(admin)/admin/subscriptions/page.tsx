'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Card,
    CardContent,
    Alert,
    Snackbar,
    Divider,
    InputAdornment,
    Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { getSystemSettings, updateSystemSettings } from '@/services/systemService';

interface PricingConfig {
    plus: { monthly: number; lifetime: number };
    pro: { monthly: number; lifetime: number };
    ultimate: { monthly: number; lifetime: number };
}

export default function AdminSubscriptionsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const [pricing, setPricing] = useState<PricingConfig>({
        plus: { monthly: 3.99, lifetime: 19.99 },
        pro: { monthly: 7.99, lifetime: 49.99 },
        ultimate: { monthly: 14.99, lifetime: 79.99 }
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getSystemSettings();
            if (settings.pricing) {
                // Convert cents to dollars for display
                const pricingData: PricingConfig = {
                    plus: {
                        monthly: (settings.pricing.plus?.monthly || 399) / 100,
                        lifetime: (settings.pricing.plus?.lifetime || 1999) / 100
                    },
                    pro: {
                        monthly: (settings.pricing.pro?.monthly || 799) / 100,
                        lifetime: (settings.pricing.pro?.lifetime || 4999) / 100
                    },
                    ultimate: {
                        monthly: (settings.pricing.ultimate?.monthly || 1499) / 100,
                        lifetime: (settings.pricing.ultimate?.lifetime || 7999) / 100
                    }
                };
                setPricing(pricingData);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            setSnackbar({ open: true, message: 'Failed to load settings', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePricing = async () => {
        setSaving(true);
        try {
            // Convert dollars to cents for storage
            const pricingInCents = {
                plus: {
                    monthly: Math.round(pricing.plus.monthly * 100),
                    lifetime: Math.round(pricing.plus.lifetime * 100)
                },
                pro: {
                    monthly: Math.round(pricing.pro.monthly * 100),
                    lifetime: Math.round(pricing.pro.lifetime * 100)
                },
                ultimate: {
                    monthly: Math.round(pricing.ultimate.monthly * 100),
                    lifetime: Math.round(pricing.ultimate.lifetime * 100)
                }
            };

            await updateSystemSettings({ pricing: pricingInCents });
            setSnackbar({ open: true, message: '💰 Pricing updated successfully!', severity: 'success' });
        } catch (error) {
            console.error('Failed to save pricing:', error);
            setSnackbar({ open: true, message: 'Failed to save pricing', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const updatePrice = (tier: keyof PricingConfig, type: 'monthly' | 'lifetime', value: string) => {
        const numValue = parseFloat(value) || 0;
        setPricing(prev => ({
            ...prev,
            [tier]: {
                ...prev[tier],
                [type]: numValue
            }
        }));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    💳 Subscription Management
                </Typography>
                <Typography color="text.secondary">
                    Configure pricing and subscription settings for all tiers
                </Typography>
            </Box>

            {/* Pricing Configuration */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                        💰 Pricing Configuration
                    </Typography>
                    <Chip label="Prices in USD" color="primary" variant="outlined" />
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                    These prices will be used for Stripe checkout. Changes take effect immediately for new purchases.
                </Alert>

                <Grid container spacing={3}>
                    {/* Plus Tier */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ height: '100%', border: '2px solid', borderColor: 'primary.main' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
                                    Plus Tier
                                </Typography>
                                <Divider sx={{ my: 2 }} />

                                <TextField
                                    label="Monthly Price"
                                    type="number"
                                    fullWidth
                                    value={pricing.plus.monthly}
                                    onChange={(e) => updatePrice('plus', 'monthly', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    label="Lifetime Price"
                                    type="number"
                                    fullWidth
                                    value={pricing.plus.lifetime}
                                    onChange={(e) => updatePrice('plus', 'lifetime', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                />

                                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Current: ${pricing.plus.monthly}/mo or ${pricing.plus.lifetime} lifetime
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Pro Tier */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" color="success.main" gutterBottom>
                                    Pro Tier
                                </Typography>
                                <Divider sx={{ my: 2 }} />

                                <TextField
                                    label="Monthly Price"
                                    type="number"
                                    fullWidth
                                    value={pricing.pro.monthly}
                                    onChange={(e) => updatePrice('pro', 'monthly', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    label="Lifetime Price"
                                    type="number"
                                    fullWidth
                                    value={pricing.pro.lifetime}
                                    onChange={(e) => updatePrice('pro', 'lifetime', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                />

                                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Current: ${pricing.pro.monthly}/mo or ${pricing.pro.lifetime} lifetime
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Ultimate Tier */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ height: '100%', border: '2px solid', borderColor: 'warning.main' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" color="warning.main" gutterBottom>
                                    Ultimate Tier
                                </Typography>
                                <Divider sx={{ my: 2 }} />

                                <TextField
                                    label="Monthly Price"
                                    type="number"
                                    fullWidth
                                    value={pricing.ultimate.monthly}
                                    onChange={(e) => updatePrice('ultimate', 'monthly', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    label="Lifetime Price"
                                    type="number"
                                    fullWidth
                                    value={pricing.ultimate.lifetime}
                                    onChange={(e) => updatePrice('ultimate', 'lifetime', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                />

                                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Current: ${pricing.ultimate.monthly}/mo or ${pricing.ultimate.lifetime} lifetime
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<SaveIcon />}
                        onClick={handleSavePricing}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Pricing'}
                    </Button>
                </Box>
            </Paper>

            {/* Quick Actions */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    🎯 Quick Actions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Manage user subscriptions from the Users page
                </Typography>
                <Button variant="outlined" href="/admin/users">
                    Go to Users Management
                </Button>
            </Paper>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
