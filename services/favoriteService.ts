import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { EnhancedProductData } from '@/app/actions';

// Define Favorite Item type
export interface FavoriteItem {
    id: string; // Product ID
    name: string;
    image?: string;
    brand?: string;
    addedAt: any;
}

export const addToFavorites = async (userId: string, product: EnhancedProductData | any) => {
    const ref = doc(db, 'users', userId, 'favorites', product.id);

    // Normalize data
    const data: FavoriteItem = {
        id: product.id,
        name: product.identity?.name || product.product_name || 'Unknown Product',
        image: product.media?.thumbnail || product.image_front_small_url || '',
        brand: product.identity?.brand || product.brands || '',
        addedAt: serverTimestamp(),
    };

    await setDoc(ref, data);
};

export const removeFromFavorites = async (userId: string, productId: string) => {
    const ref = doc(db, 'users', userId, 'favorites', productId);
    await deleteDoc(ref);
};

export const getFavorites = async (userId: string): Promise<FavoriteItem[]> => {
    const q = query(collection(db, 'users', userId, 'favorites'), orderBy('addedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FavoriteItem));
};

export const checkIsFavorite = async (userId: string, productId: string): Promise<boolean> => {
    const ref = doc(db, 'users', userId, 'favorites', productId);
    const snap = await getDoc(ref);
    return snap.exists();
};
