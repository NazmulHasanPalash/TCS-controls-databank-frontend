// src/router/PrivateRouter.js
// React Router v5 guard that ALLOWS roles: user | operator | moderator | admin
// and DENIES: new_register (or any unknown role).

import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuth from '../Hooks/useAuth'; // adjust path/casing as in your project
import useAuthRole from '../Hooks/useAuthRole'; // adjust path/casing as in your project

// Keep roles consistent with your backend and useAuthRole hook
const ROLE_ORDER = ['new_register', 'user', 'operator', 'moderator', 'admin'];

function normalizeRole(v) {
  const r = String(v || '')
    .trim()
    .toLowerCase();
  return ROLE_ORDER.includes(r) ? r : 'new_register';
}

/**
 * Props:
 * - allowedRoles?: string[]  (default: ['user','operator','moderator','admin'])
 * - redirectIfDenied?: string (default: '/')
 * - redirectIfSignedOut?: string (default: '/login')
 *
 * Example:
 *   <PrivateRouter path="/admin" allowedRoles={['admin']}>
 *     <AdminPage />
 *   </PrivateRouter>
 */
const PrivateRouter = ({
  children,
  allowedRoles = ['new_register', 'user', 'operator', 'moderator', 'admin'],
  redirectIfDenied = '/',
  redirectIfSignedOut = '/login',
  ...rest
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { role: rawRole, isLoading: roleLoading } = useAuthRole();

  const loading = !!(authLoading || roleLoading);
  const isSignedIn = !!user;
  const role = normalizeRole(rawRole);

  if (loading) {
    return (
      <div
        className="spinner-border text-primary"
        role="status"
        aria-label="Loading"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={({ location }) => {
        // Not signed in → go to login
        if (!isSignedIn) {
          return (
            <Redirect
              to={{ pathname: redirectIfSignedOut, state: { from: location } }}
            />
          );
        }

        // Signed in but role not allowed (e.g., 'new_register') → send away
        const allowed = allowedRoles.map(normalizeRole);
        if (!allowed.includes(role)) {
          return <Redirect to={{ pathname: redirectIfDenied }} />;
        }

        // Allowed
        return children;
      }}
    />
  );
};

export default PrivateRouter;
