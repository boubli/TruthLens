'use client';

import React, { useState, useRef } from 'react';
import { Box, TextField, Typography, Alert, Grid, Paper } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AnimatedButton from '@/components/ui/AnimatedButton';
import ScrollReveal from '@/components/animation/ScrollReveal';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReCAPTCHA from 'react-google-recaptcha';
import { registerUser } from '@/app/actions';

const RECAPTCHA_SITE_KEY = '6LeYMiYsAAAAAJ4yVoBV_fuMTNQgO2eni4WSAc1P'; // v2 Site Key

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [signedUp, setSignedUp] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const router = useRouter();

    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const password = data.get('password') as string;
        const confirmPassword = data.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setPasswordError('');
        setError('');
        setLoading(true);

        try {
            // Execute invisible reCAPTCHA
            // This will trigger the challenge if needed, or return token immediately
            const token = await recaptchaRef.current?.executeAsync();

            if (!token) {
                console.warn('reCAPTCHA failed to generate token');
                setError('Security check failed. Please refresh and try again.');
                return;
            }

            console.log("reCAPTCHA Token obtained, calling server...");
            const result = await registerUser(data, token);

            if (!result.success) {
                // If failed, reset captcha so user can try again
                recaptchaRef.current?.reset();
                throw new Error(result.error || 'Registration failed.');
            }

            if (result.token) {
                console.log("Signing in with custom token...");
                await signInWithCustomToken(auth, result.token);

                if (auth.currentUser) {
                    await sendEmailVerification(auth.currentUser);
                }

                setSignedUp(true);
            }

        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to create account.');
            recaptchaRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    if (signedUp) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper sx={{ p: 6, maxWidth: 500, textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Account Created!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Please check your email to verify your account before logging in.
                    </Typography>
                    <AnimatedButton variant="contained" size="large" onClick={() => router.push('/login')} sx={{ mt: 2 }}>
                        Go to Login
                    </AnimatedButton>
                </Paper>
            </Box>
        );
    }

    return (
        <Grid container sx={{ minHeight: '100vh' }}>
            {/* Left Side - Form */}
            <Grid
                size={{ xs: 12, md: 6 }}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    p: { xs: 3, md: 8 },
                }}
            >
                <Paper elevation={0} sx={{ maxWidth: 450, mx: 'auto', width: '100%', p: { xs: 3, md: 4 }, bgcolor: 'transparent' }}>
                    <ScrollReveal>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <PersonAddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                Create Account
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Join TruthLens and start making healthier choices
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                                helperText="At least 6 characters"
                                disabled={loading}
                                autoComplete="new-password"
                            />
                            <TextField
                                name="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                required
                                fullWidth
                                error={!!passwordError}
                                helperText={passwordError}
                                disabled={loading}
                                autoComplete="new-password"
                            />

                            {/* Invisible reCAPTCHA - ensure it is mounted */}
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                size="invisible"
                                sitekey={RECAPTCHA_SITE_KEY}
                            />

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
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </AnimatedButton>
                        </Box>

                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Already have an account?{' '}
                                <Link href="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>
                                    Sign In
                                </Link>
                            </Typography>
                        </Box>
                    </ScrollReveal>
                </Paper>
            </Grid>

            {/* Right Side - Branding */}
            <Grid
                size={{ xs: 12, md: 6 }}
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #00F0FF 0%, #6C63FF 100%)',
                    color: 'white',
                    p: 6,
                }}
            >
                <ScrollReveal>
                    <QrCodeScannerIcon sx={{ fontSize: 80, mb: 3 }} />
                    <Typography variant="h3" fontWeight="bold" gutterBottom textAlign="center">
                        Start Your Health Journey
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 400, textAlign: 'center' }}>
                        Get instant AI insights on every product you scan
                    </Typography>
                </ScrollReveal>
            </Grid>
        </Grid>
    );
}
