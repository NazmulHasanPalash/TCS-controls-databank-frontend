// @flow strict

import * as React from 'react';
import './Production.css';
import Header from '../Header/Header';
import ProductionDisplay from '../../Components/ProductionDisplay/ProductionDisplay';

function Production() {
  return (
    <div>
      <Header></Header>
      <ProductionDisplay></ProductionDisplay>
    </div>
  );
}

export default Production;
