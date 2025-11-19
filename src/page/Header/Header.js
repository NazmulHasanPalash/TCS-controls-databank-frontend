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

  // File manager allowed roles
  const DEPARTMENT_ROLES = [
    'sales',
    'production',
    'finance',
    'hr',
    'administrative',
    'new_sales',
    'new_production',
    'new_finance',
    'new_hr',
    'new_administrative',
  ];

  const canSeeFileManager =
    isUser ||
    isOperator ||
    isModerator ||
    isAdmin ||
    DEPARTMENT_ROLES.includes(role);

  // Administrative System inside File manager:
  const canSeeAdministrativeSystem =
    isAdmin || isModerator || isOperator || role === 'administrative';

  // Permanent employ dropdown
  const PERMANENT_EMP_ROLES = [
    'sales',
    'production',
    'finance',
    'hr',
    'administrative',
  ];
  const canSeePermanentEmploy =
    isAdmin || isModerator || isOperator || PERMANENT_EMP_ROLES.includes(role);

  // New employ dropdown
  const NEW_EMP_ROLES = [
    'new_sales',
    'new_production',
    'new_finance',
    'new_hr',
    'new_administrative',
  ];
  const canSeeNewEmploy =
    isAdmin || isModerator || isOperator || NEW_EMP_ROLES.includes(role);

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
    <header className="tcs-header-root">
      <div className="tcs-header-gradient" />

      <div className="tcs-header-shell container-fluid px-0">
        <nav className="navbar navbar-expand-lg header-style tcs-header-glass tcs-header-animate">
          <div className="container-fluid tcs-header-inner">
            {/* Logo + brand */}
            <HashLink className="navbar-brand tcs-header-brand" to="/home#home">
              <span className="tcs-logo-wrapper">
                <img
                  className="second-icon img-fluid tcs-logo-img"
                  src={logoSrc}
                  alt="TCS Controls"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="tcs-logo-text">
                  <span className="tcs-logo-main">TCS Controls</span>
                  <span className="tcs-logo-sub">File &amp; Role Portal</span>
                </span>
              </span>
            </HashLink>

            {/* Toggler */}
            <button
              className="navbar-toggler tcs-navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarTogglerDemo01"
              aria-controls="navbarTogglerDemo01"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>

            {/* Nav links */}
            <div
              className="collapse navbar-collapse tcs-navbar-collapse"
              id="navbarTogglerDemo01"
            >
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0 link-style tcs-nav-list">
                {isLoading ? null : user?.email ? (
                  <>
                    {/* Home */}
                    <li className="nav-item tcs-nav-item">
                      <HashLink
                        className="nav-link header-text-style tcs-nav-link"
                        to="/home#home"
                      >
                        <span className="tcs-link-label">Home</span>
                        <span className="tcs-link-underline" />
                      </HashLink>
                    </li>

                    {/* File manager dropdown */}
                    {canSeeFileManager && (
                      <li className="nav-item dropdown tcs-nav-item">
                        <button
                          className="btn header-text-style dropdown-toggle tcs-nav-link tcs-nav-link-btn"
                          id="fileManagerMenu"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          type="button"
                        >
                          <span className="tcs-link-label">File manager</span>
                          <span className="tcs-link-underline" />
                        </button>
                        <ul
                          className="dropdown-menu text-color tcs-dropdown-menu"
                          aria-labelledby="fileManagerMenu"
                        >
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/library"
                            >
                              Library
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/sourcingAndPricing"
                            >
                              Sourcing and Pricing
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/administrative"
                            >
                              Administrative
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/customerOrder"
                            >
                              Customer Order
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/spaceUp1"
                            >
                              Space UP-1
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/spaceUp2"
                            >
                              Space UP-2
                            </HashLink>
                          </li>
                        </ul>
                      </li>
                    )}

                    {/* Permanent employ dropdown */}
                    {canSeePermanentEmploy && (
                      <li className="nav-item dropdown tcs-nav-item">
                        <button
                          className="btn header-text-style dropdown-toggle tcs-nav-link tcs-nav-link-btn"
                          id="permanentEmployMenu"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          type="button"
                        >
                          <span className="tcs-link-label">Role-1</span>
                          <span className="tcs-link-underline" />
                        </button>
                        <ul
                          className="dropdown-menu text-color tcs-dropdown-menu"
                          aria-labelledby="permanentEmployMenu"
                        >
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/administrativeSystem"
                            >
                              Administration
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/salesSystem"
                            >
                              Sales
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/productionSystem"
                            >
                              Production
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/hrSystem"
                            >
                              HR
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/financeSystem"
                            >
                              Finance
                            </HashLink>
                          </li>
                        </ul>
                      </li>
                    )}

                    {/* New employ dropdown */}
                    {canSeeNewEmploy && (
                      <li className="nav-item dropdown tcs-nav-item">
                        <button
                          className="btn header-text-style dropdown-toggle tcs-nav-link tcs-nav-link-btn"
                          id="newEmployMenu"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          type="button"
                        >
                          <span className="tcs-link-label">Role-2</span>
                          <span className="tcs-link-underline" />
                        </button>
                        <ul
                          className="dropdown-menu text-color tcs-dropdown-menu"
                          aria-labelledby="newEmployMenu"
                        >
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/newAdministrativeSystem"
                            >
                              New Administration
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/newSalesSystem"
                            >
                              New Sales
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/newProductionSystem"
                            >
                              New Production
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/newFinanceSystem"
                            >
                              New Finance
                            </HashLink>
                          </li>
                          <li>
                            <HashLink
                              className="nav-link dropdown-text-style tcs-dropdown-link"
                              to="/files/newHrSystem"
                            >
                              New HR
                            </HashLink>
                          </li>
                        </ul>
                      </li>
                    )}

                    {/* Operator */}
                    {canSeeOperatorLink && (
                      <li className="nav-item tcs-nav-item">
                        <HashLink
                          className="nav-link header-text-style tcs-nav-link"
                          to="/operator"
                        >
                          <span className="tcs-link-label">Operator</span>
                          <span className="tcs-link-underline" />
                        </HashLink>
                      </li>
                    )}

                    {/* Moderator */}
                    {canSeeModeratorLink && (
                      <li className="nav-item tcs-nav-item">
                        <HashLink
                          className="nav-link header-text-style tcs-nav-link"
                          to="/moderator"
                        >
                          <span className="tcs-link-label">Moderator</span>
                          <span className="tcs-link-underline" />
                        </HashLink>
                      </li>
                    )}

                    {/* Admin */}
                    {canSeeAdminLink && (
                      <li className="nav-item tcs-nav-item">
                        <HashLink
                          className="nav-link header-text-style tcs-nav-link"
                          to="/admin"
                        >
                          <span className="tcs-link-label">Admin</span>
                          <span className="tcs-link-underline" />
                        </HashLink>
                      </li>
                    )}

                    {/* Logout */}
                    <li className="nav-item tcs-nav-item tcs-nav-logout">
                      <button
                        onClick={handleLogout}
                        type="button"
                        className="btn tcs-logout-btn"
                      >
                        <span className="tcs-logout-label">Log out</span>
                      </button>
                    </li>
                  </>
                ) : (
                  <li className="nav-item tcs-nav-item">
                    <HashLink
                      className="nav-link header-text-style tcs-nav-link"
                      to="/login"
                    >
                      <span className="tcs-link-label">Login</span>
                      <span className="tcs-link-underline" />
                    </HashLink>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
