import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, ListItemText, Typography, Box, Badge, Divider, List, ListItemAvatar, Avatar, ListItemButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import MessageIcon from '@mui/icons-material/Message';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleIcon from '@mui/icons-material/Circle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getUserNotifications, markNotificationRead } from '@/services/accessRequestService';
import { UserNotification } from '@/types/accessRequest';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';

// Helper for relative time
const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";

    return Math.floor(seconds) + "s ago";
};

interface UserNotificationsMenuProps {
    anchorEl: null | HTMLElement;
    open: boolean;
    onClose: () => void;
}

export default function UserNotificationsMenu({ anchorEl, open, onClose }: UserNotificationsMenuProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<UserNotification[]>([]);

    useEffect(() => {
        if (open && user) {
            loadNotifications();
        }
    }, [open, user]);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const data = await getUserNotifications(user.uid);
            setNotifications(data);
        } catch (err) {
            console.error('Error loading notifications:', err);
        }
    };

    const handleItemClick = async (notif: UserNotification) => {
        if (!notif.read && user) {
            await markNotificationRead(user.uid, notif.id);
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        }

        // Navigate if applicable (could link to profile or support)
        // For now, most link to /profile where full history is shown, or remain on page.
        // Let's close and maybe navigate to profile/notifications if they want to see more details?
        // Or just close.
        onClose();
    };

    const getIcon = (type: UserNotification['type']) => {
        switch (type) {
            case 'access_approved': return <CheckCircleIcon />;
            case 'access_denied': return <CancelIcon />;
            case 'access_expiring': return <WarningIcon />;
            case 'support_message': return <MessageIcon />;
            default: return <NotificationsIcon />;
        }
    };

    const getColor = (type: UserNotification['type']) => {
        switch (type) {
            case 'access_approved': return 'success.main';
            case 'access_denied': return 'error.main';
            case 'access_expiring': return 'warning.main';
            case 'support_message': return 'info.main';
            default: return 'primary.main';
        }
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    width: 360,
                    maxHeight: 500,
                    borderRadius: 3,
                    bgcolor: '#1E1E1E', // Dark mode background
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
            <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">Notifications</Typography>
                {notifications.filter(n => !n.read).length > 0 && (
                    <Badge badgeContent={notifications.filter(n => !n.read).length} color="error" max={99} />
                )}
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <List sx={{ p: 0 }}>
                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', opacity: 0.6 }}>
                        <AccessTimeIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <Typography variant="body2">No notifications yet</Typography>
                    </Box>
                ) : (
                    notifications.map((notif) => (
                        <ListItemButton
                            key={notif.id}
                            onClick={() => handleItemClick(notif)}
                            alignItems="flex-start"
                            sx={{
                                py: 2,
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                bgcolor: notif.read ? 'transparent' : 'rgba(255,255,255,0.02)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{
                                    bgcolor: getColor(notif.type),
                                    color: 'white'
                                }}>
                                    {getIcon(notif.type)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2" component="span" fontWeight={notif.read ? 'normal' : 'bold'}>
                                            {notif.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {getTimeAgo(notif.createdAt instanceof Timestamp ? notif.createdAt.toDate() : new Date(notif.createdAt))}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <React.Fragment>
                                        <Typography
                                            sx={{ display: 'block', mt: 0.5 }}
                                            component="span"
                                            variant="body2"
                                            color={notif.read ? "text.secondary" : "text.primary"}
                                            noWrap
                                        >
                                            {notif.message}
                                        </Typography>
                                        {!notif.read && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                <CircleIcon sx={{ fontSize: 8, color: '#2196F3' }} />
                                                <Typography variant="caption" color="#2196F3" fontWeight="bold">New</Typography>
                                            </Box>
                                        )}
                                    </React.Fragment>
                                }
                            />
                        </ListItemButton>
                    ))
                )}
            </List>

            {notifications.length > 0 && (
                <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => router.push('/profile')}>
                        View all in Profile
                    </Typography>
                </Box>
            )}
        </Menu>
    );
}
