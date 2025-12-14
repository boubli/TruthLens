'use client';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    IconButton,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Slider,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import PaletteIcon from '@mui/icons-material/Palette';
import BarChartIcon from '@mui/icons-material/BarChart';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import {
    createGlobalTheme,
    updateGlobalTheme,
    deleteGlobalTheme,
    getGlobalThemes,
    getThemeAnalytics,
    setDefaultTheme,
} from '@/services/themeService';
import { GlobalTheme, ThemeAnalytics, ThemeColors, ThemeTypography, ThemeShape, ThemeMode } from '@/types/theme';
import { useAuth } from '@/context/AuthContext';
import { themeList } from '@/lib/theme/themes';

// Default colors for new theme
const defaultColors: ThemeColors = {
    primary: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5', contrastText: '#FFFFFF' },
    secondary: { main: '#EC4899', light: '#F472B6', dark: '#DB2777', contrastText: '#FFFFFF' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    info: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB' },
    success: { main: '#10B981', light: '#34D399', dark: '#059669' },
};

const defaultTypography: ThemeTypography = {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
};

const defaultShape: ThemeShape = { borderRadius: 12 };

export default function AdminThemesPage() {
    const { user } = useAuth();
    const [globalThemes, setGlobalThemes] = useState<GlobalTheme[]>([]);
    const [analytics, setAnalytics] = useState<ThemeAnalytics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Editor state
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState<GlobalTheme | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [themeToDelete, setThemeToDelete] = useState<GlobalTheme | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formMode, setFormMode] = useState<ThemeMode>('light');
    const [formPrimary, setFormPrimary] = useState('#6366F1');
    const [formSecondary, setFormSecondary] = useState('#EC4899');
    const [formBackground, setFormBackground] = useState('#F8FAFC');
    const [formBorderRadius, setFormBorderRadius] = useState(12);
    const [formIsDefault, setFormIsDefault] = useState(false);
    const [error, setError] = useState('');

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [themes, stats] = await Promise.all([
                getGlobalThemes(),
                getThemeAnalytics(),
            ]);
            setGlobalThemes(themes);
            setAnalytics(stats);
        } catch (err) {
            console.error('Failed to load themes:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingTheme(null);
        setFormName('');
        setFormMode('light');
        setFormPrimary('#6366F1');
        setFormSecondary('#EC4899');
        setFormBackground('#F8FAFC');
        setFormBorderRadius(12);
        setFormIsDefault(false);
        setError('');
        setEditorOpen(true);
    };

    const openEditDialog = (theme: GlobalTheme) => {
        setEditingTheme(theme);
        setFormName(theme.name);
        setFormMode(theme.mode);
        setFormPrimary(theme.colors.primary.main);
        setFormSecondary(theme.colors.secondary.main);
        setFormBackground(theme.colors.background.default);
        setFormBorderRadius(theme.shape.borderRadius);
        setFormIsDefault(theme.isDefault);
        setError('');
        setEditorOpen(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            setError('Theme name is required');
            return;
        }
        if (!user) return;

        setIsSaving(true);
        try {
            const themeData = {
                name: formName,
                mode: formMode,
                colors: {
                    ...defaultColors,
                    primary: { ...defaultColors.primary, main: formPrimary },
                    secondary: { ...defaultColors.secondary, main: formSecondary },
                    background: {
                        default: formBackground,
                        paper: formMode === 'dark' ? '#1E293B' : '#FFFFFF',
                    },
                    text: {
                        primary: formMode === 'dark' ? '#F1F5F9' : '#1E293B',
                        secondary: formMode === 'dark' ? '#94A3B8' : '#64748B',
                    },
                },
                typography: defaultTypography,
                shape: { borderRadius: formBorderRadius },
                isDefault: formIsDefault,
            };

            if (editingTheme) {
                await updateGlobalTheme(editingTheme.id, themeData);
            } else {
                await createGlobalTheme(user.uid, themeData);
            }

            if (formIsDefault) {
                // Set this as default (will unset others)
                const themeId = editingTheme?.id || formName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
                await setDefaultTheme(themeId);
            }

            await loadData();
            setEditorOpen(false);
        } catch (err) {
            console.error('Failed to save theme:', err);
            setError('Failed to save theme. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!themeToDelete) return;

        setIsSaving(true);
        try {
            await deleteGlobalTheme(themeToDelete.id);
            await loadData();
            setDeleteConfirmOpen(false);
            setThemeToDelete(null);
        } catch (err) {
            console.error('Failed to delete theme:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const getAnalyticsForTheme = (themeId: string) => {
        return analytics.find(a => a.themeId === themeId);
    };

    if (isLoading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="xl">
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Theme Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Create and manage themes available to all users
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateDialog}
                    sx={{ borderRadius: 2 }}
                >
                    Create Theme
                </Button>
            </Box>

            {/* Built-in Themes (Read-only) */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Built-in Themes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    These themes are included by default and cannot be modified.
                </Typography>
                <Grid container spacing={2}>
                    {themeList.map((theme) => (
                        <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={theme.id}>
                            <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: theme.colors.primary.main }} />
                                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: theme.colors.secondary.main }} />
                                    </Box>
                                    <Typography variant="body2" fontWeight="medium">{theme.name}</Typography>
                                    <Chip
                                        label="Built-in"
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt: 1, height: 20, fontSize: 10 }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Custom Global Themes */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Custom Themes
                </Typography>
                {globalThemes.length === 0 ? (
                    <Alert severity="info">No custom themes created yet. Click "Create Theme" to add one.</Alert>
                ) : (
                    <Grid container spacing={2}>
                        {globalThemes.map((theme) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={theme.id}>
                                <Card sx={{ position: 'relative' }}>
                                    {theme.isDefault && (
                                        <Chip
                                            icon={<StarIcon />}
                                            label="Default"
                                            size="small"
                                            color="warning"
                                            sx={{ position: 'absolute', top: 8, right: 8 }}
                                        />
                                    )}
                                    <CardContent>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: theme.colors.primary.main }} />
                                            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: theme.colors.secondary.main }} />
                                            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: theme.colors.background.default, border: '1px solid', borderColor: 'divider' }} />
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight="bold">{theme.name}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                            {theme.mode === 'dark' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                                            <Typography variant="caption" color="text.secondary">
                                                {theme.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                            </Typography>
                                        </Box>
                                        {getAnalyticsForTheme(theme.id) && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                <BarChartIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                                {getAnalyticsForTheme(theme.id)?.usageCount || 0} users
                                            </Typography>
                                        )}
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" startIcon={<EditIcon />} onClick={() => openEditDialog(theme)}>
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => {
                                                setThemeToDelete(theme);
                                                setDeleteConfirmOpen(true);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>

            {/* Analytics Summary */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Theme Usage Analytics
                </Typography>
                {analytics.length === 0 ? (
                    <Alert severity="info">No analytics data available yet.</Alert>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Theme</TableCell>
                                    <TableCell align="right">Usage Count</TableCell>
                                    <TableCell align="right">Last Used</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {analytics.map((stat) => (
                                    <TableRow key={stat.themeId}>
                                        <TableCell>{stat.themeName}</TableCell>
                                        <TableCell align="right">{stat.usageCount}</TableCell>
                                        <TableCell align="right">
                                            {stat.lastUsed?.toLocaleDateString() || 'Never'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Theme Editor Dialog */}
            <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingTheme ? 'Edit Theme' : 'Create New Theme'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <TextField
                            label="Theme Name"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            fullWidth
                            required
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formMode === 'dark'}
                                    onChange={(e) => setFormMode(e.target.checked ? 'dark' : 'light')}
                                />
                            }
                            label={`Mode: ${formMode === 'dark' ? 'Dark' : 'Light'}`}
                        />

                        <Box>
                            <Typography variant="body2" gutterBottom>Primary Color</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    type="color"
                                    value={formPrimary}
                                    onChange={(e) => setFormPrimary(e.target.value)}
                                    sx={{ width: 60 }}
                                />
                                <TextField
                                    value={formPrimary}
                                    onChange={(e) => setFormPrimary(e.target.value)}
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="body2" gutterBottom>Secondary Color</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    type="color"
                                    value={formSecondary}
                                    onChange={(e) => setFormSecondary(e.target.value)}
                                    sx={{ width: 60 }}
                                />
                                <TextField
                                    value={formSecondary}
                                    onChange={(e) => setFormSecondary(e.target.value)}
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="body2" gutterBottom>Background Color</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    type="color"
                                    value={formBackground}
                                    onChange={(e) => setFormBackground(e.target.value)}
                                    sx={{ width: 60 }}
                                />
                                <TextField
                                    value={formBackground}
                                    onChange={(e) => setFormBackground(e.target.value)}
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="body2" gutterBottom>Border Radius: {formBorderRadius}px</Typography>
                            <Slider
                                value={formBorderRadius}
                                onChange={(_, value) => setFormBorderRadius(value as number)}
                                min={0}
                                max={24}
                                step={2}
                                marks
                            />
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formIsDefault}
                                    onChange={(e) => setFormIsDefault(e.target.checked)}
                                />
                            }
                            label="Set as default theme for new users"
                        />

                        {/* Live Preview */}
                        <Paper
                            sx={{
                                p: 2,
                                bgcolor: formBackground,
                                borderRadius: `${formBorderRadius}px`,
                            }}
                        >
                            <Typography variant="body2" sx={{ mb: 1, color: formMode === 'dark' ? '#F1F5F9' : '#1E293B' }}>
                                Preview
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{
                                    bgcolor: formPrimary,
                                    borderRadius: `${formBorderRadius}px`,
                                    mr: 1,
                                    '&:hover': { bgcolor: formPrimary, opacity: 0.9 },
                                }}
                            >
                                Primary
                            </Button>
                            <Button
                                variant="outlined"
                                sx={{
                                    borderColor: formSecondary,
                                    color: formSecondary,
                                    borderRadius: `${formBorderRadius}px`,
                                }}
                            >
                                Secondary
                            </Button>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : editingTheme ? 'Update Theme' : 'Create Theme'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Delete Theme?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{themeToDelete?.name}"? Users who selected this theme will be reverted to the default.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDelete} disabled={isSaving}>
                        {isSaving ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
