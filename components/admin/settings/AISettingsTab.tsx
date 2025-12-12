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
        openrouter?: string;
    };
    setModels: React.Dispatch<React.SetStateAction<any>>;
    // DeepSeek
    deepseekConfig?: {
        deepseekBaseUrl: string;
    };
    setDeepSeekConfig?: React.Dispatch<React.SetStateAction<any>>;
    handleSaveDeepSeek?: () => Promise<void>;
    savingDeepSeek?: boolean;
    // OpenRouter
    openrouterConfig?: {
        openrouterApiKey: string;
        openrouterModel: string;
        openrouterModels?: Record<string, boolean>;
    };
    setOpenRouterConfig?: React.Dispatch<React.SetStateAction<any>>;
    handleSaveOpenRouter?: () => Promise<void>;
    savingOpenRouter?: boolean;
    availableOpenRouterModels?: string[];
    fetchOpenRouterModels?: () => Promise<void>;
    toggleOpenRouterModel?: (modelId: string) => void;
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
    setModels,
    deepseekConfig,
    setDeepSeekConfig,
    handleSaveDeepSeek,
    savingDeepSeek,
    openrouterConfig,
    setOpenRouterConfig,
    handleSaveOpenRouter,
    savingOpenRouter,
    availableOpenRouterModels,
    fetchOpenRouterModels,
    toggleOpenRouterModel
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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Groq Configuration</Typography>
                        <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>Used for: AI Chat (Pro/Ultimate users)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <TextField
                            label="Groq API Key (Secure)"
                            type="password"
                            value={secureKeys.groq}
                            onChange={(e) => setSecureKeys(prev => ({ ...prev, groq: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Model ID"
                            value={models.groq || ''}
                            onChange={(e) => setModels((prev: any) => ({ ...prev, groq: e.target.value }))}
                            sx={{ width: '40%' }}
                            size="small"
                            placeholder="llama-3.3-70b-versatile"
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleTestAndSave && handleTestAndSave('groq', secureKeys.groq, models.groq || 'llama-3.3-70b-versatile')}
                            disabled={!secureKeys.groq || savingSecure}
                            sx={{ minWidth: '100px', whiteSpace: 'nowrap' }}
                        >
                            Test & Save
                        </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>Fast and powerful LLM for chat conversations</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Gemini Configuration</Typography>
                        <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>Used for: AI Chat (Pro/Ultimate users)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <TextField
                            label="Gemini API Key (Secure)"
                            type="password"
                            value={secureKeys.gemini}
                            onChange={(e) => setSecureKeys(prev => ({ ...prev, gemini: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Model ID"
                            value={models.gemini || ''}
                            onChange={(e) => setModels((prev: any) => ({ ...prev, gemini: e.target.value }))}
                            sx={{ width: '40%' }}
                            size="small"
                            placeholder="gemini-1.5-flash"
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleTestAndSave && handleTestAndSave('gemini', secureKeys.gemini, models.gemini || 'gemini-1.5-flash')}
                            disabled={!secureKeys.gemini || savingSecure}
                            sx={{ minWidth: '100px', whiteSpace: 'nowrap' }}
                        >
                            Test & Save
                        </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>Google's multimodal AI for chat and analysis</Typography>

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
                    subheader="Public collection for client-side Swarm Logic - Free/Plus users use these"
                    avatar={<CloudQueueIcon color="primary" />}
                    sx={{ bgcolor: '#e3f2fd', borderBottom: '1px solid #bbdefb' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>These keys are used when Free/Plus tier users don't provide their own keys. Test each one before saving!</Alert>

                    {/* Gemini Key */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Gemini</Typography>
                            <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>Food Scanning, AI Chat</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Gemini API Key"
                                fullWidth
                                size="small"
                                type={showKeys.gemini ? 'text' : 'password'}
                                value={freeApiKeys.gemini as string}
                                onChange={(e) => setFreeApiKeys((prev: any) => ({ ...prev, gemini: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => toggleShow('gemini')} edge="end" size="small">
                                                {showKeys.gemini ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleTestAndSave && handleTestAndSave('gemini', freeApiKeys.gemini as string, models.gemini || 'gemini-1.5-flash')}
                                disabled={!freeApiKeys.gemini || savingFreeKeys}
                                sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                            >
                                Test & Save
                            </Button>
                        </Box>
                    </Box>

                    {/* Groq Key */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Groq</Typography>
                            <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>AI Chat Fallback</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Groq API Key"
                                fullWidth
                                size="small"
                                type={showKeys.groq ? 'text' : 'password'}
                                value={freeApiKeys.groq as string}
                                onChange={(e) => setFreeApiKeys((prev: any) => ({ ...prev, groq: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => toggleShow('groq')} edge="end" size="small">
                                                {showKeys.groq ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleTestAndSave && handleTestAndSave('groq', freeApiKeys.groq as string, models.groq || 'llama-3.1-8b-instant')}
                                disabled={!freeApiKeys.groq || savingFreeKeys}
                                sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                            >
                                Test & Save
                            </Button>
                        </Box>
                    </Box>

                    {/* OpenAI Key */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>OpenAI</Typography>
                            <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>Premium Features</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="OpenAI API Key"
                                fullWidth
                                size="small"
                                type={showKeys.openai ? 'text' : 'password'}
                                value={freeApiKeys.openai as string}
                                onChange={(e) => setFreeApiKeys((prev: any) => ({ ...prev, openai: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => toggleShow('openai')} edge="end" size="small">
                                                {showKeys.openai ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleTestAndSave && handleTestAndSave('openai', freeApiKeys.openai as string, models.openai || 'gpt-3.5-turbo')}
                                disabled={!freeApiKeys.openai || savingFreeKeys}
                                sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                            >
                                Test & Save
                            </Button>
                        </Box>
                    </Box>

                    {/* DeepSeek Key */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>DeepSeek</Typography>
                            <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>AI Chat</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="DeepSeek API Key"
                                fullWidth
                                size="small"
                                type={showKeys.deepseek ? 'text' : 'password'}
                                value={freeApiKeys.deepseek as string}
                                onChange={(e) => setFreeApiKeys((prev: any) => ({ ...prev, deepseek: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => toggleShow('deepseek')} edge="end" size="small">
                                                {showKeys.deepseek ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleTestAndSave && handleTestAndSave('deepseek', freeApiKeys.deepseek as string, models.deepseek || 'deepseek-chat')}
                                disabled={!freeApiKeys.deepseek || savingFreeKeys}
                                sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                            >
                                Test & Save
                            </Button>
                        </Box>
                    </Box>

                    {/* Cerebras Key */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Cerebras</Typography>
                            <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>Fast Inference (Optional)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Cerebras API Key"
                                fullWidth
                                size="small"
                                type={showKeys.cerebras ? 'text' : 'password'}
                                value={freeApiKeys.cerebras as string}
                                onChange={(e) => setFreeApiKeys((prev: any) => ({ ...prev, cerebras: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => toggleShow('cerebras')} edge="end" size="small">
                                                {showKeys.cerebras ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                disabled
                                sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                            >
                                Save Only
                            </Button>
                        </Box>
                    </Box>

                    {/* Sambanova Key */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Sambanova</Typography>
                            <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>Specialized Tasks (Optional)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Sambanova API Key"
                                fullWidth
                                size="small"
                                type={showKeys.sambanova ? 'text' : 'password'}
                                value={freeApiKeys.sambanova as string}
                                onChange={(e) => setFreeApiKeys((prev: any) => ({ ...prev, sambanova: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => toggleShow('sambanova')} edge="end" size="small">
                                                {showKeys.sambanova ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                disabled
                                sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                            >
                                Save Only
                            </Button>
                        </Box>
                    </Box>

                    {/* SerpAPI Key */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>SerpAPI</Typography>
                            <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>Web Search Results</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="SerpAPI Key"
                                fullWidth
                                size="small"
                                type={showKeys.serpapi ? 'text' : 'password'}
                                value={freeApiKeys.serpapi as string}
                                onChange={(e) => setFreeApiKeys((prev: any) => ({ ...prev, serpapi: e.target.value }))}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => toggleShow('serpapi')} edge="end" size="small">
                                                {showKeys.serpapi ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                disabled
                                sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                            >
                                Save Only
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveFreeKeys}
                            disabled={savingFreeKeys}
                            startIcon={savingFreeKeys ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        >
                            Save All Free Keys
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* --- OLLAMA CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #e1bee7' }}>
                <CardHeader
                    title="Ollama AI Models"
                    subheader="Self-hosted LLM Inference Management (Free Forever)"
                    avatar={<SmartToyIcon color="secondary" />}
                    sx={{ bgcolor: '#f3e5f5', borderBottom: '1px solid #e1bee7' }}
                    action={
                        <Button startIcon={<SettingsSuggestIcon />} onClick={() => fetchOllamaModels(ollamaConfig.ollamaUrl)}>
                            Refresh Models
                        </Button>
                    }
                />
                <CardContent sx={{ p: 3 }}>
                    <Alert severity="success" sx={{ mb: 2 }}>✅ Self-hosted = No API costs! Used for AI Chat when selected by users.</Alert>
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

            {/* --- DEEPSEEK CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #42a5f5' }}>
                <CardHeader
                    title="DeepSeek AI"
                    subheader="High-performance Open/Self-hosted Model - Used for AI Chat"
                    avatar={<SmartToyIcon sx={{ color: '#42a5f5' }} />}
                    sx={{ bgcolor: '#e3f2fd', borderBottom: '1px solid #42a5f5' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>Configure your DeepSeek API or point to your self-hosted Ollama instance with DeepSeek models.</Alert>
                    <TextField
                        label="DeepSeek Base URL"
                        fullWidth
                        value={deepseekConfig?.deepseekBaseUrl || ''}
                        onChange={(e) => setDeepSeekConfig && setDeepSeekConfig((prev: any) => ({ ...prev, deepseekBaseUrl: e.target.value }))}
                        placeholder="https://api.deepseek.com or http://your-vm:11434"
                        helperText="Use 'https://api.deepseek.com' for official API, or your local Ollama URL for self-hosted."
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveDeepSeek}
                            disabled={savingDeepSeek}
                            startIcon={savingDeepSeek ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            sx={{
                                bgcolor: '#42a5f5',
                                '&:hover': { bgcolor: '#1e88e5' }
                            }}
                        >
                            Save DeepSeek Config
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* --- OPENROUTER CARD --- */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #ff6b6b' }}>
                <CardHeader
                    title="OpenRouter API"
                    subheader="Access 100+ AI Models via Single API - Used for AI Chat"
                    avatar={<CloudQueueIcon sx={{ color: '#ff6b6b' }} />}
                    sx={{ bgcolor: '#ffe5e5', borderBottom: '1px solid #ff6b6b' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>🌐 Free models available! Users can select OpenRouter in AI Chat.</Alert>
                    <TextField
                        label="OpenRouter API Key"
                        fullWidth
                        type="password"
                        value={openrouterConfig?.openrouterApiKey || ''}
                        onChange={(e) => setOpenRouterConfig && setOpenRouterConfig((prev: any) => ({ ...prev, openrouterApiKey: e.target.value }))}
                        placeholder="sk-or-v1-..."
                        helperText="Get your free API key from openrouter.ai"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Default Model"
                        fullWidth
                        value={openrouterConfig?.openrouterModel || ''}
                        onChange={(e) => setOpenRouterConfig && setOpenRouterConfig((prev: any) => ({ ...prev, openrouterModel: e.target.value }))}
                        placeholder="meta-llama/llama-3.1-8b-instruct:free"
                        helperText="Free models: meta-llama/llama-3.1-8b-instruct:free, google/gemma-2-9b-it:free"
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveOpenRouter}
                            disabled={savingOpenRouter}
                            startIcon={savingOpenRouter ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            sx={{
                                bgcolor: '#ff6b6b',
                                '&:hover': { bgcolor: '#ff5252' }
                            }}
                        >
                            Save OpenRouter Config
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
