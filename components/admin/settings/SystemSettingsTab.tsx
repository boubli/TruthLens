'use client';

import React from 'react';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    TextField,
    Button,
    CircularProgress,
    Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SaveIcon from '@mui/icons-material/Save';

interface SystemSettingsTabProps {
    searxngConfig: { searxngUrl: string };
    setSearxngConfig: React.Dispatch<React.SetStateAction<{ searxngUrl: string }>>;
    handleSaveSearxng: () => Promise<void>;
    savingSearxng: boolean;
    handleRunBackup: () => Promise<void>;
    runningBackup: boolean;
}

export default function SystemSettingsTab({
    searxngConfig,
    setSearxngConfig,
    handleSaveSearxng,
    savingSearxng,
    handleRunBackup,
    runningBackup
}: SystemSettingsTabProps) {
    return (
        <Box>
            {/* --- SEARXNG CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #c8e6c9' }}>
                <CardHeader
                    title="SearXNG Search Engine"
                    subheader="Self-hosted unlimited web search"
                    avatar={<SearchIcon color="success" />}
                    sx={{ bgcolor: '#e8f5e9', borderBottom: '1px solid #c8e6c9' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <TextField
                        label="SearXNG Instance URL"
                        fullWidth
                        value={searxngConfig.searxngUrl}
                        onChange={(e) => setSearxngConfig(prev => ({ ...prev, searxngUrl: e.target.value }))}
                        placeholder="http://your-server:8080"
                        helperText="Ensure JSON format is enabled in settings.yml"
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleSaveSearxng}
                            disabled={savingSearxng}
                            startIcon={savingSearxng ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        >
                            Save Internal Search
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Backup Card - Oracle VM MySQL */}
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.main', borderRadius: 3 }}>
                <CardHeader
                    title="🔄 Database Backup"
                    titleTypographyProps={{ fontWeight: 'bold', color: 'error.main' }}
                    subheader="Backup Firebase data to Oracle VM (MySQL)"
                />
                <CardContent>
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Target:</strong> Oracle VM (129.151.245.242)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Database:</strong> truthlens_backup (MariaDB)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Schedule:</strong> Weekly (manual trigger available)
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleRunBackup}
                        disabled={runningBackup}
                        startIcon={runningBackup ? <CircularProgress size={16} color="inherit" /> : <CloudQueueIcon />}
                        fullWidth
                    >
                        {runningBackup ? 'Running Backup...' : 'Run Backup Now'}
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
}
