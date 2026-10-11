"use client";

import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase-messaging";

export async function enableNotifications(user) {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    if (!user) {
      console.log("User is not logged in.");
      return null;
    }

    if (!("Notification" in window)) {
      console.log(
        "This browser does not support notifications."
      );
      return null;
    }

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      console.log(
        "Notification permission was not granted."
      );
      return null;
    }

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      console.log(
        "Firebase Messaging is not supported."
      );
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey:
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (!token) {
      console.log("No FCM token received.");
      return null;
    }

    console.log("FCM Token:", token);

    // Firebase login token
    const idToken = await user.getIdToken();

    // Save FCM token to MongoDB
    const response = await fetch(
      "/api/notifications/token",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },

        body: JSON.stringify({
          token: token,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to save notification token."
      );
    }

    console.log(
      "Notification token saved:",
      data
    );

    return token;
  } catch (error) {
    console.error(
      "Notification setup error:",
      error
    );

    return null;
  }
}