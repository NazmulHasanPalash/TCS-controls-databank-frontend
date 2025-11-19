// @flow strict

import * as React from 'react';
import './Finance.css';
import Header from '../Header/Header';
import FinanceDisplay from '../../Components/FinanceDisplay/FinanceDisplay';

function Finance() {
  return (
    <div>
      <Header></Header>
      <FinanceDisplay></FinanceDisplay>
    </div>
  );
}

export default Finance;
