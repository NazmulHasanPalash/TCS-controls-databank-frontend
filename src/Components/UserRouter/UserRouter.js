// src/router/UserRouter.js
// React Router v5 guard.
//
// Allows roles:
//   admin | moderator | operator
//   user  | sales | production | finance | hr | administrative
//   new_sales | new_production | new_finance | new_hr | new_administrative
//
// Blocks others like "new_register" or any unknown role.

import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuth from '../Hooks/useAuth'; // ✅ adjust path/casing to your project
import useAuthRole from '../Hooks/useAuthRole'; // ✅ adjust path/casing to your project

// Keep this in sync with backend ALLOWED_ROLES
const ALLOWED_ROLES = [
  // Elevated roles
  'admin',
  'moderator',
  'operator',

  // Regular / active roles
  'user',
  'sales',
  'production',
  'finance',
  'hr',
  'administrative',

  // Onboarding department roles
  'new_sales',
  'new_production',
  'new_finance',
  'new_hr',
  'new_administrative',
];

const UserRouter = ({ children, redirectIfNotAllowed = '/', ...rest }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useAuthRole();

  const loading = authLoading || roleLoading;
  const isSignedIn = !!user;
  const normalizedRole = String(role || '').toLowerCase();
  const isAllowed = ALLOWED_ROLES.includes(normalizedRole);

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
        // Not signed in → send to login
        if (!isSignedIn) {
          return (
            <Redirect to={{ pathname: '/login', state: { from: location } }} />
          );
        }

        // Signed in but role not allowed → redirect (home by default)
        if (!isAllowed) {
          return <Redirect to={{ pathname: redirectIfNotAllowed }} />;
        }

        // Signed in and role allowed → render children
        return children;
      }}
    />
  );
};

export default UserRouter;
