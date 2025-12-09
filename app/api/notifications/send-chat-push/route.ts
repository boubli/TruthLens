import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { adminDb } from '@/lib/firebase-admin';

// Configure web-push with your keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.org';

if (vapidPublicKey && vapidPrivateKey) {
    webPush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
    );
} else {
    console.warn('VAPID keys are missing. Push notifications will fail.');
}

export async function POST(request: Request) {
    try {
        const { userId, messageText, senderName } = await request.json();

        if (!userId || !messageText) {
            return NextResponse.json({ error: 'Missing userId or messageText' }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        // 1. Retrieve the user's subscription from Firestore
        const userDoc = await adminDb.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data();
        const subscription = userData?.pushSubscription;

        if (!subscription) {
            return NextResponse.json({
                error: 'Subscription not found for user.',
                details: 'User has not enabled push notifications.'
            }, { status: 404 });
        }

        // 2. Create the payload
        const payload = JSON.stringify({
            title: `New Message from ${senderName || 'Support'}`,
            body: messageText,
            url: `/chat/${userId}`, // Deep link to the chat
        });

        // 3. Send the notification
        await webPush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true, message: 'Notification sent.' });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}
