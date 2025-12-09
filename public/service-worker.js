self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192x192.png', // Replace with your app icon path
            badge: '/badge-72x72.png', // Replace with your app badge path
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
                url: data.url || '/', // Dynamic URL from payload
            },
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    } else {
        console.log('Push event but no data');
    }
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.');
    event.notification.close();

    // Open the URL triggering the notification
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
