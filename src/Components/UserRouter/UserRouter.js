// src/router/UserRouter.js
// React Router v5 guard that allows roles: admin | moderator | operator | user
// (blocks others like "new-register")

import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuth from '../Hooks/useAuth'; // ✅ adjust path/casing to your project
import useAuthRole from '../Hooks/useAuthRole'; // ✅ adjust path/casing to your project

const ALLOWED_ROLES = ['admin', 'moderator', 'operator', 'user'];

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
        if (!isSignedIn) {
          return (
            <Redirect to={{ pathname: '/login', state: { from: location } }} />
          );
        }
        if (!isAllowed) {
          // Signed in but role not in allowed set → send elsewhere (home by default)
          return <Redirect to={{ pathname: redirectIfNotAllowed }} />;
        }
        // Signed in and role allowed → render children
        return children;
      }}
    />
  );
};

export default UserRouter;
