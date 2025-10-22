import React from 'react';
import './FirstHomePageBanner.css';

const FIrsstHomePageBanner = () => {
  return (
    <div className=" banner-margin  w-100 mx-auto">
      <div className="card mb-3 w-75 mx-auto banner-style">
        <div className="row g-0 align-items-center">
          <div className="col-md-6 p-5">
            <div className="card-body">
              <h5 className="card-title">TCS Data Bank</h5>
              <h3 className="card-title text-primary">
                Manage, Share, and Find Files in Seconds
              </h3>
              <p className="card-text">
                A secure workspace for TCS controls sbn bhd team’s documents,
                media, and everything in between.
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <img
              src="image\img\covers\banner-image.png"
              className="img-fluid rounded-start"
              alt="banner"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FIrsstHomePageBanner;
