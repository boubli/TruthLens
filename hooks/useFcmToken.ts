'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';

export const useFcmToken = () => {
    const { user } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        const retrieveToken = async () => {
            try {
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    // Check if supported
                    const messaging = getMessaging(app);

                    // Request permission
                    const permission = await Notification.requestPermission();
                    setNotificationPermissionStatus(permission);

                    if (permission === 'granted') {
                        const currentToken = await getToken(messaging, {
                            vapidKey: 'BNiHcG-iqbSYTuViV7R410_xTcBMAPpgMIqGNRivQlddBgg_7-yK-6IXE7ibj_afqmULbrVSSe1yNBPGCYhLyPY'
                            // Usually need a VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push Certificates
                            // If missing, it might work with default if config is perfect, but VAPID is standard.
                            // I will use a placeholder or try without first if typically configured. 
                            // Actually, explicit VAPID is recommended. I'll ask user or try to find it.
                            // For now, let's try standard getToken.
                        });

                        if (currentToken) {
                            setToken(currentToken);
                            // Save to DB
                            if (user?.uid) {
                                const userRef = doc(db, 'users', user.uid);
                                await updateDoc(userRef, { fcmToken: currentToken });
                                console.log('FCM Token saved to profile');
                            }
                        } else {
                            console.log('No registration token available. Request permission to generate one.');
                        }
                    }
                }
            } catch (error) {
                console.error('An error occurred while retrieving token:', error);
            }
        };

        if (user) {
            retrieveToken();
        }
    }, [user]);

    // Foreground message listener
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const messaging = getMessaging(app);
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);
                // Can trigger a toast here if desired
            });
            return () => unsubscribe();
        }
    }, []);

    return { token, notificationPermissionStatus };
};
