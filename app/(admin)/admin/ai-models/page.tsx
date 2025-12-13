'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Button,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Switch,
    Tooltip,
    IconButton,
    Card,
    CardContent,
    Divider,
    Snackbar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import CloudIcon from '@mui/icons-material/Cloud';
import { useAuth } from '@/context/AuthContext';
import { getSystemSettings, updateSystemSettings } from '@/services/systemService';
import axios from 'axios';

interface Model {
    name: string;
    displayName: string;
    size: string;
    purpose: string;
    enabled: boolean;
    status: 'active' | 'inactive' | 'testing';
}

export default function AIModelsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [models, setModels] = useState<Model[]>([]);
    const [serverUrl, setServerUrl] = useState('http://localhost:11435');
    const [testingModel, setTestingModel] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        setLoading(true);
        setServerStatus('checking');

        try {
            // Get settings from Firebase
            const settings = await getSystemSettings();
            const ollamaUrl = settings.apiKeys?.ollamaUrl || 'http://localhost:11435';
            setServerUrl(ollamaUrl);

            // Fetch models from Ollama server
            const token = await user?.getIdToken();
            console.log('[AI Models] Fetching from:', ollamaUrl, 'Auth:', !!token);

            const response = await axios.get('/api/admin/ollama/models', {
                params: { url: ollamaUrl },
                headers: { Authorization: `Bearer ${token}` },
                timeout: 30000 // Increased timeout to 30s for slow connections
            });

            console.log('[AI Models] Response:', response.data);
            const modelsList = response.data.models || [];
            const enabledModels = settings.apiKeys?.ollamaModels || {};

            // Map models with display info
            const mappedModels: Model[] = modelsList.map((m: any) => ({
                name: m.name,
                displayName: getDisplayName(m.name),
                size: formatSize(m.size),
                purpose: getPurpose(m.name),
                enabled: enabledModels[m.name] !== false, // Default to enabled
                status: 'active' as const
            }));

            setModels(mappedModels);
            setServerStatus('online');
            setSnackbar({
                open: true,
                message: `✅ Connected! Found ${mappedModels.length} models`,
                severity: 'success'
            });

        } catch (error: any) {
            console.error('[AI Models] Error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Connection failed';
            setServerStatus('offline');
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const getDisplayName = (modelName: string): string => {
        const nameMap: Record<string, string> = {
            'llama3.1:8b': 'Llama 3.1 (8B)',
            'mistral:7b': 'Mistral (7B)',
            'gemma:2b': 'Gemma (2B)',
            'phi': 'Phi',
            'phi:latest': 'Phi',
            'qwen:1.8b': 'Qwen (1.8B)',
            'stablelm2:1.6b': 'StableLM2 (1.6B)',
            'tinyllama': 'TinyLlama',
            'deepseek-coder:6.7b': 'DeepSeek Coder',
            'deepseek-llm:7b': 'DeepSeek LLM'
        };
        return nameMap[modelName] || modelName;
    };

    const getPurpose = (modelName: string): string => {
        if (modelName.includes('llama3')) return 'Advanced tasks & reasoning';
        if (modelName.includes('mistral')) return 'General purpose & analysis';
        if (modelName.includes('gemma')) return 'Fast general tasks';
        if (modelName.includes('phi')) return 'Product analysis & reasoning';
        if (modelName.includes('qwen')) return 'Multilingual (Arabic/French)';
        if (modelName.includes('stablelm')) return 'Natural conversation';
        if (modelName.includes('tinyllama')) return 'Quick responses';
        if (modelName.includes('deepseek-coder')) return 'Code generation';
        if (modelName.includes('deepseek-llm')) return 'Advanced reasoning';
        return 'General AI tasks';
    };

    const formatSize = (bytes: number): string => {
        if (!bytes) return 'Unknown';
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(1)}GB`;
    };

    const handleToggleModel = async (modelName: string, enabled: boolean) => {
        try {
            // Update local state immediately
            setModels(prev => prev.map(m =>
                m.name === modelName ? { ...m, enabled } : m
            ));

            // Save to Firebase
            const settings = await getSystemSettings();
            const updatedModels = {
                ...settings.apiKeys?.ollamaModels,
                [modelName]: enabled
            };

            await updateSystemSettings({
                apiKeys: {
                    ...settings.apiKeys,
                    ollamaModels: updatedModels
                }
            });

            setSnackbar({
                open: true,
                message: `${getDisplayName(modelName)} ${enabled ? 'enabled' : 'disabled'}`,
                severity: 'success'
            });
        } catch (error) {
            console.error('Failed to update model:', error);
            // Revert local state
            setModels(prev => prev.map(m =>
                m.name === modelName ? { ...m, enabled: !enabled } : m
            ));
            setSnackbar({ open: true, message: 'Failed to update model', severity: 'error' });
        }
    };

    const handleTestModel = async (modelName: string) => {
        setTestingModel(modelName);
        try {
            const token = await user?.getIdToken();
            const response = await axios.post(
                '/api/admin/ollama/test',
                {
                    url: serverUrl,
                    model: modelName,
                    prompt: 'Hello! Please respond with a single word: OK'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: `✅ ${getDisplayName(modelName)} working perfectly!`,
                    severity: 'success'
                });
            } else {
                throw new Error('Test failed');
            }
        } catch (error) {
            console.error('Test failed:', error);
            setSnackbar({
                open: true,
                message: `❌ ${getDisplayName(modelName)} test failed`,
                severity: 'error'
            });
        } finally {
            setTestingModel(null);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    🤖 AI Models
                </Typography>
                <Typography color="text.secondary">
                    Manage your self-hosted AI models running on Azure VM
                </Typography>
            </Box>

            {/* Server Status Card */}
            <Card sx={{ mb: 3, background: serverStatus === 'online' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f44336', color: 'white' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CloudIcon sx={{ fontSize: 40 }} />
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    AI Server Status
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {serverUrl}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            {serverStatus === 'online' ? (
                                <>
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label="ONLINE"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold' }}
                                    />
                                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                                        {models.length} models ready
                                    </Typography>
                                </>
                            ) : (
                                <Chip
                                    icon={<ErrorIcon />}
                                    label="OFFLINE"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold' }}
                                />
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Models List */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                        Available Models
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchModels}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>

                {models.length === 0 ? (
                    <Alert severity="warning" icon={<WarningIcon />}>
                        No models found. Please check your server connection.
                    </Alert>
                ) : (
                    <List>
                        {models.map((model, index) => (
                            <React.Fragment key={model.name}>
                                <ListItem
                                    sx={{
                                        py: 2,
                                        '&:hover': { bgcolor: 'action.hover' },
                                        borderRadius: 1
                                    }}
                                >
                                    <ListItemIcon>
                                        <Box sx={{ position: 'relative' }}>
                                            <SmartToyIcon
                                                sx={{
                                                    fontSize: 40,
                                                    color: model.enabled ? 'success.main' : 'text.disabled'
                                                }}
                                            />
                                            {model.enabled && (
                                                <CheckCircleIcon
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: -2,
                                                        right: -2,
                                                        fontSize: 16,
                                                        color: 'success.main',
                                                        bgcolor: 'white',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="h6" fontWeight="bold">
                                                    {model.displayName}
                                                </Typography>
                                                <Chip
                                                    label={model.size}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 0.5 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {model.purpose}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                                                    Model ID: {model.name}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tooltip title={model.enabled ? 'Model enabled' : 'Model disabled'}>
                                                <Switch
                                                    checked={model.enabled}
                                                    onChange={(e) => handleToggleModel(model.name, e.target.checked)}
                                                    color="success"
                                                />
                                            </Tooltip>
                                            <Tooltip title="Test this model">
                                                <span>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleTestModel(model.name)}
                                                        disabled={!model.enabled || testingModel === model.name}
                                                    >
                                                        {testingModel === model.name ? (
                                                            <CircularProgress size={24} />
                                                        ) : (
                                                            <PlayArrowIcon />
                                                        )}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Box>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < models.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Info Section */}
            <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                    💡 How it works:
                </Typography>
                <Typography variant="body2">
                    • <strong>Enable/Disable</strong>: Toggle models on or off. Disabled models won't be used by the app.
                    <br />
                    • <strong>Test</strong>: Send a quick test to verify the model is working correctly.
                    <br />
                    • <strong>Auto-Save</strong>: All changes are instantly saved to Firebase.
                </Typography>
            </Alert>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
