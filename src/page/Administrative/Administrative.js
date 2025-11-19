import React from 'react';
import './Administrative.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import AdministrativeDisplay from '../../Components/AdministrativeDisplay/AdministrativeDisplay';

const Administrative = () => {
  return (
    <div>
      <Header></Header>
      <AdministrativeDisplay></AdministrativeDisplay>
    </div>
  );
};

export default Administrative;
