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

    // Core role flags from hook
    isAdmin: rawIsAdmin = false,
    isModerator: rawIsModerator = false,
    isOperator: rawIsOperator = false,
    isUser: rawIsUser = false,

    // Onboarding / new roles
    isNewSales: rawIsNewSales = false,
    isNewProduction: rawIsNewProduction = false,
    isNewFinance: rawIsNewFinance = false,
    isNewHr: rawIsNewHr = false,
    isNewAdministrative: rawIsNewAdministrative = false,

    // Regular / active department roles
    isSales: rawIsSales = false,
    isProduction: rawIsProduction = false,
    isFinance: rawIsFinance = false,
    isHr: rawIsHr = false,
    isAdministrative: rawIsAdministrative = false,
  } = (function safeUseAuthRole() {
    try {
      return (typeof useAuthRole === 'function' ? useAuthRole() : {}) || {};
    } catch {
      return {};
    }
  })();

  const role =
    typeof rawRole === 'string' ? rawRole.toLowerCase() : 'new_register';

  /* ============ Normalize core role booleans ============ */

  const isAdmin = rawIsAdmin === true || role === 'admin';
  const isModerator = rawIsModerator === true || role === 'moderator';
  const isOperator = rawIsOperator === true || role === 'operator';
  const isUser = rawIsUser === true || role === 'user';

  /* ============ Normalize department role booleans ============ */

  // Regular / active department roles
  const isSales = rawIsSales === true || role === 'sales';
  const isProduction = rawIsProduction === true || role === 'production';
  const isFinance = rawIsFinance === true || role === 'finance';
  const isHr = rawIsHr === true || role === 'hr';
  const isAdministrative =
    rawIsAdministrative === true || role === 'administrative';

  // Onboarding / new roles
  const isNewSales = rawIsNewSales === true || role === 'new_sales';
  const isNewProduction =
    rawIsNewProduction === true || role === 'new_production';
  const isNewFinance = rawIsNewFinance === true || role === 'new_finance';
  const isNewHr = rawIsNewHr === true || role === 'new_hr';
  const isNewAdministrative =
    rawIsNewAdministrative === true || role === 'new_administrative';

  // Grouped flags
  const isPermanentDept =
    isSales || isProduction || isFinance || isHr || isAdministrative;

  const isNewDept =
    isNewSales ||
    isNewProduction ||
    isNewFinance ||
    isNewHr ||
    isNewAdministrative;

  const isAnyDeptOrNew = isPermanentDept || isNewDept;

  /* ============ Top-level role links visibility ============ */

  const canSeeAdminLink = isAdmin;
  const canSeeModeratorLink = isModerator || isAdmin;
  const canSeeOperatorLink = isOperator || isModerator || isAdmin;

  /* ============ File Manager Access ============ */

  const canSeeFileManager =
    isUser || isOperator || isModerator || isAdmin || isAnyDeptOrNew;

  // placeholder: could be used elsewhere
  const canSeeAdministrativeSystemFileManager =
    isAdmin || isModerator || isOperator || isAdministrative;
  void canSeeAdministrativeSystemFileManager;

  /* ============ Dropdown Role Access ============ */

  // Permanent employ dropdown (Role-1) → active department roles
  const canSeePermanentEmploy =
    isAdmin || isModerator || isOperator || isPermanentDept;

  // New employ dropdown (Role-2) → onboarding roles
  const canSeeNewEmploy = isAdmin || isModerator || isOperator || isNewDept;

  // ⚠️ Special rule: AdministrationSystem item visibility
  // Only these roles can see /files/administrationSystem
  const canSeeAdministrationSystemItem =
    isAdministrative || isOperator || isModerator || isAdmin;

  // ⚠️ Special rule: SalesSystem item visibility
  // Only these roles can see /files/salesSystem
  const canSeeSalesSystemItem = isSales || isOperator || isModerator || isAdmin;

  // ⚠️ Special rule: ProductionSystem item visibility
  // Only these roles can see /files/productionSystem
  const canSeeProductionSystemItem =
    isProduction || isOperator || isModerator || isAdmin;

  // ⚠️ Special rule: HrSystem item visibility
  // Only these roles can see /files/hrSystem
  const canSeeHrSystemItem = isHr || isModerator || isAdmin;

  // ⚠️ Special rule: FinanceSystem item visibility
  // Only these roles can see /files/financeSystem
  const canSeeFinanceSystemItem = isFinance || isModerator || isAdmin;

  // ⚠️ Special rule: NewAdministrationSystem item visibility
  // Only these roles can see /files/newAdministrationSystem
  const canSeeNewAdministrationSystemItem =
    isNewAdministrative || isOperator || isModerator || isAdmin;

  // ⚠️ Special rule: NewSalesSystem item visibility
  // Only these roles can see /files/newSalesSystem
  const canSeeNewSalesSystemItem =
    isNewSales || isOperator || isModerator || isAdmin;

  // ⚠️ Special rule: NewProductionSystem item visibility
  // Only these roles can see /files/newProductionSystem
  const canSeeNewProductionSystemItem =
    isNewProduction || isOperator || isModerator || isAdmin;

  // ⚠️ Special rule: NewHrSystem item visibility
  // Only these roles can see /files/newHrSystem
  const canSeeNewHrSystemItem = isNewHr || isModerator || isAdmin;

  // ⚠️ Special rule: NewFinanceSystem item visibility
  // Only these roles can see /files/newFinanceSystem
  const canSeeNewFinanceSystemItem = isNewFinance || isModerator || isAdmin;

  /* ============ Auth / Logout ============ */

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
        <nav className="navbar navbar-expand-lg navbar-dark header-style tcs-header-glass tcs-header-animate">
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

            {/* Toggler (mobile) */}
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
                              Sourcing &amp; Pricing
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

                    {/* Permanent employ dropdown (Role-1) */}
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
                          {/* AdministrationSystem ONLY for administrative, operator, moderator, admin */}
                          {canSeeAdministrationSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/administrationSystem"
                              >
                                Administration
                              </HashLink>
                            </li>
                          )}

                          {/* SalesSystem ONLY for sales, operator, moderator, admin */}
                          {canSeeSalesSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/salesSystem"
                              >
                                Sales
                              </HashLink>
                            </li>
                          )}

                          {/* ProductionSystem ONLY for production, operator, moderator, admin */}
                          {canSeeProductionSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/productionSystem"
                              >
                                Production
                              </HashLink>
                            </li>
                          )}

                          {/* FinanceSystem ONLY for finance, moderator, admin */}
                          {canSeeFinanceSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/financeSystem"
                              >
                                Finance
                              </HashLink>
                            </li>
                          )}

                          {/* HrSystem ONLY for hr, moderator, admin */}
                          {canSeeHrSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/hrSystem"
                              >
                                HR
                              </HashLink>
                            </li>
                          )}
                        </ul>
                      </li>
                    )}

                    {/* New employ dropdown (Role-2) */}
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
                          {/* NewAdministrationSystem ONLY for new_administrative, operator, moderator, admin */}
                          {canSeeNewAdministrationSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/newAdministrationSystem"
                              >
                                New Administration
                              </HashLink>
                            </li>
                          )}

                          {/* NewSalesSystem ONLY for new_sales, operator, moderator, admin */}
                          {canSeeNewSalesSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/newSalesSystem"
                              >
                                New Sales
                              </HashLink>
                            </li>
                          )}

                          {/* NewProductionSystem ONLY for new_production, operator, moderator, admin */}
                          {canSeeNewProductionSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/newProductionSystem"
                              >
                                New Production
                              </HashLink>
                            </li>
                          )}

                          {/* NewFinanceSystem ONLY for new_finance, moderator, admin */}
                          {canSeeNewFinanceSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/newFinanceSystem"
                              >
                                New Finance
                              </HashLink>
                            </li>
                          )}

                          {/* NewHrSystem ONLY for new_hr, moderator, admin */}
                          {canSeeNewHrSystemItem && (
                            <li>
                              <HashLink
                                className="nav-link dropdown-text-style tcs-dropdown-link"
                                to="/files/newHrSystem"
                              >
                                New HR
                              </HashLink>
                            </li>
                          )}
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
