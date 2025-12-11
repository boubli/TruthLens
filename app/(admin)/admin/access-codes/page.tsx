'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
    InputLabel, Select, MenuItem, Switch, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createAccessCode, getAllAccessCodes, toggleAccessCodeStatus } from '@/services/accessRequestService';
import { AccessCode, AccessCodeTier } from '@/types/accessRequest';

export default function AdminAccessCodesPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [codes, setCodes] = useState<AccessCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // New code form
    const [newCode, setNewCode] = useState('');
    const [newTier, setNewTier] = useState<AccessCodeTier>('plus');
    const [newType, setNewType] = useState<'student' | 'general'>('general');
    const [newLimit, setNewLimit] = useState(100);
    const [newExpiry, setNewExpiry] = useState('');
    const [creating, setCreating] = useState(false);

    // Auth check
    useEffect(() => {
        if (!authLoading && userProfile?.role !== 'admin') {
            router.push('/');
        }
    }, [authLoading, userProfile, router]);

    // Load codes
    const loadCodes = async () => {
        setLoading(true);
        try {
            const data = await getAllAccessCodes();
            setCodes(data);
        } catch (err) {
            console.error('Error loading codes:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (userProfile?.role === 'admin') {
            loadCodes();
        }
    }, [userProfile]);

    const generateRandomCode = () => {
        const prefix = newType === 'student' ? 'TL-STU' : 'TL-ACC';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setNewCode(`${prefix}-${random}`);
    };

    const handleCreateCode = async () => {
        if (!newCode.trim()) {
            setError('Code is required');
            return;
        }

        setCreating(true);
        setError('');

        try {
            await createAccessCode(
                newCode,
                newTier,
                newType,
                newLimit,
                newExpiry ? new Date(newExpiry) : null,
                userProfile?.uid || ''
            );
            setSuccess('Code created successfully!');
            setOpenDialog(false);
            setNewCode('');
            loadCodes();
        } catch (err: any) {
            setError(err.message || 'Failed to create code');
        }

        setCreating(false);
    };

    const handleToggleActive = async (codeId: string, currentActive: boolean) => {
        try {
            await toggleAccessCodeStatus(codeId, !currentActive);
            loadCodes();
        } catch (err) {
            console.error('Error toggling code:', err);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccess('Code copied to clipboard!');
        setTimeout(() => setSuccess(''), 2000);
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'plus': return 'primary';
            case 'pro': return 'secondary';
            case 'ultimate': return 'warning';
            default: return 'default';
        }
    };

    if (authLoading || loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    🔑 Access Codes
                </Typography>
                <Box>
                    <Button startIcon={<RefreshIcon />} onClick={loadCodes} sx={{ mr: 1 }}>
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
                        Generate Code
                    </Button>
                </Box>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Tier</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Usage</TableCell>
                            <TableCell>Expires</TableCell>
                            <TableCell>Active</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {codes.map((code) => (
                            <TableRow key={code.id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography fontFamily="monospace" fontWeight="bold">
                                            {code.code}
                                        </Typography>
                                        <IconButton size="small" onClick={() => copyToClipboard(code.code)}>
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={code.tier.toUpperCase()} color={getTierColor(code.tier) as any} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={code.type === 'student' ? '🎓 Student' : '👤 General'}
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {code.usedCount} / {code.usageLimit === 0 ? '∞' : code.usageLimit}
                                </TableCell>
                                <TableCell>
                                    {code.expiresAt
                                        ? new Date(code.expiresAt).toLocaleDateString()
                                        : 'Never'}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={code.active}
                                        onChange={() => handleToggleActive(code.id, code.active)}
                                        color="success"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton color="error" size="small">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {codes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No access codes yet</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Code Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Generate Access Code</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Code"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            placeholder="TL-ACC-XXXXXX"
                        />
                        <Button variant="outlined" onClick={generateRandomCode}>
                            Generate
                        </Button>
                    </Box>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Tier to Grant</InputLabel>
                        <Select value={newTier} label="Tier to Grant" onChange={(e) => setNewTier(e.target.value as AccessCodeTier)}>
                            <MenuItem value="plus">Plus</MenuItem>
                            <MenuItem value="pro">Pro</MenuItem>
                            <MenuItem value="ultimate">Ultimate</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Code Type</InputLabel>
                        <Select value={newType} label="Code Type" onChange={(e) => setNewType(e.target.value as 'student' | 'general')}>
                            <MenuItem value="general">General</MenuItem>
                            <MenuItem value="student">Student (auto-approve with proof)</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        type="number"
                        label="Usage Limit (0 = unlimited)"
                        value={newLimit}
                        onChange={(e) => setNewLimit(parseInt(e.target.value) || 0)}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        type="date"
                        label="Expiry Date (optional)"
                        value={newExpiry}
                        onChange={(e) => setNewExpiry(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateCode} disabled={creating}>
                        {creating ? <CircularProgress size={20} /> : 'Create Code'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
