'use client';

import React, { useState } from 'react';
import { Container, Paper, Typography, Button, Alert, Box, TextField } from '@mui/material';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { recoverAdminAccount } from '@/app/actions/adminRecovery';

/**
 * Temporary page to set current user as admin
 * Visit: http://localhost:3000/set-admin
 * Login first, then visit this page and click the button
 */
export default function SetAdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState('');
    const [code, setCode] = useState('');

    const setAsAdmin = async () => {
        if (!user) {
            setError('Please login first');
            return;
        }

        if (!token) {
            setError('Please enter a valid Token');
            return;
        }

        if (!user.email) {
            setError('User email is required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Validating 2FA token for:', user.email);

            // Use Server Action Key + Code
            const result = await recoverAdminAccount(token, code, user.email, user.uid);

            if (!result.success) {
                throw new Error(result.message);
            }

            setSuccess(true);
            console.log('✅ Successfully set', user.email, 'as admin!');

            // Redirect to admin dashboard after 2 seconds
            // Force reload to update claims/context
            setTimeout(() => {
                window.location.href = '/admin';
            }, 2000);
        } catch (err: any) {
            console.error('Error details:', err);
            setError(err.message || 'Failed to set admin role');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ mt: 5 }}>
                <Alert severity="warning">
                    Please <a href="/login" style={{ color: 'inherit', fontWeight: 'bold' }}>login</a> first
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 5 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Set Admin Role
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                    Current user: <strong>{user.email}</strong>
                </Typography>

                <Typography variant="body2" paragraph>
                    Click the button below to set this user as an administrator.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        ✅ Successfully set as admin! Redirecting to admin dashboard...
                    </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                    <TextField
                        label="Recovery Token ID"
                        fullWidth
                        variant="outlined"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="e.g. admin-recovery-key"
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <TextField
                        label="Authenticator Code (2FA)"
                        fullWidth
                        variant="outlined"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Integers only
                        placeholder="000 000"
                        inputProps={{ maxLength: 6 }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={setAsAdmin}
                        disabled={loading || success || !token}
                        fullWidth
                    >
                        {loading ? 'Verifying...' : success ? '✅ Done!' : 'Verify & Recover'}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => router.push('/profile')}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
