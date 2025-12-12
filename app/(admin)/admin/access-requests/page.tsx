'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Alert, Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllRequests, approveRequest, denyRequest } from '@/services/accessRequestService';
import { FreeAccessRequest } from '@/types/accessRequest';

export default function AdminAccessRequestsPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [requests, setRequests] = useState<FreeAccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Deny dialog
    const [denyDialogOpen, setDenyDialogOpen] = useState(false);
    const [denyReason, setDenyReason] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<FreeAccessRequest | null>(null);
    const [processing, setProcessing] = useState(false);

    // Detail dialog
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Auth check
    useEffect(() => {
        if (!authLoading && userProfile?.role !== 'admin') {
            router.push('/');
        }
    }, [authLoading, userProfile, router]);

    // Load requests
    const loadRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (userProfile?.role === 'admin') {
            loadRequests();
        }
    }, [userProfile, loadRequests]);

    const filteredRequests = requests.filter(r => {
        if (tab === 0) return r.status === 'pending';
        if (tab === 1) return r.status === 'approved';
        return r.status === 'denied';
    });

    const handleApprove = async (request: FreeAccessRequest) => {
        setProcessing(true);
        try {
            const success = await approveRequest(request.id, userProfile?.uid || '');
            if (success) {
                setSuccess(`Approved request for ${request.fullName}`);
                loadRequests();
            }
        } catch (error) {
            console.error('Error approving request:', error);
            setError('Failed to approve request');
        }
        setProcessing(false);
    };

    const handleDenyClick = (request: FreeAccessRequest) => {
        setSelectedRequest(request);
        setDenyReason('');
        setDenyDialogOpen(true);
    };

    const handleDenyConfirm = async () => {
        if (!selectedRequest || !denyReason.trim()) return;

        setProcessing(true);
        try {
            const success = await denyRequest(selectedRequest.id, userProfile?.uid || '', denyReason);
            if (success) {
                setSuccess(`Denied request for ${selectedRequest.fullName}`);
                setDenyDialogOpen(false);
                loadRequests();
            }
        } catch (error) {
            console.error('Error denying request:', error);
            setError('Failed to deny request');
        }
        setProcessing(false);
    };

    const handleViewDetails = (request: FreeAccessRequest) => {
        setSelectedRequest(request);
        setDetailDialogOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'success';
            case 'denied': return 'error';
            default: return 'default';
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'plus': return 'primary';
            case 'pro': return 'secondary';
            case 'ultimate': return 'warning';
            default: return 'default';
        }
    };

    if (authLoading || loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    📋 Access Requests
                </Typography>
                <Button startIcon={<RefreshIcon />} onClick={loadRequests}>
                    Refresh
                </Button>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label={`Pending (${requests.filter(r => r.status === 'pending').length})`} />
                    <Tab label={`Approved (${requests.filter(r => r.status === 'approved').length})`} />
                    <Tab label={`Denied (${requests.filter(r => r.status === 'denied').length})`} />
                </Tabs>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Tier</TableCell>
                            <TableCell>Student</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRequests.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 32, height: 32 }}>{req.fullName[0]}</Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">{req.fullName}</Typography>
                                            <Typography variant="caption" color="text.secondary">@{req.username}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{req.email}</TableCell>
                                <TableCell>{req.phone}</TableCell>
                                <TableCell>
                                    <Chip label={req.codeTier.toUpperCase()} color={getTierColor(req.codeTier)} size="small" />
                                </TableCell>
                                <TableCell>
                                    {req.isStudent ? (
                                        <Chip label="🎓 Student" size="small" color="info" />
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Chip label={req.status} color={getStatusColor(req.status)} size="small" />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" onClick={() => handleViewDetails(req)}>
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                    {req.status === 'pending' && (
                                        <>
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => handleApprove(req)}
                                                disabled={processing}
                                            >
                                                <CheckCircleIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDenyClick(req)}
                                            >
                                                <CancelIcon fontSize="small" />
                                            </IconButton>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredRequests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No requests in this category</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Deny Dialog */}
            <Dialog open={denyDialogOpen} onClose={() => setDenyDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Deny Request</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        You are denying the request from <strong>{selectedRequest?.fullName}</strong>.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason for Denial"
                        value={denyReason}
                        onChange={(e) => setDenyReason(e.target.value)}
                        placeholder="This reason will be shown to the user"
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDenyDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDenyConfirm}
                        disabled={!denyReason.trim() || processing}
                    >
                        {processing ? <CircularProgress size={20} /> : 'Deny Request'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Request Details</DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Full Name</Typography>
                                <Typography fontWeight="bold">{selectedRequest.fullName}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Username</Typography>
                                <Typography>@{selectedRequest.username}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Email</Typography>
                                <Typography>{selectedRequest.email}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Phone</Typography>
                                <Typography>{selectedRequest.phone}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Reason</Typography>
                                <Typography sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                                    {selectedRequest.reason}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Code Used</Typography>
                                <Typography fontFamily="monospace">{selectedRequest.codeUsed}</Typography>
                            </Box>
                            {selectedRequest.isStudent && selectedRequest.studentProofUrl && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Student Proof</Typography>
                                    <Button
                                        variant="outlined"
                                        href={selectedRequest.studentProofUrl}
                                        target="_blank"
                                        fullWidth
                                    >
                                        View Document
                                    </Button>
                                </Box>
                            )}
                            {selectedRequest.status === 'denied' && selectedRequest.denialReason && (
                                <Alert severity="error">
                                    <Typography variant="caption" fontWeight="bold">Denial Reason:</Typography>
                                    <Typography>{selectedRequest.denialReason}</Typography>
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
