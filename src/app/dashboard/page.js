"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  Plus,
  LogOut,
  Loader2,
  Image as ImageIcon,
  Bell,
  X,
  ChevronDown,
  Camera,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { enableNotifications } from "@/app/lib/enable-notifications";

// Carousel settings (এগুলো বদলে tweak করতে পারো)
const CARD_W = 220;
const CARD_H = 300;
const GAP = 28; // প্রতিটা card-এর মাঝের সমান ফাঁক
const STEP = CARD_W + GAP;
const SPEED = 0.6; // বাড়ালে দ্রুত চলবে
const CURVE = 39; // বাড়ালে পাশের card বেশি হেলবে

// d অনুযায়ী card-এর আকার, কোণ ও দৃশ্যমান width
function cardShape(d) {
  const a = Math.min(Math.abs(d), 1.4);
  const scale = 0.82 + a * 0.3;
  const rotate = a * CURVE;
  const visibleWidth =
    CARD_W * scale * Math.cos((rotate * Math.PI) / 180);

  return { scale, rotate, visibleWidth };
}

// মাঝখান থেকে virtual দূরত্ব u → screen-এ আসল x (মাঝখান থেকে)
function screenX(u, half) {
  const sign = u < 0 ? -1 : 1;
  const target = Math.abs(u);
  const steps = Math.max(1, Math.ceil(target / 20));
  const h = target / steps;

  let x = 0;
  for (let s = 0; s < steps; s++) {
    const mid = (s + 0.5) * h;
    const { visibleWidth } = cardShape(mid / half);
    x += ((visibleWidth + GAP) / STEP) * h;
  }

  return sign * x;
}
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [folders, setFolders] = useState([]);
  const [memories, setMemories] = useState([]);
  const [totalMemories, setTotalMemories] = useState(0);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [memoriesLoading, setMemoriesLoading] = useState(true);

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [error, setError] = useState("");

  const profileRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const pausedRef = useRef(false);

  // ছবি কম থাকলেও loop যেন ভরা থাকে, তাই list repeat করা হচ্ছে
  const repeat = Math.max(1, Math.ceil(12 / Math.max(1, memories.length)));
  const carouselItems = [];
  for (let r = 0; r < repeat; r++) {
    memories.forEach((m) => carouselItems.push(m));
  }
  const carouselTotal = carouselItems.length * STEP;

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    loadFolders();
    loadMemories();
  }, [user]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);
