"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/app/lib/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

const register = async (name, email, password) => {
  const result = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await updateProfile(result.user, {
    displayName: name,
  });

  const token = await result.user.getIdToken();

  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  // First read the response as text
  const responseText = await response.text();

  console.log("API status:", response.status);
  console.log("API response:", responseText);

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server returned an invalid response. Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Failed to save user");
  }

  return result.user;
};

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return result.user;
  };

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);

    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    register,
    login,
    googleLogin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}