// src/routers/AdminRouter.js
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuthRole from '../Hooks/useAuthRole'; // ✅ correct import

const AdminRouter = ({ children, ...rest }) => {
  const { user, isLoading, isAdmin } = useAuthRole(); // ✅ use the role hook

  if (isLoading) {
    return (
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  const noAccess = !!user && !isAdmin;

  return (
    <Route
      {...rest}
      render={({ location }) =>
        user?.email && isAdmin ? (
          children
        ) : user?.email && noAccess ? (
          <Redirect
            to={{
              pathname: '/403', // or '/' if you prefer
              state: { from: location },
            }}
          />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: location },
            }}
          />
        )
      }
    />
  );
};

export default AdminRouter;
