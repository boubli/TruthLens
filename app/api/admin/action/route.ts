import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// SUPER ADMIN UID PROTECTION
const SUPER_ADMIN_UID = 'S9NpX66w6CaMDafbBV505DWtuRH2';

export async function POST(req: NextRequest) {
    try {
        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: 'Server configuration error (Admin SDK not initialized)' }, { status: 500 });
        }

        const body = await req.json();
        const { action, userId, data } = body;

        // Verify ID Token (Basic check)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
            if (decodedToken.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
            }
        } catch (e) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const requesterUid = decodedToken.uid;
        console.log(`[AdminAPI] Action: ${action} for target: ${userId || 'N/A'} by: ${requesterUid}`);

        switch (action) {
            case 'createUser':
                // Create a new User
                if (!data?.email || !data?.password) {
                    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
                }

                try {
                    const newUser = await adminAuth.createUser({
                        email: data.email,
                        password: data.password,
                        disabled: false,
                        emailVerified: true // Assume verified if admin creates it
                    });

                    const newRole = data.role || 'user';
                    const newTier = data.tier || 'free';

                    // Set Claims
                    await adminAuth.setCustomUserClaims(newUser.uid, { role: newRole });

                    // Create Firestore Document
                    await adminDb.collection('users').doc(newUser.uid).set({
                        email: data.email,
                        role: newRole,
                        subscription: {
                            tier: newTier,
                            status: 'active',
                            updatedAt: new Date()
                        },
                        createdAt: new Date(),
                        createdBy: requesterUid
                    });

                    return NextResponse.json({ success: true, message: 'User created successfully', user: newUser });
                } catch (e: any) {
                    return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 400 });
                }

            case 'updateSelf':
                // Update Admin's Own Credentials
                if (userId !== requesterUid) {
                    return NextResponse.json({ error: 'Forbidden: Can only update your own credentials via this action' }, { status: 403 });
                }

                const updates: any = {};
                if (data?.email) updates.email = data.email;
                if (data?.password) updates.password = data.password;

                if (Object.keys(updates).length === 0) {
                     return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
                }

                await adminAuth.updateUser(userId, updates);

                // If email changed, sync to Firestore
                if (data?.email) {
                    await adminDb.collection('users').doc(userId).set({ email: data.email }, { merge: true });
                }

                return NextResponse.json({ success: true, message: 'Credentials updated successfully' });

            case 'resetPasswordEmail':
                if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
                const userToReset = await adminAuth.getUser(userId);
                const link = await adminAuth.generatePasswordResetLink(userToReset.email!);
                return NextResponse.json({ success: true, message: 'Password reset link generated', link });

            case 'setPassword':
                if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
                if (!data?.newPassword) return NextResponse.json({ error: 'Missing newPassword' }, { status: 400 });
                await adminAuth.updateUser(userId, {
                    password: data.newPassword
                });
                return NextResponse.json({ success: true, message: 'Password updated successfully' });

            case 'updateRole':
                if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

                // PROTECT SUPER ADMIN
                if (userId === SUPER_ADMIN_UID && data?.role !== 'admin') {
                    return NextResponse.json({ error: 'Forbidden: Cannot remove admin role from Super Admin' }, { status: 403 });
                }

                if (!data?.role) return NextResponse.json({ error: 'Missing role' }, { status: 400 });
                await adminAuth.setCustomUserClaims(userId, { role: data.role });
                await adminDb.collection('users').doc(userId).set({ role: data.role }, { merge: true });
                return NextResponse.json({ success: true, message: `Role updated to ${data.role}` });

            case 'updateTier':
                if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
                if (!data?.tier) return NextResponse.json({ error: 'Missing tier' }, { status: 400 });
                await adminDb.collection('users').doc(userId).set({
                    subscription: {
                        tier: data.tier,
                        updatedAt: new Date()
                    }
                }, { merge: true });
                return NextResponse.json({ success: true, message: `Tier updated to ${data.tier}` });

            case 'deleteUser':
                if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

                // PROTECT SUPER ADMIN
                if (userId === SUPER_ADMIN_UID) {
                     return NextResponse.json({ error: 'Forbidden: Cannot delete Super Admin' }, { status: 403 });
                }

                await adminAuth.deleteUser(userId);
                await adminDb.collection('users').doc(userId).delete();
                return NextResponse.json({ success: true, message: 'User deleted' });

            case 'toggleStatus':
                if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

                 // PROTECT SUPER ADMIN (Should not be disabled)
                 if (userId === SUPER_ADMIN_UID) {
                     // Check if trying to disable
                     const current = await adminAuth.getUser(userId);
                     if (!current.disabled) { // If currently enabled, and we toggle, it becomes disabled. Prevent that.
                          return NextResponse.json({ error: 'Forbidden: Cannot disable Super Admin' }, { status: 403 });
                     }
                }

                const userRecord = await adminAuth.getUser(userId);
                const newStatus = !userRecord.disabled;
                await adminAuth.updateUser(userId, { disabled: newStatus });
                return NextResponse.json({ success: true, message: `User ${newStatus ? 'disabled' : 'enabled'}` });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[AdminAPI] Action failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
