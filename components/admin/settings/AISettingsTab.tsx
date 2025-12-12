'use client';

import React from 'react';
import {
    Box,
    Paper,
    Typography,
    // Grid, // Removing from main import
    Card,
    CardHeader,
    CardContent,
    TextField,
    Button,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
    Switch
} from '@mui/material';
import Grid from '@mui/material/GridLegacy'; // Using GridLegacy for v5 compatibility
import BuildIcon from '@mui/icons-material/Build';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import SaveIcon from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface AISettingsTabProps {
    secureKeys: Record<string, string>;
    setSecureKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    handleTestAndSave?: (provider: string, apiKey: string, modelId: string) => Promise<void>;
    handleSaveSecureKeys?: () => Promise<void>;
    savingSecure: boolean;
    freeApiKeys: Record<string, string>;
    setFreeApiKeys: React.Dispatch<React.SetStateAction<any>>;
    handleSaveFreeKeys: () => Promise<void>;
    savingFreeKeys: boolean;
    showKeys: Record<string, boolean>;
    toggleShow: (key: string) => void;
    ollamaConfig: {
        ollamaUrl: string;
        ollamaFallbackUrl: string;
        defaultOllamaModel: string;
        ollamaModels: Record<string, boolean>;
    };
    setOllamaConfig: React.Dispatch<React.SetStateAction<any>>;
    handleSaveOllama: () => Promise<void>;
    savingOllama: boolean;
    availableModels: string[];
    fetchOllamaModels: (url: string) => Promise<void>;
    toggleModel: (modelName: string) => void;
    models: {
        gemini?: string;
        groq?: string;
        openai?: string;
        deepseek?: string;
    };
    setModels: React.Dispatch<React.SetStateAction<any>>;
}

