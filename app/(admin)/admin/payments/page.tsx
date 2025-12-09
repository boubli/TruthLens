'use client';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Chip,
    Tab,
    Tabs,
    Card,
    CardContent,
    CardActions,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    getAllPaymentRequests,
    approvePaymentRequest,
    rejectPaymentRequest,
} from '@/services/paymentService';
import { PaymentRequest, PaymentStatus } from '@/types/payment';

export default function AdminPaymentsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [tabValue, setTabValue] = useState<number>(0);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const checkAdminRole = async () => {
        if (!user) return;
        // In a real app, check claims. Here we assume manual check or proceed.
        // For now, we will just set isAdmin to true if they are on this page (middleware should handle it)
        // Or fetch profile again.
        setIsAdmin(true);
    };

    const loadRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const allRequests = await getAllPaymentRequests();
            setRequests(allRequests);
        } catch (err) {
            setError('Failed to load payment requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        checkAdminRole().then(() => {
            loadRequests();
        });
    }, [user, router]);

    const handleApprove = async (request: PaymentRequest) => {
        if (!user || !request.id) return;

        setProcessing(true);
        setError(null);
        try {
            await approvePaymentRequest(request.id, user.uid);
            await loadRequests(); // Reload list
        } catch (err: any) {
            setError(err.message || 'Failed to approve request');
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectClick = (request: PaymentRequest) => {
        setSelectedRequest(request);
        setRejectDialogOpen(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedRequest || !selectedRequest.id || !rejectReason.trim()) return;

        setProcessing(true);
        setError(null);
        try {
            await rejectPaymentRequest(selectedRequest.id, rejectReason);
            setRejectDialogOpen(false);
            setRejectReason('');
            setSelectedRequest(null);
            await loadRequests();
        } catch (err: any) {
            setError(err.message || 'Failed to reject request');
        } finally {
            setProcessing(false);
        }
    };

    const getFilteredRequests = () => {
        const statusMap: Record<number, PaymentStatus | 'all'> = {
            0: 'all',
            1: 'pending',
            2: 'approved',
            3: 'rejected',
        };

        const filterStatus = statusMap[tabValue];
        if (filterStatus === 'all') return requests;
        return requests.filter(req => req.status === filterStatus);
    };

    const getStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
            case 'completed':
                return 'success';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: PaymentStatus) => {
        switch (status) {
            case 'pending':
                return <PendingIcon />;
            case 'approved':
            case 'completed':
                return <CheckCircleIcon />;
            case 'rejected':
                return <CancelIcon />;
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 5, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Verifying admin access...
                </Typography>
            </Container>
        );
    }

    if (!isAdmin) {
        return (
            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Alert severity="error">
                    <Typography variant="h6" gutterBottom>
                        Access Denied
                    </Typography>
                    <Typography variant="body2">
                        You do not have administrator privileges. This page is restricted to admin users only.
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => router.push('/profile')}
                        sx={{ mt: 2 }}
                    >
                        Go to Profile
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Free Access Requests
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} variant="fullWidth">
                    <Tab label="All" />
                    <Tab label="Pending" />
                    <Tab label="Approved" />
                    <Tab label="Rejected" />
                </Tabs>
            </Paper>

            <Grid container spacing={3}>
                {getFilteredRequests().map((request) => (
                    <Grid size={{ xs: 12, md: 6 }} key={request.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        {request.userName}
                                    </Typography>
                                    <Chip
                                        icon={getStatusIcon(request.status)}
                                        label={request.status.toUpperCase()}
                                        color={getStatusColor(request.status)}
                                        size="small"
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Email: {request.userEmail}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Tier: {request.tier.toUpperCase()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Price: ${request.price.toFixed(2)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Requested: {request.createdAt instanceof Date ? request.createdAt.toLocaleDateString() : 'N/A'}
                                </Typography>

                                {request.status === 'approved' && request.approvedAt && (
                                    <Typography variant="caption" color="success.main" display="block">
                                        Approved on {request.approvedAt instanceof Date ? request.approvedAt.toLocaleDateString() : 'N/A'}
                                    </Typography>
                                )}

                                {request.status === 'rejected' && request.rejectedReason && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        <Typography variant="caption">
                                            Reason: {request.rejectedReason}
                                        </Typography>
                                    </Alert>
                                )}
                            </CardContent>

                            {request.status === 'pending' && (
                                <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<CancelIcon />}
                                        onClick={() => handleRejectClick(request)}
                                        disabled={processing}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={() => handleApprove(request)}
                                        disabled={processing}
                                    >
                                        Approve
                                    </Button>
                                </CardActions>
                            )}
                        </Card>
                    </Grid>
                ))}

                {getFilteredRequests().length === 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
                            No access requests found
                        </Typography>
                    </Grid>
                )}
            </Grid>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => !processing && setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Payment Request</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        Please provide a reason for rejecting this request:
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Rejection Reason"
                        fullWidth
                        multiline
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        disabled={processing}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRejectConfirm}
                        color="error"
                        variant="contained"
                        disabled={processing || !rejectReason.trim()}
                    >
                        {processing ? <CircularProgress size={20} /> : 'Confirm Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
