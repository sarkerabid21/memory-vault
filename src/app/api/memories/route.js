import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/verify-token";

import Folder from "@/models/Folder";
import Memory from "@/models/Memory";
import cloudinary from "@/app/lib/cloudinary";

export async function POST(request) {
  try {
    console.log("=================================");
    console.log("POST /api/memories CALLED");
    console.log("=================================");

    const decodedToken = await verifyToken(request);

    const formData = await request.formData();

    const folderId = formData.get("folderId");
    const title = formData.get("title")?.trim();
    const description =
      formData.get("description")?.trim() || "";

    const memoryDate =
      formData.get("memoryDate");

    const reminderEnabled =
      formData.get("reminderEnabled") === "true";

    const reminderDate =
      formData.get("reminderDate") || null;

    const reminderMessage =
      formData.get("reminderMessage")?.trim() || "";

    const files =
      formData.getAll("files");

    console.log("Folder ID:", folderId);
    console.log("Title:", title);
    console.log("Memory Date:", memoryDate);
    console.log("Files:", files.length);

    // -----------------------------
    // Validation
    // -----------------------------

    if (!folderId) {
      return Response.json(
        {
          success: false,
          message: "Folder is required.",
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        folderId
      )
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid folder ID.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return Response.json(
        {
          success: false,
          message:
            "Memory title is required.",
        },
        { status: 400 }
      );
    }

    if (!memoryDate) {
      return Response.json(
        {
          success: false,
          message:
            "Memory date is required.",
        },
        { status: 400 }
      );
    }

    if (!files.length) {
      return Response.json(
        {
          success: false,
          message:
            "At least one image is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // MongoDB
    // -----------------------------

    await connectDB();

    console.log("MongoDB connected");

    // Make sure folder belongs to user

    const folder =
      await Folder.findOne({
        _id: folderId,
        firebaseUid:
          decodedToken.uid,
      });

    if (!folder) {
      return Response.json(
        {
          success: false,
          message:
            "Folder not found.",
        },
        { status: 404 }
      );
    }

    console.log(
      "Folder verified:",
      folder.name
    );

    // -----------------------------
    // Upload images
    // -----------------------------

    const memories = [];

    for (const file of files) {
      if (
        !file ||
        typeof file.arrayBuffer !==
          "function"
      ) {
        continue;
      }

      if (
        !file.type.startsWith("image/")
      ) {
        continue;
      }

      console.log(
        "Uploading:",
        file.name
      );

      const bytes =
        await file.arrayBuffer();

      const buffer =
        Buffer.from(bytes);

      const uploadResult =
        await new Promise(
          (resolve, reject) => {
            const uploadStream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    `memory-vault/${decodedToken.uid}/${folderId}`,
                  resource_type:
                    "image",
                },
                (
                  error,
                  result
                ) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );

            uploadStream.end(
              buffer
            );
          }
        );

      console.log(
        "Cloudinary uploaded:",
        uploadResult.secure_url
      );

      // -----------------------------
      // Save Memory
      // -----------------------------

      const memory =
        await Memory.create({
          firebaseUid:
            decodedToken.uid,

          folderId,

          title,

          description,

          imageUrl:
            uploadResult.secure_url,

          cloudinaryPublicId:
            uploadResult.public_id,

          memoryDate:
            new Date(memoryDate),

          reminderEnabled,

          reminderDate:
            reminderEnabled &&
            reminderDate
              ? new Date(
                  reminderDate
                )
              : null,

          reminderMessage:
            reminderEnabled
              ? reminderMessage
              : "",
        });

      memories.push(memory);

      console.log(
        "Memory saved:",
        memory._id
      );
    }

    if (!memories.length) {
      return Response.json(
        {
          success: false,
          message:
            "No valid images were uploaded.",
        },
        { status: 400 }
      );
    }

    console.log(
      "Memory creation successful"
    );

    return Response.json({
      success: true,
      message: `${memories.length} memory image(s) created successfully.`,
      memories,
    });
  } catch (error) {
    console.error(
      "CREATE MEMORY ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to create memory.",
      },
      { status: 500 }
    );
  }
}


export async function GET(request) {
  try {
    // Verify logged-in user
    const decodedToken = await verifyToken(request);

    // Connect to MongoDB
    await connectDB();

    // Read optional limit from URL
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit")) || 12;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    // Get only this user's memories from every folder
    const memories = await Memory.find({
      firebaseUid: decodedToken.uid,
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    // Count all memories belonging to this user
    const totalCount = await Memory.countDocuments({
      firebaseUid: decodedToken.uid,
    });

    return Response.json({
      success: true,
      memories,
      totalCount,
    });
  } catch (error) {
    console.error("GET MEMORIES ERROR:", error);

    return Response.json(
      {
        success: false,
        message: error?.message || "Failed to load memories.",
      },
      { status: 500 }
    );
  }
}
