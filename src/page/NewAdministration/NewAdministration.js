// @flow strict

import * as React from 'react';
import './NewAdministration.css';
import Header from '../Header/Header';
import NewAdministrationDisplay from '../../Components/NewAdministrationDisplay/NewAdministrationDisplay';

function NewAdministration() {
  return (
    <div>
      <Header></Header>
      <NewAdministrationDisplay></NewAdministrationDisplay>
    </div>
  );
}

export default NewAdministration;
