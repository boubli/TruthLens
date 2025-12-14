/**
 * User Table Component
 * Admin table for managing users with actions
 */

'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Avatar,
    Box,
    Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import TierBadge from '@/components/subscription/TierBadge';
import { UserTier } from '@/types/user';

interface User {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    tier: UserTier;
    createdAt: Date;
}

interface UserTableProps {
    users: User[];
    onEdit?: (userId: string) => void;
    onDelete?: (userId: string) => void;
}

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Tier</TableCell>
                        <TableCell>Joined</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar src={user.photoURL || '/icons/icon-192x192.png'} sx={{ width: 32, height: 32 }}>
                                        {user.displayName?.[0] || user.email[0].toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2">{user.displayName || 'No name'}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">{user.email}</Typography>
                            </TableCell>
                            <TableCell>
                                <TierBadge tier={user.tier} size="small" />
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                    {user.createdAt.toLocaleDateString()}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                {onEdit && (
                                    <IconButton size="small" onClick={() => onEdit(user.id)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                )}
                                {onDelete && (
                                    <IconButton size="small" color="error" onClick={() => onDelete(user.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
