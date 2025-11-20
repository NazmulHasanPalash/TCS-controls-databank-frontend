// @flow strict

import * as React from 'react';
import './NewSales.css';
import Header from '../Header/Header';
import NewSalesDisplay from '../../Components/NewSalesDisplay/NewSalesDisplay';

function NewSales() {
  return (
    <div>
      <Header></Header>
      <NewSalesDisplay></NewSalesDisplay>
    </div>
  );
}

export default NewSales;
