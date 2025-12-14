'use client';

import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, useTheme, useMediaQuery, alpha } from '@mui/material';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/animation/PageTransition';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Footer from '@/components/layout/Footer';
import MenuIcon from '@mui/icons-material/MenuRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import NotificationsIcon from '@mui/icons-material/NotificationsNoneRounded';

import { Badge } from '@mui/material';
import { listenForAdminUnreadCount } from '@/services/supportService';

import AdminNotificationsMenu from '@/components/admin/AdminNotificationsMenu';
import { getPendingRequests } from '@/services/accessRequestService';

const SIDEBAR_WIDTH = 280;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        // Listen for chat messages
        const unsubscribe = listenForAdminUnreadCount((count) => {
            // Also fetch pending requests count to update total badge
            getPendingRequests().then(requests => {
                setUnreadCount(count + requests.length);
            }).catch(() => {
                setUnreadCount(count);
            });
        });
        return () => unsubscribe();
    }, []);

    const handleDrawerToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setDesktopOpen(!desktopOpen);
        }
    };

    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchor(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchor(null);
    };

    const getPageTitle = (path: string) => {
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 1 && parts[0] === 'admin') return 'Dashboard';
        const lastPart = parts[parts.length - 1];
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Sidebar Navigation */}
            <AdminSidebar
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                desktopOpen={desktopOpen} // Pass desktop state
                unreadCount={unreadCount}
            />

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    minWidth: 0, // Critical for text truncation in flex children
                    transition: 'width 0.3s ease',
                }}
            >
                {/* Glassmorphic AppBar */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        bgcolor: alpha(theme.palette.background.default, 0.8),
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        color: 'text.primary',
                        transition: 'width 0.3s ease',
                    }}
                >
                    <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }}>
                        {/* Hamburger Menu (Visible on both now) */}
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{
                                mr: 2,
                                // display: { md: 'none' }, // Removed to show on desktop
                                bgcolor: alpha('#0F172A', 0.05),
                                borderRadius: '12px',
                                '&:hover': {
                                    bgcolor: alpha('#0F172A', 0.1),
                                },
                            }}
                        >
                            {(isMobile ? mobileOpen : desktopOpen) ? <CloseIcon /> : <MenuIcon />}
                        </IconButton>

                        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 0.5 }}>
                            {getPageTitle(pathname)}
                        </Typography>

                        {/* Right Side Actions */}
                        <IconButton
                            onClick={handleNotificationClick}
                            sx={{
                                color: 'text.secondary',
                                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
                            }}
                        >
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>

                        <AdminNotificationsMenu
                            anchorEl={notificationAnchor}
                            open={Boolean(notificationAnchor)}
                            onClose={handleNotificationClose}
                        />
                    </Toolbar>
                </AppBar>

                {/* Page Content Container */}
                <Box
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2.5, sm: 4, md: 5 },
                        maxWidth: '100%',
                        overflowX: 'hidden', // Prevent horizontal scroll on mobile
                    }}
                >
                    <AnimatePresence mode="wait">
                        <PageTransition key={pathname}>
                            {children}
                        </PageTransition>
                    </AnimatePresence>
                </Box>

                {/* Footer */}
                <Box sx={{ mt: 'auto' }}>
                    <Footer />
                </Box>
            </Box>
        </Box>
    );
}
