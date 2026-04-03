"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      setError(msg);
      throw e;
    }
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Login failed";
        setError(msg);
        throw e;
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      try {
        setError(null);
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Sign-up failed";
        setError(msg);
        throw e;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Logout failed";
      setError(msg);
      throw e;
    }
  }, []);

  return {
    user,
    loading,
    error,
    clearError,
    signInWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    logout,
  };
}
