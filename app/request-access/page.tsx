'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Paper, TextField, Button,
    CircularProgress, Alert, FormControlLabel, Switch,
    Stepper, Step, StepLabel, InputAdornment, Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import KeyIcon from '@mui/icons-material/Key';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { validateAccessCode, submitAccessRequest } from '@/services/accessRequestService';
// Zero storage implementation
import { motion } from 'framer-motion';
import AIProcessingOverlay from '@/components/ui/AIProcessingOverlay';

const steps = ['Enter Code', 'Fill Details', 'Submit'];

export default function RequestAccessPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [autoApproved, setAutoApproved] = useState(false);
    const [approvedTier, setApprovedTier] = useState<string>('');
    const [showAIOverlay, setShowAIOverlay] = useState(false);

    // Step 1: Code
    const [code, setCode] = useState('');
    const [codeValid, setCodeValid] = useState(false);
    const [codeTier, setCodeTier] = useState<string>('');

    // Step 2: Form
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [useAccountEmail, setUseAccountEmail] = useState(true);
    const [phone, setPhone] = useState('');
    const [reason, setReason] = useState('');
    const [isStudent, setIsStudent] = useState(false);
    const [studentProof, setStudentProof] = useState<File | null>(null);
    const [uploadingProof, setUploadingProof] = useState(false);

    // Pre-fill from profile
    useEffect(() => {
        if (userProfile) {
            setFullName(userProfile.displayName || '');
            setEmail(userProfile.email || '');
        }
    }, [userProfile]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/request-access');
        }
    }, [user, authLoading, router]);

    const handleValidateCode = async () => {
        if (!code.trim()) {
            setError('Please enter an access code');
            return;
        }

        setLoading(true);
        setError('');

        const result = await validateAccessCode(code);

        if (result.valid && result.codeData) {
            setCodeValid(true);
            setCodeTier(result.codeData.tier);
            setActiveStep(1);
        } else {
            setError(result.error || 'Invalid code');
        }

        setLoading(false);
    };

    const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            setError('Please upload an image or PDF file');
            return;
        }

        setStudentProof(file);
    };

    const handleSubmit = async () => {
        // Validate form
        if (!fullName.trim()) { setError('Full name is required'); return; }
        if (!username.trim()) { setError('Username is required'); return; }
        if (!useAccountEmail && !email.trim()) { setError('Email is required'); return; }
        if (!phone.trim()) { setError('Phone number is required'); return; }
        if (!reason.trim()) { setError('Reason is required'); return; }
        if (isStudent && !studentProof) { setError('Student proof is required'); return; }

        setLoading(true);
        setError('');

        if (isStudent && studentProof) {
            setShowAIOverlay(true); // Show AI animation
        }

        try {
            // Convert student proof to base64 for AI verification
            let studentProofBase64: string | null = null;
            let studentProofUrl: string | null = null;

            if (isStudent && studentProof && user) {
                setUploadingProof(true);

                // Convert to base64
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const base64 = reader.result as string;
                        const base64Data = base64.split(',')[1]; // Remove data:image prefix
                        resolve(base64Data);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(studentProof);
                });
                studentProofBase64 = await base64Promise;
                setUploadingProof(false);
            }

            // Submit request with base64 for AI verification
            const result = await submitAccessRequest(user!.uid, {
                // ... fields
                fullName,
                username,
                email: useAccountEmail ? (userProfile?.email || '') : email,
                useAccountEmail,
                phone,
                reason,
                code,
                isStudent,
                studentProofUrl,
                studentProofBase64
            });

            if (result.success) {
                // Keep overlay for a moment to show "Finalizing"
                if (isStudent) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                setShowAIOverlay(false);
                setSuccess(true);
                // ...
            } else {
                setShowAIOverlay(false);
                setError(result.error || 'Failed to submit request');
            }
        } catch (err: any) {
            setShowAIOverlay(false);
            setError(err.message || 'An error occurred');
        }

        setLoading(false);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
            <AIProcessingOverlay open={showAIOverlay} />

            <Container maxWidth="sm">

                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                    sx={{ mb: 3 }}
                >
                    Back
                </Button>

                <Paper
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ p: 4, borderRadius: 3 }}
                >
                    <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
                        🎁 Request Free Access
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
                        Get 3 months of premium access
                    </Typography>

                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    {/* Step 1: Enter Code */}
                    {activeStep === 0 && (
                        <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Enter your access code provided by admin:
                            </Typography>
                            <TextField
                                fullWidth
                                label="Access Code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g., TL2024-STUDENT"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><KeyIcon /></InputAdornment>
                                }}
                                sx={{ mb: 3 }}
                            />
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleValidateCode}
                                disabled={loading || !code.trim()}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Validate Code'}
                            </Button>
                        </Box>
                    )}

                    {/* Step 2: Fill Form */}
                    {activeStep === 1 && (
                        <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Code valid! This grants <Chip label={codeTier.toUpperCase()} color="primary" size="small" /> access for 3 months.
                            </Alert>

                            <TextField
                                fullWidth
                                label="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
                                }}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Your TruthLens username"
                                sx={{ mb: 2 }}
                            />

                            <FormControlLabel
                                control={<Switch checked={useAccountEmail} onChange={(e) => setUseAccountEmail(e.target.checked)} />}
                                label={`Use account email (${userProfile?.email || 'N/A'})`}
                                sx={{ mb: 1 }}
                            />

                            {!useAccountEmail && (
                                <TextField
                                    fullWidth
                                    label="Alternative Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>
                                    }}
                                    sx={{ mb: 2 }}
                                />
                            )}

                            <TextField
                                fullWidth
                                label="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 234 567 8900"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment>
                                }}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="Reason for Request"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                multiline
                                rows={3}
                                placeholder="Why do you need free access?"
                                sx={{ mb: 3 }}
                            />

                            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                                <FormControlLabel
                                    control={<Switch checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)} color="secondary" />}
                                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SchoolIcon /> I am a student</Box>}
                                />
                                {isStudent && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                            Upload student ID or proof (instant approval!)
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<CloudUploadIcon />}
                                            fullWidth
                                        >
                                            {studentProof ? studentProof.name : 'Upload Proof'}
                                            <input type="file" hidden accept="image/*,.pdf" onChange={handleProofUpload} />
                                        </Button>
                                    </Box>
                                )}
                            </Paper>

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            >
                                {loading ? (uploadingProof ? 'Uploading...' : <CircularProgress size={24} />) : 'Submit Request'}
                            </Button>
                        </Box>
                    )}

                    {/* Step 3: Success */}
                    {activeStep === 2 && success && (
                        <Box component={motion.div} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} textAlign="center">
                            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                {autoApproved ? '🎉 Congratulations!' : 'Request Submitted!'}
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                                {autoApproved && `You now have ${approvedTier.toUpperCase()} Tier!`}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                {autoApproved
                                    ? `Your student verification was approved by our AI! You now have full ${approvedTier.toUpperCase()} access for 3 months. Page will refresh in 3 seconds...`
                                    : 'Your request is pending admin review. You will be notified once it is processed.'}
                            </Typography>
                            {!autoApproved && (
                                <Button variant="contained" onClick={() => router.push('/profile')}>
                                    Go to Profile
                                </Button>
                            )}
                        </Box>
                    )}
                </Paper>
            </Container>
        </Box >
    );
}
