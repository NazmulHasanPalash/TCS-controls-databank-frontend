// src/page/Home/Home.js
import React from 'react';

import FIrsstHomePageBanner from '../../Components/FirstHomePageBanner/FIrsstHomePageBanner';
import './Home.css';
import Header from '../Header/Header';
import FileManager from '../../Components/FileManager/FileManager';

// ✅ Role hook (path matches: src/hooks/useAuthRole.js)
import useAuthRole from '../../Components/Hooks/useAuthRole';

// Roles that ARE allowed to see the Home + FileManager page.
// We allow all department "new_*" roles, department roles, and elevated roles.
// Only "new_register" (or unknown roles) will see the pending-authorization modal.
const ALLOWED_ROLES = [
  // Onboarding department roles
  'new_sales',
  'new_production',
  'new_finance',
  'new_hr',
  'new_administrative',

  // Regular / active roles
  'user',
  'sales',
  'production',
  'finance',
  'hr',
  'administrative',

  // Elevated roles
  'operator',
  'moderator',
  'admin',
];

const Home = () => {
  const { role, isLoading } = useAuthRole();
  const normalizedRole = String(role || '').toLowerCase();
  const canView = ALLOWED_ROLES.includes(normalizedRole);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div
          className="spinner-border text-primary"
          role="status"
          aria-live="polite"
        >
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (canView) {
    return (
      <div>
        <Header />
        <FIrsstHomePageBanner />
        <FileManager />
      </div>
    );
  }

  // new_register or any unknown role → show pending authorization message
  return (
    <>
      <div
        className="modal fade show"
        role="dialog"
        aria-modal="true"
        style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <div className="modal-header">
              <h5 className="modal-title">Authorization Required</h5>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                Your account is pending authorization.
                <br />
                <strong>
                  Contact with the Admin for authorization access.
                </strong>
              </p>
            </div>
            <div className="modal-footer">
              <a href="/" className="btn btn-secondary">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
};

export default Home;
