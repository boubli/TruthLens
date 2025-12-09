# Web Push Implementation Guide

## 1. Generate VAPID Keys
To secure your push notifications, you need VAPID keys. Run this command in your terminal:

```bash
npx web-push generate-vapid-keys
```

This will output a **Public Key** and a **Private Key**.

## 2. Environment Variables
Add the following to your `.env.local` file (create it if it doesn't exist):

```properties
NEXT_PUBLIC_VAPID_PUBLIC_KEY="<your-generated-public-key>"
VAPID_PRIVATE_KEY="<your-generated-private-key>"
VAPID_SUBJECT="mailto:support@yourdomain.com"
```

## 3. Database Integration (Completed)
-   **`app/api/notifications/subscribe/route.ts`**: Handles saving subscriptions to Firestore (`users/{userId}`).
-   **`app/api/notifications/send-chat-push/route.ts`**: Handles retrieving subscriptions from Firestore.

## 4. Frontend Integration
You must add the `<PushNotificationSetup />` component to your **User Chat Page** or **Layout** so users can enable notifications.

Example (`app/chat/layout.tsx` or `app/chat/page.tsx`):
```tsx
import PushNotificationSetup from '@/components/PushNotificationSetup';
// ... inside your component
<PushNotificationSetup userId={currentUser.uid} />
```

## 4. Testing
1.  Reload your application.
2.  Click the new **"Enable Chat Notifications"** button (add `<PushNotificationSetup userId="current-user-id" />` to your chat page).
3.  Check the console for "Subscribed!"
4.  Test the push API manually (e.g., with Postman):

    **POST** `http://localhost:3000/api/notifications/send-chat-push`
    ```json
    {
      "userId": "current-user-id",
      "messageText": "Hello from the server!",
      "senderName": "Test Bot"
    }
    ```
