'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Grid, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithPopup, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ScrollReveal from '@/components/animation/ScrollReveal';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const { getUserProfile } = await import('@/services/subscriptionService');
            const profile = await getUserProfile(user.uid, user.email || '', user.displayName, user.photoURL);

            // @ts-ignore
            if (profile.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Failed to login with Google.');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setVerificationSent(false);

        const data = new FormData(e.target as HTMLFormElement);
        const email = data.get('email') as string;
        const password = data.get('password') as string;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                setUnverifiedEmail(email);
                setError('Please verify your email address before logging in.');
                await auth.signOut();
                setLoading(false);
                return;
            }

            const { getUserProfile } = await import('@/services/subscriptionService');
            const profile = await getUserProfile(user.uid, user.email || '', user.displayName, user.photoURL);

            // @ts-ignore
            if (profile.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found. Please sign up first.');
            } else {
                setError(err.message || 'Failed to login.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!unverifiedEmail) return;
        setLoading(true);
        try {
            const data = new FormData(document.querySelector('form') as HTMLFormElement);
            const password = data.get('password') as string;
            const userCredential = await signInWithEmailAndPassword(auth, unverifiedEmail, password);
            await sendEmailVerification(userCredential.user);
            await auth.signOut();
            setVerificationSent(true);
            setError('');
        } catch (err) {
            setError('Failed to resend verification email.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !error) {
        return <LoadingSpinner fullScreen message='Logging in...' />;
    }

    return (
        <Grid container sx={{ minHeight: '100vh' }}>
            {/* Left Side - Branding */}
            <Grid
                size={{ xs: 12, md: 6 }}
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #6C63FF 0%, #00F0FF 100%)',
                    color: 'white',
                    p: 6,
                }}
            >
                <ScrollReveal>
                    <QrCodeScannerIcon sx={{ fontSize: 80, mb: 3 }} />
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        Welcome Back to TruthLens
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 400, textAlign: 'center' }}>
                        Scan products, get instant AI health insights, and make smarter choices.
                    </Typography>
                </ScrollReveal>
            </Grid>

            {/* Right Side - Login Form */}
            <Grid
                size={{ xs: 12, md: 6 }}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    p: { xs: 3, md: 8 },
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: 450,
                        mx: 'auto',
                        width: '100%',
                        p: { xs: 3, md: 4 },
                        bgcolor: 'transparent',
                    }}
                >
                    <ScrollReveal>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <LockOutlinedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                Sign In
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Enter your credentials to access your account
                            </Typography>
                        </Box>

                        {error && (
                            <Alert
                                severity="error"
                                sx={{ mb: 3 }}
                                action={
                                    unverifiedEmail && !verificationSent ? (
                                        <Button color="inherit" size="small" onClick={handleResendVerification}>
                                            Resend
                                        </Button>
                                    ) : null
                                }
                            >
                                {error}
                            </Alert>
                        )}

                        {verificationSent && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Verification email sent! Check your inbox.
                            </Alert>
                        )}

                        <AnimatedButton
                            fullWidth
                            size="large"
                            variant="outlined"
                            startIcon={<GoogleIcon />}
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                mb: 3,
                                borderColor: 'rgba(108,99,255,0.3)',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                },
                            }}
                        >
                            Continue with Google
                        </AnimatedButton>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                            <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                                OR
                            </Typography>
                            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                        </Box>

                        <Box component="form" onSubmit={handleEmailLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                name="email"
                                label="Email Address"
                                type="email"
                                required
                                fullWidth
                                disabled={loading}
                                autoComplete="email"
                            />
                            <TextField
                                name="password"
                                label="Password"
                                type="password"
                                required
                                fullWidth
                                disabled={loading}
                                autoComplete="current-password"
                            />

                            <Box sx={{ textAlign: 'right', mt: -1 }}>
                                <Link href="/reset-password" style={{ fontSize: '0.875rem', color: '#6C63FF', textDecoration: 'none' }}>
                                    Forgot Password?
                                </Link>
                            </Box>

                            <AnimatedButton
                                type="submit"
                                fullWidth
                                size="large"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    mt: 1,
                                    background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                                }}
                            >
                                {loading ? 'Logging in...' : 'Sign In'}
                            </AnimatedButton>
                        </Box>

                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Don't have an account?{' '}
                                <Link href="/signup" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>
                                    Sign Up
                                </Link>
                            </Typography>
                        </Box>
                    </ScrollReveal>
                </Paper>
            </Grid>
        </Grid>
    );
}
