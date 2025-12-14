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
    Switch,
    Backdrop,
    Fade,
    Autocomplete,
    Chip
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
        huggingface?: string;
        cerebras?: string;
        sambanova?: string;
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
    testingProviderId?: string | null;
    // GitHub Models
    githubModelsConfig?: {
        githubModelsToken: string;
        githubModelsModel: string;
    };
    setGithubModelsConfig?: React.Dispatch<React.SetStateAction<any>>;
    handleSaveGithubModels?: () => Promise<void>;
    savingGithubModels?: boolean;
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
    toggleOpenRouterModel,
    testingProviderId,
    // GitHub Models
    githubModelsConfig,
    setGithubModelsConfig,
    handleSaveGithubModels,
    savingGithubModels
}: AISettingsTabProps) {
    // Unified Provider Configuration List
    const providers = [
        {
            id: 'openai',
            name: 'OpenAI',
            icon: <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="OpenAI" style={{ width: 24, height: 24 }} />,
            color: '#10a37f', // Green
            description: 'Industry standard for complex reasoning',
            apiKey: (freeApiKeys.openai as string) || '',
            setApiKey: (val: string) => setFreeApiKeys((prev: any) => ({ ...prev, openai: val })),
            model: models.openai || '',
            setModel: (val: string) => setModels((prev: any) => ({ ...prev, openai: val })),
            defaultModel: 'gpt-4o-mini',
            isSecure: false
        },
        {
            id: 'gemini',
            name: 'Google Gemini',
            icon: <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Gemini" style={{ width: 24, height: 24 }} />,
            color: '#1a73e8', // Blue
            description: 'Multimodal AI (Vision + Chat)',
            apiKey: secureKeys.gemini || freeApiKeys.gemini || '',
            setApiKey: (val: string) => {
                setSecureKeys(prev => ({ ...prev, gemini: val }));
                setFreeApiKeys((prev: any) => ({ ...prev, gemini: val }));
            },
            model: models.gemini || '',
            setModel: (val: string) => setModels((prev: any) => ({ ...prev, gemini: val })),
            defaultModel: 'gemini-1.5-flash',
            isSecure: true
        },
        {
            id: 'groq',
            name: 'Groq',
            icon: <img src="https://avatars.githubusercontent.com/u/102422079?s=200&v=4" alt="Groq" style={{ width: 24, height: 24, borderRadius: '4px' }} />,
            color: '#f57c00', // Orange
            description: 'Fastest inference for AI Chat (Recommended)',
            apiKey: secureKeys.groq || freeApiKeys.groq || '',
            setApiKey: (val: string) => {
                // Prioritize Secure updates, but sync Free if Secure is empty (simplification)
                setSecureKeys(prev => ({ ...prev, groq: val }));
                setFreeApiKeys((prev: any) => ({ ...prev, groq: val }));
            },
            model: models.groq || '',
            setModel: (val: string) => setModels((prev: any) => ({ ...prev, groq: val })),
            defaultModel: 'llama-3.3-70b-versatile',
            isSecure: true
        },
        {
            id: 'github',
            name: 'GitHub Models (PC Builder)',
            icon: <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" style={{ width: 24, height: 24, filter: 'invert(1)' }} />,
            color: '#24292e', // GitHub Black
            description: 'AI for PC build recommendations (GPT-4o)',
            apiKey: githubModelsConfig?.githubModelsToken || '',
            setApiKey: (val: string) => setGithubModelsConfig && setGithubModelsConfig((prev: any) => ({ ...prev, githubModelsToken: val })),
            model: githubModelsConfig?.githubModelsModel || '',
            setModel: (val: string) => setGithubModelsConfig && setGithubModelsConfig((prev: any) => ({ ...prev, githubModelsModel: val })),
            defaultModel: 'gpt-4o',
            isSecure: true // It treats token as secure usually
        },
        {
            id: 'deepseek',
            name: 'DeepSeek',
            icon: <img src="https://avatars.githubusercontent.com/u/146703566?s=200&v=4" alt="DeepSeek" style={{ width: 24, height: 24, borderRadius: '4px' }} />,
            color: '#4d53e0', // Indigo
            description: 'Strong reasoning capabilities (API or Self-Hosted)',
            apiKey: (freeApiKeys.deepseek as string) || '',
            setApiKey: (val: string) => setFreeApiKeys((prev: any) => ({ ...prev, deepseek: val })),
            model: models.deepseek || '',
            setModel: (val: string) => setModels((prev: any) => ({ ...prev, deepseek: val })),
            defaultModel: 'deepseek-chat',
            isSecure: false,
            extraSettings: (
                <TextField
                    label="Comparison / Base URL (Optional)"
                    fullWidth
                    size="small"
                    value={deepseekConfig?.deepseekBaseUrl || ''}
                    onChange={(e) => setDeepSeekConfig && setDeepSeekConfig((prev: any) => ({ ...prev, deepseekBaseUrl: e.target.value }))}
                    placeholder="https://api.deepseek.com"
                    sx={{ mt: 2 }}
                />
            )
        },
        {
            id: 'openrouter',
            name: 'OpenRouter',
            icon: <img src="https://avatars.githubusercontent.com/u/136613866?s=200&v=4" alt="OpenRouter" style={{ width: 24, height: 24, borderRadius: '4px' }} />,
            color: '#ef5350', // Red
            description: 'Hub for 100+ Models (Free Tiers Available)',
            apiKey: openrouterConfig?.openrouterApiKey || '',
            setApiKey: (val: string) => setOpenRouterConfig && setOpenRouterConfig((prev: any) => ({ ...prev, openrouterApiKey: val })),
            model: openrouterConfig?.openrouterModel || '',
            setModel: (val: string) => setOpenRouterConfig && setOpenRouterConfig((prev: any) => ({ ...prev, openrouterModel: val })),
            defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
            isSecure: false,
            extraSettings: (
                <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {availableOpenRouterModels && availableOpenRouterModels.map(m => (
                            <Chip
                                key={m}
                                label={m}
                                size="small"
                                onClick={() => toggleOpenRouterModel && toggleOpenRouterModel(m)}
                                color={openrouterConfig?.openrouterModel === m ? "primary" : "default"}
                                variant={openrouterConfig?.openrouterModel === m ? "filled" : "outlined"}
                            />
                        ))}
                    </Box>
                    <Button
                        size="small"
                        onClick={() => fetchOpenRouterModels && fetchOpenRouterModels()}
                        startIcon={<CloudQueueIcon />}
                    >
                        Load Models
                    </Button>
                </Box>
            )
        },
        {
            id: 'huggingface',
            name: 'HuggingFace',
            icon: <img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" alt="HuggingFace" style={{ width: 24, height: 24 }} />,
            color: '#ffd000', // Yellow
            description: 'Open-source model hosting',
            apiKey: (freeApiKeys.huggingface as string) || '',
            setApiKey: (val: string) => setFreeApiKeys((prev: any) => ({ ...prev, huggingface: val })),
            model: models.huggingface || '',
            setModel: (val: string) => setModels((prev: any) => ({ ...prev, huggingface: val })),
            defaultModel: 'meta-llama/Meta-Llama-3-8B-Instruct',
            isSecure: false
        },
        {
            id: 'cerebras',
            name: 'Cerebras',
            icon: <img src="https://avatars.githubusercontent.com/u/55291244?s=200&v=4" alt="Cerebras" style={{ width: 24, height: 24, borderRadius: '4px' }} />,
            color: '#1d1d1f',
            description: 'Wafer-scale engine inference',
            apiKey: (freeApiKeys.cerebras as string) || '',
            setApiKey: (val: string) => setFreeApiKeys((prev: any) => ({ ...prev, cerebras: val })),
            model: models.cerebras || '',
            setModel: (val: string) => setModels((prev: any) => ({ ...prev, cerebras: val })),
            defaultModel: 'llama3.1-70b',
            isSecure: false
        },
        {
            id: 'sambanova',
            name: 'SambaNova',
            icon: <img src="https://avatars.githubusercontent.com/u/36696142?s=200&v=4" alt="SambaNova" style={{ width: 24, height: 24, borderRadius: '4px' }} />,
            color: '#C8102E',
            description: 'Full stack AI platform',
            apiKey: (freeApiKeys.sambanova as string) || '',
            setApiKey: (val: string) => setFreeApiKeys((prev: any) => ({ ...prev, sambanova: val })),
            model: models.sambanova || '',
            setModel: (val: string) => setModels((prev: any) => ({ ...prev, sambanova: val })),
            defaultModel: 'Meta-Llama-3.1-8B-Instruct',
            isSecure: false
        }
    ];

    // Common Save Handler
    const handleSave = async (providerId: string, secure: boolean) => {
        if (providerId === 'deepseek') await handleSaveDeepSeek?.();
        else if (providerId === 'openrouter') await handleSaveOpenRouter?.();
        else if (providerId === 'github') await handleSaveGithubModels?.();
        else if (secure) await handleSaveSecureKeys?.();
        else await handleSaveFreeKeys();
    };

    return (
        <Box>
            {/* OLLAMA SECTION (Kept separate as it's structurally unique) */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid #e1bee7' }}>
                <CardHeader
                    title="Ollama (Self-Hosted)"
                    subheader="Free, private, local inference. Recommended for privacy."
                    avatar={<img src="https://avatars.githubusercontent.com/u/149025251?s=200&v=4" alt="Ollama" style={{ width: 24, height: 24, borderRadius: '4px' }} />}
                    sx={{ bgcolor: '#f3e5f5', borderBottom: '1px solid #e1bee7' }}
                    action={
                        <Button startIcon={<SettingsSuggestIcon />} onClick={() => fetchOllamaModels(ollamaConfig.ollamaUrl)}>
                            Refresh Models
                        </Button>
                    }
                />
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                label="Ollama Server URL"
                                fullWidth
                                size="small"
                                value={ollamaConfig.ollamaUrl}
                                onChange={(e) => setOllamaConfig((prev: any) => ({ ...prev, ollamaUrl: e.target.value }))}
                                placeholder="http://localhost:11434"
                            />
                        </Grid>
                        <Grid item xs={12} md={4} display="flex" alignItems="center">
                            <Button
                                fullWidth
                                variant="contained"
                                color="secondary"
                                onClick={handleSaveOllama}
                                disabled={savingOllama}
                            >
                                {savingOllama ? <CircularProgress size={24} /> : 'Save Config'}
                            </Button>
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
                        Active Models ({availableModels.length})
                    </Typography>

                    {availableModels.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {availableModels.map(model => (
                                <Paper
                                    key={model}
                                    variant="outlined"
                                    sx={{
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        borderColor: ollamaConfig.defaultOllamaModel === model ? 'secondary.main' : 'divider',
                                        bgcolor: ollamaConfig.defaultOllamaModel === model ? 'rgba(156, 39, 176, 0.04)' : 'transparent'
                                    }}
                                >
                                    <Switch
                                        size="small"
                                        checked={!!ollamaConfig.ollamaModels?.[model]}
                                        onChange={() => toggleModel(model)}
                                    />
                                    <Box onClick={() => setOllamaConfig((prev: any) => ({ ...prev, defaultOllamaModel: model }))} sx={{ cursor: 'pointer' }}>
                                        <Typography variant="caption" fontWeight="bold">{model}</Typography>
                                        {ollamaConfig.defaultOllamaModel === model && <Typography variant="caption" display="block" color="secondary" sx={{ fontSize: '0.6rem' }}>DEFAULT</Typography>}
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Alert severity="warning" variant="outlined" sx={{ py: 0 }}>No models detected at {ollamaConfig.ollamaUrl}</Alert>
                    )}
                </CardContent>
            </Card>

            <Typography variant="overline" color="text.secondary" sx={{ ml: 1, mb: 1, display: 'block' }}>cloud providers</Typography>

            <Grid container spacing={3}>
                {providers.map((p) => (
                    <Grid item xs={12} md={6} key={p.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, borderTop: `4px solid ${p.color}` }}>
                            <CardHeader
                                title={p.name}
                                subheader={p.description}
                                avatar={<Box sx={{ color: p.color }}>{p.icon}</Box>}
                                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                                subheaderTypographyProps={{ variant: 'caption', lineHeight: 1.2 }}
                                sx={{ pb: 1 }}
                            />
                            <CardContent sx={{ pt: 1, flexGrow: 1 }}>
                                <Box sx={{ mb: 2 }}>
                                    <TextField
                                        label="API Key"
                                        type={showKeys[p.id] ? 'text' : 'password'}
                                        fullWidth
                                        size="small"
                                        value={p.apiKey}
                                        onChange={(e) => p.setApiKey(e.target.value)}
                                        placeholder={p.isSecure ? "Stored securely on server" : "Public/Client key"}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => toggleShow(p.id)} edge="end" size="small">
                                                        {showKeys[p.id] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        options={[]}
                                        value={p.model ? p.model.split(',').map((s: string) => s.trim()).filter((s: string) => s) : []}
                                        onChange={(event, newValue) => {
                                            p.setModel(newValue.join(', '));
                                        }}
                                        renderTags={(value: readonly string[], getTagProps) =>
                                            value.map((option: string, index: number) => (
                                                <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />
                                            ))
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                label="Model ID(s)"
                                                placeholder={p.model ? "" : p.defaultModel}
                                                helperText="Press Enter to add multiple models for redundancy"
                                                size="small"
                                            />
                                        )}
                                    />
                                </Box>
                                {p.extraSettings}
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, mt: 'auto', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button
                                    size="small"
                                    color={testingProviderId === p.id ? "primary" : "inherit"}
                                    onClick={() => handleTestAndSave && handleTestAndSave(p.id, p.apiKey, p.model || p.defaultModel)}
                                    disabled={!p.apiKey || !!testingProviderId}
                                    startIcon={testingProviderId === p.id ? <CircularProgress size={16} /> : undefined}
                                >
                                    {testingProviderId === p.id ? 'Testing...' : 'Test & Save'}
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    sx={{ bgcolor: p.color, '&:hover': { bgcolor: p.color, filter: 'brightness(0.9)' } }}
                                    onClick={() => handleSave(p.id, p.isSecure)}
                                    startIcon={<SaveIcon />}
                                    disabled={!!testingProviderId}
                                >
                                    Save Only
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Centered Testing Overlay */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 9999, // Very high z-index to cover everything
                    flexDirection: 'column',
                    backdropFilter: 'blur(4px)',
                    bgcolor: 'rgba(0, 0, 0, 0.8)'
                }}
                open={!!testingProviderId}
            >
                {(() => {
                    const activeProvider = providers.find(p => p.id === testingProviderId);
                    if (!activeProvider) return null;

                    return (
                        <Fade in={!!testingProviderId} timeout={500}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <Box sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 140,
                                    height: 140,
                                    bgcolor: 'background.paper',
                                    borderRadius: '50%',
                                    boxShadow: `0 0 50px ${activeProvider.color}60`,
                                    border: `4px solid ${activeProvider.color}`
                                }}>
                                    {/* Icon container - clone element to increase size if possible, or just wrap */}
                                    <Box sx={{
                                        fontSize: 70,
                                        color: activeProvider.color,
                                        display: 'flex',
                                        '& svg': { fontSize: 80 }
                                    }}>
                                        {activeProvider.icon}
                                    </Box>

                                    <CircularProgress
                                        size={160}
                                        sx={{
                                            position: 'absolute',
                                            color: activeProvider.color,
                                            opacity: 0.8
                                        }}
                                        thickness={1.5}
                                    />
                                </Box>

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.5)', mb: 1 }}>
                                        Testing {activeProvider.name}...
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'light' }}>
                                        Verifying keys & connectivity
                                    </Typography>
                                </Box>
                            </Box>
                        </Fade>
                    );
                })()}
            </Backdrop>
        </Box>
    );
}
