import 'server-only';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
            console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not set. Admin SDK will not be available.');
        } else {
            const serviceAccount = JSON.parse(serviceAccountKey);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            console.log('✅ Firebase Admin SDK initialized');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    }
}

export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