export default function AISettingsTab({
    secureKeys,
    setSecureKeys,
    handleSaveSecureKeys,
    handleTestAndSave,
    savingSecure,
    freeApiKeys,
    setFreeApiKeys,
    handleSaveFreeKeys,
    savingFreeKeys,
    showKeys,
    toggleShow,
    ollamaConfig,
    setOllamaConfig,
    handleSaveOllama,
    savingOllama,
    availableModels,
    fetchOllamaModels,
    toggleModel,
    models,
    setModels
}: AISettingsTabProps) {
    return (
        <Box>
            {/* --- SECURE KEYS (SERVER SIDE) --- */}
            <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BuildIcon /> Secure AI Keys & Models
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 'auto', bgcolor: '#e8f5e9', color: 'success.dark', px: 1, py: 0.5, borderRadius: 1 }}>Server-Side Vault</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>Keys here are never exposed to the client. Used for production-critical LLMs.</Alert>

                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>Groq Configuration</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            label="Groq API Key (Secure)"
                            type="password"
                            value={secureKeys.groq}
                            onChange={(e) => setSecureKeys(prev => ({ ...prev, groq: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Model ID (e.g., llama-3.3-70b-versatile)"
                            value={models.groq || ''}
                            onChange={(e) => setModels((prev: any) => ({ ...prev, groq: e.target.value }))}
                            sx={{ width: '40%' }}
                            size="small"
                            placeholder="Default: llama-3.3-70b-versatile"
                        />
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>Gemini Configuration</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            label="Gemini API Key (Secure)"
                            type="password"
                            value={secureKeys.gemini}
                            onChange={(e) => setSecureKeys(prev => ({ ...prev, gemini: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Model ID (e.g., gemini-1.5-flash)"
                            value={models.gemini || ''}
                            onChange={(e) => setModels((prev: any) => ({ ...prev, gemini: e.target.value }))}
                            sx={{ width: '40%' }}
                            size="small"
                            placeholder="Default: gemini-1.5-flash"
                        />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button variant="contained" color="success" onClick={handleSaveSecureKeys} disabled={savingSecure} startIcon={savingSecure ? <CircularProgress size={16} /> : <SaveIcon />}>
                            {savingSecure ? 'Securing...' : 'Update Vault & Models'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* --- FREE API KEYS CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #bbdefb' }}>
                <CardHeader
                    title="Legacy & Free API Keys"
                    subheader="Public collection for client-side Swarm Logic"
                    avatar={<CloudQueueIcon color="primary" />}
                    sx={{ bgcolor: '#e3f2fd', borderBottom: '1px solid #bbdefb' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        {Object.keys(freeApiKeys).map((key) => (
                            <Grid item xs={12} sm={6} key={key}>
                                <TextField
                                    label={`${key.charAt(0).toUpperCase() + key.slice(1)} Key`}
                                    fullWidth
                                    size="small"
                                    type={showKeys[key] ? 'text' : 'password'}
                                    value={freeApiKeys[key] as string}
                                    onChange={(e) => setFreeApiKeys((prev: any) => ({ ...prev, [key]: e.target.value }))}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => toggleShow(key)} edge="end" size="small">
                                                    {showKeys[key] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveFreeKeys}
                            disabled={savingFreeKeys}
                            startIcon={savingFreeKeys ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        >
                            Save Free Keys
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* --- OLLAMA CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #e1bee7' }}>
                <CardHeader
                    title="Ollama AI Models"
                    subheader="Self-hosted LLM Inference Management"
                    avatar={<SmartToyIcon color="secondary" />}
                    sx={{ bgcolor: '#f3e5f5', borderBottom: '1px solid #e1bee7' }}
                    action={
                        <Button startIcon={<SettingsSuggestIcon />} onClick={() => fetchOllamaModels(ollamaConfig.ollamaUrl)}>
                            Refresh Models
                        </Button>
                    }
                />
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Primary Ollama URL"
                                fullWidth
                                value={ollamaConfig.ollamaUrl}
                                onChange={(e) => setOllamaConfig((prev: any) => ({ ...prev, ollamaUrl: e.target.value }))}
                                placeholder="http://primary-server:11434"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Fallback Ollama URL"
                                fullWidth
                                value={ollamaConfig.ollamaFallbackUrl}
                                onChange={(e) => setOllamaConfig((prev: any) => ({ ...prev, ollamaFallbackUrl: e.target.value }))}
                                placeholder="http://backup-server:11434"
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}>
                        DETECTED MODELS ({availableModels.length})
                    </Typography>

                    {availableModels.length > 0 ? (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {availableModels.map((model) => (
                                <Grid item xs={12} key={model}>
                                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: ollamaConfig.defaultOllamaModel === model ? 'rgba(156, 39, 176, 0.04)' : 'transparent', borderColor: ollamaConfig.defaultOllamaModel === model ? 'secondary.main' : 'divider' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {model}
                                                </Typography>
                                                <Typography variant="caption" color={ollamaConfig.ollamaModels?.[model] ? 'success.main' : 'text.secondary'}>
                                                    {ollamaConfig.ollamaModels?.[model] ? 'Enabled' : 'Disabled'}
                                                </Typography>
                                            </Box>
                                            {ollamaConfig.defaultOllamaModel === model && (
                                                <Box sx={{ bgcolor: 'secondary.main', color: 'white', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                    DEFAULT
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant={ollamaConfig.defaultOllamaModel === model ? "contained" : "outlined"}
                                                color="secondary"
                                                disabled={!ollamaConfig.ollamaModels?.[model]}
                                                onClick={() => setOllamaConfig((prev: any) => ({ ...prev, defaultOllamaModel: model }))}
                                                sx={{ fontSize: '0.7rem' }}
                                            >
                                                {ollamaConfig.defaultOllamaModel === model ? "Main" : "Set Main"}
                                            </Button>
                                            <Switch
                                                checked={!!ollamaConfig.ollamaModels?.[model]}
                                                onChange={() => toggleModel(model)}
                                                color="success"
                                            />
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Alert severity="warning" sx={{ mb: 3 }}>No models detected. Ensure Ollama is running and accessible.</Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleSaveOllama}
                            disabled={savingOllama}
                            startIcon={savingOllama ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        >
                            Save Model Config
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
