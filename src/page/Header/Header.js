// src/page/Header/Header.js
import React from 'react';
import './Header.css';
import { HashLink } from 'react-router-hash-link';

import useAuthRole from '../../Components/Hooks/useAuthRole';
import useFirebase from '../../Components/Hooks/useFirebase';

const Header = () => {
  const {
    user = null,
    isLoading = false,
    role: rawRole = 'new_register',
    isAdmin: rawIsAdmin = false,
    isModerator: rawIsModerator = false,
    isOperator: rawIsOperator = false,
    isUser: rawIsUser = false,
  } = (function safeUseAuthRole() {
    try {
      return (typeof useAuthRole === 'function' ? useAuthRole() : {}) || {};
    } catch {
      return {};
    }
  })();

  const role =
    typeof rawRole === 'string' ? rawRole.toLowerCase() : 'new_register';
  const isAdmin = rawIsAdmin === true;
  const isModerator = rawIsModerator === true;
  const isOperator = rawIsOperator === true;
  const isUser = rawIsUser === true || role === 'user';

  const canSeeAdminLink = isAdmin;
  const canSeeModeratorLink = isModerator || isAdmin;
  const canSeeOperatorLink = isOperator || isModerator || isAdmin;
  const canSeeFileManager = isUser || isOperator || isModerator || isAdmin;

  const { logOut } = (function safeUseFirebase() {
    try {
      return (typeof useFirebase === 'function' ? useFirebase() : {}) || {};
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
      window.location.hash = '#/login';
    }
  };

  // Use PUBLIC_URL to ensure the image resolves from any route depth
  const logoSrc = `${process.env.PUBLIC_URL || ''}/image/img/tcscontrols.png`;

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
                  src={logoSrc}
                  alt="TCS Controls"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </span>
            </HashLink>

            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 link-style d-flex align-items-center">
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

                  {canSeeFileManager && (
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
