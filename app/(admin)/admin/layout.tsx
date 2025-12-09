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

const SIDEBAR_WIDTH = 280;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        const unsubscribe = listenForAdminUnreadCount((count) => {
            setUnreadCount(count);
        });
        return () => unsubscribe();
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const getPageTitle = (path: string) => {
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 1 && parts[0] === 'admin') return 'Dashboard';
        const lastPart = parts[parts.length - 1];
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
            {/* Sidebar Navigation */}
            <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} unreadCount={unreadCount} />

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    // Safe area for sidebar on desktop
                    width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
                    minHeight: '100vh',
                    transition: 'width 0.3s ease',
                }}
            >
                {/* Glassmorphic AppBar */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        bgcolor: alpha('#F8FAFC', 0.8),
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid',
                        borderColor: alpha('#94A3B8', 0.2),
                        color: '#0F172A',
                    }}
                >
                    <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }}>
                        {/* Hamburger Menu (Mobile Only) */}
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{
                                mr: 2,
                                display: { md: 'none' },
                                bgcolor: alpha('#0F172A', 0.05),
                                borderRadius: '12px',
                                '&:hover': {
                                    bgcolor: alpha('#0F172A', 0.1),
                                },
                            }}
                        >
                            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                        </IconButton>

                        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 0.5 }}>
                            {getPageTitle(pathname)}
                        </Typography>

                        {/* Right Side Actions */}
                        <IconButton
                            sx={{
                                color: '#64748B',
                                '&:hover': { color: '#0F172A', bgcolor: alpha('#0F172A', 0.05) }
                            }}
                        >
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
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
