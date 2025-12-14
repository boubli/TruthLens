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
    Button,
    Card,
    CardContent,
    Chip,
} from '@mui/material';
import StatsCard from '@/components/admin/StatsCard';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import ScannerIcon from '@mui/icons-material/QrCodeScanner';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import UpgradeRequestList from '@/components/admin/UpgradeRequestList';
import ActiveUsersGraph from '@/components/admin/ActiveUsersGraph';
import { getDashboardStats, DashboardStats, getUserActivityData, ActivityData } from '@/services/statsService';
import { getSystemSettings } from '@/services/systemService';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [graphOpen, setGraphOpen] = useState(false);
    const [activityData, setActivityData] = useState<ActivityData[]>([]);
    const [graphLoading, setGraphLoading] = useState(false);
    const [aiServerStatus, setAiServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [aiModelsCount, setAiModelsCount] = useState(0);
    const router = useRouter();
    const { user } = useAuth();

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
        fetchStats();
        checkAIServer();
    }, []);

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

    const checkAIServer = async () => {
        try {
            const settings = await getSystemSettings();
            const ollamaUrl = settings.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434';
            const token = await user?.getIdToken();

            const response = await axios.get('/api/admin/ollama/models', {
                params: { url: ollamaUrl },
                headers: { Authorization: `Bearer ${token}` }
            });

            setAiModelsCount(response.data.models?.length || 0);
            setAiServerStatus('online');
        } catch (error) {
            setAiServerStatus('offline');
        }
    };

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

                {/* AI Server Status */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                        height: '100%',
                        background: aiServerStatus === 'online'
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <SmartToyIcon sx={{ fontSize: 40 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        AI Server
                                    </Typography>
                                </Box>
                                {aiServerStatus === 'online' ? (
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label="ONLINE"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold' }}
                                    />
                                ) : (
                                    <Chip
                                        icon={<ErrorIcon />}
                                        label={aiServerStatus === 'checking' ? 'Checking...' : 'OFFLINE'}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold' }}
                                    />
                                )}
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                                {aiServerStatus === 'online'
                                    ? `${aiModelsCount} AI models ready to use`
                                    : 'AI server unavailable. Check connection.'
                                }
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => router.push('/admin/ai-models')}
                            >
                                Manage AI Models
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            🚀 Quick Actions
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 6 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<PeopleIcon />}
                                    onClick={() => router.push('/admin/users')}
                                    sx={{ py: 1.5 }}
                                >
                                    Users
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<ChatIcon />}
                                    onClick={() => router.push('/admin/chat')}
                                    sx={{ py: 1.5 }}
                                >
                                    Support
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<SmartToyIcon />}
                                    onClick={() => router.push('/admin/ai-models')}
                                    sx={{ py: 1.5 }}
                                >
                                    AI Models
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<SettingsIcon />}
                                    onClick={() => router.push('/admin/settings')}
                                    sx={{ py: 1.5 }}
                                >
                                    Settings
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
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
