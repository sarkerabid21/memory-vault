import { connectDB } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/verify-token";
import Folder from "@/models/Folder";

export async function GET(request) {
  try {
    const decodedToken = await verifyToken(request);

    await connectDB();

    const folders = await Folder.find({
      firebaseUid: decodedToken.uid,
    }).sort({
      createdAt: -1,
    });

    return Response.json({
      success: true,
      folders,
    });
  } catch (error) {
    console.error("Get folders error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch folders",
      },
      { status: 401 }
    );
  }
}

export async function POST(request) {
  try {
    const decodedToken = await verifyToken(request);

    const body = await request.json();

    const name = body.name?.trim();
    const description = body.description?.trim() || "";

    if (!name) {
      return Response.json(
        {
          success: false,
          message: "Folder name is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingFolder = await Folder.findOne({
      firebaseUid: decodedToken.uid,
      name,
    });

    if (existingFolder) {
      return Response.json(
        {
          success: false,
          message: "A folder with this name already exists.",
        },
        { status: 409 }
      );
    }

    const folder = await Folder.create({
      firebaseUid: decodedToken.uid,
      name,
      description,
    });

    return Response.json({
      success: true,
      message: "Folder created successfully",
      folder,
    });
  } catch (error) {
    console.error("Create folder error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create folder",
      },
      { status: 500 }
    );
  }
}