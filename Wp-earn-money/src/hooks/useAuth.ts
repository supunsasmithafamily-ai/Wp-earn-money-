'use client';

import { useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/lib/store';
import type { UserProfile } from '@/lib/firebase';

interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  coinBalance: number;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { setUser, setLoading, logout: storeLogout } = useAuthStore.getState();

  // Stable logout function that calls Firebase signOut and clears the store
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // Even if Firebase signOut fails, clear the local store
    }
    storeLogout();
  }, [storeLogout]);

  useEffect(() => {
    // Set loading true when listener first attaches
    setLoading(true);

    // Safety net: if Firebase Auth's callback never fires (e.g. a mobile
    // browser blocking IndexedDB/cookies causes persistence init to hang),
    // don't leave the user stuck on the loading screen forever.
    const timeoutId = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        console.warn('[useAuth] Firebase auth state took too long to resolve — proceeding as signed out.');
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      clearTimeout(timeoutId);
      if (firebaseUser) {
        try {
          // Fetch the user's Firestore profile
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUser({
              uid: profile.uid,
              displayName: profile.displayName,
              email: profile.email,
              photoURL: profile.photoURL,
              coinBalance: profile.coinBalance,
            });
          } else {
            // No Firestore profile exists — fall back to Firebase auth data
            setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName ?? 'User',
              email: firebaseUser.email ?? '',
              photoURL: firebaseUser.photoURL,
              coinBalance: 0,
            });
          }
        } catch {
          // Firestore read failed — still set basic auth info
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? 'User',
            email: firebaseUser.email ?? '',
            photoURL: firebaseUser.photoURL,
            coinBalance: 0,
          });
        }
      } else {
        // User is signed out
        useAuthStore.getState().logout();
      }

      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [setUser, setLoading]);

  return { user, isAuthenticated, isLoading, logout };
}
