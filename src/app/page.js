"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading Memory Vault...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900">
          Memory Vault
        </h1>

        <p className="mt-4 text-gray-600">
          Save your memories. Keep them forever.
        </p>

        {user ? (
          <>
            <p className="mt-6 text-gray-700">
              Welcome, {user.displayName || user.email}!
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            <p className="text-gray-600">
              Login to access your saved memories.
            </p>

            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg border border-blue-600 px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
            >
              Create an Account
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}