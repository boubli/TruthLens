import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, ListItemText, Typography, Box, Badge, Divider, List, ListItemAvatar, Avatar, ListItemButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import ChatIcon from '@mui/icons-material/ChatBubbleOutline';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CircleIcon from '@mui/icons-material/Circle';
import { listenForAdminChatList } from '@/services/supportService';
import { getPendingRequests } from '@/services/accessRequestService';
import { Timestamp } from 'firebase/firestore';

// Helper for relative time to avoid date-fns dependency issues
const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
};

interface AdminNotification {
    id: string;
    type: 'message' | 'request';
    title: string;
    description: string;
    timestamp: Date;
    link: string;
    unread: boolean;
    priority?: 'high' | 'normal';
}

interface AdminNotificationsMenuProps {
    anchorEl: null | HTMLElement;
    open: boolean;
    onClose: () => void;
}

export default function AdminNotificationsMenu({ anchorEl, open, onClose }: AdminNotificationsMenuProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);

    // Real-time listener for CHATS to merge into the list
    useEffect(() => {
        const unsubscribe = listenForAdminChatList((chats) => {
            // Filter only chats with unread messages for admin
            const unreadChats = chats.filter(c => c.unreadCountAdmin > 0);

            const chatNotifications: AdminNotification[] = unreadChats.map(chat => {
                const updatedAt = chat.updatedAt instanceof Timestamp ? chat.updatedAt.toDate() : new Date(chat.updatedAt || Date.now());
                return {
                    id: chat.id,
                    type: 'message',
                    title: chat.userName || 'User Message',
                    description: chat.lastMessage?.text || 'New message',
                    timestamp: updatedAt,
                    // Use query param to potentially deep link in future, or just open chat list
                    link: `/admin/chat?chatId=${chat.id}`,
                    unread: true,
                    priority: 'normal'
                };
            });

            // Fetch pending requests and merge
            getPendingRequests().then(requests => {
                const reqNotifications: AdminNotification[] = requests.map(req => {
                    const createdAt = req.createdAt instanceof Timestamp ? req.createdAt.toDate() : new Date(req.createdAt);
                    return {
                        id: req.id,
                        type: 'request',
                        title: 'Access Request',
                        description: `${req.fullName} • ${req.codeTier.toUpperCase()}`,
                        timestamp: createdAt,
                        link: '/admin/access-requests',
                        unread: true,
                        priority: 'high'
                    };
                });

                // Combine and sort by newest first
                const combined = [...chatNotifications, ...reqNotifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                setNotifications(combined);
            }).catch(err => {
                console.error("Error fetching requests:", err);
                // Even if requests fail, show chats
                setNotifications(chatNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
            });
        });

        return () => unsubscribe();
    }, []);


    const handleItemClick = (link: string) => {
        onClose();
        router.push(link);
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
                {notifications.length > 0 && (
                    <Badge badgeContent={notifications.length} color="error" max={99} />
                )}
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <List sx={{ p: 0 }}>
                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', opacity: 0.6 }}>
                        <AccessTimeIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <Typography variant="body2">No new notifications</Typography>
                    </Box>
                ) : (
                    notifications.map((notif) => (
                        <ListItemButton
                            key={`${notif.type}-${notif.id}`}
                            onClick={() => handleItemClick(notif.link)}
                            alignItems="flex-start"
                            sx={{
                                py: 2,
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{
                                    bgcolor: notif.type === 'request' ? 'secondary.main' : 'primary.main',
                                    color: 'white'
                                }}>
                                    {notif.type === 'request' ? <CardMembershipIcon /> : <ChatIcon />}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2" component="span" fontWeight="bold">
                                            {notif.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {getTimeAgo(notif.timestamp)}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <React.Fragment>
                                        <Typography
                                            sx={{ display: 'block', mb: 0.5 }}
                                            component="span"
                                            variant="body2"
                                            color="text.secondary"
                                            noWrap
                                        >
                                            {notif.description}
                                        </Typography>
                                        {notif.priority === 'high' && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                <CircleIcon sx={{ fontSize: 8, color: '#F44336' }} />
                                                <Typography variant="caption" color="#F44336" fontWeight="bold">Action Required</Typography>
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
                    <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={onClose}>
                        Close
                    </Typography>
                </Box>
            )}
        </Menu>
    );
}
