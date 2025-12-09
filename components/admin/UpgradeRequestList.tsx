'use client';

import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    IconButton,
    Chip,
    Tooltip,
    Alert,
    Button,
    CircularProgress,
    Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getAllPaymentRequests, approvePaymentRequest, rejectPaymentRequest } from '@/services/paymentService';
import { PaymentRequest } from '@/types/payment';
import { useAuth } from '@/context/AuthContext';

export default function UpgradeRequestList() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await getAllPaymentRequests('pending');
            setRequests(data);
            setError(null);
        } catch (err) {
            setError('Failed to load requests');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (requestId: string) => {
        if (!user) return;
        setActionLoading(requestId);
        try {
            await approvePaymentRequest(requestId, user.uid);
            // Refresh list
            setRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (err) {
            alert('Failed to approve request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setActionLoading(requestId);
        try {
            await rejectPaymentRequest(requestId, 'Admin rejected');
            // Refresh list
            setRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (err) {
            alert('Failed to reject request');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <Paper sx={{ p: 3, height: '100%', maxHeight: 500, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                    Pending Upgrade Requests
                </Typography>
                <IconButton onClick={fetchRequests} disabled={loading} size="small">
                    <RefreshIcon />
                </IconButton>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : requests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography>No pending requests</Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {requests.map((request, index) => (
                        <React.Fragment key={request.id}>
                            {index > 0 && <Divider component="li" />}
                            <ListItem
                                secondaryAction={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Reject">
                                            <IconButton
                                                edge="end"
                                                color="error"
                                                onClick={() => handleReject(request.id!)}
                                                disabled={actionLoading === request.id}
                                            >
                                                <CancelIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Approve">
                                            <IconButton
                                                edge="end"
                                                color="success"
                                                onClick={() => handleApprove(request.id!)}
                                                disabled={actionLoading === request.id}
                                            >
                                                {actionLoading === request.id ? <CircularProgress size={24} /> : <CheckCircleIcon />}
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>
                                        <PersonIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={request.userName || 'Unknown User'}
                                    secondary={
                                        <React.Fragment>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {request.userEmail}
                                            </Typography>
                                            {" — "}{request.type === 'manual' ? 'Free Request' : 'Paid'}
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Paper>
    );
}
