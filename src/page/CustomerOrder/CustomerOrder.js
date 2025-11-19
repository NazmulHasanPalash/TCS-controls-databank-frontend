import React from 'react';
import './CustomerOrder.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import CustomerOrderDisplay from '../../Components/CustomerOrderDisplay/CustomerOrderDisplay';

const CustomerOrder = () => {
  return (
    <div>
      <Header></Header>
      <CustomerOrderDisplay></CustomerOrderDisplay>
    </div>
  );
};

export default CustomerOrder;
