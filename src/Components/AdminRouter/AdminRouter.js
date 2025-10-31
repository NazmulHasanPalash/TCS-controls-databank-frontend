// src/routers/AdminRouter.js
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuthRole from '../Hooks/useAuthRole'; // ✅ correct path & casing

const AdminRouter = ({ children, ...rest }) => {
  const { user, isLoading, isAdmin } = useAuthRole();

  if (isLoading) {
    return (
      <div
        className="spinner-border text-primary"
        role="status"
        aria-live="polite"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={({ location }) =>
        user?.email && isAdmin ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/',
              state: { from: location },
            }}
          />
        )
      }
    />
  );
};

export default AdminRouter;
