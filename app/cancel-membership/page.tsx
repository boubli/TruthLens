'use client';

import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Alert, Paper, Box, CircularProgress } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useAuth } from '@/context/AuthContext';
import { createCancellationRequest } from '@/services/subscriptionService';
import { useRouter } from 'next/navigation';

export default function CancelMembershipPage() {
    const { user, tier } = useAuth();
    const router = useRouter();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If user is not logged in or is on free tier, handle gracefully
    if (!user) {
        return (
            <Container sx={{ mt: 10, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (tier === 'free') {
        return (
            <Container maxWidth="md" sx={{ mt: 10 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>No Active Subscription</Typography>
                    <Typography color="text.secondary" paragraph>
                        You are currently on the Free tier, so there is no membership to cancel.
                    </Typography>
                    <Button variant="contained" onClick={() => router.push('/profile')}>
                        Back to Profile
                    </Button>
                </Paper>
            </Container>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!reason.trim()) {
            setError('Please provide a reason for cancellation.');
            setLoading(false);
            return;
        }

        try {
            await createCancellationRequest(user.uid, user.email || 'No Email', reason);
            setSuccess(true);
        } catch (err: any) {
            setError('Failed to submit cancellation request. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Container maxWidth="md" sx={{ mt: 10 }}>
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                    <Box sx={{ color: 'success.main', mb: 2 }}>
                        <CheckIcon />
                    </Box>
                    <Typography variant="h5" gutterBottom fontWeight="bold">Request Received</Typography>
                    <Typography color="text.secondary" paragraph>
                        Your cancellation request has been submitted to our support team. We will process it shortly and notify you via email.
                    </Typography>
                    <Button variant="outlined" onClick={() => router.push('/profile')}>
                        Return to Profile
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 5, mb: 10 }}>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, color: 'warning.main' }}>
                    <WarningIcon fontSize="large" />
                    <Typography variant="h5" fontWeight="bold" color="text.primary">Cancel Membership</Typography>
                </Box>

                <Typography variant="body1" paragraph>
                    We're sorry to see you go! If you cancel, you will lose access to your <strong>{tier?.toUpperCase()}</strong> tier benefits at the end of your billing cycle.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    Please let us know why you are cancelling so we can improve TruthLens.
                </Alert>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <TextField
                    fullWidth
                    label="Reason for cancellation"
                    multiline
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="I'm cancelling because..."
                    required
                    sx={{ mb: 4 }}
                />

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="text"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Keep Membership
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Confirm Cancellation'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

function CheckIcon() {
    return (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
