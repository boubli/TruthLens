'use client';

import React, { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Alert, CircularProgress, Divider } from '@mui/material';
import { generateAdminToken } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

export default function AdminRecoverySettingsPage() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [generatedData, setGeneratedData] = useState<{ token: string; secret: string; otpAuthUrl: string } | null>(null);
    const [email, setEmail] = useState('');

    const handleGenerate = async () => {
        if (!email) {
            alert('Please enter an email for this token.');
            return;
        }
        setLoading(true);
        try {
            const data = await generateAdminToken(email);
            setGeneratedData(data);
        } catch (error) {
            console.error(error);
            alert('Failed to generate token.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    if (userProfile?.role !== 'admin') return null;

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/settings')} sx={{ mb: 2 }}>
                Back to Settings
            </Button>

            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Admin 2FA Recovery Setup
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Create emergency recovery tokens secured by 2FA (Google Authenticator).
                Save the <strong>Token ID</strong> safely, and scan the <strong>QR Code</strong> with your phone.
            </Typography>

            <Paper sx={{ p: 4, mt: 4 }}>
                {!generatedData ? (
                    <Box>
                        <TextField
                            label="Admin Email for Recovery"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="my.personal.email@example.com"
                            helperText="The email address allowed to use this token."
                            sx={{ mb: 3 }}
                        />
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleGenerate}
                            disabled={loading || !email}
                        >
                            {loading ? 'Generating...' : 'Generate New 2FA Token'}
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center' }}>
                        <Alert severity="success" sx={{ mb: 4 }}>
                            <strong>Token Generated Successfully!</strong>
                        </Alert>

                        <Typography variant="h6" gutterBottom>Step 1: Save this Token ID</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 4 }}>
                            <Typography variant="h3" fontWeight="bold" fontFamily="monospace" sx={{ bgcolor: '#eee', p: 2, borderRadius: 2 }}>
                                {generatedData.token}
                            </Typography>
                            <Button onClick={() => copyToClipboard(generatedData.token)} startIcon={<ContentCopyIcon />}>
                                Copy
                            </Button>
                        </Box>

                        <Divider sx={{ my: 4 }} />

                        <Typography variant="h6" gutterBottom>Step 2: Scan QR with Google Authenticator</Typography>
                        <Box sx={{ border: '1px solid #ddd', p: 2, display: 'inline-block', borderRadius: 2, mb: 2, bgcolor: 'white' }}>
                            <QRCodeCanvas value={generatedData.otpAuthUrl} size={256} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Or enter secret manually: {generatedData.secret}
                        </Typography>

                        <Divider sx={{ my: 4 }} />

                        <Button variant="outlined" onClick={() => setGeneratedData(null)}>
                            Done (Clear Screen)
                        </Button>

                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <strong>Warning:</strong> You must save the Token ID and scan the QR now. You cannot view them again later.
                        </Alert>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
