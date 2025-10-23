// src/hooks/useAuthRole.js
// Watches Firebase Auth; reads Firestore users/{uid}.role; exposes helpers.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../Firebase/firebase.init';

const ROLE_ORDER = ['operator', 'moderator', 'admin'];

function normalizeRole(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  return ROLE_ORDER.includes(v) ? v : 'operator';
}

export function useAuthRole() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('operator');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Compare two roles by seniority: is a >= b?
  const gte = useCallback(
    (a, b) =>
      ROLE_ORDER.indexOf(normalizeRole(a)) >=
      ROLE_ORDER.indexOf(normalizeRole(b)),
    []
  );

  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isModerator = useMemo(() => role === 'moderator', [role]);
  const isOperator = useMemo(() => role === 'operator', [role]);

  // “At least” helpers (admin counts as moderator, etc.)
  const isModeratorPlus = useMemo(() => gte(role, 'moderator'), [gte, role]);
  const isOperatorPlus = useMemo(() => gte(role, 'operator'), [gte, role]); // always true for known roles

  // Read role from Firestore: users/{uid}.role
  const fetchRoleForUid = useCallback(async (uid) => {
    try {
      setError('');
      if (!uid) {
        setRole('operator');
        return;
      }
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      const r = snap.exists() ? normalizeRole(snap.data().role) : 'user';
      setRole(r);
    } catch (e) {
      setRole('operator'); // safe fallback; server should still enforce RBAC
      setError(e?.message || 'Failed to read user role');
    }
  }, []);

  // Keep in sync with Firebase Auth state
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!mounted) return;

      if (!u) {
        setUser(null);
        setRole('operator');
        setLoading(false);
        return;
      }

      setUser(u);
      setLoading(true);
      await fetchRoleForUid(u.uid);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fetchRoleForUid]);

  // Manual refresh (e.g., after an admin changes your role)
  const refreshRole = useCallback(async () => {
    setLoading(true);
    await fetchRoleForUid(user ? user.uid : '');
    setLoading(false);
  }, [fetchRoleForUid, user]);

  return {
    // state
    user, // Firebase Auth user or null
    role, // 'operator' | 'moderator' | 'admin'
    loading, // original flag
    isLoading: loading, // ✅ alias for router code that expects isLoading
    error,

    // exact-role flags
    isAdmin,
    isModerator,
    isOperator,

    // inclusive helpers
    isModeratorPlus, // moderator or admin
    isOperatorPlus, // operator or above (i.e., any valid role)

    // utils
    gte, // (aRole, bRole) => boolean
    refreshRole, // re-read role from Firestore
  };
}

export default useAuthRole;
