// src/components/Header/Header.jsx
import React from 'react';
import './Header.css';
import { HashLink } from 'react-router-hash-link';

import useAuthRole from '../../Components/Hooks/useAuthRole'; // role & user state
import useFirebase from '../../Components/Hooks/useFirebase'; // logout helper

const Header = () => {
  // Safely read role state; provide hard defaults so UI never crashes
  const {
    user = null,
    isLoading = false,
    isAdmin: rawIsAdmin = false,
    isModerator: rawIsModerator = false,
    isOperator: rawIsOperator = false,
  } = (function safeUseAuthRole() {
    try {
      return useAuthRole?.() || {};
    } catch {
      return {};
    }
  })();

  // Normalize: only literal boolean true counts
  const isAdmin = rawIsAdmin === true;
  const isModerator = rawIsModerator === true;
  const isOperator = rawIsOperator === true;

  // 🔐 Visibility rules:
  // - Users (no role) CANNOT see Operator
  // - Operators CAN see Users (plus Admins can too)
  const canSeeAdminLink = isAdmin;
  const canSeeModeratorLink = isModerator || isAdmin; // admin inherits moderator
  const canSeeOperatorLink = isOperator || isModerator || isAdmin; // exclude plain users
  const canSeeUsersLink = isAdmin || isOperator; // ✅ operators (and admins) can see Users

  // Logout
  const { logOut } = (function safeUseFirebase() {
    try {
      return useFirebase?.() || {};
    } catch {
      return {};
    }
  })();

  const handleLogout = async () => {
    try {
      if (typeof logOut === 'function') {
        await logOut();
      }
    } finally {
      // Always navigate to login after attempting logout
      window.location.hash = '#/login';
    }
  };

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
              {/* Avoid flicker while auth is loading */}
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

                  {/* File Manager (always for signed-in users) */}
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

                  {/* Admin / Users area */}
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
