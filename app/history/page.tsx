'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, Tab, Tabs, Chip, CircularProgress, Button, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserHistoryWithLimit, deleteHistoryItem, HistoryItem, exportHistoryToCSV, exportHistoryToPDF } from '@/services/historyService';
import UgradePrompt from '@/components/subscription/UpgradePrompt';
import AdBanner from '@/components/ads/AdBanner';
import PageTransition from '@/components/animation/PageTransition';
import StaggerList, { StaggerItem } from '@/components/animation/StaggerList';
import AnimatedButton from '@/components/ui/AnimatedButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import HistoryIcon from '@mui/icons-material/History';

export default function HistoryPage() {
    const [tabValue, setTabValue] = useState(0);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [limit, setLimit] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const router = useRouter();
    const { user, isPro, isFree, tier, features } = useAuth();

    useEffect(() => {
        if (user) {
            loadHistory();
        } else {
            setLoading(false);
        }
    }, [user, tier]);

    const loadHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserHistoryWithLimit(user.uid, tier);
            setHistory(data.items);
            setHasMore(data.hasMore);
            setLimit(data.limit);
        } catch (error) {
            console.error('[HISTORY] ❌ Failed to load:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await deleteHistoryItem(id);
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            alert('Failed to delete item');
        }
    };

    const handleExportCSV = async () => {
        if (!user || !features.exportFormats.includes('csv')) return;
        setExporting(true);
        try {
            const csv = await exportHistoryToCSV(user.uid);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `truthlens-history-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to export CSV');
        } finally {
            setExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (!user || !features.exportFormats.includes('pdf')) return;
        setExporting(true);
        try {
            const html = await exportHistoryToPDF(user.uid);
            const blob = new Blob([html], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `truthlens-history-${new Date().toISOString().split('T')[0]}.html`;
            a.click();
            window.URL.revokeObjectURL(url);
            alert('PDF export downloaded as HTML. Open it in your browser and print to PDF.');
        } catch (error) {
            alert('Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    const filteredHistory = history.filter(item => {
        if (tabValue === 0) return true;
        if (tabValue === 1) return item.type === 'search'; // Tab 1 is now "Searches"
        if (tabValue === 2) return item.type === 'scan';   // Tab 2 is now "Scans"
        return true;
    });

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <PageTransition>
            <Container maxWidth="md" sx={{ mt: 5, mb: isFree ? 15 : 10 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => router.back()}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" fontWeight="bold">History</Typography>
                    </Box>

                    {features.exportFormats.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {features.exportFormats.includes('csv') && (
                                <AnimatedButton
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleExportCSV}
                                    disabled={exporting || history.length === 0}
                                >
                                    CSV
                                </AnimatedButton>
                            )}
                            {features.exportFormats.includes('pdf') && (
                                <AnimatedButton
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleExportPDF}
                                    disabled={exporting || history.length === 0}
                                >
                                    PDF
                                </AnimatedButton>
                            )}
                        </Box>
                    )}
                </Box>

                {isFree && limit && (
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography variant="body2">
                            Free users can view the last <strong>{limit} scans</strong>.
                            {hasMore && ' You have more history items. '}
                            <strong
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => router.push('/upgrade')}
                            >
                                Upgrade to Pro for unlimited history.
                            </strong>
                        </Typography>
                    </Alert>
                )}

                <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="secondary" textColor="inherit" variant="fullWidth">
                        <Tab label="All Activity" />
                        <Tab label="Searches" />
                        <Tab label="Scans" />
                    </Tabs>
                </Paper>

                {filteredHistory.length > 0 ? (
                    <StaggerList staggerDelay={0.05}>
                        {filteredHistory.map((item) => (
                            <StaggerItem key={item.id}>
                                <Paper
                                    sx={{
                                        mb: 2,
                                        overflow: 'hidden',
                                        borderRadius: 3,
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                                    }}
                                >
                                    <ListItem
                                        secondaryAction={
                                            <IconButton edge="end" aria-label="delete" onClick={(e) => handleDelete(e, item.id!)}>
                                                <DeleteIcon color="error" />
                                            </IconButton>
                                        }
                                        disablePadding
                                        sx={{ p: 2, cursor: 'pointer' }}
                                        onClick={() => router.push(`/product/${item.productId || item.id}`)}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: item.type === 'scan' ? 'primary.main' : 'secondary.main' }}>
                                                {item.type === 'scan' ? <QrCodeScannerIcon /> : <SearchIcon />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">{item.title}</Typography>
                                                    {item.grade && (
                                                        <Chip
                                                            label={`Grade ${item.grade}`}
                                                            size="small"
                                                            color={['A', 'B'].includes(item.grade) ? 'success' : item.grade === 'C' ? 'warning' : 'error'}
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
                                        />
                                    </ListItem>
                                </Paper>
                            </StaggerItem>
                        ))}
                    </StaggerList>
                ) : (
                    <EmptyState
                        icon={<HistoryIcon sx={{ fontSize: 60, color: 'text.secondary' }} />}
                        title="No history yet"
                        description="Your scanned products and searches will appear here."
                        actionLabel="Start Scanning"
                        onAction={() => router.push('/scan')}
                    />
                )}

                {isFree && hasMore && (
                    <Box sx={{ mt: 3 }}>
                        <UgradePrompt feature="Unlimited History & Export" variant="full" />
                    </Box>
                )}
            </Container>

            {isFree && features.adsEnabled && <AdBanner position="bottom" />}
        </PageTransition>
    );
}
