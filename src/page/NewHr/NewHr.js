// @flow strict

import * as React from 'react';
import './NewHr.css';
import Header from '../Header/Header';
import NewHrDisplay from '../../Components/NewHrDisplay/NewHrDisplay';

function NewHr() {
  return (
    <div>
      <Header></Header>
      <NewHrDisplay></NewHrDisplay>
    </div>
  );
}

export default NewHr;
