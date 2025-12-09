import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAwzrOcRTSM6tP4DUYks77K5NeW1D8GXu0",
    authDomain: "nutrilens-c24a6.firebaseapp.com",
    projectId: "nutrilens-c24a6",
    storageBucket: "nutrilens-c24a6.firebasestorage.app",
    messagingSenderId: "667801974110",
    appId: "1:667801974110:web:862ea16de0280a63ab0bcf",
    measurementId: "G-91D6PJFTXK"
};

// Initialize Firebase (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Analytics (Client-side only)
let analytics: any = null;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, googleProvider, analytics };
