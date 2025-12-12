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
import ComputerIcon from '@mui/icons-material/Computer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface SystemSettingsTabProps {
    searxngConfig: { searxngUrl: string };
    setSearxngConfig: React.Dispatch<React.SetStateAction<{ searxngUrl: string }>>;
    handleSaveSearxng: () => Promise<void>;
    savingSearxng: boolean;
    handleRunBackup: () => Promise<void>;
    runningBackup: boolean;
    // GitHub Models (PC Builder)
    githubModelsConfig: {
        githubModelsToken: string;
        githubModelsModel: string;
    };
    setGithubModelsConfig: React.Dispatch<React.SetStateAction<any>>;
    handleSaveGithubModels: () => Promise<void>;
    savingGithubModels: boolean;
    // PC Consultation Price
    pcConsultationPrice: number;
    setPcConsultationPrice: React.Dispatch<React.SetStateAction<number>>;
    handleSavePcPrice: () => Promise<void>;
    savingPcPrice: boolean;
}

export default function SystemSettingsTab({
    searxngConfig,
    setSearxngConfig,
    handleSaveSearxng,
    savingSearxng,
    handleRunBackup,
    runningBackup,
    githubModelsConfig,
    setGithubModelsConfig,
    handleSaveGithubModels,
    savingGithubModels,
    pcConsultationPrice,
    setPcConsultationPrice,
    handleSavePcPrice,
    savingPcPrice
}: SystemSettingsTabProps) {
    return (
        <Box>
            {/* --- GITHUB MODELS (PC BUILDER) CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #c8b6ff' }}>
                <CardHeader
                    title="GitHub Models API (PC Builder)"
                    subheader="AI for PC build recommendations"
                    avatar={<ComputerIcon sx={{ color: '#6C63FF' }} />}
                    sx={{ bgcolor: '#f3f0ff', borderBottom: '1px solid #c8b6ff' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <TextField
                        label="GitHub Personal Access Token"
                        fullWidth
                        type="password"
                        value={githubModelsConfig.githubModelsToken}
                        onChange={(e) => setGithubModelsConfig((prev: any) => ({ ...prev, githubModelsToken: e.target.value }))}
                        placeholder="github_pat_11..."
                        helperText="Create a token at github.com/settings/tokens with 'models' scope"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Model"
                        fullWidth
                        value={githubModelsConfig.githubModelsModel}
                        onChange={(e) => setGithubModelsConfig((prev: any) => ({ ...prev, githubModelsModel: e.target.value }))}
                        placeholder="gpt-4o"
                        helperText="Model ID from GitHub Models catalog"
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveGithubModels}
                            disabled={savingGithubModels}
                            startIcon={savingGithubModels ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            sx={{
                                background: 'linear-gradient(45deg, #6C63FF 30%, #00F0FF 90%)',
                                '&:hover': { opacity: 0.9 }
                            }}
                        >
                            Save PC Builder Config
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* --- PC BUILDER CONSULTATION PRICE --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #ffd700' }}>
                <CardHeader
                    title="PC Consultation Service"
                    subheader="Pricing configuration"
                    avatar={<AttachMoneyIcon sx={{ color: '#ffd700' }} />}
                    sx={{ bgcolor: '#fffde7', borderBottom: '1px solid #ffd700' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <TextField
                        label="Consultation Price (USD Cents)"
                        fullWidth
                        type="number"
                        value={pcConsultationPrice}
                        onChange={(e) => setPcConsultationPrice(Number(e.target.value))}
                        placeholder="2000"
                        helperText="2000 = $20.00"
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleSavePcPrice}
                            disabled={savingPcPrice}
                            startIcon={savingPcPrice ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            sx={{
                                background: 'linear-gradient(45deg, #FFD700 30%, #FF8C00 90%)',
                                color: 'white'
                            }}
                        >
                            Save Price
                        </Button>
                    </Box>
                </CardContent>
            </Card>

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
            </Card >

            {/* Backup Card - Oracle VM MySQL */}
            < Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.main', borderRadius: 3 }}>
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
            </Card >
        </Box >
    );
}
