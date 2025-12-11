'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon,
    IconButton, Badge, Chip, CircularProgress, Collapse, Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import MessageIcon from '@mui/icons-material/Message';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAuth } from '@/context/AuthContext';
import { getUserNotifications, markNotificationRead } from '@/services/accessRequestService';
import { UserNotification } from '@/types/accessRequest';

export default function NotificationsSection() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserNotifications(user.uid);
            setNotifications(data);
        } catch (err) {
            console.error('Error loading notifications:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const handleMarkRead = async (notifId: string) => {
        if (!user) return;
        await markNotificationRead(user.uid, notifId);
        setNotifications(prev =>
            prev.map(n => n.id === notifId ? { ...n, read: true } : n)
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: UserNotification['type']) => {
        switch (type) {
            case 'access_approved': return <CheckCircleIcon color="success" />;
            case 'access_denied': return <CancelIcon color="error" />;
            case 'access_expiring': return <WarningIcon color="warning" />;
            case 'support_message': return <MessageIcon color="info" />;
            default: return <NotificationsIcon />;
        }
    };

    const getColor = (type: UserNotification['type']) => {
        switch (type) {
            case 'access_approved': return 'success.light';
            case 'access_denied': return 'error.light';
            case 'access_expiring': return 'warning.light';
            default: return 'info.light';
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ mb: 3, overflow: 'hidden' }}>
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'background.default',
                    cursor: 'pointer'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon />
                    </Badge>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Notifications
                    </Typography>
                </Box>
                <IconButton size="small">
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">No notifications yet</Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {notifications.map((notif) => (
                            <ListItem
                                key={notif.id}
                                sx={{
                                    bgcolor: notif.read ? 'transparent' : 'action.hover',
                                    borderLeft: `4px solid`,
                                    borderLeftColor: getColor(notif.type)
                                }}
                                secondaryAction={
                                    !notif.read && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleMarkRead(notif.id)}
                                            title="Mark as read"
                                        >
                                            <MarkEmailReadIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getIcon(notif.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={notif.read ? 'normal' : 'bold'}>
                                                {notif.title}
                                            </Typography>
                                            {notif.metadata?.tier && (
                                                <Chip
                                                    label={notif.metadata.tier.toUpperCase()}
                                                    size="small"
                                                    color="primary"
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {notif.message}
                                            </Typography>
                                            <Typography variant="caption" display="block" color="text.disabled">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Collapse>
        </Paper>
    );
}
