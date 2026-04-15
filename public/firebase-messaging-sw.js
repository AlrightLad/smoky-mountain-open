/* Firebase Cloud Messaging Service Worker
   Handles background push notifications when the app is not in the foreground. */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCKM8rm2zRqYb-UPVjiyj1u-Sv9mfBJwFk",
  authDomain: "parbaughs.firebaseapp.com",
  projectId: "parbaughs",
  storageBucket: "parbaughs.firebasestorage.app",
  messagingSenderId: "104772709228",
  appId: "1:104772709228:web:c5915f88e7f6868e28e149"
});

var messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  var data = payload.notification || payload.data || {};
  var title = data.title || "The Parbaughs";
  var options = {
    body: data.body || "",
    icon: "/smoky-mountain-open/watermark.jpg",
    badge: "/smoky-mountain-open/apple-touch-icon.png",
    data: { url: data.click_action || "/smoky-mountain-open/" }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/smoky-mountain-open/";
  event.waitUntil(clients.openWindow(url));
});
