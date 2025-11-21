// @flow strict

import * as React from 'react';
import './Moderator.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import ModeratorDisplay from '../../Components/ModeratorDisplay/ModeratorDisplay';
import ModeratorControls from '../../Components/ModeratorControls/ModeratorControls';

function Moderator() {
  return (
    <div>
      <Header></Header>
      <ModeratorDisplay></ModeratorDisplay>
      <ModeratorControls></ModeratorControls>
    </div>
  );
}

export default Moderator;
