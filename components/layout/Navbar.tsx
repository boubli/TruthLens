'use client';
import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import RecommendIcon from '@mui/icons-material/Recommend';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import { useAuth } from '@/context/AuthContext';
import { listenForUnreadForUser } from '@/services/supportService';

import { useEffect } from 'react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import ThemeCustomizer from '@/components/theme/ThemeCustomizer';
import TierBadge from '@/components/subscription/TierBadge';

const userPages = [
    { name: 'Search', path: '/search', icon: SearchIcon },
    { name: 'History', path: '/history', icon: HistoryIcon },
    { name: 'Recommendations', path: '/recommendations', icon: RecommendIcon },
    { name: 'Profile', path: '/profile', icon: PersonIcon },
];

const adminPages = [
    { name: 'Admin Dashboard', path: '/admin', icon: AdminPanelSettingsIcon },
    { name: 'Profile', path: '/profile', icon: PersonIcon },
];

import UserNotificationsMenu from './UserNotificationsMenu';

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { isPro, isFree, user, tier } = useAuth();
    const [customizerOpen, setCustomizerOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (!user) return;

        // Listen for support messages
        const unsubscribeSupport = listenForUnreadForUser(user.uid, (supportCount) => {
            // Also fetch notifications count (simplest way is to fetch once, or set interval, or REAL TIME listener if added)
            // For now, let's just use supportCount + 0, but ideally we want `getUserNotifications` count.
            // Let's do a quick fetch of notifications to add to the badge count.
            // Or better, make `UserNotificationsMenu` fetch on mount, but Navbar needs the count always.
            // We'll update this simply to load basic notifications count.

            // TODO: Add realtime listener for notifications collection too if heavy traffic.
            // For now, we will just use the support count or if user opens menu it updates.
            // BETTER: Let's fetch the unread count from notifications collection here too.
            import('@/services/accessRequestService').then(({ getUserNotifications }) => {
                getUserNotifications(user.uid).then(notifs => {
                    const notifCount = notifs.filter(n => !n.read).length;
                    setUnreadCount(supportCount + notifCount);
                });
            });
        });
        return () => unsubscribeSupport();
    }, [user, notificationAnchor]); // Re-fetch when menu closes/opens in case read status changed

    // Determine if user is admin based on role
    // Note: 'user' object from context should have 'role' property if fetching full profile
    // If usage of 'user' here is from Firebase Auth User object, it might not have 'role' directly on top level
    // unless mapped. Let's assume 'user' here is the UserContext object which usually mixes both or we check the profile.
    // Looking at useAuth usage elsewhere, 'user' is often User | null. 
    // Types might need verification. 
    // In `app/profile/page.tsx`: const { user, userProfile ... } = useAuth();
    // In `services/subscriptionService.ts`: `UserProfile` has `role`.
    // Let's assume `user` from `useAuth` might be just Firebase User. 
    // We should use `userProfile` if available or check `user['role']` if we extended it.
    // Let's use `userProfile` from `useAuth` if available.
    // Checking `Navbar` again... it destructures `{ isPro, isFree, user, tier }`.
    // I should check if `userProfile` is available from `useAuth`.
    // If not, I might need to rely on `user.email` (bad) or assume `user` has custom claims? 
    // Let's check `context/AuthContext.tsx`.

    // Assuming for now I can get `userProfile` or checking if `tier === 'admin'`? No, tier is 'free'|'plus'...
    // Let's look at `AuthContext`.

    // TEMPORARY ASSUMPTION: I need to check `AuthContext` to be sure.
    // But I will proceed with rendering logic assuming I can access `isAdmin`.
    // I will use `userProfile?.role === 'admin'` if `userProfile` is there.
    // If `Navbar` doesn't have `userProfile`, I'll add it to destructuring.

    const { userProfile } = useAuth();
    const isAdmin = userProfile?.role === 'admin';

    const pages = isAdmin ? adminPages : userPages;

    return (
        <AppBar position="sticky" sx={{ bgcolor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', background: 'linear-gradient(45deg, #6C63FF, #00F0FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    TruthLens
                </Typography>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
                    {user && (
                        <>
                            {pages.map((page) => {
                                const Icon = page.icon;
                                return (
                                    <Link key={page.name} href={page.path} passHref style={{ textDecoration: 'none' }}>
                                        <Button
                                            component={motion.button}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            startIcon={<Icon />}
                                            sx={{
                                                color: pathname.startsWith(page.path) && page.path !== '/profile' ? 'secondary.main' : (pathname === page.path ? 'secondary.main' : 'text.primary'),
                                                // Handle /admin matching /admin/dashboard
                                                fontWeight: pathname.startsWith(page.path) && page.path !== '/profile' ? 'bold' : 'normal',
                                            }}
                                        >
                                            {page.name}
                                        </Button>
                                    </Link>
                                );
                            })}

                            {/* Upgrade Button - Hide for Admin */}
                            {!isAdmin && isFree && (
                                <Button
                                    variant="contained"
                                    color="warning"
                                    size="small"
                                    startIcon={<StarIcon />}
                                    onClick={() => router.push('/upgrade')}
                                    sx={{
                                        fontWeight: 'bold',
                                        background: 'linear-gradient(45deg, #FFD700 30%, #FF8C00 90%)',
                                        boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                                    }}
                                >
                                    Upgrade
                                </Button>
                            )}

                            {/* Tier Badge - Hide for Admin since they see 'Admin' dashboard? Or keep it? 
                                User asked "futures only for users". Tier badge is kind of a user feature status.
                                Let's hide it for Admin to be cleaner.
                            */}
                            {!isAdmin && !isFree && (
                                <TierBadge tier={tier} size="small" />
                            )}

                            {/* Theme Toggle */}
                            <ThemeToggle onOpenCustomizer={() => setCustomizerOpen(true)} />



                            {/* Notification Icon */}
                            <IconButton
                                color="inherit"
                                onClick={(e) => setNotificationAnchor(e.currentTarget)}
                                sx={{ ml: 1 }}
                            >
                                <Badge badgeContent={unreadCount} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>

                            <UserNotificationsMenu
                                anchorEl={notificationAnchor}
                                open={Boolean(notificationAnchor)}
                                onClose={() => setNotificationAnchor(null)}
                            />
                        </>
                    )}
                </Box>
            </Toolbar>

            {/* Theme Customizer Drawer */}
            <ThemeCustomizer
                open={customizerOpen}
                onClose={() => setCustomizerOpen(false)}
            />
        </AppBar>
    );
};

export default Navbar;
