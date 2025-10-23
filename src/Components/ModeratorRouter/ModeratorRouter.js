// src/routers/ModeratorRouter.js
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuthRole from '../Hooks/useAuthRole'; // make sure this path/casing matches your project

const ModeratorRouter = ({ children, ...rest }) => {
  // use the correct hook you imported
  const { user, isLoading, isModerator } = useAuthRole();

  if (isLoading) {
    return (
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  const noAccess = !!user && !isModerator;

  return (
    <Route
      {...rest}
      render={({ location }) =>
        user?.email && isModerator ? (
          children
        ) : user?.email && noAccess ? (
          <Redirect
            to={{
              pathname: '/403',
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

export default ModeratorRouter;
