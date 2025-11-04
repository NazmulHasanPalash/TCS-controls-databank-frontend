// src/hooks/useAuthRole.js
// Watches Firebase Auth; reads Firestore users/{uid}.role; exposes helpers.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../Firebase/firebase.init'; // keep your exact path/casing

// ↓ Add "user" as the lowest role
const ROLE_ORDER = ['user', 'operator', 'moderator', 'admin'];

function normalizeRole(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  return ROLE_ORDER.includes(v) ? v : 'user'; // default to user (not operator)
}

export function useAuthRole() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user'); // default now "user"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Compare two roles by seniority: is a >= b?
  const gte = useCallback(
    (a, b) =>
      ROLE_ORDER.indexOf(normalizeRole(a)) >=
      ROLE_ORDER.indexOf(normalizeRole(b)),
    []
  );

  // Exact-role flags
  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isModerator = useMemo(() => role === 'moderator', [role]);
  const isOperator = useMemo(() => role === 'operator', [role]);
  const isUser = useMemo(() => role === 'user', [role]);

  // Inclusive helpers
  const isOperatorPlus = useMemo(() => gte(role, 'operator'), [gte, role]); // operator | moderator | admin
  const isModeratorPlus = useMemo(() => gte(role, 'moderator'), [gte, role]); // moderator | admin
  const isAdminPlus = useMemo(() => gte(role, 'admin'), [gte, role]); // admin

  // Read role from Firestore: users/{uid}.role
  const fetchRoleForUid = useCallback(async (uid) => {
    try {
      setError('');
      if (!uid) {
        setRole('user');
        return;
      }
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      const raw = snap.exists() ? snap.data()?.role : undefined;
      setRole(normalizeRole(raw)); // user | operator | moderator | admin
    } catch (e) {
      setRole('user'); // safe fallback; server should still enforce RBAC
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
        setRole('user'); // signed out -> user baseline
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
    role, // 'user' | 'operator' | 'moderator' | 'admin'
    loading,
    isLoading: loading, // alias
    error,

    // exact-role flags
    isUser,
    isOperator,
    isModerator,
    isAdmin,

    // inclusive helpers
    isOperatorPlus, // operator or above
    isModeratorPlus, // moderator or above
    isAdminPlus, // admin (kept for symmetry)

    // utils
    gte, // (aRole, bRole) => boolean
    refreshRole, // re-read role from Firestore
  };
}

export default useAuthRole;
