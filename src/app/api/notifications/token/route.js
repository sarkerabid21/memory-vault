import { connectDB } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/verify-token";
import User from "@/models/User";

import {
  getMessaging,
} from "firebase-admin/messaging";

import "@/app/lib/firebase-admin";

export async function POST(request) {
  try {
    const decodedToken =
      await verifyToken(request);

    await connectDB();

    const user = await User.findOne({
      firebaseUid: decodedToken.uid,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    const tokens =
      user.notificationTokens || [];

    if (tokens.length === 0) {
      return Response.json(
        {
          success: false,
          message:
            "No notification device found. Please enable notifications first.",
        },
        {
          status: 400,
        }
      );
    }

    const messaging =
      getMessaging();

    const results = [];

    for (const device of tokens) {
      try {
        const response =
          await messaging.send({
            token: device.token,

            notification: {
              title:
                "Memory Vault 🔔",

              body:
                "Your test notification is working successfully!",
            },

            webpush: {
              notification: {
                title:
                  "Memory Vault 🔔",

                body:
                  "Your test notification is working successfully!",

                icon: "/icon-192.png",
              },
            },
          });

        results.push({
          success: true,
          token: device.token,
          messageId: response,
        });

      } catch (error) {
        console.error(
          "FCM send error:",
          error
        );

        results.push({
          success: false,
          token: device.token,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      message:
        "Test notification sent.",
      results,
    });

  } catch (error) {
    console.error(
      "Test notification error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to send test notification.",
      },
      {
        status: 500,
      }
    );
  }
}