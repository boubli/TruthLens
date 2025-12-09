import 'server-only';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
