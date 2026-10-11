import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/verify-token";

import Folder from "@/models/Folder";
import Memory from "@/models/Memory";

export async function GET(request, { params }) {
  try {
    const decodedToken = await verifyToken(request);

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: "Invalid folder ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const folder = await Folder.findOne({
      _id: id,
      firebaseUid: decodedToken.uid,
    });

    if (!folder) {
      return Response.json(
        {
          success: false,
          message: "Folder not found",
        },
        { status: 404 }
      );
    }

    const memories = await Memory.find({
      folderId: id,
      firebaseUid: decodedToken.uid,
    }).sort({
      memoryDate: -1,
    });

    return Response.json({
      success: true,
      folder,
      memories,
    });
  } catch (error) {
    console.error("Folder details error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to load folder",
      },
      { status: 500 }
    );
  }
}