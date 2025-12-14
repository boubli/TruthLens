import { Client, Storage } from 'node-appwrite';

// Server-Side Initialization using Admin Key
const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
    console.error("Appwrite Configuration Missing: Project ID or API Key not found.");
} else {
    client
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
}

const storage = new Storage(client);

export { storage, client };
