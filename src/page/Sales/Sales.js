// @flow strict

import * as React from 'react';
import './Sales.css';
import Header from '../Header/Header';
import SalesDisplay from '../../Components/SalesDisplay/SalesDisplay';

function Sales() {
  return (
    <div>
      <Header></Header>
      <SalesDisplay></SalesDisplay>
    </div>
  );
}

export default Sales;
