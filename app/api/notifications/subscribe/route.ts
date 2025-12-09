import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { subscription, userId } = await request.json();

        if (!subscription || !userId) {
            return NextResponse.json({ error: 'Missing subscription or userId' }, { status: 400 });
        }

        if (!adminDb) {
            console.error('Firebase Admin not initialized');
            // In dev environment without keys, we might fail gracefully or return error
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        // Save subscription to Firestore under the user's document
        // We update a specific field 'pushSubscription'
        // Using set with merge: true to ensure we don't overwrite other user data if using set,
        // or just update if we know doc exists. Update is safer if user must exist.
        // However, if user doc doesn't exist, update fails. Users should exist.
        await adminDb.collection('users').doc(userId).set({
            pushSubscription: subscription
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Subscription saved to Firestore.' });
    } catch (error) {
        console.error('Error in subscribe API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
