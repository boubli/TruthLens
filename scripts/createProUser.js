// Temporary script to create Pro user in Firestore
// Run with: node scripts/createProUser.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (uses your project's credentials)
const serviceAccount = require('../lib/firebase'); // Will use your existing config

// For Admin SDK, we need server-side initialization
// Since you're using client SDK, we'll use a workaround
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase config from .env.local
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createProUser() {
    const userId = 'ORJ9FSZnKgg6cQpoUiAxzbiEIVc2';

    const userData = {
        email: 'test@test.com',
        displayName: 'Test User',
        photoURL: null,
        subscription: {
            tier: 'pro',
            startDate: new Date(),
            endDate: null,
            autoRenew: true,
        },
        dietaryPreferences: {
            isKeto: false,
            isVegan: false,
            isDiabetic: false,
            lowSodium: false,
            glutenFree: false,
        },
        createdAt: new Date(),
    };

    try {
        await setDoc(doc(db, 'users', userId), userData);
        console.log('✅ Pro user created successfully!');
        console.log('User ID:', userId);
        console.log('Email:', userData.email);
        console.log('Tier:', userData.subscription.tier);
        console.log('\n🎉 Refresh your app to see Pro features!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating user:', error);
        process.exit(1);
    }
}

createProUser();
