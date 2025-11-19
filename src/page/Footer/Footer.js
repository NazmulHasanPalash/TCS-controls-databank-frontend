import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="tcs-footer-root ">
      <div className="tcs-footer-gradient" />
      <div className="tcs-footer-shell mx-auto">
        <div className="tcs-footer-bar text-center text-white">
          <div className="tcs-footer-glow" />
          <p className="tcs-footer-text mb-0">
            Copyright 2025 TCS Controls Sdn Bhd 200801028053 (New) / 829380-T
            (Old). All Rights&nbsp;Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
