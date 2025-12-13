'use client';

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface AdminProfileTabProps {
    //
}

export default function AdminProfileTab({ }: AdminProfileTabProps) {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [showPassword, setShowPassword] = useState(false);

    // Load current email on mount
    React.useEffect(() => {
        if (user?.email) setEmail(user.email);
    }, [user]);

    const handleUpdate = async () => {
        setLoading(true);
        setMsg({ type: '', text: '' });
        try {
            const token = await user?.getIdToken();
            const res = await axios.post('/api/admin/action', {
                action: 'updateSelf',
                userId: user?.uid,
                data: {
                    email: email !== user?.email ? email : undefined,
                    password: password || undefined
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setMsg({ type: 'success', text: 'Credentials updated successfully!' });
                setPassword(''); // Clear password field
            }
        } catch (error: any) {
            console.error(error);
            setMsg({ type: 'error', text: error.response?.data?.error || 'Failed to update credentials' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
                My Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Update your admin login credentials.
            </Typography>

            <Box sx={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                    label="Email Address"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    helperText="Changing email will require re-login."
                />

                <TextField
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty to keep current password"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {msg.text && (
                    <Alert severity={msg.type as any}>{msg.text}</Alert>
                )}

                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleUpdate}
                    disabled={loading || (!password && email === user?.email)}
                >
                    {loading ? 'Updating...' : 'Update Credentials'}
                </Button>
            </Box>
        </Paper>
    );
}
