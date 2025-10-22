// @flow strict

import * as React from 'react';
import './Moderator.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import ModeratorDisplay from '../../Components/ModeratorDisplay/ModeratorDisplay';

function Moderator() {
  return (
    <div>
      <Header></Header>
      <ModeratorDisplay></ModeratorDisplay>
      <Footer></Footer>
    </div>
  );
}

export default Moderator;
