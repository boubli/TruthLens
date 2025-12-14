'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, Tooltip, CircularProgress, Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCancellationRequests, updateUserTier } from '@/services/subscriptionService';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CancellationRequest {
    id: string;
    userId: string;
    email: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    createdAt: Date | { toDate: () => Date };
}

export default function CancellationRequestsPage() {
    const [requests, setRequests] = useState<CancellationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const data = await getCancellationRequests();
        setRequests(data as CancellationRequest[]);
        setLoading(false);
    };

    const handleApprove = async (request: CancellationRequest) => {
        if (!confirm('Are you sure you want to approve this cancellation? This will downgrade the user to FREE tier immediately.')) return;

        setActionLoading(request.id);
        try {
            // 1. Update User Tier to Free
            await updateUserTier(request.userId, 'free');

            // 2. Update Request Status
            const requestRef = doc(db, 'cancellationRequests', request.id);
            await updateDoc(requestRef, { status: 'completed' });

            // 3. Refresh List
            await fetchRequests();
        } catch (error) {
            console.error('Error approving cancellation:', error);
            alert('Failed to approve cancellation.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (request: CancellationRequest) => {
        if (!confirm('Are you sure you want to reject this cancellation?')) return;

        setActionLoading(request.id);
        try {
            const requestRef = doc(db, 'cancellationRequests', request.id);
            await updateDoc(requestRef, { status: 'rejected' });
            await fetchRequests();
        } catch (error) {
            console.error('Error rejecting cancellation:', error);
            alert('Failed to reject cancellation.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            await deleteDoc(doc(db, 'cancellationRequests', id));
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved':
            case 'completed': return 'success';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
                Membership Cancellations
            </Typography>

            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: 3 }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell><strong>User Email</strong></TableCell>
                                <TableCell><strong>Reason</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No cancellation requests found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow key={request.id} hover>
                                        <TableCell>{request.email}</TableCell>
                                        <TableCell sx={{ maxWidth: 300 }}>
                                            <Tooltip title={request.reason}>
                                                <Typography variant="body2" noWrap>{request.reason}</Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            {request.createdAt instanceof Date
                                                ? request.createdAt.toLocaleDateString()
                                                : 'toDate' in request.createdAt
                                                    ? request.createdAt.toDate().toLocaleDateString()
                                                    : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={request.status.toUpperCase()}
                                                color={getStatusColor(request.status)}
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {request.status === 'pending' && (
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<CheckCircleIcon />}
                                                        disabled={actionLoading === request.id}
                                                        onClick={() => handleApprove(request)}
                                                    >
                                                        Approve Cancel
                                                    </Button>
                                                    <IconButton
                                                        color="default"
                                                        size="small"
                                                        onClick={() => handleReject(request)}
                                                        disabled={actionLoading === request.id}
                                                    >
                                                        <CancelIcon />
                                                    </IconButton>
                                                </Box>
                                            )}
                                            {request.status !== 'pending' && (
                                                <IconButton onClick={() => handleDelete(request.id)} color="error" size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
