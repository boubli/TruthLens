'use client';

import React, { useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper, Alert } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import EmailIcon from '@mui/icons-material/Email';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AnimatedButton from '@/components/ui/AnimatedButton';
import ScrollReveal from '@/components/animation/ScrollReveal';

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const email = data.get('email') as string;

        setLoading(true);
        setError('');

        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <EmailIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Check Your Email
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        We've sent password reset instructions to your email address.
                    </Typography>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <AnimatedButton variant="outlined" onClick={() => setSent(false)}>
                            Try Again
                        </AnimatedButton>
                        <AnimatedButton variant="contained" component={Link} href="/login">
                            Back to Login
                        </AnimatedButton>
                    </Box>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, width: '100%', bgcolor: 'transparent' }}>
                <ScrollReveal>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <LockResetIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Reset Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Enter your email address and we'll send you instructions to reset your password
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleReset} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            name="email"
                            label="Email Address"
                            type="email"
                            required
                            fullWidth
                            disabled={loading}
                            autoComplete="email"
                            autoFocus
                        />

                        <AnimatedButton
                            type="submit"
                            fullWidth
                            size="large"
                            variant="contained"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                            }}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </AnimatedButton>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Remember your password?{' '}
                                <Link href="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>
                                    Sign In
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </ScrollReveal>
            </Paper>
        </Container>
    );
}
