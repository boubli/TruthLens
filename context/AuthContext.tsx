'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, UserTier, DietaryPreferences, TierFeatures, DEFAULT_SUBSCRIPTION, DEFAULT_DIETARY_PREFERENCES, TIER_CONFIG } from '@/types/user';
import { getUserProfile, getFeatureAccess } from '@/services/subscriptionService';
import { subscribeToSystemSettings } from '@/services/systemService';
import { SystemTierConfig, TierDefinition } from '@/types/system';
import { useFcmToken } from '@/hooks/useFcmToken';
import { usePresence } from '@/hooks/usePresence';


interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
    immediateLogout: () => Promise<void>;
    isPro: boolean;
    isPlus: boolean;
    isUltimate: boolean;
    isFree: boolean;
    tier: UserTier;
    features: TierFeatures;
    dietaryPreferences: DietaryPreferences;
    refreshProfile: () => Promise<void>;
    isBetaEnabled: boolean;
    // New: Dynamic Config
    tierConfig: SystemTierConfig | null;
    getTierDef: (tier: UserTier) => TierDefinition | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    logout: async () => { },
    immediateLogout: async () => { },
    isPro: false,
    isPlus: false,
    isUltimate: false,
    isFree: true,
    tier: 'free',
    features: getFeatureAccess('free'),
    dietaryPreferences: DEFAULT_DIETARY_PREFERENCES,
    refreshProfile: async () => { },
    isBetaEnabled: false,
    tierConfig: null,
    getTierDef: () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [betaMode, setBetaMode] = useState(false);
    const [tierConfig, setTierConfig] = useState<SystemTierConfig | null>(null);



    // Initialize FCM Token Management
    useFcmToken();

    // Initialize Presence System (Heartbeat)
    usePresence(user);


    const router = useRouter();
    const pathname = usePathname();

    // Listen to System Settings (Maintenance Mode + Tier Config) - Only when authenticated
    useEffect(() => {
        if (!user) {
            // Reset to defaults or keep clean state when logged out
            setMaintenanceMode(false);
            setBetaMode(false);
            setTierConfig(null);
            return;
        }

        const unsubscribe = subscribeToSystemSettings((settings) => {
            setMaintenanceMode(settings.maintenanceMode);
            setBetaMode(settings.betaAccess);
            if (settings.tierConfig) {
                setTierConfig(settings.tierConfig);
            }
        });
        return () => unsubscribe();
    }, [user]);

    // Maintenance Mode & Admin Strict Isolation Guard
    useEffect(() => {
        if (loading) return;

        // Allow access to login page always
        if (pathname === '/login') return;

        const isAdminUser = userProfile?.role === 'admin';

        // STRICT ADMIN ISOLATION: Admins can ONLY see /admin/* pages (and set-admin for testing/setup)
        if (isAdminUser) {
            // Check if current path starts with /admin or is /set-admin
            const isAllowedAdminPath = pathname.startsWith('/admin') || pathname === '/set-admin';

            if (!isAllowedAdminPath) {
                console.log('[AUTH] Admin strict mode: Redirecting to dashboard');
                router.push('/admin');
                return;
            }
        }

        // If Maintenance Mode is ON
        if (maintenanceMode) {
            console.log('[AUTH] Maintenance Mode is ON. isAdmin:', isAdminUser, 'pathname:', pathname);
            // Allow Admins through (already handled above roughly, but double check)
            if (isAdminUser) return;

            // If not admin, and not already on maintenance page, redirect
            if (pathname !== '/maintenance') {
                console.log('[AUTH] Redirecting to maintenance page...');
                router.push('/maintenance');
            }
        } else {
            // If Maintenance Mode is OFF, and user is on maintenance page, redirect home
            if (pathname === '/maintenance') {
                console.log('[AUTH] Maintenance OFF, redirecting from maintenance page...');
                router.push('/');
            }
        }
    }, [maintenanceMode, userProfile, pathname, loading, router]);




    // Load user profile when auth state changes
    useEffect(() => {
        console.log('[AUTH] Setting up auth state listener...');

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('[AUTH] Auth state changed:', user ? `User: ${user.email}` : 'No user');
            setUser(user);

            if (user) {
                await loadUserProfile(user);
            } else {
                setUserProfile(null);
            }

            setLoading(false);
            console.log('[AUTH] Loading complete');
        }, (error) => {
            // Error callback for onAuthStateChanged
            console.error('[AUTH] Auth state error:', error);
            setLoading(false); // Important: stop loading even on error
            setUser(null);
            setUserProfile(null);
        });

        // Fallback: If auth doesn't respond within 3 seconds, stop loading
        const timeout = setTimeout(() => {
            console.warn('[AUTH] Auth initialization timeout - forcing loading to false');
            setLoading(false);
        }, 8000);

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, []);

    const loadUserProfile = async (user: User) => {
        try {
            const profile = await getUserProfile(
                user.uid,
                user.email || '',
                user.displayName,
                user.photoURL
            );
            setUserProfile(profile);
        } catch (error) {
            console.error('Failed to load user profile:', error);
            // Set default profile on error
            setUserProfile({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName,
                photoURL: user.photoURL,
                subscription: DEFAULT_SUBSCRIPTION,
                dietaryPreferences: DEFAULT_DIETARY_PREFERENCES,
                createdAt: new Date(),
            });
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await loadUserProfile(user);
        }
    };

    const logout = async () => {
        // Safe check for user profile
        // @ts-ignore
        if (userProfile?.role === 'admin') {
            // Admins get fast logout
            await immediateLogout();
        } else {
            // Users get the immersive quest page
            router.push('/quest');
        }
    };

    const immediateLogout = async () => {
        await firebaseSignOut(auth);
        setUserProfile(null);
        router.push('/login');
    };

    // Computed values
    const tier = userProfile?.subscription.tier || 'free';

    // Exact tier checks
    const isAdmin = userProfile?.role === 'admin';
    const isUltimate = tier === 'ultimate' || isAdmin; // Admins get full access

    // Inclusive tier checks (Hierarchy: Free < Plus < Pro < Ultimate)
    const isPro = tier === 'pro' || isUltimate;
    const isPlus = tier === 'plus' || isPro; // Includes Pro and Ultimate
    const isFree = tier === 'free' && !isAdmin;


    // Dynamic Feature Resolution
    // Prefer Dynamic Config if loaded, else fallback to hardcoded
    const features = tierConfig && tierConfig[tier] ? tierConfig[tier].features : getFeatureAccess(tier);

    const dietaryPreferences = userProfile?.dietaryPreferences || DEFAULT_DIETARY_PREFERENCES;

    const getTierDef = (t: UserTier) => {
        if (tierConfig && tierConfig[t]) return tierConfig[t];
        // Fallback or return null
        return null;
    };

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            loading,
            logout,
            immediateLogout,
            isPro,
            isPlus,
            isUltimate,
            isFree,
            tier,
            features,
            dietaryPreferences,
            refreshProfile,
            isBetaEnabled: betaMode,
            tierConfig,
            getTierDef
        }}>
            {children}
        </AuthContext.Provider>
    );
};


