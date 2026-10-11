import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";

import { getMessaging } from "firebase-admin/messaging";

const adminApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId:
            process.env.FIREBASE_ADMIN_PROJECT_ID,

          clientEmail:
            process.env.FIREBASE_ADMIN_CLIENT_EMAIL,

          privateKey:
            process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
              /\\n/g,
              "\n"
            ),
        }),
      })
    : getApps()[0];

export const adminAuth =
  getAuth(adminApp);

export const adminMessaging =
  getMessaging(adminApp);

export default adminApp;