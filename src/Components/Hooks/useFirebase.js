// src/hooks/useFirebase.js
// React hook for Firebase Auth with React Router v5 redirect on logout

import { useEffect, useState, useCallback } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../Firebase/firebase.init';
import { useHistory } from 'react-router-dom'; // <-- v5

const useFirebase = () => {
  const history = useHistory(); // v5 navigation
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Google sign-in
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

  // Observe auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setIsLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Log out + redirect to /login (v5 history.replace)
  const logOut = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      await signOut(auth);
      setUser(null);

      // Prefer SPA redirect if we're inside a Router
      if (history && typeof history.replace === 'function') {
        history.replace('/login');
      } else {
        // Fallback if used outside Router
        window.location.replace('/login');
      }
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err?.message || 'Sign-out failed');
    } finally {
      setIsLoading(false);
    }
  }, [history]);

  // Optional: fresh ID token for API calls
  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Not signed in');
    return auth.currentUser.getIdToken();
  }, []);

  return { user, isLoading, error, signInUsingGoogle, logOut, getIdToken };
};

export default useFirebase;
