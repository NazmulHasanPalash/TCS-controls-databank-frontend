// src/routers/OperatorRouter.js
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuthRole from '../Hooks/useAuthRole'; // ✅ use the role hook (operator OR above)

const OperatorRouter = ({ children, ...rest }) => {
  const { user, isLoading, isOperatorPlus } = useAuthRole();
  // isOperatorPlus === operator OR moderator OR admin

  if (isLoading) {
    return (
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  const isSignedIn = !!user?.email;
  const canAccess = isSignedIn && isOperatorPlus; // ✅ allow moderator/admin too

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

export default OperatorRouter;
