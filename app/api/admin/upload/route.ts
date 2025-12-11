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

        // 1. Ensure Bucket Exists (Robustness)
        try {
            await storage.getBucket(bucketId);
        } catch (e: any) {
            if (e.code === 404) {
                console.log(`Bucket ${bucketId} not found, creating...`);
                // node-appwrite expects a File-like object. Next.js `File` fits well usually, 
                // but sometimes needs buffer conversion.
                // `createFile` signature: (bucketId, fileId, file, permissions?)

                const fileId = ID.unique();

                // Convert Next.js File to Buffer/Stream if needed? 
                // `storage.createFile` in node-appwrite accepts `InputFile`.
                // We can pass the `file` directly if it behaves like a Blob/File, 
                // OR we might need to convert it. 
                // Let's try passing the file directly as the SDK supports standard File objects in newer versions.

                await storage.createFile(
                    bucketId,
                    fileId,
                    file
                );

                // 3. Construct Public URL
                // https://cloud.appwrite.io/v1/storage/buckets/[BUCKET_ID]/files/[FILE_ID]/view?project=[PROJECT_ID]
                // Or use `storage.getFileView(bucketId, fileId)` to get the URL

                // This method returns a URL string (synchronously generated based on client config)
                // Wait, `getFileView` returns a URL (string) in Client SDK. 
                // In Node SDK, it returns an ArrayBuffer (binary content).
                // WE NEED THE PUBLIC URL FOR THE FRONTEND.

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
