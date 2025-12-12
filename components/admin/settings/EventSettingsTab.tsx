import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    Divider,
    IconButton,
    Chip,
    Card,
    CardContent,
    CardActions,
    Stack,
    Tooltip,
    MenuItem
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { EventManagerConfig, ExtendedSystemSettings } from '@/types/system';
import DateTimeSplitter from '@/components/admin/settings/DateTimeSplitter';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EventIcon from '@mui/icons-material/Event';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MessageIcon from '@mui/icons-material/Message';
import PaletteIcon from '@mui/icons-material/Palette';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CircularProgress from '@mui/material/CircularProgress';

import TuneIcon from '@mui/icons-material/Tune';

interface EventSettingsTabProps {
    settings: ExtendedSystemSettings;
    onUpdateSettings: (newSettings: ExtendedSystemSettings) => void;
    saving: boolean;
}

// TEMPLATE for new events (Phase A removed)
const DEFAULT_EVENT_TEMPLATE: EventManagerConfig = {
    event_id: 'New_Event',
    is_active_global: true,
    // [REMOVED] general_theme_start/end
    celebration_music_start: new Date(Date.now() + 3600000).toISOString(),
    celebration_climax_start: new Date(Date.now() + 3900000).toISOString(),
    celebration_music_end: new Date(Date.now() + 7200000).toISOString(),
    countdown_seconds: 10,
    celebration_message: 'HAPPY HOLIDAYS',
    special_message: '',
    special_message_color: '#ffffff',
    special_message_image_url: '',
    climax_message_start: '',
    climax_message_end: '',
    special_message_start: '',
    special_message_end: '',
    music_file_url: '',
    climax_effect: 'fireworks'
};

