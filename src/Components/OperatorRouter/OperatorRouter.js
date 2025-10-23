// src/routers/OperatorRouter.js
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuthRole from '../Hooks/useAuthRole'; // <-- use the role hook

const OperatorRouter = ({ children, ...rest }) => {
  const { user, isLoading, isOperator } = useAuthRole();

  if (isLoading) {
    return (
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  const noAccess = !!user && !isOperator;

  return (
    <Route
      {...rest}
      render={({ location }) =>
        user?.email && isOperator ? (
          children
        ) : user?.email && noAccess ? (
          <Redirect
            to={{
              pathname: '/403', // or '/', if you prefer
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

export default OperatorRouter;
