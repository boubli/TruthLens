'use client';

import React, { useEffect, useState } from 'react';

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

interface PushNotificationSetupProps {
    userId: string;
}

const PushNotificationSetup: React.FC<PushNotificationSetupProps> = ({ userId }) => {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/',
                updateViaCache: 'none',
            });
            console.log('Service Worker registered with scope:', registration.scope);

            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    };

    const subscribeToPush = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;

            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined');
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            setSubscription(sub);

            // Send subscription to backend
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: sub,
                    userId: userId,
                }),
            });

            console.log('Subscribed to push notifications!');
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    };

    if (!isSupported) {
        return null; // Don't render if not supported
    }

    return (
        <div className="push-notification-setup">
            {!subscription && (
                <button
                    onClick={subscribeToPush}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Enable Chat Notifications
                </button>
            )}
            {subscription && (
                <p className="text-sm text-green-600 flex items-center">
                    Notifications Enabled
                </p>
            )}
        </div>
    );
};

export default PushNotificationSetup;
