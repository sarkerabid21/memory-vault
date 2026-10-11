import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      index: true,
    },

    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    cloudinaryPublicId: {
      type: String,
      required: true,
    },

    memoryDate: {
      type: Date,
      required: true,
    },

    reminderEnabled: {
      type: Boolean,
      default: false,
    },

    reminderDate: {
      type: Date,
      default: null,
    },

    reminderMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

const Memory =
  mongoose.models.Memory ||
  mongoose.model("Memory", memorySchema);

export default Memory;