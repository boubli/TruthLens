import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        if (!adminMessaging) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const { token, title, body, link } = await req.json();

        if (!token || !title || !body) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const message = {
            token: token,
            notification: {
                title: title,
                body: body,
            },
            webpush: {
                fcmOptions: {
                    link: link || '/'
                }
            },
            data: {
                click_action: link || '/'
            }
        };

        const response = await adminMessaging.send(message);
        return NextResponse.json({ success: true, messageId: response });

    } catch (error: any) {
        console.error('FCM Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
