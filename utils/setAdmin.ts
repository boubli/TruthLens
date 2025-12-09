/**
 * Simple client-side script to set admin role
 * Run this in browser console OR create a temporary page
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export async function setCurrentUserAsAdmin() {
    const user = auth.currentUser;

    if (!user) {
        console.error('No user logged in');
        return;
    }

    try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            role: 'admin'
        });

        console.log('✅ Successfully set', user.email, 'as admin!');
        console.log('🎯 Refresh the page to see changes');

        return true;
    } catch (error) {
        console.error('❌ Error setting admin role:', error);
        return false;
    }
}

// Make it available globally in browser console
if (typeof window !== 'undefined') {
    (window as any).setCurrentUserAsAdmin = setCurrentUserAsAdmin;
}
