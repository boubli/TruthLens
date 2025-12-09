'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Chip,
    Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { motion } from 'framer-motion';
import { AIProvider, AILanguage, AI_PROVIDERS, AI_LANGUAGES } from '@/types/aiChat';
import { getUserApiKeys, savePreferredProvider, savePreferredLanguage } from '@/services/aiChatService';
import { useAuth } from '@/context/AuthContext';

interface AIChatSettingsProps {
    onSettingsChanged?: () => void;
}

export default function AIChatSettings({ onSettingsChanged }: AIChatSettingsProps) {
    const { user } = useAuth();

    const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
    const [selectedLanguage, setSelectedLanguage] = useState<AILanguage>('en');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        if (!user) return;
        try {
            const keys = await getUserApiKeys(user.uid);
            if (keys.preferredProvider) setSelectedProvider(keys.preferredProvider);
            if (keys.preferredLanguage) setSelectedLanguage(keys.preferredLanguage);
        } catch (error) {
            console.error('Failed to load AI settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderChange = async (provider: AIProvider) => {
        if (!user) return;
        setSelectedProvider(provider);
        setSaving(true);
        setMessage(null);
        try {
            await savePreferredProvider(user.uid, provider);
            setMessage({ type: 'success', text: `AI model set to ${AI_PROVIDERS[provider].name}` });
            onSettingsChanged?.();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save provider:', error);
            setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleLanguageChange = async (language: AILanguage) => {
        if (!user) return;
        setSelectedLanguage(language);
        setSaving(true);
        setMessage(null);
        try {
            await savePreferredLanguage(user.uid, language);
            setMessage({ type: 'success', text: `AI will now respond in ${AI_LANGUAGES[language].name}` });
            onSettingsChanged?.();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save language:', error);
            setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    return (
        <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ p: 4, borderRadius: 4 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SmartToyIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold">
                    AI Chat Settings
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Customize how the AI assistant responds to you.
            </Typography>

            {/* AI Model Selection */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    ⚡ AI Model
                </Typography>
                <FormControl fullWidth>
                    <Select
                        value={selectedProvider}
                        onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                        disabled={saving}
                        sx={{ borderRadius: 2 }}
                    >
                        {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((provider) => (
                            <MenuItem key={provider} value={provider}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <span>{AI_PROVIDERS[provider].icon}</span>
                                    <span>{AI_PROVIDERS[provider].name}</span>
                                    {selectedProvider === provider && (
                                        <Chip
                                            label="Selected"
                                            size="small"
                                            color="primary"
                                            sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Language Selection */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TranslateIcon sx={{ fontSize: 18 }} /> Response Language
                </Typography>
                <FormControl fullWidth>
                    <Select
                        value={selectedLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value as AILanguage)}
                        disabled={saving}
                        sx={{ borderRadius: 2 }}
                    >
                        {(Object.keys(AI_LANGUAGES) as AILanguage[]).map((lang) => (
                            <MenuItem key={lang} value={lang}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <span style={{ fontSize: 20 }}>{AI_LANGUAGES[lang].flag}</span>
                                    <span>{AI_LANGUAGES[lang].name}</span>
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                        ({AI_LANGUAGES[lang].nativeName})
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Status Message */}
            {message && (
                <Alert
                    severity={message.type}
                    icon={message.type === 'success' ? <CheckCircleIcon /> : undefined}
                    sx={{ mt: 2 }}
                >
                    {message.text}
                </Alert>
            )}

            {saving && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">Saving...</Typography>
                </Box>
            )}
        </Paper>
    );
}
