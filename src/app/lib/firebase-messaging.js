import {
  getMessaging,
  isSupported,
} from "firebase/messaging";

import app from "./firebase";

export async function getFirebaseMessaging() {
  const supported = await isSupported();

  if (!supported) {
    return null;
  }

  return getMessaging(app);
}