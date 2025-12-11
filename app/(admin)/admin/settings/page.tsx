'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Snackbar,
    Alert,
    Tabs,
    Tab,
    Paper
} from '@mui/material';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { getSystemSettings, updateSystemSettings } from '@/services/systemService';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

// Import Sub-Components
import GeneralSettingsTab from '@/components/admin/settings/GeneralSettingsTab';
import AISettingsTab from '@/components/admin/settings/AISettingsTab';
import SystemSettingsTab from '@/components/admin/settings/SystemSettingsTab';

import { EventManagerConfig } from '@/types/system';

export default function AdminSettingsPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Tab State (Default to 0 or URL param)
    const initialTab = parseInt(searchParams.get('tab') || '0');
    const [tabValue, setTabValue] = useState(initialTab);

    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: 'success', text: '' });
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    // General Settings
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [betaMode, setBetaMode] = useState(false);
    const [branding, setBranding] = useState({
        faviconUrl: '',
        appleTouchIconUrl: '',
        androidIcon192Url: '',
        androidIcon512Url: ''
    });
    const [savingBranding, setSavingBranding] = useState(false);

    // Secure API Keys (stored in _system_secrets - backend only access)
    const [secureKeys, setSecureKeys] = useState({
        groq: '',
        gemini: ''
    });
    const [savingSecure, setSavingSecure] = useState(false);

    // --- FREE API KEYS ---
    const [freeApiKeys, setFreeApiKeys] = useState({
        gemini: '',
        groq: '',
        openai: '',
        deepseek: '',
        cerebras: '',
        sambanova: '',
        serpapi: ''
    });
    const [savingFreeKeys, setSavingFreeKeys] = useState(false);

    // --- SEARXNG SETTINGS ---
    const [searxngConfig, setSearxngConfig] = useState({
        searxngUrl: ''
    });
    const [savingSearxng, setSavingSearxng] = useState(false);

    // --- OLLAMA SETTINGS ---
    const [ollamaConfig, setOllamaConfig] = useState({
        ollamaUrl: '',
        ollamaFallbackUrl: '',
        defaultOllamaModel: '',
        ollamaModels: {} as Record<string, boolean>
    });
    const [savingOllama, setSavingOllama] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    // --- BACKUP SETTINGS ---
    const [runningBackup, setRunningBackup] = useState(false);

    // --- EVENT MANAGER SETTINGS ---
    // Moved to /admin/events

    useEffect(() => {
        if (!authLoading) {
            if (userProfile?.role !== 'admin') {
                router.push('/');
                return;
            }
            fetchSettings();
        }
    }, [userProfile, authLoading]);

    // Update URL when tab changes
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', newValue.toString());
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const fetchSettings = async () => {
        try {
            const settings = await getSystemSettings();

            // Load environment variable keys as fallback/current values
            const envKeys = {
                gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
                groq: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
                openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
                deepseek: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
                cerebras: process.env.NEXT_PUBLIC_CEREBRAS_API_KEY || '',
                sambanova: process.env.NEXT_PUBLIC_SAMBANOVA_API_KEY || '',
                serpapi: process.env.NEXT_PUBLIC_SERPAPI_API_KEY || '',
            };

            setFreeApiKeys({
                gemini: settings.apiKeys?.gemini || envKeys.gemini,
                groq: settings.apiKeys?.groq || envKeys.groq,
                openai: settings.apiKeys?.openai || envKeys.openai,
                deepseek: settings.apiKeys?.deepseek || envKeys.deepseek,
                cerebras: settings.apiKeys?.cerebras || envKeys.cerebras,
                sambanova: settings.apiKeys?.sambanova || envKeys.sambanova,
                serpapi: settings.apiKeys?.serpapi || envKeys.serpapi,
            });

            setSearxngConfig({
                searxngUrl: settings.apiKeys?.searxngUrl || 'http://20.199.129.203:8080',
            });

            setOllamaConfig({
                ollamaUrl: settings.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434',
                ollamaFallbackUrl: settings.apiKeys?.ollamaFallbackUrl || '',
                defaultOllamaModel: settings.apiKeys?.defaultOllamaModel || '',
                ollamaModels: settings.apiKeys?.ollamaModels || {}
            });

            // Load Models list if Ollama URL exists
            const currentOllamaUrl = settings.apiKeys?.ollamaUrl || 'http://20.199.129.203:11434';
            if (currentOllamaUrl) {
                fetchOllamaModels(currentOllamaUrl, false);
            }

            if (settings.branding) {
                setBranding({
                    faviconUrl: settings.branding.faviconUrl || '',
                    appleTouchIconUrl: settings.branding.appleTouchIconUrl || '',
                    androidIcon192Url: settings.branding.androidIcon192Url || '',
                    androidIcon512Url: settings.branding.androidIcon512Url || ''
                });
            }

            if (typeof settings.maintenanceMode !== 'undefined') {
                setMaintenanceMode(settings.maintenanceMode);
            }
            if (typeof settings.betaAccess !== 'undefined') {
                setBetaMode(settings.betaAccess);
            }


        } catch (error) {
            console.error(error);
            setMsg({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const toggleShow = (key: string) => {
        setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- HANDLERS (Moved from inline to functions where possible, or kept here if simple) ---

    const updateMaintenanceMode = async (val: boolean) => {
        try {
            await updateSystemSettings({ maintenanceMode: val });
            setMsg({ type: 'success', text: `Maintenance mode ${val ? 'enabled' : 'disabled'}` });
        } catch (e) {
            console.error(e);
            setMsg({ type: 'error', text: 'Failed to update maintenance mode' });
            setMaintenanceMode(!val); // Revert
        }
    };

    const updateBetaMode = async (val: boolean) => {
        try {
            await updateSystemSettings({ betaAccess: val });
            setMsg({ type: 'success', text: `Beta features ${val ? 'enabled' : 'disabled'}` });
        } catch (e) {
            console.error(e);
            setMsg({ type: 'error', text: 'Failed to update beta config' });
            setBetaMode(!val); // Revert
        }
    };

    const handleSaveFreeKeys = async () => {
        setSavingFreeKeys(true);
        try {
            const currentSettings = await getSystemSettings();
            const updatedApiKeys = {
                ...currentSettings.apiKeys,
                ...freeApiKeys
            };
            await updateSystemSettings({ apiKeys: updatedApiKeys });
            setMsg({ type: 'success', text: 'Free API Keys updated!' });
        } catch (error) {
            console.error('Save Free Keys Error:', error);
            setMsg({ type: 'error', text: 'Failed to save API keys' });
        } finally {
            setSavingFreeKeys(false);
        }
    };

    const handleSaveSearxng = async () => {
        setSavingSearxng(true);
        try {
            const currentSettings = await getSystemSettings();
            const updatedApiKeys = {
                ...currentSettings.apiKeys,
                ...searxngConfig
            };
            await updateSystemSettings({ apiKeys: updatedApiKeys });
            setMsg({ type: 'success', text: 'SearXNG Settings updated!' });
        } catch (error) {
            console.error('Save SearXNG Error:', error);
            setMsg({ type: 'error', text: 'Failed to save SearXNG settings' });
        } finally {
            setSavingSearxng(false);
        }
    };

    const handleSaveOllama = async () => {
        setSavingOllama(true);
        try {
            const currentSettings = await getSystemSettings();
            const updatedApiKeys = {
                ...currentSettings.apiKeys,
                ...ollamaConfig
            };
            if (!updatedApiKeys.ollamaModels) {
                updatedApiKeys.ollamaModels = {};
            }
            await updateSystemSettings({ apiKeys: updatedApiKeys });
            setMsg({ type: 'success', text: 'Ollama Settings updated!' });
        } catch (error) {
            console.error('Save Ollama Error:', error);
            setMsg({ type: 'error', text: 'Failed to save Ollama settings' });
        } finally {
            setSavingOllama(false);
        }
    };

    const handleSaveBranding = async () => {
        setSavingBranding(true);
        try {
            await updateSystemSettings({ branding });
            setMsg({ type: 'success', text: 'Branding updated!' });
        } catch (error) {
            console.error('Save Branding Error:', error);
            setMsg({ type: 'error', text: 'Failed to save branding' });
        } finally {
            setSavingBranding(false);
        }
    };

    const fetchOllamaModels = async (url: string, showMsg = true) => {
        if (!url || !user) return;
        setLoadingModels(true);
        try {
            console.log('[ADMIN] Fetching models via proxy for:', url);
            const token = await user.getIdToken();
            const response = await axios.get('/api/admin/ollama/models', {
                params: { url: url },
                headers: { Authorization: `Bearer ${token}` }
            });

            const models = response.data.models?.map((m: any) => m.name) || [];
            if (models.length > 0) {
                setAvailableModels(models);
                setOllamaConfig(prev => {
                    const currentModels = prev.ollamaModels || {};
                    const newModels = { ...currentModels };
                    models.forEach((m: string) => {
                        if (newModels[m] === undefined) {
                            newModels[m] = true;
                        }
                    });
                    return { ...prev, ollamaModels: newModels };
                });
                if (showMsg) setMsg({ type: 'success', text: `Found ${models.length} AI models!` });
            } else {
                setAvailableModels([]);
                if (showMsg) setMsg({ type: 'warning', text: 'Connected to server, but no models found installed.' });
            }
        } catch (error) {
            console.error('[ADMIN] Failed to fetch models:', error);
            if (showMsg) setMsg({ type: 'error', text: 'Failed to connect. Ensure your Ollama server is running and accessible from the backend.' });
        } finally {
            setLoadingModels(false);
        }
    };

    const toggleModel = (modelName: string) => {
        setOllamaConfig(prev => ({
            ...prev,
            ollamaModels: {
                ...prev.ollamaModels,
                [modelName]: !prev.ollamaModels?.[modelName]
            }
        }));
    };

    const handleSaveSecureKeys = async () => {
        if (!user) return;
        setSavingSecure(true);
        try {
            const token = await user.getIdToken();
            if (secureKeys.groq) {
                await axios.post('/api/admin/keys', {
                    action: 'save',
                    provider: 'groq',
                    key: secureKeys.groq
                }, { headers: { Authorization: `Bearer ${token}` } });
            }
            if (secureKeys.gemini) {
                await axios.post('/api/admin/keys', {
                    action: 'save',
                    provider: 'gemini',
                    key: secureKeys.gemini
                }, { headers: { Authorization: `Bearer ${token}` } });
            }
            setMsg({ type: 'success', text: '🔐 Secure AI keys updated! Server actions will now use these keys.' });
            setSecureKeys({ groq: '', gemini: '' });
        } catch (error: any) {
            console.error('Failed to save secure keys:', error);
            setMsg({ type: 'error', text: 'Failed to save secure keys. Ensure you have Admin privileges.' });
        } finally {
            setSavingSecure(false);
        }
    };

    const handleRunBackup = async () => {
        setRunningBackup(true);
        try {
            const token = await user?.getIdToken();
            const res = await axios.post('/api/admin/backup', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMsg({ type: 'success', text: `Backup completed! ${res.data.recordsBackedUp} records saved.` });
        } catch (e: any) {
            setMsg({ type: 'error', text: e.response?.data?.error || 'Backup failed' });
        } finally {
            setRunningBackup(false);
        }
    };




    if (loading || authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 1, sm: 2 } }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' }, color: '#333' }}>
                System Settings
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                Manage global configuration, AI services, and integrations.
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab icon={<SettingsSuggestIcon />} iconPosition="start" label="General" />
                    <Tab icon={<SmartToyIcon />} iconPosition="start" label="AI & Models" />
                    <Tab icon={<CloudQueueIcon />} iconPosition="start" label="Integrations" />

                </Tabs>
            </Paper>

            <Box sx={{ mt: 3 }}>
                {tabValue === 0 && (
                    <GeneralSettingsTab
                        maintenanceMode={maintenanceMode}
                        setMaintenanceMode={setMaintenanceMode}
                        updateMaintenanceMode={updateMaintenanceMode}
                        betaMode={betaMode}
                        setBetaMode={setBetaMode}
                        updateBetaMode={updateBetaMode}
                        branding={branding}
                        setBranding={setBranding}
                        handleSaveBranding={handleSaveBranding}
                        savingBranding={savingBranding}
                    />
                )}
                {tabValue === 1 && (
                    <AISettingsTab
                        secureKeys={secureKeys}
                        setSecureKeys={setSecureKeys}
                        handleSaveSecureKeys={handleSaveSecureKeys}
                        savingSecure={savingSecure}
                        freeApiKeys={freeApiKeys}
                        setFreeApiKeys={setFreeApiKeys}
                        handleSaveFreeKeys={handleSaveFreeKeys}
                        savingFreeKeys={savingFreeKeys}
                        showKeys={showKeys}
                        toggleShow={toggleShow}
                        ollamaConfig={ollamaConfig}
                        setOllamaConfig={setOllamaConfig}
                        handleSaveOllama={handleSaveOllama}
                        savingOllama={savingOllama}
                        availableModels={availableModels}
                        fetchOllamaModels={fetchOllamaModels}
                        toggleModel={toggleModel}
                    />
                )}
                {tabValue === 2 && (
                    <SystemSettingsTab
                        searxngConfig={searxngConfig}
                        setSearxngConfig={setSearxngConfig}
                        handleSaveSearxng={handleSaveSearxng}
                        savingSearxng={savingSearxng}
                        handleRunBackup={handleRunBackup}
                        runningBackup={runningBackup}
                    />
                )}

            </Box>

            <Snackbar
                open={!!msg.text}
                autoHideDuration={6000}
                onClose={() => setMsg({ type: '', text: '' })}
            >
                <Alert severity={msg.type as any} sx={{ width: '100%' }}>
                    {msg.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}
