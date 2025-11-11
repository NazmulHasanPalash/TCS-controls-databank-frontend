import React from 'react';
import Header from '../Header/Header';
import './Library.css';

import LibraryDisplay from '../../Components/LibraryDIsplay/LibraryDisplay';
import Footer from '../Footer/Footer';
const Library = () => {
  return (
    <div>
      <Header></Header>
      <LibraryDisplay></LibraryDisplay>
      <Footer></Footer>
    </div>
  );
};

export default Library;
