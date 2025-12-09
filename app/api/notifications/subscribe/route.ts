import { NextResponse } from 'next/server';

// In a real application, you would store this in a database (e.g., Firestore, PostgreSQL)
// This is a simple in-memory store for demonstration purposes BUT it will reset on server restart
// and won't work across multiple serverless functions.
// YOU MUST REPLACE THIS WITH REAL DB CALLS.
let subscriptions: Record<string, any> = {};

// Mock database function
const saveSubscriptionToDb = async (userId: string, subscription: any) => {
    console.log(`[DB] Saving subscription for user ${userId}:`, subscription);
    subscriptions[userId] = subscription;
    // TODO: Insert into database here
    // await db.collection('users').doc(userId).collection('push_subscriptions').add(subscription);
};

export async function POST(request: Request) {
    try {
        const { subscription, userId } = await request.json();

        if (!subscription || !userId) {
            return NextResponse.json({ error: 'Missing subscription or userId' }, { status: 400 });
        }

        await saveSubscriptionToDb(userId, subscription);

        return NextResponse.json({ success: true, message: 'Subscription saved.' });
    } catch (error) {
        console.error('Error in subscribe API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
