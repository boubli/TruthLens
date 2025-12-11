import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import mysql from 'mysql2/promise';

// Oracle VM MySQL Configuration
const MYSQL_CONFIG = {
    host: '129.151.245.242',
    port: 3306,
    user: 'truthlens',
    password: 'TL_Backup_2024',
    database: 'truthlens_backup'
};

// POST: Trigger manual backup
export async function POST(req: NextRequest) {
    try {
        // 1. Verify Access (Admin Token OR Secret Key)
        let authorized = false;
        let triggeredBy = 'unknown';

        const authHeader = req.headers.get('Authorization');
        const secretHeader = req.headers.get('x-backup-secret');
        const backupSecret = process.env.BACKUP_SECRET;

        // Case A: Automation via Secret
        if (backupSecret && secretHeader === backupSecret) {
            authorized = true;
            triggeredBy = 'system_automation';
        }
        // Case B: Manual Admin Trigger
        else if (authHeader?.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await adminAuth!.verifyIdToken(idToken);
            const userDoc = await adminDb!.collection('users').doc(decodedToken.uid).get();
            const userData = userDoc.data();

            if (userData?.role === 'admin') {
                authorized = true;
                triggeredBy = decodedToken.email || decodedToken.uid;
            }
        }

        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }

        // 2. Connect to MySQL
        const connection = await mysql.createConnection(MYSQL_CONFIG);

        // 3. Log backup start
        const [logResult] = await connection.execute(
            'INSERT INTO backup_log (backupType, startedAt, status, triggeredBy) VALUES (?, NOW(), ?, ?)',
            ['manual', 'in_progress', triggeredBy]
        );
        const backupId = (logResult as any).insertId;

        let totalRecords = 0;

        try {
            // 4. Backup Users
            const usersSnapshot = await adminDb!.collection('users').get();
            for (const doc of usersSnapshot.docs) {
                const data = doc.data();
                await connection.execute(
                    `INSERT INTO users (id, email, displayName, photoURL, tier, createdAt, data) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE email=VALUES(email), displayName=VALUES(displayName), 
                     tier=VALUES(tier), data=VALUES(data), lastSyncedAt=NOW()`,
                    [
                        doc.id,
                        data.email || null,
                        data.displayName || null,
                        data.photoURL || null,
                        data.subscription?.tier || 'free',
                        data.createdAt?.toDate() || new Date(),
                        JSON.stringify(data)
                    ]
                );
                totalRecords++;
            }

            // 5. Backup System Settings
            const settingsDoc = await adminDb!.collection('system').doc('settings').get();
            if (settingsDoc.exists) {
                await connection.execute(
                    `INSERT INTO system_settings (id, data) VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE data=VALUES(data), lastSyncedAt=NOW()`,
                    ['settings', JSON.stringify(settingsDoc.data())]
                );
                totalRecords++;
            }

            // 6. Update backup log as success
            await connection.execute(
                'UPDATE backup_log SET completedAt=NOW(), recordsBackedUp=?, status=? WHERE id=?',
                [totalRecords, 'success', backupId]
            );

            await connection.end();

            return NextResponse.json({
                success: true,
                message: `Backup completed successfully`,
                recordsBackedUp: totalRecords,
                backupId
            });

        } catch (backupError: any) {
            // Update backup log as failed
            await connection.execute(
                'UPDATE backup_log SET completedAt=NOW(), status=?, error=? WHERE id=?',
                ['failed', backupError.message, backupId]
            );
            await connection.end();
            throw backupError;
        }

    } catch (error: any) {
        console.error('[Backup API] Error:', error);
        return NextResponse.json({
            error: error.message || 'Backup failed',
            details: error.code
        }, { status: 500 });
    }
}

// GET: Get backup status/history
export async function GET(req: NextRequest) {
    try {
        const connection = await mysql.createConnection(MYSQL_CONFIG);

        const [rows] = await connection.execute(
            'SELECT * FROM backup_log ORDER BY startedAt DESC LIMIT 10'
        );

        await connection.end();

        return NextResponse.json({ backups: rows });

    } catch (error: any) {
        console.error('[Backup API] Error fetching history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
