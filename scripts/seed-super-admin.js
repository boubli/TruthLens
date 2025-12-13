
const admin = require('firebase-admin');

// Using the same logic as lib/firebaseAdmin.ts but adapted for standalone script
// We need to ensure we can read the env var from where this script runs.
// In the sandbox, we might need to rely on the environment variables being present.

async function seedAdmin() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not set.');
    process.exit(1);
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (e) {
    serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('ascii'));
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  const TARGET_UID = 'S9NpX66w6CaMDafbBV505DWtuRH2';
  const TARGET_EMAIL = 'bbb.vloger@gmail.com';
  const INITIAL_PASSWORD = 'bbb.vloger@gmail.com';

  console.log(`Checking for user ${TARGET_EMAIL} (${TARGET_UID})...`);

  try {
    // 1. Try to get the user by UID
    try {
      const user = await auth.getUser(TARGET_UID);
      console.log('✅ User exists.');

      // Update email if different
      if (user.email !== TARGET_EMAIL) {
          console.log(`Updating email from ${user.email} to ${TARGET_EMAIL}...`);
          await auth.updateUser(TARGET_UID, { email: TARGET_EMAIL });
      }

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('⚠️ User not found by UID. Creating...');
        try {
            await auth.createUser({
              uid: TARGET_UID,
              email: TARGET_EMAIL,
              password: INITIAL_PASSWORD,
            });
            console.log('✅ User created successfully.');
        } catch (createError) {
            // Check if email already exists with a DIFFERENT UID
            if (createError.code === 'auth/email-already-exists') {
                 console.log('⚠️ User exists with this email but different UID. Finding and migrating...');
                 const existingUser = await auth.getUserByEmail(TARGET_EMAIL);
                 console.log(`Found user with UID: ${existingUser.uid}. Deleting old user to enforce UID ${TARGET_UID}...`);
                 await auth.deleteUser(existingUser.uid);
                 await db.collection('users').doc(existingUser.uid).delete();

                 // Try creating again
                 await auth.createUser({
                    uid: TARGET_UID,
                    email: TARGET_EMAIL,
                    password: INITIAL_PASSWORD,
                  });
                 console.log('✅ Re-created user with correct UID.');
            } else {
                throw createError;
            }
        }
      } else {
        throw error;
      }
    }

    // 2. Set Custom Claims (Role = Admin)
    console.log('Setting custom claims...');
    await auth.setCustomUserClaims(TARGET_UID, { role: 'admin' });

    // 3. Update Firestore Document
    console.log('Updating Firestore...');
    await db.collection('users').doc(TARGET_UID).set({
      email: TARGET_EMAIL,
      role: 'admin',
      subscription: {
        tier: 'ultimate', // Give super admin ultimate access
        status: 'active'
      },
      updatedAt: new Date()
    }, { merge: true });

    console.log('🎉 Super Admin Seeding Complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
