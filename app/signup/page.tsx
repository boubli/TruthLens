'use client';

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const password = data.get('password') as string;
        const confirmPassword = data.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setPasswordError(t('auth_password_mismatch'));
            return;
        }
        if (password.length < 6) {
            setPasswordError(t('auth_password_too_short'));
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
                setError(t('auth_captcha_failed'));
                return;
            }

            console.log("reCAPTCHA Token obtained, calling server...");
            const result = await registerUser(data, token);

            if (!result.success) {
                // If failed, reset captcha so user can try again
                recaptchaRef.current?.reset();
                throw new Error(result.error || t('auth_registration_failed'));
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
            setError(err.message || t('auth_create_account_failed'));
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
                        {t('auth_account_created')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {t('auth_check_email_verify')}
                    </Typography>
                    <AnimatedButton variant="contained" size="large" onClick={() => router.push('/login')} sx={{ mt: 2 }}>
                        {t('auth_go_to_login')}
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
                                {t('auth_create_account_title')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('auth_create_account_subtitle')}
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                name="email"
                                label={t('auth_email')}
                                type="email"
                                required
                                fullWidth
                                disabled={loading}
                                autoComplete="email"
                            />
                            <TextField
                                name="password"
                                label={t('auth_password')}
                                type="password"
                                required
                                fullWidth
                                helperText={t('auth_password_helper')}
                                disabled={loading}
                                autoComplete="new-password"
                            />
                            <TextField
                                name="confirmPassword"
                                label={t('auth_confirm_password')}
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
                                {loading ? t('auth_creating_account') : t('auth_sign_up_button')}
                            </AnimatedButton>
                        </Box>

                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('auth_already_have_account')}{' '}
                                <Link href="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>
                                    {t('auth_sign_in_link')}
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
                        {t('auth_signup_welcome_title')}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 400, textAlign: 'center' }}>
                        {t('auth_signup_welcome_desc')}
                    </Typography>
                </ScrollReveal>
            </Grid>
        </Grid>
    );
}
