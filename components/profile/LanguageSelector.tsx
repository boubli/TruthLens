'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Box,
    Typography,
    FormControl,
    Select,
    MenuItem,
    Button,
    Alert,
    CircularProgress,
    SelectChangeEvent
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';

// Language Options Map
const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },

];

export default function LanguageSelector() {
    const { t, i18n } = useTranslation();
    const { user, userProfile, refreshProfile } = useAuth();

    // Local state for immediate UI feedback before saving
    // Initialize with current i18n language or user profile preference
    const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLanguageChange = (event: SelectChangeEvent) => {
        setSelectedLang(event.target.value as string);
        setMessage(null); // Clear previous messages on change
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        setMessage(null);

        try {
            // 1. Update Firebase
            // Update preferences.language field
            await setDoc(doc(db, 'users', user.uid), {
                preferences: { language: selectedLang }
            }, { merge: true });

            // 2. Change Language in App
            await i18n.changeLanguage(selectedLang);

            // 3. Refresh Profile Context (to sync across app)
            await refreshProfile();

            // 4. Success Feedback
            setMessage({ type: 'success', text: t('language_updated_success') });

        } catch (error) {
            console.error('Error saving language:', error);
            setMessage({ type: 'error', text: t('error_saving_data') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 4, mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LanguageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                    {t('language_selection_label')}
                </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('current_language_label')}: <b>{LANGUAGES.find(l => l.code === i18n.language)?.label || i18n.language}</b>
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                        value={selectedLang}
                        onChange={handleLanguageChange}
                        displayEmpty
                    >
                        {LANGUAGES.map((lang) => (
                            <MenuItem key={lang.code} value={lang.code}>
                                <span style={{ marginRight: '10px', fontSize: '1.2em' }}>{lang.flag}</span>
                                {lang.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading || selectedLang === i18n.language}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Saving...' : t('save_button')}
                </Button>
            </Box>

            {message && (
                <Alert severity={message.type} sx={{ mt: 2 }}>
                    {message.text}
                </Alert>
            )}
        </Box>
    );
}
