import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuth from '../Hooks/useAuth'; // make sure this path matches your project

const PrivateRouter = ({ children, ...rest }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  const isSignedIn = !!user; // ✅ don't access user.email directly

  return (
    <Route
      {...rest}
      render={({ location }) =>
        isSignedIn ? (
          children
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: location } }} />
        )
      }
    />
  );
};

export default PrivateRouter;
