// src/page/Home/Home.js
import React from 'react';

import FIrsstHomePageBanner from '../../Components/FirstHomePageBanner/FIrsstHomePageBanner';
import './Home.css';
import Header from '../Header/Header';
import FileManager from '../../Components/FileManager/FileManager';

// ✅ Role hook (adjust the path if your folder is named differently)
import useAuthRole from '../../Components/Hooks/useAuthRole';

const ALLOWED_ROLES = ['user', 'operator', 'moderator', 'admin'];

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

        <h1 className="home-page-heading-style mx-auto my-5 text-primary">
          File Manager
        </h1>
        <FileManager />
      </div>
    );
  }

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
