// @flow strict

import * as React from 'react';
import './NewFinance.css';
import Header from '../Header/Header';
import NewFinanceDisplay from '../../Components/NewFinanceDisplay/NewFinanceDisplay';

function NewFinance() {
  return (
    <div>
      <Header></Header>
      <NewFinanceDisplay></NewFinanceDisplay>
    </div>
  );
}

export default NewFinance;
