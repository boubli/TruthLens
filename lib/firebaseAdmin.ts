import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            // Priority 1: Environment Variable (Base64 or JSON string)
            console.log('[FirebaseAdmin] Initializing with FIREBASE_SERVICE_ACCOUNT_KEY env var');
            let serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Priority 2: Local File (Development)
            // Note: In production (e.g. Vercel), files aren't always accessible this way.
            console.log('[FirebaseAdmin] Attempting to initialize with local file serviceAccountKey.json');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const serviceAccount = require('../serviceAccountKey.json');
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        console.log('[FirebaseAdmin] Admin SDK initialized successfully');
    } catch (error: any) {
        console.warn('[FirebaseAdmin] Failed to initialize Admin SDK:', error.message);
        console.warn('[FirebaseAdmin] Some admin features (User Management) will not work.');
    }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
