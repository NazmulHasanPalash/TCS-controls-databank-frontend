// @flow strict

import * as React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import SourcingAndPricingDisplay from '../../Components/SourcingAndPricingDisplay/SourcingAndPricingDisplay';

function SourcingAndPricing() {
  return (
    <div>
      <Header></Header>
      <SourcingAndPricingDisplay></SourcingAndPricingDisplay>
    </div>
  );
}

export default SourcingAndPricing;
