'use client';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    TextField,
    CircularProgress,
    Alert,
    Divider,
    Stack,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PCBuildRequest, AdminBuildResponse, PCBuildRequestStatus, PCComponent } from '@/types/pcBuilder';
import { useAuth } from '@/context/AuthContext';

export default function AdminPCRequestDetail() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const requestId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [request, setRequest] = useState<PCBuildRequest | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Admin Response State
    const [adminResponse, setAdminResponse] = useState<AdminBuildResponse>({
        buildName: '',
        totalPrice: 0,
        components: [], // Starts empty, admin can type JSON or we can build a UI
        adminNotes: '',
        youtubeLink: '',
        purchaseLinks: [],
        createdAt: new Date().toISOString() // Placeholder
    });

    // For simple component entry for now (JSON string)
    const [componentsJson, setComponentsJson] = useState('[]');

    useEffect(() => {
        const fetchRequest = async () => {
            if (!requestId) return;
            try {
                const docRef = doc(db, 'pc_build_requests', requestId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as PCBuildRequest;
                    setRequest(data);

                    if (data.adminResponse) {
                        setAdminResponse(data.adminResponse);
                        setComponentsJson(JSON.stringify(data.adminResponse.components, null, 2));
                    } else {
                        // Initialize empty response
                        setAdminResponse(prev => ({
                            ...prev,
                            // Inherit budget as initial price guess?
                            totalPrice: data.formData?.budget || 0
                        }));
                    }
                } else {
                    setError('Request not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load request');
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [requestId]);

    const handleStatusChange = async (newStatus: PCBuildRequestStatus) => {
        if (!request) return;
        try {
            await updateDoc(doc(db, 'pc_build_requests', requestId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            setRequest(prev => prev ? { ...prev, status: newStatus } : null);
            setSuccessMsg(`Status updated to ${newStatus}`);
        } catch (err) {
            console.error(err);
            setError('Failed to update status');
        }
    };

    const handleSaveResponse = async () => {
        if (!request) return;
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
            // Parse components JSON
            let parsedComponents: PCComponent[] = [];
            try {
                parsedComponents = JSON.parse(componentsJson);
            } catch (error) {
                console.error('Invalid JSON for components:', error);
                throw new Error('Invalid JSON for components');
            }

            const responseToSave: AdminBuildResponse = {
                ...adminResponse,
                components: parsedComponents,
                createdAt: new Date().toISOString() // Update timestamp
            };

            await updateDoc(doc(db, 'pc_build_requests', requestId), {
                adminResponse: responseToSave,
                status: 'completed', // Auto-complete on save? Or separate? Let's keep manual status control or set to Reviewing
                updatedAt: serverTimestamp()
            });

            // Also update request local state
            setRequest(prev => prev ? { ...prev, adminResponse: responseToSave } : null);
            setSuccessMsg('Build plan saved');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save response');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Container sx={{ mt: 5, textAlign: 'center' }}><CircularProgress /></Container>;
    if (error && !request) return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
    if (!request) return <Container sx={{ mt: 5 }}><Alert severity="info">Request not found.</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/pc-requests')} sx={{ mb: 2 }}>
                Back to List
            </Button>

            <Grid container spacing={3}>
                {/* Left Column: User Request Details */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">User Requirement</Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">User</Typography>
                                <Typography variant="body1">{request.userEmail}</Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                <Chip
                                    label={request.status.toUpperCase()}
                                    color={request.status === 'completed' ? 'success' : 'warning'}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Update Status To</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Button size="small" variant="outlined" onClick={() => handleStatusChange('reviewing')}>Reviewing</Button>
                                    <Button size="small" variant="outlined" color="success" onClick={() => handleStatusChange('completed')}>Completed</Button>
                                </Stack>
                            </Box>

                            <Divider />

                            {request.formData ? (
                                <>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Budget</Typography>
                                        <Typography variant="h5" color="primary.main">
                                            {request.formData.currency} {request.formData.budget}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Usage</Typography>
                                        <Typography variant="body1">{request.formData.usage}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Monitor Setup</Typography>
                                        <Typography variant="body1">
                                            {request.formData.monitors}x Monitor(s) @ {request.formData.resolution}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Peripherals</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                            {request.formData.peripherals.length > 0 ? (
                                                request.formData.peripherals.map((p, i) => <Chip key={i} label={p} size="small" />)
                                            ) : (
                                                <Typography variant="body2">None requested</Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Preferences / Notes</Typography>
                                        <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {request.formData.preferences || 'No additional notes.'}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </>
                            ) : (
                                <Alert severity="warning">User has not filled out the form yet.</Alert>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Right Column: Admin Build Plan */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Proposed Build</Typography>
                        <Divider sx={{ mb: 3 }} />

                        {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        <Stack spacing={3}>
                            <TextField
                                label="Build Name / Title"
                                fullWidth
                                value={adminResponse.buildName}
                                onChange={e => setAdminResponse({ ...adminResponse, buildName: e.target.value })}
                                placeholder="e.g., Ultimate 4K Gaming Beast"
                            />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        label="Total Price"
                                        type="number"
                                        fullWidth
                                        value={adminResponse.totalPrice}
                                        onChange={e => setAdminResponse({ ...adminResponse, totalPrice: Number(e.target.value) })}
                                        InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>{request.formData?.currency === 'EUR' ? '€' : '$'}</Typography> }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    {/* Placeholder for future expansion */}
                                </Grid>
                            </Grid>

                            <TextField
                                label="Admin Notes & Recommendations"
                                multiline
                                rows={4}
                                fullWidth
                                value={adminResponse.adminNotes}
                                onChange={e => setAdminResponse({ ...adminResponse, adminNotes: e.target.value })}
                                placeholder="Explain why you chose these parts..."
                            />

                            <TextField
                                label="YouTube Walkthrough/Guide URL"
                                fullWidth
                                value={adminResponse.youtubeLink}
                                onChange={e => setAdminResponse({ ...adminResponse, youtubeLink: e.target.value })}
                                placeholder="https://youtube.com/..."
                            />

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>Components (JSON)</Typography>
                                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                                    {'Paste the JSON array of components here. Use the format `[{"type": "CPU", "name": "...", "price": ... }]`'}
                                </Typography>
                                <TextField
                                    multiline
                                    rows={10}
                                    fullWidth
                                    value={componentsJson}
                                    onChange={e => setComponentsJson(e.target.value)}
                                    sx={{ fontFamily: 'monospace' }}
                                />
                            </Box>

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                disabled={saving}
                                onClick={handleSaveResponse}
                                sx={{
                                    mt: 2,
                                    background: 'linear-gradient(45deg, #10B981 30%, #3B82F6 90%)'
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Build Plan'}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
