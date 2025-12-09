import { NextResponse } from 'next/server';
import webPush from 'web-push';

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

// Mock database retrieval function
const getSubscriptionFromDb = async (userId: string) => {
    // TODO: Retrieval logic here
    // const userDoc = await db.collection('users').doc(userId).get();
    // return userDoc.data()?.subscription;

    console.log(`[DB] Retrieving subscription for user ${userId}`);
    // For demonstration, we simply return null and log that a real DB is needed.
    // In a real scenario, you would return the subscription object stored in 
    // /api/notifications/subscribe
    return null;
};

export async function POST(request: Request) {
    try {
        const { userId, messageText, senderName } = await request.json();

        if (!userId || !messageText) {
            return NextResponse.json({ error: 'Missing userId or messageText' }, { status: 400 });
        }

        // 1. Retrieve the user's subscription from your database
        const subscription = await getSubscriptionFromDb(userId);

        if (!subscription) {
            // For this generated code to work 'out of the box' for testing without a DB, 
            // you might need to pass the subscription in the body temporarily, 
            // but for production, fetch it from DB.
            return NextResponse.json({
                error: 'Subscription not found for user. (Implement DB retrieval)',
                details: 'Ensure to implement the getSubscriptionFromDb function to fetch the stored subscription.'
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
