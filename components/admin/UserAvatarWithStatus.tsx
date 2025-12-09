import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserAvatarWithStatusProps {
    userId: string;
    name: string;
    email?: string;
    isSelected?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const UserAvatarWithStatus: React.FC<UserAvatarWithStatusProps> = ({
    userId,
    name,
    email,
    isSelected = false,
    size = 'md'
}) => {
    const [status, setStatus] = useState<'online' | 'offline'>('offline');

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = onSnapshot(doc(db, 'users', userId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const now = new Date();
                const lastSeenDate = data.lastSeen?.toDate ? data.lastSeen.toDate() : null;

                // Heartbeat check (60s threshold)
                const isHeartbeatAlive = lastSeenDate && (now.getTime() - lastSeenDate.getTime() < 60000);

                if (data.status === 'online' && isHeartbeatAlive) {
                    setStatus('online');
                } else {
                    setStatus('offline');
                }
            }
        });

        return () => unsubscribe();
    }, [userId]);

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-lg',
        lg: 'w-16 h-16 text-xl'
    };

    return (
        <div className="relative shrink-0">
            <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold transition-all ${isSelected
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                }`}>
                {(name || email || 'U')[0]?.toUpperCase()}
            </div>

            <div className={`
                absolute bottom-0 right-0 rounded-full border-2 border-white transition-colors duration-300
                ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}
                ${status === 'online' ? 'bg-green-400' : 'bg-gray-300'}
            `}></div>
        </div>
    );
};

export default UserAvatarWithStatus;
