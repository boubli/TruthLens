/**
 * PC Builder Page
 * Main entry point for the PC Geek Builder feature
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Slider,
    TextField,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    IconButton,
    Chip,
    LinearProgress,
    Alert,
    Snackbar,
    Tooltip,
    Divider,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MemoryIcon from '@mui/icons-material/Memory';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SaveIcon from '@mui/icons-material/Save';
import SpeedIcon from '@mui/icons-material/Speed';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import BuildGeneratingView, { BuildStage } from '@/components/pc-builder/BuildGeneratingView';
import { SavedBuild, PCComponent, PCBuildRequest, HardwareInput } from '@/types/pcBuilder';
import ConsultationIntro from '@/components/pc-builder/consultation/ConsultationIntro';
import ConsultationForm from '@/components/pc-builder/consultation/ConsultationForm';
import ConsultationStatus from '@/components/pc-builder/consultation/ConsultationStatus';
import { verifyPaymentAndCreateRequest } from '@/app/actions/stripe';

// Component display config
const componentConfig: Record<string, { label: string; color: string }> = {
    cpu: { label: 'CPU', color: '#6C63FF' },
    gpu: { label: 'GPU', color: '#00F0FF' },
    ram: { label: 'RAM', color: '#10B981' },
    motherboard: { label: 'Motherboard', color: '#F59E0B' },
    psu: { label: 'PSU', color: '#EF4444' },
    case: { label: 'Case', color: '#8B5CF6' },
    storage: { label: 'Storage', color: '#EC4899' },
    cooler: { label: 'Cooler', color: '#3B82F6' },
};

export default function PCBuilderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, features, loading: authLoading, tier } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    // Consultation State
    const [consultationRequest, setConsultationRequest] = useState<PCBuildRequest | null>(null);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);

    // AI Builder State
    const [mode, setMode] = useState<'budget' | 'hardware'>('budget');
    const [budget, setBudget] = useState<number>(1500);
    const [hardwareInput, setHardwareInput] = useState<HardwareInput>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [stage, setStage] = useState<BuildStage>('drafting');
    const [build, setBuild] = useState<SavedBuild | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Access check - use tier fallback
    const hasAccess = features?.pcBuilder || tier === 'pro' || tier === 'ultimate';

    // 1. Listen for Consultation Request Status
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'pc_build_requests', user.uid), (docSnap) => {
            if (docSnap.exists()) {
                setConsultationRequest(docSnap.data() as PCBuildRequest);
            } else {
                setConsultationRequest(null);
            }
        });
        return () => unsub();
    }, [user]);

    // 2. Handle Payment Return
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const sessionId = searchParams.get('session_id');

        if (paymentStatus === 'success' && sessionId && !paymentVerified) {
            setVerifyingPayment(true);
            verifyPaymentAndCreateRequest(sessionId)
                .then((res) => {
                    if (res.success) {
                        setPaymentVerified(true);
                        setActiveTab(1); // Switch to Consultation tab
                        // Clear URL params
                        router.replace('/pc-builder');
                    } else {
                        setError('Payment verification failed.');
                    }
                })
                .finally(() => setVerifyingPayment(false));
        }
    }, [searchParams, paymentVerified, router]);

    if (authLoading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Loading...</Typography>
            </Box>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    if (!hasAccess) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 4 }}>
                <Container maxWidth="sm">
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.05) 0%, rgba(0, 240, 255, 0.05) 100%)'
                        }}
                    >
                        <MemoryIcon sx={{ fontSize: 60, color: '#6C63FF', mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            PC Geek Builder
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Build optimized PCs with AI-powered compatibility analysis and real-time pricing.
                        </Typography>
                        <Chip label="Pro / Ultimate Only" color="warning" sx={{ mb: 3 }} />
                        <Button
                            variant="contained"
                            onClick={() => router.push('/upgrade')}
                            sx={{
                                background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                                px: 4
                            }}
                        >
                            Upgrade Now
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

    const handleGenerate = async () => {
        setError(null);
        setIsGenerating(true);
        setStage('drafting');
        setBuild(null);

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Not authenticated');

            // Simulate stage progression for UX
            const stageTimer = setTimeout(() => setStage('pricing'), 3000);
            const stageTimer2 = setTimeout(() => setStage('optimizing'), 7000);

            const response = await fetch('/api/pc-builder/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    mode,
                    budget: mode === 'budget' ? budget : undefined,
                    existingHardware: mode === 'hardware' ? hardwareInput : undefined
                })
            });

            clearTimeout(stageTimer);
            clearTimeout(stageTimer2);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate build');
            }

            setStage('complete');
            setBuild(data.build);

        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!build) return;

        setIsSaving(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Not authenticated');

            const response = await fetch('/api/pc-builder/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(build)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save');
            }

            setSaveSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const formatPrice = (price?: number) => {
        if (!price) return 'N/A';
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const renderConsultationTab = () => {
        if (verifyingPayment) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography>Verifying Payment...</Typography>
                </Box>
            );
        }

        // Logic flow:
        // 1. No request OR status 'pending_payment' (if logic allows retrying) -> Show Intro
        // 2. Status 'paid_pending_form' -> Show Form
        // 3. Status 'submitted' or 'completed' -> Show Status

        const status = consultationRequest?.status;

        if (!consultationRequest || status === 'pending_payment') {
            return <ConsultationIntro />;
        }

        if (status === 'paid_pending_form') {
            return <ConsultationForm onSuccess={() => { }} />; // Firestore listener will auto-update UI to 'submitted'
        }

        return <ConsultationStatus request={consultationRequest} />;
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
            {/* Header */}
            <Box
                component={motion.div}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{
                    pt: 2,
                    pb: 3,
                    px: 2,
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '0 0 24px 24px',
                    mb: 3
                }}
            >
                <Container maxWidth="md">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => router.back()} sx={{ color: 'white' }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
                                PC Geek Builder
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                Expert tools for your perfect rig
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="md">
                {/* Tabs */}
                <Paper sx={{ mb: 4, borderRadius: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        variant="fullWidth"
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab icon={<AutoAwesomeIcon />} label="AI Auto-Build" iconPosition="start" />
                        <Tab icon={<EngineeringIcon />} label="Request PC Build" iconPosition="start" />
                    </Tabs>
                </Paper>

                <AnimatePresence mode="wait">
                    {/* Tab 0: AI Auto-Build */}
                    {activeTab === 0 && (
                        <motion.div
                            key="ai-build"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Generating State */}
                            {isGenerating && (
                                <BuildGeneratingView stage={stage} />
                            )}

                            {/* Results View */}
                            {build && !isGenerating && (
                                <Box>
                                    {/* Metrics Cards */}
                                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                        {/* Bottleneck Gauge */}
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                flex: 1,
                                                minWidth: 150,
                                                p: 2,
                                                borderRadius: 3,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <SpeedIcon sx={{ fontSize: 32, color: build.metrics.bottleneckScore < 15 ? '#10B981' : build.metrics.bottleneckScore < 30 ? '#F59E0B' : '#EF4444' }} />
                                            <Typography variant="h4" fontWeight="bold">
                                                {build.metrics.bottleneckScore}%
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Bottleneck Score
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={100 - build.metrics.bottleneckScore}
                                                sx={{
                                                    mt: 1,
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: 'rgba(0,0,0,0.1)',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: build.metrics.bottleneckScore < 15 ? '#10B981' : build.metrics.bottleneckScore < 30 ? '#F59E0B' : '#EF4444'
                                                    }
                                                }}
                                            />
                                        </Paper>

                                        {/* Power Usage */}
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                flex: 1,
                                                minWidth: 150,
                                                p: 2,
                                                borderRadius: 3,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <BoltIcon sx={{ fontSize: 32, color: '#F59E0B' }} />
                                            <Typography variant="h4" fontWeight="bold">
                                                {build.metrics.estimatedWattage}W
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Estimated Power
                                            </Typography>
                                        </Paper>

                                        {/* Total Price */}
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                flex: 1,
                                                minWidth: 150,
                                                p: 2,
                                                borderRadius: 3,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                textAlign: 'center',
                                                background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(0, 240, 255, 0.1) 100%)'
                                            }}
                                        >
                                            <AttachMoneyIcon sx={{ fontSize: 32, color: '#6C63FF' }} />
                                            <Typography variant="h4" fontWeight="bold">
                                                {formatPrice(build.totalPrice)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Total Price
                                            </Typography>
                                        </Paper>
                                    </Box>

                                    {/* Components List */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            mb: 3
                                        }}
                                    >
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            Components
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        {Object.entries(build.components).map(([key, component]) => {
                                            if (!component) return null;
                                            const config = componentConfig[key];

                                            return (
                                                <Box
                                                    key={key}
                                                    component={motion.div}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        py: 1.5,
                                                        borderBottom: '1px solid',
                                                        borderColor: 'divider',
                                                        '&:last-child': { borderBottom: 'none' }
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Chip
                                                            label={config?.label || key}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: `${config?.color}20`,
                                                                color: config?.color,
                                                                fontWeight: 600,
                                                                minWidth: 90
                                                            }}
                                                        />
                                                        <Box>
                                                            <Typography variant="body1" fontWeight="500">
                                                                {component.brand} {component.name}
                                                            </Typography>
                                                            {component.priceUrl && (
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                                >
                                                                    via {component.priceSource}
                                                                    <Tooltip title="View source">
                                                                        <IconButton
                                                                            size="small"
                                                                            href={component.priceUrl}
                                                                            target="_blank"
                                                                            sx={{ p: 0 }}
                                                                        >
                                                                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                    <Typography
                                                        variant="body1"
                                                        fontWeight="bold"
                                                        sx={{ color: component.price ? 'text.primary' : 'text.disabled' }}
                                                    >
                                                        {formatPrice(component.price)}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Paper>

                                    {/* Actions */}
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Button
                                            variant="contained"
                                            startIcon={saveSuccess ? <CheckCircleIcon /> : <SaveIcon />}
                                            onClick={handleSave}
                                            disabled={isSaving || saveSuccess}
                                            sx={{
                                                flex: 1,
                                                py: 1.5,
                                                background: saveSuccess
                                                    ? 'linear-gradient(45deg, #10B981 30%, #059669 90%)'
                                                    : 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)'
                                            }}
                                        >
                                            {saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save to Profile'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => { setBuild(null); setStage('drafting'); }}
                                            sx={{ flex: 1, py: 1.5 }}
                                        >
                                            New Build
                                        </Button>
                                    </Box>
                                </Box>
                            )}

                            {/* Input Form */}
                            {!build && !isGenerating && (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {/* Mode Toggle */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            mb: 3
                                        }}
                                    >
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Build Mode
                                        </Typography>
                                        <ToggleButtonGroup
                                            value={mode}
                                            exclusive
                                            onChange={(_, v) => v && setMode(v)}
                                            fullWidth
                                            sx={{ mb: 3 }}
                                        >
                                            <ToggleButton value="budget" sx={{ py: 1.5 }}>
                                                <AttachMoneyIcon sx={{ mr: 1 }} />
                                                Budget
                                            </ToggleButton>
                                            <ToggleButton value="hardware" sx={{ py: 1.5 }}>
                                                <MemoryIcon sx={{ mr: 1 }} />
                                                Hardware
                                            </ToggleButton>
                                        </ToggleButtonGroup>

                                        {/* Budget Mode */}
                                        {mode === 'budget' && (
                                            <Box>
                                                <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ mb: 2 }}>
                                                    ${budget.toLocaleString()}
                                                </Typography>
                                                <Slider
                                                    value={budget}
                                                    onChange={(_, v) => setBudget(v as number)}
                                                    min={500}
                                                    max={10000}
                                                    step={100}
                                                    marks={[
                                                        { value: 500, label: '$500' },
                                                        { value: 2500, label: '$2.5K' },
                                                        { value: 5000, label: '$5K' },
                                                        { value: 10000, label: '$10K' }
                                                    ]}
                                                    sx={{
                                                        '& .MuiSlider-track': {
                                                            background: 'linear-gradient(90deg, #6C63FF 0%, #00F0FF 100%)'
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        )}

                                        {/* Hardware Mode */}
                                        {mode === 'hardware' && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    Enter the components you already own. The AI will build around them.
                                                </Typography>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                                    {[
                                                        { key: 'cpu', label: 'CPU (Processor)', icon: '🧠' },
                                                        { key: 'gpu', label: 'GPU (Graphics Card)', icon: '🎮' },
                                                        { key: 'ram', label: 'RAM (Memory)', icon: '💾' },
                                                        { key: 'motherboard', label: 'Motherboard', icon: '🔌' },
                                                        { key: 'psu', label: 'PSU (Power Supply)', icon: '⚡' },
                                                        { key: 'case', label: 'Case (Chassis)', icon: '📦' },
                                                        { key: 'storage', label: 'Storage (SSD/HDD)', icon: '💿' },
                                                        { key: 'cooler', label: 'CPU Cooler', icon: '❄️' }
                                                    ].map((field) => (
                                                        <TextField
                                                            key={field.key}
                                                            fullWidth
                                                            label={field.label}
                                                            placeholder={field.key === 'cpu' ? 'e.g., Ryzen 7 5800X' : field.key === 'gpu' ? 'e.g., RTX 3070' : 'Optional'}
                                                            value={hardwareInput[field.key as keyof typeof hardwareInput] || ''}
                                                            onChange={(e) => setHardwareInput(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                            InputProps={{
                                                                startAdornment: <Box component="span" sx={{ mr: 1, filter: 'grayscale(100%)', opacity: 0.7 }}>{field.icon}</Box>
                                                            }}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: 2
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </Paper>

                                    {/* Generate Button */}
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        startIcon={<RocketLaunchIcon />}
                                        onClick={handleGenerate}
                                        disabled={mode === 'hardware' && !Object.values(hardwareInput).some(v => v?.trim())}
                                        sx={{
                                            py: 2,
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                                            borderRadius: 3,
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #5a52d5 30%, #00d4e0 90%)'
                                            }
                                        }}
                                    >
                                        Generate Build
                                    </Button>

                                    {error && (
                                        <Alert severity="error" sx={{ mt: 2 }}>
                                            {error}
                                        </Alert>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Tab 1: Expert Consultation */}
                    {activeTab === 1 && (
                        <motion.div
                            key="consultation"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderConsultationTab()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Container>

            {/* Success Snackbar */}
            <Snackbar
                open={saveSuccess}
                autoHideDuration={3000}
                onClose={() => setSaveSuccess(false)}
                message="Build saved to your profile!"
            />
        </Box>
    );
}
