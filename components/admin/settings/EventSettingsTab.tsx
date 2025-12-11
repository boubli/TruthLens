import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    TextField,
    // Grid,
    Button,
    Divider,
    IconButton,
    Chip,
    Card,
    CardContent,
    CardActions,
    Stack,
    Tooltip
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { EventManagerConfig } from '@/types/system';
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

interface EventSettingsTabProps {
    settings: { eventSchedule?: EventManagerConfig[] };
    onUpdateSettings: (newSettings: any) => void;
    saving: boolean;
}

// TEMPLATE for new events
const DEFAULT_EVENT_TEMPLATE: EventManagerConfig = {
    event_id: 'New_Event',
    is_active_global: true,
    general_theme_start: new Date().toISOString(),
    general_theme_end: new Date(Date.now() + 86400000).toISOString(),
    celebration_music_start: new Date(Date.now() + 3600000).toISOString(),
    celebration_climax_start: new Date(Date.now() + 3900000).toISOString(),
    celebration_music_end: new Date(Date.now() + 7200000).toISOString(),
    countdown_seconds: 10,
    celebration_message: 'HAPPY HOLIDAYS',
    special_message: '', // [NEW] Default empty
    music_file_url: '',
    theme_effect: 'snow_cold',
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
    const [uploading, setUploading] = useState(false); // [NEW] Upload state

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

        // Attempt to delete file if it exists and is from Appwrite
        if (eventToDelete.music_file_url && eventToDelete.music_file_url.includes('cloud.appwrite.io')) {
            try {
                // Extract IDs from URL
                // Format: .../buckets/[BUCKET]/files/[FILE]/view...
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

    const fmtDate = (iso: string) => {
        if (!iso) return 'N/A';
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER ---

    if (view === 'LIST') {
        return (
            <Box>
                {/* Header Section */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                    p: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff', mb: 0.5 }}>
                            Event Schedule
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Manage upcoming seasonal events. The system automatically activates the event matching the current date.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={handleCreateNew}
                        sx={{
                            background: 'linear-gradient(45deg, #00C853, #64DD17)',
                            color: '#000',
                            fontWeight: 'bold',
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            boxShadow: '0 4px 15px rgba(0, 200, 83, 0.3)',
                            '&:hover': { background: 'linear-gradient(45deg, #00E676, #76FF03)' }
                        }}
                    >
                        New Event
                    </Button>
                </Box>

                {/* Grid of Cards */}
                {schedule.length === 0 ? (
                    <Box sx={{
                        p: 8,
                        textAlign: 'center',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        borderRadius: 4,
                        color: 'text.secondary'
                    }}>
                        <EventIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                        <Typography>No scheduled events. Create one to get started!</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {schedule.map((evt, idx) => (
                            <Grid item xs={12} md={6} lg={4} key={evt.event_id || idx}>
                                <Card sx={{
                                    height: '100%',
                                    background: 'rgba(30,30,40,0.7)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 3,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    }
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Chip
                                                label={evt.is_active_global ? "ACTIVE" : "INACTIVE"}
                                                size="small"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    bgcolor: evt.is_active_global ? 'rgba(0, 200, 83, 0.2)' : 'rgba(255,255,255,0.1)',
                                                    color: evt.is_active_global ? '#69F0AE' : '#999',
                                                }}
                                            />
                                            <Chip
                                                icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                                                label={evt.theme_effect === 'none' ? 'No Theme' : evt.theme_effect}
                                                size="small"
                                                variant="outlined"
                                                sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                                            />
                                        </Box>

                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                                            {evt.event_id}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2, minHeight: 40 }}>
                                            "{evt.celebration_message}"
                                        </Typography>

                                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                                        <Stack spacing={1}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.85rem' }}>
                                                <Typography variant="caption" sx={{ color: '#4FC3F7', fontWeight: 'bold', width: 60 }}>START</Typography>
                                                {fmtDate(evt.general_theme_start)}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.85rem' }}>
                                                <Typography variant="caption" sx={{ color: '#FF5252', fontWeight: 'bold', width: 60 }}>END</Typography>
                                                {fmtDate(evt.general_theme_end)}
                                            </Box>
                                        </Stack>
                                    </CardContent>

                                    <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                                        <Tooltip title="Delete Event">
                                            <IconButton onClick={() => handleDelete(idx)} sx={{ color: '#FF5252', mr: 1 }}>
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEdit(idx)}
                                            sx={{ borderRadius: 2, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
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

    // --- EDITOR VIEW (PREMIUM UI) ---
    return (
        <Box>
            <Button
                startIcon={<ArrowBackIosNewIcon />}
                onClick={() => setView('LIST')}
                sx={{ mb: 3, color: 'text.secondary', '&:hover': { color: '#fff' } }}
            >
                Back to Schedule
            </Button>

            <Paper sx={{
                p: 4,
                mb: 3,
                background: 'rgba(30,30,35,0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 80px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                    <Box>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold', letterSpacing: 2 }}>
                            CONFIGURATION
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>
                            {editingIndex === -1 ? 'New Event Setup' : editorState.event_id}
                        </Typography>
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={editorState.is_active_global}
                                onChange={(e) => handleEditorChange('is_active_global', e.target.checked)}
                                color="success"
                                sx={{ transform: 'scale(1.2)' }}
                            />
                        }
                        label={<Typography fontWeight="bold" sx={{ color: editorState.is_active_global ? '#69F0AE' : 'text.disabled' }}>{editorState.is_active_global ? "ACTIVE" : "INACTIVE"}</Typography>}
                    />
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            variant="filled"
                            label="Event Identifier"
                            value={editorState.event_id}
                            onChange={(e) => handleEditorChange('event_id', e.target.value)}
                            helperText="Internal unique name (e.g. 'NYE_2025')"
                            InputProps={{ sx: { fontSize: '1.2rem' } }}
                        />
                    </Grid>

                    {/* PHASE A CARD */}
                    <Grid item xs={12}>
                        <Box sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(180deg, rgba(33,150,243,0.1) 0%, rgba(0,0,0,0) 100%)',
                            border: '1px solid rgba(33,150,243,0.3)'
                        }}>
                            <Typography variant="h6" sx={{ color: '#64B5F6', fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AutoAwesomeIcon /> Phase A: Theme & Ambience
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Long-running background effects (Snow, Leaves, Rain) that set the mood.
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Theme Effect"
                                        value={editorState.theme_effect || 'snow_cold'}
                                        onChange={(e) => handleEditorChange('theme_effect', e.target.value)}
                                        SelectProps={{ native: true }}
                                        variant="outlined"
                                    >
                                        <option value="snow_cold">❄️ Snow / Cold</option>
                                        <option value="none">🚫 None</option>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <DateTimeSplitter
                                        label="Theme Start"
                                        value={editorState.general_theme_start}
                                        onChange={(val) => handleEditorChange('general_theme_start', val)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <DateTimeSplitter
                                        label="Theme End"
                                        value={editorState.general_theme_end}
                                        onChange={(val) => handleEditorChange('general_theme_end', val)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* PHASE B CARD */}
                    <Grid item xs={12}>
                        <Box sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(180deg, rgba(255,64,129,0.1) 0%, rgba(0,0,0,0) 100%)',
                            border: '1px solid rgba(255,64,129,0.3)'
                        }}>
                            <Typography variant="h6" sx={{ color: '#FF80AB', fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon /> Phase B: The Celebration
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
                                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }}>Special Message Configuration</Divider>
                                    <Box sx={{
                                        p: 3,
                                        borderRadius: 3,
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px dashed rgba(255,255,255,0.2)'
                                    }}>
                                        <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MessageIcon /> Enhanced Special Message
                                        </Typography>

                                        <Grid container spacing={3}>
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
                                                            InputProps={{ sx: { height: 50 } }}
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
                        </Box>
                    </Grid>

                    {/* MUSIC SECTION */}
                    <Grid item xs={12}>
                        <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                                <MusicNoteIcon color="primary" />
                                <Typography variant="h6" color="text.primary">Background Music</Typography>
                            </Box>

                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label="Music URL"
                                        value={editorState.music_file_url}
                                        onChange={(e) => handleEditorChange('music_file_url', e.target.value)}
                                        placeholder="https://..."
                                        disabled={uploading}
                                        InputProps={{
                                            readOnly: editorState.music_file_url?.includes('appwrite.io'),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        component="label"
                                        variant="contained"
                                        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                                        disabled={uploading}
                                        sx={{ flex: 1, background: 'linear-gradient(45deg, #7C4DFF, #448AFF)' }}
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
                                            <IconButton color="error" onClick={() => handleEditorChange('music_file_url', '')} sx={{ bgcolor: 'rgba(255,0,0,0.1)' }}>
                                                <DeleteForeverIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Grid>
                            </Grid>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Upload .mp3, .wav, or .ogg files. They will be stored securely in Appwrite.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Footer Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 6, gap: 2 }}>
                    <Button
                        size="large"
                        variant="outlined"
                        onClick={() => setEditorState({ ...DEFAULT_EVENT_TEMPLATE, event_id: 'Auto_' + Date.now() })}
                        sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary' }}
                    >
                        Load Preset
                    </Button>
                    <Button
                        size="large"
                        variant="contained"
                        onClick={handleSaveEditor}
                        sx={{
                            px: 5,
                            background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                            boxShadow: '0 8px 25px rgba(33,150,243, 0.4)',
                            fontWeight: 'bold',
                            borderRadius: 2
                        }}
                    >
                        Save Configuration
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
