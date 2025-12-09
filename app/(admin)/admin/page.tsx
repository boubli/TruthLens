'use client';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Skeleton,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
} from '@mui/material';
import StatsCard from '@/components/admin/StatsCard';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import ScannerIcon from '@mui/icons-material/QrCodeScanner';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import UpgradeRequestList from '@/components/admin/UpgradeRequestList';
import ActiveUsersGraph from '@/components/admin/ActiveUsersGraph';
import { getDashboardStats, DashboardStats, getUserActivityData, ActivityData } from '@/services/statsService';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [graphOpen, setGraphOpen] = useState(false);
    const [activityData, setActivityData] = useState<ActivityData[]>([]);
    const [graphLoading, setGraphLoading] = useState(false);

    const handleOpenGraph = async () => {
        setGraphOpen(true);
        if (activityData.length === 0) {
            setGraphLoading(true);
            const data = await getUserActivityData();
            setActivityData(data);
            setGraphLoading(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome to your admin dashboard
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {loading ? (
                        <Skeleton variant="rounded" height={140} />
                    ) : (
                        <StatsCard
                            title="Total Users"
                            value={formatNumber(stats?.totalUsers || 0)}
                            icon={PeopleIcon}
                            trend={stats?.userGrowth || 0}
                            color="#6C63FF"
                            onClick={handleOpenGraph}
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {loading ? (
                        <Skeleton variant="rounded" height={140} />
                    ) : (
                        <StatsCard
                            title="Revenue"
                            value={`$${formatNumber(stats?.totalRevenue || 0)}`}
                            icon={PaymentIcon}
                            trend={stats?.revenueGrowth || 0}
                            color="#00F0FF"
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {loading ? (
                        <Skeleton variant="rounded" height={140} />
                    ) : (
                        <StatsCard
                            title="Total Scans"
                            value={formatNumber(stats?.totalScans || 0)}
                            icon={ScannerIcon}
                            trend={stats?.scanGrowth || 0}
                            color="#FCD34D"
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    {loading ? (
                        <Skeleton variant="rounded" height={140} />
                    ) : (
                        <StatsCard
                            title="Growth"
                            value={`${stats?.userGrowth || 0}%`}
                            icon={TrendingUpIcon}
                            trend={stats?.userGrowth || 0}
                            color="#10B981"
                        />
                    )}
                </Grid>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                        <UpgradeRequestList />
                    </Grid>
                </Grid>

                <Dialog
                    open={graphOpen}
                    onClose={() => setGraphOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3, p: 1 }
                    }}
                >
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
                        <Typography variant="h6" fontWeight="bold">User Activity Analysis</Typography>
                        <IconButton onClick={() => setGraphOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <ActiveUsersGraph data={activityData} loading={graphLoading} />
                    </DialogContent>
                </Dialog>
            </Grid>
        </Container>
    );
}

