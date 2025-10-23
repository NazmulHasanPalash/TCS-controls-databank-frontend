// src/components/Header/Header.jsx
import React from 'react';
import './Header.css';
import { HashLink } from 'react-router-hash-link';

// 👉 roles (user, isLoading, isAdmin, isModerator, isOperator, …)
import useAuthRole from '../../Components/Hooks/useAuthRole'; // adjust path if yours differs

// 👉 optional: whatever hook you already use for logout
import useAuth from '../../Components/Hooks/useAuth'; // adjust/remove if your project differs

const Header = () => {
  // Role & user state
  const { user, isLoading, isAdmin, isModerator, isOperator } = useAuthRole();

  // Logout (support your existing hook if available)
  const { logOut, signOut } = (function safeUseAuth() {
    try {
      return useAuth?.() || {};
    } catch {
      return {};
    }
  })();

  const handleLogout = async () => {
    try {
      if (typeof logOut === 'function') {
        await logOut();
      } else if (typeof signOut === 'function') {
        await signOut();
      } else {
        // No hook? Try Firebase global if you have it available
        // await auth.signOut();
      }
      // Optional: send the user to login after logout (HashRouter style)
      window.location.hash = '#/login';
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Logout failed:', e);
    }
  };

  // Visibility flags per your rules
  const canSeeAdminLink = !!isAdmin;
  const canSeeModeratorLink = isModerator || isAdmin; // admin can also see moderator section
  const canSeeOperatorLink = isOperator || isModerator || isAdmin; // everyone who is signed in in your schema

  return (
    <div className="w-100 mx-auto margin-header">
      <nav className="navbar navbar-expand-lg navbar-dark header-style">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarTogglerDemo01"
            aria-controls="navbarTogglerDemo01"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
            <HashLink className="navbar-brand mx-auto" to="/home#home">
              <span className="span-style text-primary icon-style">
                <img
                  className="second-icon img-fluid"
                  src="image/img/tcscontrols.svg"
                  alt="TCS Controls"
                />
              </span>
            </HashLink>

            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 link-style d-flex align-items-center">
              {/* While auth is loading, avoid flicker */}
              {isLoading ? null : user?.email ? (
                <>
                  <li className="nav-item">
                    <HashLink
                      className="nav-link active header-text-style"
                      to="/home#home"
                    >
                      Home
                    </HashLink>
                  </li>

                  {/* Normal user file sections (always visible to signed-in users) */}
                  <li className="nav-item dropdown">
                    <button
                      className="btn header-text-style dropdown-toggle active"
                      id="fileManagerMenu"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      type="button"
                    >
                      File manager
                    </button>
                    <ul
                      className="dropdown-menu text-color w-100"
                      aria-labelledby="fileManagerMenu"
                    >
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/library"
                        >
                          Library
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/sourcingAndPricing"
                        >
                          Sourcing and Pricing
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/administrative"
                        >
                          Administrative
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/customerOrder"
                        >
                          Customer Order
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/spaceUp1"
                        >
                          Space UP-1
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/spaceUp2"
                        >
                          Space UP-2
                        </HashLink>
                      </li>
                    </ul>
                  </li>

                  {/* Role sections */}
                  {canSeeModeratorLink && (
                    <li className="nav-item">
                      <HashLink
                        className="nav-link active header-text-style"
                        to="/moderator"
                      >
                        Moderator
                      </HashLink>
                    </li>
                  )}

                  {canSeeOperatorLink && (
                    <li className="nav-item">
                      <HashLink
                        className="nav-link active header-text-style"
                        to="/operator"
                      >
                        Operator
                      </HashLink>
                    </li>
                  )}

                  {canSeeAdminLink && (
                    <li className="nav-item">
                      <HashLink
                        className="nav-link active header-text-style"
                        to="/admin"
                      >
                        Admin
                      </HashLink>
                    </li>
                  )}

                  {/* Logout */}
                  <li className="nav-item header-text-style">
                    <button
                      onClick={handleLogout}
                      type="button"
                      className="btn btn-light mx-5"
                    >
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <HashLink
                    className="nav-link active header-text-style"
                    to="/login"
                  >
                    Login
                  </HashLink>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
