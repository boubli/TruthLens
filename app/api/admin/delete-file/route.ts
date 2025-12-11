import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/appwriteAdmin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bucketId, fileId } = body;

        if (!bucketId || !fileId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        await storage.deleteFile(bucketId, fileId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete File Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
