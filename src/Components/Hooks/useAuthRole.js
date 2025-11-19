// src/hooks/useAuthRole.js
// Watches Firebase Auth; reads Firestore users/{uid}.role; exposes helpers.
// Default (lowest) role is "new_register".

import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../Firebase/firebase.init'; // keep your exact path/casing

// Lowest → Highest (keep this in sync with backend)
const ROLE_ORDER = [
  // Base
  'new_register',
  'user',

  // Onboarding / new roles
  'new_sales',
  'new_production',
  'new_finance',
  'new_hr',
  'new_administrative',

  // Regular / active department roles
  'sales',
  'production',
  'finance',
  'hr',
  'administrative',

  // Elevated roles
  'operator',
  'moderator',
  'admin',
];

function normalizeRole(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  // Fallback to lowest role if missing/unknown
  return ROLE_ORDER.includes(v) ? v : 'new_register';
}

export function useAuthRole() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('new_register'); // default baseline
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
  const isNewRegister = useMemo(() => role === 'new_register', [role]);
  const isUser = useMemo(() => role === 'user', [role]);

  // Onboarding / new roles
  const isNewSales = useMemo(() => role === 'new_sales', [role]);
  const isNewProduction = useMemo(() => role === 'new_production', [role]);
  const isNewFinance = useMemo(() => role === 'new_finance', [role]);
  const isNewHr = useMemo(() => role === 'new_hr', [role]);
  const isNewAdministrative = useMemo(
    () => role === 'new_administrative',
    [role]
  );

  // Active department roles
  const isSales = useMemo(() => role === 'sales', [role]);
  const isProduction = useMemo(() => role === 'production', [role]);
  const isFinance = useMemo(() => role === 'finance', [role]);
  const isHr = useMemo(() => role === 'hr', [role]);
  const isAdministrative = useMemo(() => role === 'administrative', [role]);

  // Elevated roles
  const isOperator = useMemo(() => role === 'operator', [role]);
  const isModerator = useMemo(() => role === 'moderator', [role]);
  const isAdmin = useMemo(() => role === 'admin', [role]);

  // Inclusive helpers
  const isOperatorPlus = useMemo(() => gte(role, 'operator'), [gte, role]); // operator | moderator | admin
  const isModeratorPlus = useMemo(() => gte(role, 'moderator'), [gte, role]); // moderator | admin
  const isAdminPlus = useMemo(() => gte(role, 'admin'), [gte, role]); // admin

  // Read role from Firestore: users/{uid}.role
  const fetchRoleForUid = useCallback(async (uid) => {
    try {
      setError('');
      if (!uid) {
        setRole('new_register');
        return;
      }
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      const raw = snap.exists() ? snap.data()?.role : undefined;
      setRole(normalizeRole(raw)); // any known role, else new_register
    } catch (e) {
      // Safe fallback; server should still enforce RBAC
      setRole('new_register');
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
        setRole('new_register'); // signed out -> baseline
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
    role, // e.g. 'new_register', 'user', 'sales', 'operator', 'admin', etc.
    loading,
    isLoading: loading, // alias
    error,

    // exact-role flags
    isNewRegister,
    isUser,

    isNewSales,
    isNewProduction,
    isNewFinance,
    isNewHr,
    isNewAdministrative,

    isSales,
    isProduction,
    isFinance,
    isHr,
    isAdministrative,

    isOperator,
    isModerator,
    isAdmin,

    // inclusive helpers
    isOperatorPlus, // operator or above
    isModeratorPlus, // moderator or above
    isAdminPlus, // admin

    // utils
    gte, // (aRole, bRole) => boolean
    refreshRole, // re-read role from Firestore
  };
}

export default useAuthRole;
