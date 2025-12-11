import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/appwriteAdmin';
import { ID, Permission, Role } from 'node-appwrite';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bucketId = process.env.APPWRITE_BUCKET_ID || 'music_bucket';

        // 1. Ensure Bucket Exists
        try {
            await storage.getBucket(bucketId);
        } catch (e: any) {
            if (e.code === 404) {
                console.log(`Bucket ${bucketId} not found, creating...`);
                await storage.createBucket(
                    bucketId,
                    'Music Storage',
                    [Permission.read(Role.any())],
                    false,
                    true,
                    undefined,
                    ['mp3', 'wav', 'ogg', 'm4a', 'jpg', 'jpeg', 'png', 'webp']
                );

            } else {
                // If it's another error, throw it to the main catcher
                throw e;
            }
        }

        // 2. Upload File
        const fileId = ID.unique();

        await storage.createFile(
            bucketId,
            fileId,
            file
        );

        // 3. Construct View URL
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

        const viewUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;

        return NextResponse.json({
            success: true,
            url: viewUrl,
            fileId: fileId,
            bucketId: bucketId
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Upload Failed' }, { status: 500 });
    }
}
