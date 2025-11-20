// @flow strict

import * as React from 'react';
import './NewProduction.css';
import Header from '../Header/Header';
import NewProductionDisplay from '../../Components/NewProductionDisplay/NewProductionDisplay';

function NewProduction() {
  return (
    <div>
      <Header></Header>
      <NewProductionDisplay></NewProductionDisplay>
    </div>
  );
}

export default NewProduction;