export default function EventSettingsTab({
    settings,
    onUpdateSettings,
    saving
}: EventSettingsTabProps) {

    const [view, setView] = useState<'LIST' | 'EDITOR'>('LIST');
    const [editingIndex, setEditingIndex] = useState<number>(-1);
    const [editorState, setEditorState] = useState<EventManagerConfig>(DEFAULT_EVENT_TEMPLATE);
    const [uploading, setUploading] = useState(false);

    const schedule: EventManagerConfig[] = settings?.eventSchedule || [];

    // --- ACTIONS ---

    const handleCreateNew = () => {
        setEditorState({ ...DEFAULT_EVENT_TEMPLATE, event_id: `Event_${new Date().getFullYear()}` });
        setEditingIndex(-1);
        setView('EDITOR');
    };

    const handleEdit = (index: number) => {
        setEditorState({ ...schedule[index] });
        setEditingIndex(index);
        setView('EDITOR');
    };

    const handleDelete = async (index: number) => {
        if (!confirm('Are you sure you want to delete this event? This will also delete any associated music file.')) return;

        const eventToDelete = schedule[index];
        if (eventToDelete.music_file_url && eventToDelete.music_file_url.includes('cloud.appwrite.io')) {
            try {
                const urlObj = new URL(eventToDelete.music_file_url);
                const pathParts = urlObj.pathname.split('/');
                const bucketId = pathParts[3];
                const fileId = pathParts[5];

                if (bucketId && fileId) {
                    await fetch('/api/admin/delete-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bucketId, fileId })
                    });
                }
            } catch (e) {
                console.error("Failed to cleanup file", e);
            }
        }

        const newSchedule = [...schedule];
        newSchedule.splice(index, 1);
        onUpdateSettings({ ...settings, eventSchedule: newSchedule });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'music_file_url' | 'special_message_image_url') => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success && data.url) {
                handleEditorChange(targetField, data.url);
            } else {
                alert('Upload Failed: ' + (data.error || 'Unknown Error'));
            }
        } catch (err) {
            console.error(err);
            alert('Upload Error');
        } finally {
            setUploading(false);
        }
    };

    const handleEditorChange = (field: keyof EventManagerConfig, value: any) => {
        setEditorState(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveEditor = () => {
        const newSchedule = [...schedule];
        if (editingIndex === -1) {
            newSchedule.push(editorState);
        } else {
            newSchedule[editingIndex] = editorState;
        }
        onUpdateSettings({ ...settings, eventSchedule: newSchedule });
        setView('LIST');
    };

    // Update Global Atmosphere Settings
    const handleGlobalUpdate = <K extends keyof ExtendedSystemSettings>(key: K, value: ExtendedSystemSettings[K]) => {
        onUpdateSettings({
            ...settings,
            [key]: value
        });
    };

    const handleGlobalEffectChange = (effectKey: 'snow' | 'rain' | 'leaves' | 'confetti' | 'christmas', value: boolean) => {
        // Ensure globalEffects exists, default to all false if undefined
        const currentEffects = settings.globalEffects || { snow: false, rain: false, leaves: false, confetti: false, christmas: false };

        onUpdateSettings({
            ...settings,
            globalEffects: {
                ...currentEffects,
                [effectKey]: value
            }
        });
    };

    const fmtDate = (iso: string) => {
        if (!iso) return 'N/A';
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER ---

    if (view === 'LIST') {
        return (
            <Box>
                {/* ----------------- GLOBAL ATMOSPHERE CONTROL ----------------- */}
                <Card variant="outlined" sx={{ mb: 4, borderColor: 'primary.main', borderWidth: 1 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <TuneIcon color="primary" fontSize="large" />
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">Global Atmosphere Control</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Toggle multiple effects simultaneously. These run independently of scheduled events.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Snow Switch */}
                            <Grid item xs={6} md={3}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.globalEffects?.snow || false}
                                            onChange={(e) => handleGlobalEffectChange('snow', e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="❄️ Snow"
                                />
                            </Grid>
                            {/* Rain Switch */}
                            <Grid item xs={6} md={3}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.globalEffects?.rain || false}
                                            onChange={(e) => handleGlobalEffectChange('rain', e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="🌧️ Rain"
                                />
                            </Grid>
                            {/* Leaves Switch */}
                            <Grid item xs={6} md={3}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.globalEffects?.leaves || false}
                                            onChange={(e) => handleGlobalEffectChange('leaves', e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="🍂 Leaves"
                                />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.globalEffects?.confetti || false}
                                            onChange={(e) => handleGlobalEffectChange('confetti', e.target.checked)}
                                            color="secondary"
                                        />
                                    }
                                    label="🎊 Confetti"
                                />
                            </Grid>
                            {/* Christmas Switch */}
                            <Grid item xs={6} md={3}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.globalEffects?.christmas || false}
                                            onChange={(e) => handleGlobalEffectChange('christmas', e.target.checked)}
                                            color="error"
                                        />
                                    }
                                    label="🎄 Christmas"
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Divider sx={{ mb: 4 }} />

                {/* ----------------- SCHEDULED EVENTS HEADER ----------------- */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="text.primary">
                            Event Schedule
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Scheduled celebrations (New Year Countdown, Music, Popups).
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={handleCreateNew}
                    >
                        New Event
                    </Button>
                </Box>

                {/* Grid of Cards */}
                {schedule.length === 0 ? (
                    <Box sx={{
                        p: 8,
                        textAlign: 'center',
                        borderRadius: 4,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider'
                    }}>
                        <EventIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5, color: 'text.secondary' }} />
                        <Typography color="text.secondary">No scheduled events. Create one to get started!</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {schedule.map((evt, idx) => (
                            <Grid item xs={12} md={6} lg={4} key={evt.event_id || idx}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Chip
                                                label={evt.is_active_global ? "ACTIVE" : "INACTIVE"}
                                                size="small"
                                                color={evt.is_active_global ? "success" : "default"}
                                            />
                                            {/* Phase A Removed, just show Climax info */}
                                            <Chip
                                                icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                                                label={evt.climax_effect === 'none' ? 'No Climax' : evt.climax_effect}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>
                                            {evt.event_id}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40, fontStyle: 'italic' }}>
                                            "{evt.celebration_message}"
                                        </Typography>

                                        <Divider sx={{ mb: 2 }} />

                                        <Stack spacing={1}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', width: 60, color: 'text.primary' }}>START</Typography>
                                                {fmtDate(evt.celebration_music_start)}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', width: 60, color: 'text.primary' }}>END</Typography>
                                                {fmtDate(evt.celebration_music_end)}
                                            </Box>
                                        </Stack>
                                    </CardContent>

                                    <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                                        <Tooltip title="Delete Event">
                                            <IconButton onClick={() => handleDelete(idx)} color="error" size="small">
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEdit(idx)}
                                        >
                                            Edit
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        );
    }

    // --- EDITOR VIEW (STANDARD UI) ---
    return (
        <Box>
            <Button
                startIcon={<ArrowBackIosNewIcon />}
                onClick={() => setView('LIST')}
                sx={{ mb: 3 }}
            >
                Back to Schedule
            </Button>

            <Paper sx={{ p: 4, mb: 3 }} variant="outlined">
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                    <Box>
                        <Typography variant="overline" color="primary" fontWeight="bold">
                            CONFIGURATION
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            {editingIndex === -1 ? 'New Event Setup' : editorState.event_id}
                        </Typography>
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={editorState.is_active_global}
                                onChange={(e) => handleEditorChange('is_active_global', e.target.checked)}
                                color="success"
                            />
                        }
                        label={<Typography fontWeight="bold">{editorState.is_active_global ? "ACTIVE" : "INACTIVE"}</Typography>}
                    />
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Event Identifier"
                            value={editorState.event_id}
                            onChange={(e) => handleEditorChange('event_id', e.target.value)}
                            helperText="Internal unique name (e.g. 'NYE_2025')"
                        />
                    </Grid>

                    {/* PHASE A REMOVED (Theme & Ambience) - Now handled globally */}
                    <Grid item xs={12}>
                        <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                    Note: Background effects (Phase A) are now controlled globally via the "Global Atmosphere Control" tab.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* PHASE B CARD - The Celebration */}
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.primary' }}>
                                    <EventIcon color="secondary" /> The Celebration Event
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    The main event moment. Fireworks, countdowns, and music.
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Climax Effect"
                                            value={editorState.climax_effect || 'fireworks'}
                                            onChange={(e) => handleEditorChange('climax_effect', e.target.value)}
                                            SelectProps={{ native: true }}
                                        >
                                            <option value="fireworks">🎆 Fireworks</option>
                                            <option value="confetti">🎊 Confetti</option>
                                            <option value="both">🎆 + 🎊 Both</option>
                                            <option value="none">🚫 None</option>
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Climax Message (Big Text)"
                                            value={editorState.celebration_message}
                                            onChange={(e) => handleEditorChange('celebration_message', e.target.value)}
                                            placeholder="e.g. HAPPY NEW YEAR!"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <DateTimeSplitter
                                            label="Msg Start"
                                            value={editorState.climax_message_start || ''}
                                            onChange={(val) => handleEditorChange('climax_message_start', val)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <DateTimeSplitter
                                            label="Msg End"
                                            value={editorState.climax_message_end || ''}
                                            onChange={(val) => handleEditorChange('climax_message_end', val)}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Countdown (s)"
                                            value={editorState.countdown_seconds}
                                            onChange={(e) => handleEditorChange('countdown_seconds', parseInt(e.target.value) || 10)}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <DateTimeSplitter
                                            label="Music Start (Fade In)"
                                            value={editorState.celebration_music_start}
                                            onChange={(val) => handleEditorChange('celebration_music_start', val)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <DateTimeSplitter
                                            label="All Effects Start (Climax)"
                                            value={editorState.celebration_climax_start || editorState.celebration_music_start}
                                            onChange={(val) => handleEditorChange('celebration_climax_start', val)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <DateTimeSplitter
                                            label="Event Stop (Fade Out)"
                                            value={editorState.celebration_music_end}
                                            onChange={(val) => handleEditorChange('celebration_music_end', val)}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }}>Special Message Configuration</Divider>
                                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                                            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MessageIcon fontSize="small" /> Special Message
                                            </Typography>

                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={4}>
                                                    <DateTimeSplitter
                                                        label="Msg Start"
                                                        value={editorState.special_message_start || ''}
                                                        onChange={(val) => handleEditorChange('special_message_start', val)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <DateTimeSplitter
                                                        label="Msg End"
                                                        value={editorState.special_message_end || ''}
                                                        onChange={(val) => handleEditorChange('special_message_end', val)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        rows={4}
                                                        label="Message Text (Thank You Note)"
                                                        value={editorState.special_message || ''}
                                                        onChange={(e) => handleEditorChange('special_message', e.target.value)}
                                                        placeholder="Use this space for a detailed message..."
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Stack spacing={3}>
                                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                            <PaletteIcon color="action" />
                                                            <TextField
                                                                fullWidth
                                                                type="color"
                                                                label="Text Color"
                                                                value={editorState.special_message_color || '#ffffff'}
                                                                onChange={(e) => handleEditorChange('special_message_color', e.target.value)}
                                                            />
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                            <ImageSearchIcon color="action" />
                                                            <TextField
                                                                fullWidth
                                                                label="Message Image URL"
                                                                value={editorState.special_message_image_url || ''}
                                                                onChange={(e) => handleEditorChange('special_message_image_url', e.target.value)}
                                                                disabled={uploading}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <Button
                                                                            component="label"
                                                                            variant="contained"
                                                                            size="small"
                                                                            disabled={uploading}
                                                                            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                                                        >
                                                                            Upload
                                                                            <input
                                                                                type="file"
                                                                                hidden
                                                                                accept="image/*"
                                                                                onChange={(e) => handleFileUpload(e, 'special_message_image_url')}
                                                                            />
                                                                        </Button>
                                                                    )
                                                                }}
                                                            />
                                                        </Box>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* MUSIC SECTION */}
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                                    <MusicNoteIcon color="primary" />
                                    <Typography variant="h6">Background Music</Typography>
                                </Box>

                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={8}>
                                        <TextField
                                            fullWidth
                                            label="Music URL"
                                            value={editorState.music_file_url}
                                            onChange={(e) => handleEditorChange('music_file_url', e.target.value)}
                                            placeholder="https://..."
                                            disabled={uploading}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            component="label"
                                            variant="contained"
                                            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                                            disabled={uploading}
                                            sx={{ flex: 1 }}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload File'}
                                            <input
                                                type="file"
                                                hidden
                                                accept="audio/*"
                                                onChange={(e) => handleFileUpload(e, 'music_file_url')}
                                            />
                                        </Button>

                                        {editorState.music_file_url && (
                                            <Tooltip title="Clear/Remove Music">
                                                <IconButton color="error" onClick={() => handleEditorChange('music_file_url', '')}>
                                                    <DeleteForeverIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Footer Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 6, gap: 2 }}>
                    <Button
                        size="large"
                        variant="outlined"
                        onClick={() => setEditorState({ ...DEFAULT_EVENT_TEMPLATE, event_id: 'Auto_' + Date.now() })}
                    >
                        Load Preset
                    </Button>
                    <Button
                        size="large"
                        variant="contained"
                        onClick={handleSaveEditor}
                        sx={{ px: 5, fontWeight: 'bold' }}
                    >
                        Save Configuration
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
