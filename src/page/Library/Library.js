import React from 'react';
import Header from '../Header/Header';
import './Library.css';

import LibraryDisplay from '../../Components/LibraryDIsplay/LibraryDisplay';
const Library = () => {
  return (
    <div>
      <Header></Header>

      <LibraryDisplay></LibraryDisplay>
    </div>
  );
};

export default Library;
