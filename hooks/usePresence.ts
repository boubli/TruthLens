import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'; // onDisconnect is for RDB, Firestore relies on heartbeat
import { User } from 'firebase/auth';

/**
 * usePresence Hook
 * Updates the user's "lastSeen" field in Firestore every 30 seconds.
 * This allows the Admin Dashboard to determine if a user is "Online" (active within last 60s).
 */
export const usePresence = (user: User | null) => {
    useEffect(() => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);

        // 1. Initial "Online" set
        const setOnline = async () => {
            try {
                await updateDoc(userRef, {
                    status: 'online',
                    lastSeen: serverTimestamp()
                });
            } catch (error) {
                console.error("Presence Error:", error);
            }
        };

        setOnline();

        // 2. Heartbeat every 30s
        const intervalId = setInterval(() => {
            updateDoc(userRef, {
                lastSeen: serverTimestamp()
            }).catch(e => console.error("Heartbeat fail", e));
        }, 30000);

        // 3. Cleanup: Try to set offline (best effort, as this won't run on hard crash/tab close sometimes)
        // For accurate offline detection, the Admin side relies on "lastSeen < 60s ago"
        // But we try to set 'offline' on unmount for cleaner data if user navigates away properly.
        const setOffline = async () => {
            // Only if we are still authenticated? 
            // Actually unsafe to run async in cleanup but we try
            try {
                // We can't await in cleanup typically, we fire and forget
                updateDoc(userRef, {
                    status: 'offline',
                    lastSeen: serverTimestamp()
                });
            } catch (e) {
                // ignore
            }
        };

        // Window visibility handling
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateDoc(userRef, { status: 'online', lastSeen: serverTimestamp() });
            } else {
                // Optional: Set to 'away' or just rely on heartbeat stopping?
                // Let's set 'away' to be fancy? Or keep it simple.
                // Sending 'offline' might be aggressive if they just switched tabs.
                // Let's just update lastSeen so they stay online for a bit.
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            setOffline();
        };
    }, [user]);
};
