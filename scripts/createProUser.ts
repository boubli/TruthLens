// Simple script to create Pro user using existing Firebase setup
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

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

async function createProUser() {
    try {
        await setDoc(doc(db, 'users', userId), userData);
        console.log('✅ Pro user created successfully!');
        console.log('User ID:', userId);
        console.log('Email:', userData.email);
        console.log('Tier:', userData.subscription.tier);
        console.log('\n🎉 Refresh your app to see Pro features!');
    } catch (error) {
        console.error('❌ Error creating user:', error);
    }
}

createProUser();
