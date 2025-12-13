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
import SettingsIcon from '@mui/icons-material/Settings';
import ComputerIcon from '@mui/icons-material/Computer';
import LogoutIcon from '@mui/icons-material/Logout';
import EventBusyIcon from '@mui/icons-material/EventBusyRounded';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import CardMembershipIcon from '@mui/icons-material/CardMembershipRounded';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcardRounded';
import KeyIcon from '@mui/icons-material/VpnKeyRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import SupportIcon from '@mui/icons-material/SupportAgent';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useAuth } from '@/context/AuthContext';

interface AdminSidebarProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    desktopOpen?: boolean;
    unreadCount?: number;
}

const SIDEBAR_WIDTH = 280; // Slightly wider for better readability on tablets/desktop

// Organized menu items by category
const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: DashboardIcon, category: 'Overview' },
    { name: 'Users', path: '/admin/users', icon: PeopleIcon, category: 'Management' },
    { name: 'Chat Support', path: '/admin/chat', icon: ChatBubbleOutlineIcon, category: 'Management' },
    { name: 'Access Requests', path: '/admin/access-requests', icon: CardGiftcardIcon, category: 'Access' },
    { name: 'Access Codes', path: '/admin/access-codes', icon: KeyIcon, category: 'Access' },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: CardMembershipIcon, category: 'Billing' },
    { name: 'Cancellations', path: '/admin/cancellations', icon: EventBusyIcon, category: 'Billing' },
    { name: 'AI Models', path: '/admin/ai-models', icon: SmartToyIcon, category: 'AI & Features' },
    { name: 'PC Requests', path: '/admin/pc-requests', icon: ComputerIcon, category: 'AI & Features' },
    { name: 'Events', path: '/admin/events', icon: CelebrationRoundedIcon, category: 'Customization' },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon, category: 'System' },
];

export default function AdminSidebar({ mobileOpen, setMobileOpen, desktopOpen = true, unreadCount = 0 }: AdminSidebarProps) {
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
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderRight: '1px solid',
                borderColor: 'divider',
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
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: 'primary.main',
                        width: 64,
                        height: 64,
                        boxShadow: 3,
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'primary.contrastText',
                    }}
                >
                    {user?.displayName?.[0] || 'A'}
                </Avatar>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: 0.5 }}>
                        TruthLens
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
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
                        color: 'text.secondary',
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
                                        bgcolor: active ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                                        color: active ? 'primary.main' : 'text.secondary',
                                        px: 2.5,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            bgcolor: active ? alpha(theme.palette.primary.main, 0.25) : 'action.hover',
                                            color: active ? 'primary.main' : 'text.primary',
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
                                                bgcolor: 'primary.main',
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
                                    {item.name === 'Chat' && unreadCount > 0 && (
                                        <Box
                                            sx={{
                                                bgcolor: '#EF4444',
                                                color: 'white',
                                                borderRadius: '99px',
                                                px: 1,
                                                py: 0.25,
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                minWidth: '20px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {unreadCount}
                                        </Box>
                                    )}
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Logout Section */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        borderRadius: '12px',
                        minHeight: 56,
                        color: 'error.main',
                        '&:hover': {
                            bgcolor: 'action.hover',
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
            sx={{
                width: { md: desktopOpen ? SIDEBAR_WIDTH : 0 },
                flexShrink: { md: 0 },
                transition: 'width 0.3s ease',
                overflow: 'hidden'
            }}
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
                        bgcolor: 'background.paper',
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
                variant="persistent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: 'background.paper',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                    },
                }}
                open={desktopOpen}
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}
