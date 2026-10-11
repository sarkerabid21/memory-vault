import { adminAuth } from "@/app/lib/firebase-admin";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    const decodedToken = await adminAuth.verifyIdToken(token);

    await connectDB();

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";
    const name = decodedToken.name || "Memory Vault User";
    const photoURL = decodedToken.picture || "";

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = await User.create({
        firebaseUid,
        name,
        email,
        photoURL,
      });
    }

    return Response.json({
      success: true,
      message: "User saved successfully",
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("User API error:", error);

    return Response.json(
      {
        success: false,
        message: error.message || "Failed to save user",
      },
      { status: 500 }
    );
  }
}