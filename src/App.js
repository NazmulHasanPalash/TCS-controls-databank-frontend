// src/App.js
import './App.css';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Home from './page/Home/Home';
import NotFound from './page/NotFound/NotFound';
import PrivateRouter from './Components/PrivateRouter/PrivateRouter';
import Footer from './page/Footer/Footer';
import AuthProvider from './Components/Context/AuthProvider';
import Login from './page/Login/Login';

import Administrative from './page/Administrative/Administrative';
import Storico from './page/Storico/Storico';
import SpaceUp from './page/SpaceUp/SpaceUp';
import CustomerOrder from './page/CustomerOrder/CustomerOrder';
import Library from './page/Library/Library';
import SourcingAndPricing from './page/SourcingAndPricing/SourcingAndPricing';

import Moderator from './page/Moderator/Moderator';
import Operator from './page/Operator/Operator';
import Admin from './page/Admin/Admin';

import AdminRouter from './Components/AdminRouter/AdminRouter';
import ModeratorRouter from './Components/ModeratorRouter/ModeratorRouter';
import OperatorRouter from './Components/OperatorRouter/OperatorRouter';
import UserRouter from './Components/UserRouter/UserRouter';
import AdministrativeSystem from './page/AdministrativeSystem/AdministrativeSystem';
import Sales from './page/Sales/Sales';
import Production from './page/Production/Production';
import Hr from './page/Hr/Hr';
import Finance from './page/Finance/Finance';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Switch>
            {/* Public */}
            <Route exact path="/">
              <Login />
            </Route>
            <Route exact path="/login">
              <Login />
            </Route>

            {/* Authenticated (any signed-in user) */}
            <PrivateRouter exact path="/home">
              <Home />
            </PrivateRouter>
            <PrivateRouter exact path="/files/administrativeSystem">
              <AdministrativeSystem></AdministrativeSystem>
            </PrivateRouter>
            <PrivateRouter exact path="/files/salesSystem">
              <Sales></Sales>
            </PrivateRouter>
            <PrivateRouter exact path="/files/productionSystem">
              <Production></Production>
            </PrivateRouter>
            <PrivateRouter exact path="/files/hrSystem">
              <Hr></Hr>
            </PrivateRouter>
            <PrivateRouter exact path="/files/financeSystem">
              <Finance></Finance>
            </PrivateRouter>

            {/* File manager sections (any signed-in user) */}
            <UserRouter exact path="/files/library">
              <Library />
            </UserRouter>
            <UserRouter exact path="/files/sourcingAndPricing">
              <SourcingAndPricing />
            </UserRouter>
            <UserRouter exact path="/files/administrative">
              <Administrative />
            </UserRouter>
            <UserRouter exact path="/files/customerOrder">
              <CustomerOrder />
            </UserRouter>
            <UserRouter exact path="/files/spaceUp1">
              <Storico />
            </UserRouter>
            <UserRouter exact path="/files/spaceUp2">
              <SpaceUp />
            </UserRouter>

            {/* Role-guarded sections */}
            <ModeratorRouter exact path="/moderator">
              <Moderator />
            </ModeratorRouter>

            <OperatorRouter exact path="/operator">
              <Operator />
            </OperatorRouter>

            <AdminRouter exact path="/admin">
              <Admin />
            </AdminRouter>

            {/* 404 */}
            <Route exact path="*">
              <NotFound />
            </Route>
          </Switch>

          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
