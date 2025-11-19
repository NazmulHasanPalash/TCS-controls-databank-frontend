// @flow strict

import * as React from 'react';
import './AdministrativeSystem';
import AdministrativeSystemDisplay from '../../Components/AdministariveSystemDisplay/AdministrativeSystemDisplay';
import Header from '../Header/Header';
function AdministrativeSystem() {
  return (
    <div>
      \<Header></Header>
      <AdministrativeSystemDisplay></AdministrativeSystemDisplay>
    </div>
  );
}

export default AdministrativeSystem;
