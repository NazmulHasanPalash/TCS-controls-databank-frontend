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
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <Login></Login>
            </Route>
            <PrivateRouter exact path="/home">
              <Home></Home>
            </PrivateRouter>

            <Route exact path="/login">
              <Login></Login>
            </Route>
            <PrivateRouter exact path="/files/library">
              <Library></Library>
            </PrivateRouter>
            <PrivateRouter exact path="/files/sourcingAndPricing">
              <SourcingAndPricing></SourcingAndPricing>
            </PrivateRouter>
            <PrivateRouter exact path="/files/administrative">
              <Administrative></Administrative>
            </PrivateRouter>
            <PrivateRouter exact path="/files/customerOrder">
              <CustomerOrder></CustomerOrder>
            </PrivateRouter>
            <PrivateRouter exact path="/files/spaceUp1">
              <Storico></Storico>
            </PrivateRouter>
            <PrivateRouter exact path="/files/spaceUp2">
              <SpaceUp></SpaceUp>
            </PrivateRouter>

            <PrivateRouter exact path="/moderator">
              <Moderator></Moderator>
            </PrivateRouter>
            <PrivateRouter exact path="/operator">
              <Operator></Operator>
            </PrivateRouter>
            <PrivateRouter exact path="/admin">
              <Admin></Admin>
            </PrivateRouter>

            <Route exact path="*">
              <NotFound></NotFound>
            </Route>
          </Switch>
          <Footer></Footer>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
