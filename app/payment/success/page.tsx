'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { verifyStripeSession } from '@/app/actions/stripe';
import { getAuth } from 'firebase/auth'; // Handle client auth
import { createPaymentRequest } from '@/services/paymentService';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying payment...');

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            setMessage('Invalid session.');
            return;
        }

        const verify = async () => {
            try {
                // 1. Verify with Stripe via Server Action
                const result = await verifyStripeSession(sessionId);

                if (result.success && result.metadata) {
                    // 2. Metadata contains user info
                    const { userId, tier, billingCycle, userEmail } = result.metadata;

                    // 3. Create 'Paid' Payment Request (which triggers upgrade in service)
                    // We re-use createPaymentRequest with type='paid' to record it and upgrade tier
                    // Note: Ideally, this happens via Webhook for security, but for immediate MVP 
                    // this confirms the payment logic client-triggered-but-server-verified.

                    // We need a way to ensure this runs cleanly:
                    // ideally createPaymentRequest runs on server or we call a new server action 'completeUpgrade'.
                    // For now, using the existing client service which calls Firestore directly 
                    // (protected by rules? Rules let user create request, but maybe not upgrade tier directly?)
                    // CHECK: paymentService.ts -> createPaymentRequest -> updateUserTier (admin only?)
                    // updateUserTier usually requires Admin. Wait, let's check paymentService.ts.
                    // createPaymentRequest calls updateUserTier. Firestore rules probably block 'subscription' update for normal users.
                    // SOLUTION: The 'upgrade' must happen via Server Action (Admin SDK).

                    // Calling a new Server Action to finalize
                    const upgradeResult = await finalizeUpgradeAction(userId, tier, billingCycle);

                    if (upgradeResult.success) {
                        setStatus('success');
                    } else {
                        throw new Error('Upgrade failed');
                    }
                } else {
                    throw new Error('Payment verification failed.');
                }
            } catch (error) {
                console.error(error);
                setStatus('error');
                setMessage('Verification failed. Please contact support if you were charged.');
            }
        };

        verify();
    }, [sessionId]);

    if (status === 'loading') {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (status === 'error') {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500 }}>
                    <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>Something went wrong</Typography>
                    <Typography color="text.secondary">{message}</Typography>
                    <Typography
                        variant="button"
                        sx={{ mt: 3, display: 'block', cursor: 'pointer', color: 'primary.main' }}
                        onClick={() => router.push('/')}
                    >
                        Return Home
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500 }}>
                <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                <Typography variant="h4" fontWeight="bold" gutterBottom>Payment Successful!</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Thank you for your purchase. Your account has been upgraded.
                </Typography>
                <Typography
                    variant="button"
                    sx={{ mt: 2, display: 'block', cursor: 'pointer', color: 'primary.main', fontWeight: 'bold' }}
                    onClick={() => router.push('/profile')}
                >
                    Go to Profile
                </Typography>
            </Paper>
        </Box>
    );
}

// Inline Server Action helper for this file (or move to actions/stripe.ts)
// Since this file is client, we can't define server action here directly unless mixed.
// Better to export it from actions/stripe.ts.
import { finalizeUpgradeAction } from '@/app/actions/stripe';
