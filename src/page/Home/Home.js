import React from 'react';

import FIrsstHomePageBanner from '../../Components/FirstHomePageBanner/FIrsstHomePageBanner';
import './Home.css';
import Header from '../Header/Header';
import FileManager from '../../Components/FileManager/FileManager';

const Home = () => {
  return (
    <div>
      <Header></Header>
      <FIrsstHomePageBanner></FIrsstHomePageBanner>

      <h1 className="home-page-heading-style mx-auto my-5 text-primary">
        File Manager
      </h1>
      <FileManager></FileManager>
    </div>
  );
};

export default Home;
