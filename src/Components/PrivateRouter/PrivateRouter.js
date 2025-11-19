// src/router/PrivateRouter.js
// React Router v5 guard.
//
// Default behaviour (if you don't pass allowedRoles):
//   ✅ ALLOW:
//        new_sales, new_production, new_finance, new_hr, new_administrative,
//        user, sales, production, finance, hr, administrative,
//        operator, moderator, admin
//   ❌ DENY:
//        new_register and any unknown role.

import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuth from '../Hooks/useAuth'; // adjust path/casing as in your project
import useAuthRole from '../Hooks/useAuthRole'; // adjust path/casing as in your project

// Keep roles consistent with backend + useAuthRole
// Lowest → Highest
const ROLE_ORDER = [
  // Onboarding / new roles
  'new_register',
  'new_sales',
  'new_production',
  'new_finance',
  'new_hr',
  'new_administrative',

  // Regular / active roles
  'user',
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

function normalizeRole(v) {
  const r = String(v || '')
    .trim()
    .toLowerCase();
  return ROLE_ORDER.includes(r) ? r : 'new_register';
}

const PrivateRouter = ({
  children,
  // Default: allow all department "new_*" roles, active roles, and elevated roles.
  // Only "new_register" (and unknown roles) are denied by default.
  allowedRoles = [
    // Onboarding / department new roles
    'new_register',
    'new_sales',
    'new_production',
    'new_finance',
    'new_hr',
    'new_administrative',

    // Regular / active roles
    'user',
    'sales',
    'production',
    'finance',
    'hr',
    'administrative',

    // Elevated
    'operator',
    'moderator',
    'admin',
  ],
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

        // Signed in but role not allowed → redirect
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
