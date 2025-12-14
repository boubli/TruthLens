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
    CircularProgress,
    Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PCBuildRequest, PCBuildRequestStatus } from '@/types/pcBuilder';

export default function AdminPCRequestsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<PCBuildRequest[]>([]);
    const [tabValue, setTabValue] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return; // Wait for auth

        const q = query(collection(db, 'pc_build_requests'), orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: PCBuildRequest[] = [];
            snapshot.forEach((doc) => {
                items.push(doc.data() as PCBuildRequest);
            });
            setRequests(items);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching PC requests:", err);
            setError("Failed to load requests.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getFilteredRequests = () => {
        // 0: All
        // 1: Action Required (submitted)
        // 2: In Progress (reviewing)
        // 3: Completed
        // 4: Pending User (paid_pending_form, pending_payment)

        switch (tabValue) {
            case 0: return requests;
            case 1: return requests.filter(r => r.status === 'submitted');
            case 2: return requests.filter(r => r.status === 'reviewing');
            case 3: return requests.filter(r => r.status === 'completed');
            case 4: return requests.filter(r => ['paid_pending_form', 'pending_payment'].includes(r.status));
            default: return requests;
        }
    };

    const getStatusChip = (status: PCBuildRequestStatus) => {
        switch (status) {
            case 'completed':
                return <Chip icon={<CheckCircleIcon />} label="Completed" color="success" size="small" />;
            case 'reviewing':
                return <Chip icon={<BuildIcon />} label="Reviewing" color="info" size="small" />;
            case 'submitted':
                return <Chip icon={<VisibilityIcon />} label="New Request" color="warning" size="small" />;
            case 'paid_pending_form':
                return <Chip icon={<AccessTimeIcon />} label="Waiting for Form" color="default" size="small" />;
            case 'pending_payment':
                return <Chip icon={<PendingIcon />} label="Payment Pending" color="default" variant="outlined" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 5, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                PC Build Requests
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, val) => setTabValue(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="All" />
                    <Tab label="New Requests" />
                    <Tab label="In Progress" />
                    <Tab label="Completed" />
                    <Tab label="Pending User" />
                </Tabs>
            </Paper>

            <Grid container spacing={3}>
                {getFilteredRequests().map((req) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={req.userId}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold" noWrap sx={{ maxWidth: '70%' }}>
                                        {req.userEmail}
                                    </Typography>
                                    {getStatusChip(req.status)}
                                </Box>

                                {req.formData ? (
                                    <>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Budget:</strong> {req.formData.currency} {req.formData.budget}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Usage:</strong> {req.formData.usage}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Country:</strong> {req.formData.country}
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                        Form not submitted yet.
                                    </Typography>
                                )}

                                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.disabled' }}>
                                    Updated: {req.updatedAt ? new Date(req.updatedAt).toLocaleDateString() : 'N/A'}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    fullWidth
                                    onClick={() => router.push(`/admin/pc-requests/${req.userId}`)}
                                >
                                    Manage Request
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}

                {getFilteredRequests().length === 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                            <Typography color="text.secondary">No requests found in this category.</Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Container>
    );
}

// Add these types if they are missing in your local file to make it compile,
// though they should be imported from types/pcBuilder.ts