// Auto-moving curved carousel animation
useEffect(() => {
  if (carouselTotal === 0) return;

  let offset = 0;
  let raf;

  const tick = () => {
    const stage = stageRef.current;

    if (stage) {
      const half = stage.clientWidth / 2;

      if (!pausedRef.current) {
        offset = (offset + SPEED) % carouselTotal;
      }

      cardRefs.current.forEach((el, i) => {
        if (!el) return;

        // মাঝখান থেকে virtual দূরত্ব (-total/2 থেকে +total/2)
        let u = i * STEP - offset;
        u =
          ((((u + carouselTotal / 2) % carouselTotal) + carouselTotal) %
            carouselTotal) -
          carouselTotal / 2;

        const d = u / half;
        const shape = cardShape(d);
        const x = half + screenX(u, half);
        const rotate = -Math.sign(d) * shape.rotate;

        el.style.transform = `translateX(${x - CARD_W / 2}px) rotateY(${rotate}deg) scale(${shape.scale})`;
        el.style.zIndex = String(Math.round(10 - Math.min(Math.abs(d), 1.4) * 5));
      });
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, [carouselTotal]);
  async function loadFolders() {
    try {
      setFoldersLoading(true);
      const token = await user.getIdToken();

      const response = await fetch("/api/folders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load folders.");

      setFolders(data.folders || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load folders.");
    } finally {
      setFoldersLoading(false);
    }
  }

  async function loadMemories() {
    try {
      setMemoriesLoading(true);
      const token = await user.getIdToken();

      const response = await fetch("/api/memories?limit=12", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load recent memories.");

      const items = data.memories || [];
      setTotalMemories(data.totalCount ?? items.length);
      items.sort(
        (a, b) =>
          new Date(b.createdAt || b.memoryDate) -
          new Date(a.createdAt || a.memoryDate)
      );
      setMemories(items);
    } catch (err) {
      console.error("Recent memories:", err);
      setMemories([]);
      setError((previous) => previous || "Could not load recent memories. Check the memories API.");
    } finally {
      setMemoriesLoading(false);
    }
  }

  async function createFolder(event) {
    event.preventDefault();

    if (!folderName.trim()) {
      setError("Please enter a folder name.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      const token = await user.getIdToken();

      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: folderName.trim(),
          description: folderDescription.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create folder.");

      setFolders((previous) => [data.folder, ...previous]);
      setFolderName("");
      setFolderDescription("");
      setShowCreateFolder(false);
    } catch (err) {
      setError(err.message || "Failed to create folder.");
    } finally {
      setCreating(false);
    }
  }

  async function handleEnableNotifications() {
    if (!user) return;

    try {
      setNotificationLoading(true);
      setError("");
      const token = await enableNotifications(user);

      if (token) setNotificationEnabled(true);
      else setError("Notification permission was not granted.");
    } catch (err) {
      setError(err.message || "Failed to enable notifications.");
    } finally {
      setNotificationLoading(false);
    }
  }

  async function handleTestNotification() {
    try {
      setNotificationLoading(true);
      const token = await user.getIdToken();

      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Test notification failed.");

      alert("Test notification sent successfully!");
    } catch (err) {
      setError(err.message || "Failed to send test notification.");
    } finally {
      setNotificationLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setShowProfileMenu(false);
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Could not log out. Please try again.");
    }
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <Loader2 className="animate-spin text-gray-500" size={28} />
      </main>
    );
  }

  const firstName =
    user.displayName?.trim().split(/\s+/)[0] || "Memory Keeper";

  return (
  <main className="relative isolate min-h-screen text-gray-900">
  {/* Animated minimalist background */}
  <div className="vault-bg" aria-hidden="true">
    <span className="vault-glow vault-glow-1" />
    <span className="vault-glow vault-glow-2" />
    <span className="vault-glow vault-glow-3" />
    <span className="vault-grid" />
  </div>

  <style>{`
    .vault-bg {
      position: fixed;
      inset: 0;
      z-index: -10;
      overflow: hidden;
      background: #faf9f6;
      pointer-events: none;
    }

    .vault-glow {
      position: absolute;
      border-radius: 9999px;
      filter: blur(90px);
      opacity: 0.55;
      will-change: transform;
    }

    .vault-glow-1 {
      width: 520px;
      height: 520px;
      top: -140px;
      left: -120px;
      background: #cfe8e4; /* soft teal */
      animation: vault-drift-1 26s ease-in-out infinite alternate;
    }

    .vault-glow-2 {
      width: 460px;
      height: 460px;
      top: 18%;
      right: -140px;
      background: #d6e0f5; /* soft blue */
      animation: vault-drift-2 32s ease-in-out infinite alternate;
    }

    .vault-glow-3 {
      width: 420px;
      height: 420px;
      bottom: -160px;
      left: 32%;
      background: #f6e3d3; /* soft peach */
      animation: vault-drift-3 38s ease-in-out infinite alternate;
    }

    .vault-grid {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
        rgba(17, 24, 39, 0.09) 1px,
        transparent 1px
      );
      background-size: 28px 28px;
      -webkit-mask-image: radial-gradient(
        ellipse at 50% 0%,
        #000 20%,
        transparent 75%
      );
      mask-image: radial-gradient(ellipse at 50% 0%, #000 20%, transparent 75%);
      animation: vault-grid-move 40s linear infinite;
    }

    @keyframes vault-drift-1 {
      from { transform: translate3d(0, 0, 0) scale(1); }
      to   { transform: translate3d(180px, 120px, 0) scale(1.15); }
    }

    @keyframes vault-drift-2 {
      from { transform: translate3d(0, 0, 0) scale(1.1); }
      to   { transform: translate3d(-200px, 140px, 0) scale(0.95); }
    }

    @keyframes vault-drift-3 {
      from { transform: translate3d(0, 0, 0) scale(1); }
      to   { transform: translate3d(-160px, -120px, 0) scale(1.2); }
    }

    @keyframes vault-grid-move {
      from { background-position: 0 0; }
      to   { background-position: 28px 28px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .vault-glow,
      .vault-grid {
        animation: none;
      }
    }
  `}</style>

  {/* ...your existing header and content continue below, unchanged... */}
      {/* Top navigation — no sidebar */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-lg font-bold text-white">
              M
            </span>
            <span className="text-lg font-bold tracking-tight">Memory Vault</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleEnableNotifications}
              disabled={notificationLoading || notificationEnabled}
              title="Enable browser notifications"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {notificationLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Bell size={17} />
              )}
              <span className="hidden sm:inline">
                {notificationEnabled ? "Notifications On" : "Enable Notifications"}
              </span>
            </button>

            {notificationEnabled && (
              <button
                onClick={handleTestNotification}
                disabled={notificationLoading}
                title="Send a test notification"
                className="rounded-xl border border-gray-200 bg-white p-2.5 hover:bg-gray-50 disabled:opacity-50"
              >
                <Bell size={17} />
              </button>
            )}

            {/* Profile image opens dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu((value) => !value)}
                aria-expanded={showProfileMenu}
                aria-label="Open profile menu"
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 pr-2 hover:bg-gray-50"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
                    <UserRound size={20} />
                  </span>
                )}
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-4">
                    <p className="truncate font-semibold">
                      {user.displayName || "Memory Keeper"}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Welcome */}
        <section className="mb-8">
          <p className="text-sm font-semibold tracking-wide text-gray-500">
            Your personal memory space
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-3 max-w-2xl text-gray-500">
            Keep your precious moments safe, organized, and easy to revisit.
          </p>
        </section>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Two stat cards only */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Folders</p>
              <p className="mt-2 text-3xl font-bold">
                {foldersLoading ? "—" : folders.length}
              </p>
              <p className="mt-1 text-xs text-gray-400">Your collections</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
              <Folder size={26} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Captured Memories</p>
              <p className="mt-2 text-3xl font-bold">
                {memoriesLoading ? "—" : totalMemories}
              </p>
              <p className="mt-1 text-xs text-gray-400">Recently saved photos</p>
            </div>
            <div className="rounded-2xl bg-teal-50 p-4 text-teal-700">
              <Camera size={26} />
            </div>
          </div>
        </section>

        {/* Recent Memories — curved auto-moving carousel */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold sm:text-2xl">Recent Memories</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your latest moments, from every folder.
            </p>
          </div>

          {memoriesLoading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-200 bg-white">
              <Loader2 className="animate-spin text-gray-400" size={26} />
            </div>
          ) : memories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <ImageIcon className="mx-auto text-gray-400" size={34} />
              <h3 className="mt-4 font-semibold">No memories yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Add a photo to any folder and it will appear here.
              </p>
            </div>
          ) : (
            <div
              ref={stageRef}
              onMouseEnter={() => (pausedRef.current = true)}
              onMouseLeave={() => (pausedRef.current = false)}
              className="relative overflow-hidden"
              style={{ height: CARD_H + 80, perspective: "1100px" }}
            >
              {carouselItems.map((memory, i) => (
                <div
                  key={`${memory._id}-${i}`}
                  ref={(el) => (cardRefs.current[i] = el)}
                  onClick={() => router.push(`/dashboard/memories/${memory._id}`)}
                  className="absolute left-0 cursor-pointer overflow-hidden rounded-3xl bg-gray-200 shadow-lg"
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    top: "50%",
                    marginTop: -CARD_H / 2,
                    willChange: "transform",
                  }}
                >
                  <img
                    src={memory.imageUrl}
                    alt={memory.title || "Memory"}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="truncate text-sm font-semibold text-white">
                      {memory.title || "Untitled memory"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Folders */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">My Folders</h2>
              <p className="mt-1 text-sm text-gray-500">
                Organize your memories your way.
              </p>
            </div>

            <button
              onClick={() => {
                setError("");
                setShowCreateFolder(true);
              }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create Folder</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>

          {foldersLoading ? (
            <div className="flex justify-center rounded-2xl border bg-white py-16">
              <Loader2 className="animate-spin text-gray-400" size={25} />
            </div>
          ) : folders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center">
              <Folder className="mx-auto text-gray-400" size={34} />
              <h3 className="mt-4 font-semibold">No folders yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create your first folder to start saving memories.
              </p>
              <button
                onClick={() => setShowCreateFolder(true)}
                className="mt-5 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
              >
                <Plus className="mr-2 inline" size={17} />
                Create your first folder
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <button
                  key={folder._id}
                  onClick={() => router.push(`/dashboard/folders/${folder._id}`)}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <span className="rounded-xl bg-gray-100 p-3">
                      <Folder size={24} />
                    </span>
                    <span className="text-sm text-gray-400 group-hover:text-gray-900">
                      Open →
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold">{folder.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {folder.description || "No description"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create folder modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Create Folder</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Give your memory collection a name.
                </p>
              </div>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createFolder} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Folder Name</label>
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. University Memories"
                  maxLength={100}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  placeholder="What's this folder about?"
                  rows={3}
                  maxLength={300}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="flex-1 rounded-xl border border-gray-300 py-3 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}