import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
    credential: cert({
        projectId: 'nutrilens-c24a6',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
});

const db = getFirestore(app);

async function setAdminRole(email: string) {
    try {
        console.log(`🔍 Searching for user: ${email}...`);

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            console.log('❌ No user found with that email');
            return;
        }

        const userDoc = snapshot.docs[0];
        const userId = userDoc.id;

        console.log(`✅ Found user: ${userId}`);

        await usersRef.doc(userId).update({
            role: 'admin',
        });

        console.log(`✅ Successfully set ${email} as admin!`);
        console.log(`🎯 Access admin panel: http://localhost:3000/admin`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

const email = process.argv[2] || 'bbb.vloger@gmail.com';
setAdminRole(email).then(() => process.exit(0));
