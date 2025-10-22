// @flow strict

import * as React from 'react';
import './Admin.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import AdminDisplay from '../../Components/AdminDisplay/AdminDisplay';
import AdminControls from '../../Components/AdminControls/AdminControls';

function Admin() {
  return (
    <div>
      <Header></Header>
      <AdminControls></AdminControls>
      <AdminDisplay></AdminDisplay>
      <Footer></Footer>
    </div>
  );
}

export default Admin;
