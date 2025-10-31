// src/routers/ModeratorRouter.js
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuthRole from '../Hooks/useAuthRole'; // ✅ ensure this path/casing matches your project

const ModeratorRouter = ({ children, ...rest }) => {
  // Allow moderators *and* admins
  const { user, isLoading, isModeratorPlus } = useAuthRole();
  // isModeratorPlus === moderator OR admin

  if (isLoading) {
    return (
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  const isSignedIn = !!user?.email;
  const canAccess = isSignedIn && isModeratorPlus;

  return (
    <Route
      {...rest}
      render={({ location }) =>
        canAccess ? (
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

export default ModeratorRouter;
