"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Download,
  Edit3,
  Trash2,
  Loader2,
  CalendarDays,
  Bell,
  X,
  Save,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function MemoryDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const { user, loading } = useAuth();

  const [memory, setMemory] =
    useState(null);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showEdit, setShowEdit] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [title, setTitle] =
    useState("");

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


  // ========================================
  // Authentication
  // ========================================

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [
    user,
    loading,
    router,
  ]);


  // ========================================
  // Load memory
  // ========================================

  useEffect(() => {
    if (user && id) {
      loadMemory();
    }
  }, [user, id]);


  const loadMemory = async () => {
    try {
      setPageLoading(true);
      setError("");

      const token =
        await user.getIdToken();

      const response =
        await fetch(
          `/api/memories/${id}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load memory."
        );
      }

      setMemory(data.memory);

      prepareEditForm(
        data.memory
      );

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Failed to load memory."
      );
    } finally {
      setPageLoading(false);
    }
  };


  // ========================================
  // Prepare edit form
  // ========================================

  const prepareEditForm = (
    memoryData
  ) => {
    setTitle(
      memoryData.title || ""
    );

    setDescription(
      memoryData.description ||
        ""
    );

    setMemoryDate(
      memoryData.memoryDate
        ? new Date(
            memoryData.memoryDate
          )
            .toISOString()
            .split("T")[0]
        : ""
    );

    setReminderEnabled(
      memoryData.reminderEnabled ||
        false
    );

    setReminderDate(
      memoryData.reminderDate
        ? new Date(
            memoryData.reminderDate
          )
            .toISOString()
            .split("T")[0]
        : ""
    );

    setReminderMessage(
      memoryData.reminderMessage ||
        ""
    );
  };


  // ========================================
  // Download
  // ========================================

  const handleDownload = async () => {
    try {
      const response =
        await fetch(
          memory.imageUrl
        );

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        `${memory.title || "memory"}.jpg`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );

    } catch (error) {
      console.error(
        "Download error:",
        error
      );

      window.open(
        memory.imageUrl,
        "_blank"
      );
    }
  };


  // ========================================
  // Update
  // ========================================

  const handleUpdate =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");

        const token =
          await user.getIdToken();

        const response =
          await fetch(
            `/api/memories/${id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                title,
                description,
                memoryDate,
                reminderEnabled,
                reminderDate:
                  reminderEnabled
                    ? reminderDate
                    : null,
                reminderMessage:
                  reminderEnabled
                    ? reminderMessage
                    : "",
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update memory."
          );
        }

        setMemory(
          data.memory
        );

        setShowEdit(false);

      } catch (error) {
        console.error(error);

        setError(
          error.message ||
            "Failed to update memory."
        );
      } finally {
        setSaving(false);
      }
    };


  // ========================================
  // Delete
  // ========================================

  const handleDelete =
    async () => {

      const confirmed =
        window.confirm(
          "Are you sure you want to permanently delete this memory?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeleting(true);
        setError("");

        const token =
          await user.getIdToken();

        const response =
          await fetch(
            `/api/memories/${id}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to delete memory."
          );
        }

        router.back();

      } catch (error) {
        console.error(error);

        setError(
          error.message ||
            "Failed to delete memory."
        );

        setDeleting(false);
      }
    };


  // ========================================
  // Loading
  // ========================================

  if (
    loading ||
    pageLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2
          size={30}
          className="animate-spin"
        />
      </main>
    );
  }


  if (!user) {
    return null;
  }


  if (!memory) {
    return (
      <main className="flex min-h-screen items-center justify-center">

        <div className="text-center">

          <h1 className="text-xl font-bold">
            Memory not found
          </h1>

          <p className="mt-2 text-gray-500">
            {error}
          </p>

          <button
            onClick={() =>
              router.back()
            }
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go Back
          </button>

        </div>

      </main>
    );
  }


  // ========================================
  // Main UI
  // ========================================

  return (
    <main className="min-h-screen bg-gray-950">

      {/* Top bar */}

      <header className="border-b border-white/10 bg-gray-950">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <button
            onClick={() =>
              router.back()
            }
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            <ArrowLeft
              size={18}
            />

            Back
          </button>

          <div className="flex items-center gap-2">

            <button
              onClick={
                handleDownload
              }
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              <Download
                size={17}
              />

              Download
            </button>

            <button
              onClick={() =>
                setShowEdit(true)
              }
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              <Edit3
                size={17}
              />

              Edit
            </button>

            <button
              onClick={
                handleDelete
              }
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Trash2
                  size={17}
                />
              )}

              Delete
            </button>

          </div>

        </div>

      </header>


      {/* Content */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">

          {/* Image */}

          <div className="flex min-h-[500px] items-center justify-center overflow-hidden rounded-2xl bg-black">

            <img
              src={memory.imageUrl}
              alt={memory.title}
              className="max-h-[75vh] max-w-full object-contain"
            />

          </div>


          {/* Information */}

          <div className="rounded-2xl bg-white p-6">

            <h1 className="text-3xl font-bold text-gray-900">
              {memory.title}
            </h1>


            {/* Date */}

            <div className="mt-5 flex items-center gap-3 text-gray-600">

              <CalendarDays
                size={19}
              />

              <span>
                {new Date(
                  memory.memoryDate
                ).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </span>

            </div>


            {/* Description */}

            {memory.description && (
              <div className="mt-8">

                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                  About this memory
                </h2>

                <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
                  {
                    memory.description
                  }
                </p>

              </div>
            )}


            {/* Reminder */}

            {memory.reminderEnabled && (
              <div className="mt-8 rounded-xl bg-gray-50 p-4">

                <div className="flex items-center gap-2 font-semibold">

                  <Bell
                    size={18}
                  />

                  Yearly Reminder

                </div>

                {memory.reminderDate && (
                  <p className="mt-2 text-sm text-gray-600">
                    Every{" "}
                    {new Date(
                      memory.reminderDate
                    ).toLocaleDateString(
                      undefined,
                      {
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                )}

                {memory.reminderMessage && (
                  <p className="mt-3 text-sm italic text-gray-700">
                    "{memory.reminderMessage}"
                  </p>
                )}

              </div>
            )}

          </div>

        </div>

      </section>


      {/* ================================= */}
      {/* EDIT MODAL */}
      {/* ================================= */}

      {showEdit && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">

          <div className="flex min-h-full items-center justify-center">

            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold">
                    Edit Memory
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Update your memory details.
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowEdit(false)
                  }
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X
                    size={20}
                  />
                </button>

              </div>


              <form
                onSubmit={
                  handleUpdate
                }
                className="space-y-5 p-6"
              >

                {/* Title */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Title
                  </label>

                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                  />

                </div>


                {/* Description */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Description
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
                    rows={4}
                    className="w-full resize-none rounded-lg border px-4 py-3 outline-none focus:border-black"
                  />

                </div>


                {/* Date */}

                <div>

                  <label className="mb-2 block text-sm font-semibold">
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
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                  />

                </div>


                {/* Reminder */}

                <div className="rounded-xl bg-gray-50 p-4">

                  <label className="flex items-center gap-3">

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
                    />

                    <span className="font-semibold">
                      Enable yearly reminder
                    </span>

                  </label>


                  {reminderEnabled && (

                    <div className="mt-4 space-y-4">

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
                        className="w-full rounded-lg border px-4 py-3"
                      />

                      <textarea
                        value={
                          reminderMessage
                        }
                        onChange={(e) =>
                          setReminderMessage(
                            e.target.value
                          )
                        }
                        placeholder="Reminder message..."
                        rows={3}
                        className="w-full resize-none rounded-lg border px-4 py-3"
                      />

                    </div>

                  )}

                </div>


                {/* Buttons */}

                <div className="flex gap-3 border-t pt-5">

                  <button
                    type="button"
                    onClick={() =>
                      setShowEdit(false)
                    }
                    className="flex-1 rounded-lg border px-4 py-3 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
                  >

                    {saving ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />

                        Saving...
                      </>
                    ) : (
                      <>
                        <Save
                          size={18}
                        />

                        Save Changes
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