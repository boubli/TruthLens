/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "AIzaSyAwzrOcRTSM6tP4DUYks77K5NeW1D8GXu0",
    authDomain: "nutrilens-c24a6.firebaseapp.com",
    projectId: "nutrilens-c24a6",
    storageBucket: "nutrilens-c24a6.firebasestorage.app",
    messagingSenderId: "667801974110",
    appId: "1:667801974110:web:862ea16de0280a63ab0bcf",
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png', // Use our new icon
        badge: '/icons/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
