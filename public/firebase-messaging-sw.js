importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyC-D94T4fYS-zDHmSUEeQ3Ln7MYr0ErdKU",
  authDomain: "memory-vault-abbae.firebaseapp.com",
  projectId: "memory-vault-abbae",
  storageBucket: "memory-vault-abbae.firebasestorage.app",
  messagingSenderId: "974814078626",
  appId: "1:974814078626:web:c9dd1d0351d6e893dfd9fb",
});

// #   apiKey: "AIzaSyC-D94T4fYS-zDHmSUEeQ3Ln7MYr0ErdKU",
// #   authDomain: "memory-vault-abbae.firebaseapp.com",
// #   projectId: "memory-vault-abbae",
// #   storageBucket: "memory-vault-abbae.firebasestorage.app",
// #   messagingSenderId: "974814078626",
// #   appId: "1:974814078626:web:c9dd1d0351d6e893dfd9fb",
// #   measurementId: "G-KT70P921RY"
// # pass mongodb 8njzef8JhxVDdORW username:abidsarker213_db_user


const messaging =
  firebase.messaging();

messaging.onBackgroundMessage(
  function (payload) {
    console.log(
      "[firebase-messaging-sw.js] Background message:",
      payload
    );

    const notificationTitle =
      payload.notification?.title ||
      "Memory Vault";

    const notificationOptions = {
      body:
        payload.notification?.body ||
        "You have a memory to remember today ❤️",

      icon: "/icon-192.png",

      data: payload.data || {},
    };

    self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  }
);