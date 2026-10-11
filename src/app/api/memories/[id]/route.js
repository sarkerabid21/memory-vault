import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/verify-token";

import Memory from "@/models/Memory";
import cloudinary from "@/app/lib/cloudinary";


// ========================================
// GET SINGLE MEMORY
// ========================================

export async function GET(request, { params }) {
  try {
    const decodedToken = await verifyToken(request);

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: "Invalid memory ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const memory = await Memory.findOne({
      _id: id,
      firebaseUid: decodedToken.uid,
    });

    if (!memory) {
      return Response.json(
        {
          success: false,
          message: "Memory not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      memory,
    });
  } catch (error) {
    console.error(
      "Get memory error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to load memory.",
      },
      { status: 500 }
    );
  }
}


// ========================================
// DELETE MEMORY
// ========================================

export async function DELETE(
  request,
  { params }
) {
  try {
    const decodedToken =
      await verifyToken(request);

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Invalid memory ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Only the owner can delete it
    const memory =
      await Memory.findOne({
        _id: id,
        firebaseUid:
          decodedToken.uid,
      });

    if (!memory) {
      return Response.json(
        {
          success: false,
          message:
            "Memory not found.",
        },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary
    if (memory.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(
          memory.cloudinaryPublicId,
          {
            resource_type: "image",
          }
        );

        console.log(
          "Cloudinary image deleted:",
          memory.cloudinaryPublicId
        );
      } catch (cloudinaryError) {
        console.error(
          "Cloudinary delete error:",
          cloudinaryError
        );
      }
    }

    // Delete from MongoDB
    await Memory.deleteOne({
      _id: id,
      firebaseUid:
        decodedToken.uid,
    });

    return Response.json({
      success: true,
      message:
        "Memory deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete memory error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to delete memory.",
      },
      { status: 500 }
    );
  }
}


// ========================================
// UPDATE MEMORY
// ========================================

export async function PATCH(
  request,
  { params }
) {
  try {
    const decodedToken =
      await verifyToken(request);

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Invalid memory ID.",
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const {
      title,
      description,
      memoryDate,
      reminderEnabled,
      reminderDate,
      reminderMessage,
    } = body;

    await connectDB();

    const memory =
      await Memory.findOne({
        _id: id,
        firebaseUid:
          decodedToken.uid,
      });

    if (!memory) {
      return Response.json(
        {
          success: false,
          message:
            "Memory not found.",
        },
        { status: 404 }
      );
    }

    if (title !== undefined) {
      memory.title =
        title.trim();
    }

    if (
      description !== undefined
    ) {
      memory.description =
        description.trim();
    }

    if (memoryDate !== undefined) {
      memory.memoryDate =
        new Date(memoryDate);
    }

    if (
      reminderEnabled !== undefined
    ) {
      memory.reminderEnabled =
        reminderEnabled;
    }

    if (
      reminderDate !== undefined
    ) {
      memory.reminderDate =
        reminderDate
          ? new Date(reminderDate)
          : null;
    }

    if (
      reminderMessage !== undefined
    ) {
      memory.reminderMessage =
        reminderMessage.trim();
    }

    await memory.save();

    return Response.json({
      success: true,
      message:
        "Memory updated successfully.",
      memory,
    });
  } catch (error) {
    console.error(
      "Update memory error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update memory.",
      },
      { status: 500 }
    );
  }
}