"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Folder,
  X,
  Upload,
  CalendarDays,
  Bell,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function FolderPage() {
  const { id } = useParams();
  const router = useRouter();

  const { user, loading } = useAuth();

  const [folder, setFolder] = useState(null);
  const [memories, setMemories] = useState([]);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [showAddMemory, setShowAddMemory] =
    useState(false);

  const [files, setFiles] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [memoryDate, setMemoryDate] =
    useState("");

  const [reminderEnabled, setReminderEnabled] =
    useState(false);

  const [reminderDate, setReminderDate] =
    useState("");

  const [reminderMessage, setReminderMessage] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] = useState("");

  // --------------------------------
  // Authentication
  // --------------------------------

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // --------------------------------
  // Load folder
  // --------------------------------

  useEffect(() => {
    if (user && id) {
      loadFolder();
    }
  }, [user, id]);

  const loadFolder = async () => {
    try {
      setPageLoading(true);

      const token = await user.getIdToken();

      const response = await fetch(
        `/api/folders/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setFolder(data.folder);
      setMemories(data.memories || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load folder.");
    } finally {
      setPageLoading(false);
    }
  };

  // --------------------------------
  // Select images
  // --------------------------------

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    setFiles(selectedFiles);
    setError("");
  };

  // --------------------------------
  // Add Memory
  // --------------------------------

  const handleAddMemory = async (event) => {
    event.preventDefault();

    if (!files.length) {
      setError("Please select at least one image.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a memory title.");
      return;
    }

    if (!memoryDate) {
      setError("Please select the memory date.");
      return;
    }

    if (
      reminderEnabled &&
      !reminderDate
    ) {
      setError(
        "Please select the reminder date."
      );
      return;
    }

    try {
      setUploading(true);
      setError("");

      const token =
        await user.getIdToken();

      const formData =
        new FormData();

      formData.append(
        "folderId",
        id
      );

      formData.append(
        "title",
        title
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "memoryDate",
        memoryDate
      );

      formData.append(
        "reminderEnabled",
        String(reminderEnabled)
      );

      if (reminderEnabled) {
        formData.append(
          "reminderDate",
          reminderDate
        );

        formData.append(
          "reminderMessage",
          reminderMessage
        );
      }

      files.forEach((file) => {
        formData.append(
          "files",
          file
        );
      });

      const response = await fetch("/api/memories", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const responseText = await response.text();

console.log("MEMORY API STATUS:", response.status);
console.log("MEMORY API RESPONSE:", responseText);

let data = {};

try {
  data = responseText
    ? JSON.parse(responseText)
    : {};
} catch (error) {
  console.error(
    "API returned non-JSON response:",
    responseText
  );
}

if (!response.ok) {
  throw new Error(
    data.message ||
      `Server error (${response.status})`
  );
}

      // Reload memories
      await loadFolder();

      // Reset form
      setFiles([]);
      setTitle("");
      setDescription("");
      setMemoryDate("");
      setReminderEnabled(false);
      setReminderDate("");
      setReminderMessage("");

      setShowAddMemory(false);

    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-gray-400"
        />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // --------------------------------
  // Folder not found
  // --------------------------------

  if (!folder) {
    return (
      <main className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <Folder
            size={40}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-4 text-xl font-bold">
            Folder not found
          </h1>

          <button
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </button>

        </div>

      </main>
    );
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <button
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            <ArrowLeft size={18} />

            Back to folders
          </button>

          <div className="text-sm text-gray-500">
            {user.email}
          </div>

        </div>

      </header>

      {/* Content */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Folder heading */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-white">

                <Folder size={24} />

              </div>

              <div>

                <h1 className="text-3xl font-bold text-gray-900">
                  {folder.name}
                </h1>

                {folder.description && (
                  <p className="mt-1 text-gray-500">
                    {folder.description}
                  </p>
                )}

              </div>

            </div>

          </div>

          <button
            onClick={() => {
              setError("");
              setShowAddMemory(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <ImagePlus size={18} />

            Add Memory
          </button>

        </div>

        {/* Error */}

        {error && !showAddMemory && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Memories */}

        <div className="mt-10">

          <div className="mb-5">

            <h2 className="text-xl font-bold">
              Memories
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your precious moments inside this folder.
            </p>

          </div>

          {memories.length === 0 ? (

            <div className="rounded-2xl border border-dashed bg-white py-20 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">

                <ImagePlus size={28} />

              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No memories yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Start adding photos and turn this folder into your personal memory collection.
              </p>

              <button
                onClick={() =>
                  setShowAddMemory(true)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white"
              >
                <ImagePlus size={18} />

                Add your first memory
              </button>

            </div>

          ) : (

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

              {memories.map(
                (memory) => (

                  <div
                    key={memory._id}
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >

                    <button
  onClick={() =>
    router.push(
      `/dashboard/memories/${memory._id}`
    )
  }
  className="block w-full overflow-hidden"
>
  <img
    src={memory.imageUrl}
    alt={memory.title}
    className="aspect-square w-full object-cover transition duration-300 hover:scale-105"
  />
</button>

                    <div className="p-4">

                      <h3 className="font-semibold">
                        {memory.title}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">

                        {new Date(
                          memory.memoryDate
                        ).toLocaleDateString()}

                      </p>

                      {memory.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                          {
                            memory.description
                          }
                        </p>
                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </section>

      {/* ============================= */}
      {/* ADD MEMORY MODAL */}
      {/* ============================= */}

      {showAddMemory && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">

          <div className="flex min-h-full items-center justify-center">

            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

              {/* Modal Header */}

              <div className="flex items-center justify-between border-b px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold">
                    Add New Memory
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Save a moment you'll want to remember.
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowAddMemory(false)
                  }
                  disabled={uploading}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>

              </div>

              {/* Form */}

              <form
                onSubmit={
                  handleAddMemory
                }
                className="space-y-6 p-6"
              >

                {/* Images */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Photos
                  </label>

                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-black">

                    <Upload
                      size={28}
                      className="text-gray-400"
                    />

                    <span className="mt-3 text-sm font-semibold">
                      Choose photos
                    </span>

                    <span className="mt-1 text-xs text-gray-500">
                      You can select multiple images
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={
                        handleFileChange
                      }
                      className="hidden"
                    />

                  </label>

                  {files.length > 0 && (

                    <div className="mt-3 rounded-lg bg-gray-50 p-3">

                      <p className="text-sm font-medium">
                        {files.length} image
                        {files.length > 1
                          ? "s"
                          : ""}{" "}
                        selected
                      </p>

                      <div className="mt-2 space-y-1">

                        {files.map(
                          (file, index) => (
                            <p
                              key={
                                `${file.name}-${index}`
                              }
                              className="truncate text-xs text-gray-500"
                            >
                              {file.name}
                            </p>
                          )
                        )}

                      </div>

                    </div>

                  )}

                </div>

                {/* Title */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Memory Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Our Last University Day"
                    maxLength={150}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />

                </div>

                {/* Description */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Description
                    <span className="ml-1 font-normal text-gray-400">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    value={
                      description
                    }
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    placeholder="Write something about this memory..."
                    rows={4}
                    maxLength={2000}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />

                </div>

                {/* Memory Date */}

                <div>

                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

                    <CalendarDays
                      size={17}
                    />

                    Memory Date

                  </label>

                  <input
                    type="date"
                    value={
                      memoryDate
                    }
                    onChange={(e) =>
                      setMemoryDate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />

                </div>

                {/* Reminder */}

                <div className="rounded-xl border bg-gray-50 p-5">

                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        reminderEnabled
                      }
                      onChange={(e) =>
                        setReminderEnabled(
                          e.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <div>

                      <div className="flex items-center gap-2 font-semibold">

                        <Bell
                          size={17}
                        />

                        Remind me about this memory

                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        We'll use this date for your yearly memory reminder.
                      </p>

                    </div>

                  </label>

                  {reminderEnabled && (

                    <div className="mt-5 space-y-4">

                      <div>

                        <label className="mb-2 block text-sm font-medium">
                          Reminder Date
                        </label>

                        <input
                          type="date"
                          value={
                            reminderDate
                          }
                          onChange={(e) =>
                            setReminderDate(
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />

                      </div>

                      <div>

                        <label className="mb-2 block text-sm font-medium">
                          Reminder Message
                        </label>

                        <textarea
                          value={
                            reminderMessage
                          }
                          onChange={(e) =>
                            setReminderMessage(
                              e.target.value
                            )
                          }
                          placeholder="e.g. Remember this beautiful day ❤️"
                          rows={3}
                          maxLength={500}
                          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />

                      </div>

                    </div>

                  )}

                </div>

                {/* Error */}

                {error && (

                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>

                )}

                {/* Buttons */}

                <div className="flex gap-3 border-t pt-5">

                  <button
                    type="button"
                    disabled={
                      uploading
                    }
                    onClick={() =>
                      setShowAddMemory(
                        false
                      )
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      uploading
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  >

                    {uploading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />

                        Saving...
                      </>
                    ) : (
                      <>
                        <ImagePlus
                          size={18}
                        />

                        Save Memory
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}