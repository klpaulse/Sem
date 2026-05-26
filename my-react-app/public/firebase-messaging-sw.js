// Firebase Messaging Service Worker
// VIKTIG: Fyll inn Firebase-konfig her (kopier fra src/config/Firebase.jsx)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD0nz-dh0Gogtlb4rkTxAEiGnpzV7tyg1s",
  authDomain: "fotball-lag-4326f.firebaseapp.com",
  projectId: "fotball-lag-4326f",
  storageBucket: "fotball-lag-4326f.firebasestorage.app",
  messagingSenderId: "850881569053",
  appId: "1:850881569053:web:65f6d6bfb377ebefbd81f4",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title || "Breddefotball Live", {
    body: payload.notification?.body || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: payload.data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
