// @flow strict

import * as React from 'react';
import './Operator.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import OperatorDisplay from '../../Components/OperatorDisplay/OperatorDisplay';

function Operator() {
  return (
    <div>
      <Header></Header>
      <OperatorDisplay></OperatorDisplay>
    </div>
  );
}

export default Operator;
