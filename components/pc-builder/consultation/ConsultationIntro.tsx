'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedIcon from '@mui/icons-material/Verified';
import PaymentIcon from '@mui/icons-material/Payment';
import { useAuth } from '@/context/AuthContext';
import { createConsultationCheckout } from '@/app/actions/stripe';
import { getSystemSettings } from '@/services/systemService';

export default function ConsultationIntro() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [price, setPrice] = useState<number>(2000); // Default 2000 cents
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSystemSettings().then(settings => {
            if (settings.pcConsultationPrice) {
                setPrice(settings.pcConsultationPrice);
            }
        });
    }, []);

    const handlePay = async () => {
        if (!user || !user.email) return;
        setLoading(true);
        setError(null);
        try {
            const result = await createConsultationCheckout(user.uid, user.email);
            if (result.url) {
                window.location.href = result.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Payment initiation failed');
        } finally {
            setLoading(false);
        }
    };

    const formattedPrice = (price / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                textAlign: 'center',
                maxWidth: 600,
                mx: 'auto'
            }}
        >
            <VerifiedIcon sx={{ fontSize: 60, color: '#10B981', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Expert PC Build Consultation
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Get a custom, hand-picked PC configuration designed specifically for your needs by our hardware experts.
            </Typography>

            <List sx={{ textAlign: 'left', mb: 4, bgcolor: 'background.paper', borderRadius: 2, p: 2 }}>
                {[
                    'Personalized parts selection based on your budget and goals',
                    'Compatibility verification and bottleneck checks',
                    'Local availability and pricing optimization',
                    'Direct video guides and assembly tips included'
                ].map((text, i) => (
                    <ListItem key={i} disablePadding sx={{ mb: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 36, color: '#10B981' }}>
                            <CheckCircleOutlineIcon />
                        </ListItemIcon>
                        <ListItemText primary={text} />
                    </ListItem>
                ))}
            </List>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Chip label={`Service Fee: ${formattedPrice}`} color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                onClick={handlePay}
                disabled={loading}
                sx={{
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #10B981 30%, #3B82F6 90%)',
                    boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                }}
            >
                {loading ? 'Processing...' : `Agree & Pay ${formattedPrice}`}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Secure payment via Stripe. Fully refundable if we cannot meet your request.
            </Typography>
        </Paper>
    );
}
