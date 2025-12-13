'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    Tabs,
    Tab,
    Badge
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

interface AdminUser {
    uid: string;
    email: string;
    role: string;
    tier: string;
    status: 'Active' | 'Disabled';
    lastSignIn?: string;
    createdAt?: string;
}

interface UserTableProps {
    users: AdminUser[];
    loading: boolean;
    onEdit: (user: AdminUser) => void;
    onPass: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
}

const UserTable = ({ users, loading, onEdit, onPass, onDelete }: UserTableProps) => (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: 600, sm: 650 } }}>
            <TableHead sx={{ bgcolor: '#fafafa' }}>
                <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tier</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                            <CircularProgress />
                        </TableCell>
                    </TableRow>
                ) : users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                            <Typography color="text.secondary">No users found.</Typography>
                        </TableCell>
                    </TableRow>
                ) : (
                    users.map((user, index) => (
                        <TableRow key={user.uid} hover>
                            <TableCell sx={{ color: '#666', fontSize: '0.85rem' }}>{index + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{user.email}</TableCell>
                            <TableCell>
                                <Chip
                                    label={user.role}
                                    size="small"
                                    color={user.role === 'admin' ? 'primary' : 'default'}
                                    variant={user.role === 'admin' ? 'filled' : 'outlined'}
                                />
                            </TableCell>
                            <TableCell>
                                {user.role === 'admin' ? (
                                    <Chip
                                        label="—"
                                        size="small"
                                        variant="outlined"
                                        sx={{ color: '#999', borderColor: '#eee' }}
                                    />
                                ) : (
                                    <Chip
                                        label={user.tier ? user.tier.toUpperCase() : 'FREE'}
                                        size="small"
                                        sx={{
                                            bgcolor: user.tier === 'pro' || user.tier === 'ultimate' ? 'gold' : '#e0e0e0',
                                            fontWeight: 'bold',
                                            color: user.tier === 'pro' || user.tier === 'ultimate' ? 'black' : 'inherit'
                                        }}
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={user.status}
                                    size="small"
                                    color={user.status === 'Active' ? 'success' : 'error'}
                                    sx={{ borderRadius: 1 }}
                                />
                            </TableCell>
                            <TableCell>
                                <IconButton size="small" color="primary" onClick={() => onEdit(user)} title="Edit User">
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="secondary" onClick={() => onPass(user)} title="Reset Password">
                                    <LockResetIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => onDelete(user)} title="Delete User">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    </TableContainer>
);


export default function UserManagementPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: currentUser } = useAuth();


    // Dialog States
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [passOpen, setPassOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    // Form data
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPass, setNewUserPass] = useState('');
    const [role, setRole] = useState('user');
    const [tier, setTier] = useState('free');
    const [newPassword, setNewPassword] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // Filtered lists
    const admins = users.filter(u => u.role === 'admin');
    const regularUsers = users.filter(u => u.role !== 'admin');


    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = await currentUser?.getIdToken();
            const res = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.users);
        } catch (err: any) {
            console.error(err);
            setError('Failed to fetch users. Ensure you have admin privileges.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser]);

    const handleAction = async (action: string, data: any = {}) => {
        setActionLoading(true);
        setActionMsg('');
        try {
            const token = await currentUser?.getIdToken();
            const res = await axios.post('/api/admin/action', {
                action,
                userId: selectedUser?.uid,
                data
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // Refresh list or update local state
                if (action === 'deleteUser') {
                    if (selectedUser) {
                        setUsers(users.filter(u => u.uid !== selectedUser.uid));
                    }
                    setDeleteOpen(false);
                } else if (action === 'createUser') {
                    setActionMsg('User created successfully!');
                    setTimeout(() => {
                        setCreateOpen(false);
                        fetchUsers(); // Refresh full list to get new user
                    }, 1000);
                } else if (action === 'updateRole') {
                    if (selectedUser) {
                        setUsers(users.map(u => u.uid === selectedUser.uid ? { ...u, role: data.role } : u));
                    }
                } else if (action === 'updateTier') {
                    if (selectedUser) {
                        setUsers(users.map(u => u.uid === selectedUser.uid ? { ...u, tier: data.tier } : u));
                    }
                } else if (action === 'setPassword') {
                    setActionMsg('Password updated successfully!');
                    setTimeout(() => setPassOpen(false), 1500);
                } else if (action === 'resetPasswordEmail') {
                    setActionMsg(`Reset Link Generated: ${res.data.link}`);
                }

                if (['updateRole', 'updateTier'].includes(action)) {
                    setActionMsg('Updated successfully');
                }
            }
        } catch (err: any) {
            console.error(err);
            setActionMsg(`Error: ${err.response?.data?.error || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Wrapper to save both Role and Tier
    const handleSaveUser = async () => {
        // Validation: Prevent self-demotion if last admin
        if (selectedUser?.uid === currentUser?.uid) {
            if (role !== 'admin' && admins.length <= 1) {
                setActionMsg('Error: You cannot remove your admin status because you are the only admin.');
                return;
            }
        }

        // We'll call them sequentially for simplicity 
        await handleAction('updateRole', { role });
        await handleAction('updateTier', { tier });
        // Close dialog after short delay to show success
        setTimeout(() => setEditOpen(false), 800);
    }

    const handleCreateUser = () => {
        if (!newUserEmail || !newUserPass) {
            setActionMsg('Email and Password are required.');
            return;
        }
        handleAction('createUser', {
            email: newUserEmail,
            password: newUserPass,
            role: role,
            tier: tier
        });
    }


    const openEdit = (user: AdminUser) => {
        setSelectedUser(user);
        setRole(user.role);
        setTier(user.tier || 'free');
        setEditOpen(true);
        setActionMsg('');
    };

    const openPass = (user: AdminUser) => {
        setSelectedUser(user);
        setNewPassword('');
        setPassOpen(true);
        setActionMsg('');
    };

    const openDelete = (user: AdminUser) => {
        setSelectedUser(user);
        setDeleteOpen(true);
        setActionMsg('');
    };

    const openCreate = () => {
        setNewUserEmail('');
        setNewUserPass('');
        setRole('user');
        setTier('free');
        setCreateOpen(true);
        setActionMsg('');
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                >
                    Create User
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ mb: 3, borderRadius: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, val) => setTabValue(val)}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab
                        icon={<PersonIcon fontSize="small" />}
                        iconPosition="start"
                        label={
                            <Badge badgeContent={regularUsers.length} color="secondary" sx={{ ml: 1 }}>
                                <Box sx={{ mr: 2 }}>Users</Box>
                            </Badge>
                        }
                    />
                    <Tab
                        icon={<AdminPanelSettingsIcon fontSize="small" />}
                        iconPosition="start"
                        label={
                            <Badge badgeContent={admins.length} color="primary" sx={{ ml: 1 }}>
                                <Box sx={{ mr: 2 }}>Admins</Box>
                            </Badge>
                        }
                    />
                </Tabs>
            </Paper>

            {tabValue === 0 && (
                <UserTable
                    users={regularUsers}
                    loading={loading}
                    onEdit={openEdit}
                    onPass={openPass}
                    onDelete={openDelete}
                />
            )}

            {tabValue === 1 && (
                <UserTable
                    users={admins}
                    loading={loading}
                    onEdit={openEdit}
                    onPass={openPass}
                    onDelete={openDelete}
                />
            )}


            {/* Edit User Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
                <DialogTitle>Edit User Details</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>User: {selectedUser?.email}</Typography>

                    <TextField
                        select
                        label="Role"
                        fullWidth
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        variant="outlined"
                        sx={{ mt: 1, mb: 2 }}
                    >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Subscription Tier"
                        fullWidth
                        value={tier}
                        onChange={(e) => setTier(e.target.value)}
                        variant="outlined"
                    >
                        <MenuItem value="free">Free</MenuItem>
                        <MenuItem value="plus">Plus</MenuItem>
                        <MenuItem value="pro">Pro</MenuItem>
                        <MenuItem value="ultimate">Ultimate</MenuItem>
                    </TextField>

                    {actionMsg && <Alert severity={actionMsg.includes('Error') ? 'error' : 'success'} sx={{ mt: 2 }}>{actionMsg}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveUser}
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Password Dialog */}
            <Dialog open={passOpen} onClose={() => setPassOpen(false)}>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent sx={{ minWidth: 350, pt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>User: {selectedUser?.email}</Typography>

                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Option 1: Direct Change</Typography>
                    <TextField
                        label="New Password"
                        type="text" // Visible so admin can read it to user
                        fullWidth
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                    />
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 1 }}
                        onClick={() => handleAction('setPassword', { newPassword })}
                        disabled={!newPassword || actionLoading}
                    >
                        Set Password Directly
                    </Button>

                    <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Option 2: Email Reset</Typography>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleAction('resetPasswordEmail')}
                        disabled={actionLoading}
                    >
                        Generate Reset Link
                    </Button>

                    {actionMsg && <Alert severity={actionMsg.includes('Error') ? 'error' : 'success'} sx={{ mt: 2, wordBreak: 'break-all' }}>{actionMsg}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPassOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle sx={{ color: '#d32f2f' }}>Delete User?</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete <b>{selectedUser?.email}</b>?</Typography>
                    <Typography variant="caption" color="error">This action cannot be undone.</Typography>

                    {selectedUser?.uid === currentUser?.uid && admins.length <= 1 && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Warning: You are the ONLY admin. Deleting your account will lock everyone out of the admin panel. Action Blocked.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleAction('deleteUser')}
                        disabled={actionLoading || (selectedUser?.uid === currentUser?.uid && admins.length <= 1)}
                    >
                        {actionLoading ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                </DialogActions>
            </Dialog>

             {/* Create User Dialog */}
             <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
                <DialogTitle>Create New User</DialogTitle>
                <DialogContent sx={{ minWidth: 350, pt: 2 }}>
                    <TextField
                        label="Email Address"
                        fullWidth
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                     <TextField
                        label="Initial Password"
                        fullWidth
                        value={newUserPass}
                        onChange={(e) => setNewUserPass(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        select
                        label="Role"
                        fullWidth
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Subscription Tier"
                        fullWidth
                        value={tier}
                        onChange={(e) => setTier(e.target.value)}
                        variant="outlined"
                    >
                        <MenuItem value="free">Free</MenuItem>
                        <MenuItem value="plus">Plus</MenuItem>
                        <MenuItem value="pro">Pro</MenuItem>
                        <MenuItem value="ultimate">Ultimate</MenuItem>
                    </TextField>

                    {actionMsg && <Alert severity={actionMsg.includes('Error') ? 'error' : 'success'} sx={{ mt: 2 }}>{actionMsg}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateUser}
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Creating...' : 'Create User'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
