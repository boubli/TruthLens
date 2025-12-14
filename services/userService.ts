import { auth } from '@/lib/firebase';
import { updateProfile, updatePassword, User } from 'firebase/auth';

/**
 * Updates the user's display name and photo URL.
 * @param user The current Firebase User object
 * @param displayName New display name
 * @param photoURL New photo URL (optional)
 */
export const updateUserProfile = async (user: User, displayName: string, photoURL?: string) => {
    try {
        await updateProfile(user, {
            displayName: displayName,
            photoURL: photoURL || user.photoURL
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating profile:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Updates the user's password.
 * @param user The current Firebase User object
 * @param newPassword The new password
 */
export const updateUserPassword = async (user: User, newPassword: string) => {
    try {
        await updatePassword(user, newPassword);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating password:", error);
        // Common error: 'auth/requires-recent-login'
        return { success: false, error: error.message, code: error.code };
    }
};
