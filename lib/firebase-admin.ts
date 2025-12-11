import type { ServiceAccount } from 'firebase-admin';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (serviceAccountKey) {
            // Handle both stringified JSON and base64 encoded JSON
            let serviceAccount: ServiceAccount;
            try {
                serviceAccount = JSON.parse(serviceAccountKey);
            } catch (e) {
                // If parse fails, it might be base64 encoded or just raw fields
                serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('ascii'));
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: "nutrilens-c24a6", // Hardcoded based on client config
            });
        } else {
            console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set. Push notifications will not work.');
        }
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminMessaging = admin.apps.length ? admin.messaging() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
