"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type AuthContextType = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextType | null>(null);

/** Set or clear the __firebase_auth cookie so proxy.ts can guard routes server-side */
function syncAuthCookie(user: User | null) {
  if (user) {
    // Get a fresh ID token and store it as a cookie (1 hour, same as token TTL)
    user.getIdToken().then((token) => {
      document.cookie = `__firebase_auth=${token}; path=/; max-age=3600; SameSite=Strict`;
    });
  } else {
    // Clear the cookie on logout
    document.cookie = "__firebase_auth=; path=/; max-age=0; SameSite=Strict";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authValue = useAuth();

  // Keep the cookie in sync with Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      syncAuthCookie(user);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
