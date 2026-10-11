"use client";

import { useState } from "react";

export default function TestUploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setResult(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl border p-8 shadow-sm">

        <h1 className="text-2xl font-bold">
          Cloudinary Test Upload
        </h1>

        <p className="mt-2 text-gray-500">
          Select an image to test Cloudinary.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-6 w-full"
        />

        {file && (
          <p className="mt-3 text-sm text-gray-600">
            Selected: {file.name}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 border border-red-200 p-4 text-red-600">
            {error}
          </div>
        )}

        {result?.success && (
          <div className="mt-5">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-700">
              Image uploaded successfully! ✅
            </div>

            <img
              src={result.image.url}
              alt="Uploaded memory"
              className="mt-5 w-full rounded-xl"
            />

            <p className="mt-3 break-all text-xs text-gray-500">
              {result.image.url}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}