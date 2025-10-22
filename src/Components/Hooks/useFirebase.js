// src/hooks/useFirebase.js
// React hook for Firebase Auth (Google sign-in, sign-out, auth state, ID token helper)

import { useEffect, useState, useCallback } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../Firebase/firebase.init'; // adjust path if your init file is elsewhere

const useFirebase = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Sign in with Google
  const signInUsingGoogle = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err?.message || 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Observe auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setIsLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Sign out
  const logOut = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err?.message || 'Sign-out failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optional: helper to fetch a fresh ID token for API calls
  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Not signed in');
    return auth.currentUser.getIdToken(); // SDK refreshes if needed
  }, []);

  return {
    user,
    isLoading,
    error,
    signInUsingGoogle,
    logOut,
    getIdToken, // optional helper
  };
};

export default useFirebase;
