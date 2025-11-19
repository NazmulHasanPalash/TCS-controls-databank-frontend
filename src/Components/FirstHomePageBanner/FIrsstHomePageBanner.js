import React from 'react';
import './FirstHomePageBanner.css';

const FirstHomePageBanner = () => {
  // Use PUBLIC_URL so the image works from any route
  const bannerImg =
    (process.env.PUBLIC_URL || '') + '/image/img/covers/banner-image.png';

  return (
    <section className="banner-margin fhb-root w-100 mx-auto">
      <div className="fhb-shell">
        <div className="card mb-3 banner-style fhb-card">
          <div className="row g-0 align-items-center">
            {/* Text side */}
            <div className="col-md-6">
              <div className="card-body fhb-copy">
                <p className="fhb-kicker">TCS Data Bank</p>
                <h1 className="fhb-title">
                  Manage, share &amp; find files
                  <span className="fhb-title-accent"> in seconds.</span>
                </h1>
                <p className="fhb-subtitle">
                  A secure, central workspace for TCS Controls Sdn Bhd team
                  documents, media, and project files — organized and always
                  within reach.
                </p>
                <div className="fhb-meta-row">
                  <div className="fhb-meta-pill">Role-based access</div>
                  <div className="fhb-meta-dot" />
                  <div className="fhb-meta-pill">Fast search</div>
                  <div className="fhb-meta-dot" />
                  <div className="fhb-meta-pill">Centralized storage</div>
                </div>
              </div>
            </div>

            {/* Visual side */}
            <div className="col-md-6">
              <div className="fhb-media-wrapper">
                <div className="fhb-orbit fhb-orbit-1" />
                <div className="fhb-orbit fhb-orbit-2" />
                <img
                  src={bannerImg}
                  className="img-fluid rounded-start fhb-image"
                  alt="TCS Data Bank banner"
                  onError={(e) => {
                    // Fail silently if image missing
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FirstHomePageBanner;
