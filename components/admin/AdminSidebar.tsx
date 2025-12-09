/**
 * Admin Sidebar Component
 * Mobile-First Design: Large touch targets, responsive drawer, modern aesthetics.
 */

'use client';

import React from 'react';
import {
    Box,
    Drawer,
    SwipeableDrawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Avatar,
    Divider,
    useMediaQuery,
    useTheme,
    alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import PaymentIcon from '@mui/icons-material/PaymentRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import EventBusyIcon from '@mui/icons-material/EventBusyRounded';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import CardMembershipIcon from '@mui/icons-material/CardMembershipRounded';
import { useAuth } from '@/context/AuthContext';

interface AdminSidebarProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const SIDEBAR_WIDTH = 280; // Slightly wider for better readability on tablets/desktop

// Modern Palette & Gradients
const SIDEBAR_BG = '#0F172A'; // Deep Slate Blue
const ACTIVE_BG = 'rgba(56, 189, 248, 0.15)'; // Cyan tint
const ACTIVE_TEXT = '#38BDF8'; // Cyan
const INACTIVE_TEXT = '#94A3B8'; // Slate 400
const HOVER_BG = 'rgba(255, 255, 255, 0.05)';

const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: DashboardIcon },
    { name: 'Users', path: '/admin/users', icon: PeopleIcon },
    { name: 'Payments', path: '/admin/payments', icon: PaymentIcon },
    { name: 'Cancellations', path: '/admin/cancellations', icon: EventBusyIcon },
    { name: 'Chat', path: '/admin/chat', icon: ChatBubbleOutlineIcon },
    { name: 'Subscriptions', path: '/admin/tiers', icon: CardMembershipIcon },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
];

export default function AdminSidebar({ mobileOpen, setMobileOpen }: AdminSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const { logout, user } = useAuth();

    const handleNavigation = (path: string) => {
        router.push(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        if (isMobile) setMobileOpen(false);
    };

    const isActive = (path: string) => {
        if (path === '/admin') return pathname === '/admin';
        return pathname.startsWith(path);
    };

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: SIDEBAR_BG,
                color: 'common.white',
                backdropFilter: 'blur(10px)',
            }}
        >
            {/* Header Profile Section */}
            <Box
                sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: `1px solid ${alpha(INACTIVE_TEXT, 0.1)}`,
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: ACTIVE_TEXT,
                        width: 64,
                        height: 64,
                        boxShadow: `0 0 20px ${alpha(ACTIVE_TEXT, 0.4)}`,
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: SIDEBAR_BG,
                    }}
                >
                    {user?.displayName?.[0] || 'A'}
                </Avatar>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#F8FAFC', letterSpacing: 0.5 }}>
                        TruthLens
                    </Typography>
                    <Typography variant="caption" sx={{ color: INACTIVE_TEXT, fontWeight: 500 }}>
                        Admin Workspace
                    </Typography>
                </Box>
            </Box>

            {/* Navigation List */}
            <Box sx={{ flexGrow: 1, py: 3, px: 2, overflowY: 'auto' }}>
                <Typography
                    variant="caption"
                    sx={{
                        px: 2,
                        mb: 1,
                        display: 'block',
                        color: alpha(INACTIVE_TEXT, 0.6),
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                    }}
                >
                    Menu
                </Typography>
                <List disablePadding>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <ListItem key={item.name} disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    component={motion.div}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleNavigation(item.path)}
                                    sx={{
                                        borderRadius: '12px',
                                        minHeight: 56, // Touch-friendly target
                                        bgcolor: active ? ACTIVE_BG : 'transparent',
                                        color: active ? ACTIVE_TEXT : INACTIVE_TEXT,
                                        px: 2.5,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            bgcolor: active ? ACTIVE_BG : HOVER_BG,
                                            color: active ? ACTIVE_TEXT : '#F8FAFC',
                                        },
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    {active && (
                                        <Box
                                            component={motion.div}
                                            layoutId="activeIndicator"
                                            sx={{
                                                position: 'absolute',
                                                left: 0,
                                                width: 4,
                                                height: '60%',
                                                bgcolor: ACTIVE_TEXT,
                                                borderRadius: '0 4px 4px 0',
                                            }}
                                        />
                                    )}
                                    <ListItemIcon
                                        sx={{
                                            color: 'inherit',
                                            minWidth: 40,
                                        }}
                                    >
                                        <Icon fontSize="medium" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.name}
                                        primaryTypographyProps={{
                                            fontWeight: active ? 600 : 500,
                                            fontSize: '0.95rem',
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Logout Section */}
            <Box sx={{ p: 2, borderTop: `1px solid ${alpha(INACTIVE_TEXT, 0.1)}` }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        borderRadius: '12px',
                        minHeight: 56,
                        color: '#EF4444', // Red-500
                        '&:hover': {
                            bgcolor: alpha('#EF4444', 0.1),
                        },
                    }}
                >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="Sign Out"
                        primaryTypographyProps={{ fontWeight: 600 }}
                    />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
            aria-label="admin folders"
        >
            {/* Mobile Drawer */}
            <SwipeableDrawer
                variant="temporary"
                anchor="left"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                onOpen={() => setMobileOpen(true)}
                disableBackdropTransition={!iOS}
                disableDiscovery={iOS}
                ModalProps={{ keepMounted: true }}
                PaperProps={{
                    sx: {
                        width: SIDEBAR_WIDTH,
                        bgcolor: SIDEBAR_BG,
                        border: 'none',
                    },
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                }}
            >
                {drawerContent}
            </SwipeableDrawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: SIDEBAR_BG,
                        borderRight: '1px solid',
                        borderColor: alpha(INACTIVE_TEXT, 0.1),
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}
