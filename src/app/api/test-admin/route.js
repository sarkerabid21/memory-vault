import { adminAuth } from "@/app/lib/firebase-admin";

export async function GET() {
  try {
    const result = await adminAuth.listUsers(1);

    return Response.json({
      success: true,
      message: "Firebase Admin connected successfully!",
      usersChecked: result.users.length,
    });
  } catch (error) {
    console.error("Firebase Admin error:", error);

    return Response.json(
      {
        success: false,
        message: "Firebase Admin connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}