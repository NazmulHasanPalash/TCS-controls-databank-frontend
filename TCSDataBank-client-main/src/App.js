import './App.css';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './page/Home/Home';
import NotFound from './page/NotFound/NotFound';
import PrivateRouter from './Components/PrivateRouter/PrivateRouter';
import Footer from './page/Footer/Footer';
import AuthProvider from './Components/Context/AuthProvider';
import Login from './page/Login/Login';
import Myfile from './page/MyFiles/Myfile';
import ManageFiles from './page/MangeFiles/ManageFiles';
import SourcingPricing from './page/SourcingPricing/SourcingPricing';
import Administrative from './page/Administrative/Administrative';
import Storico from './page/Storico/Storico';
import SpaceUp from './page/SpaceUp/SpaceUp';
import CustomerOrder from './page/CustomerOrder/CustomerOrder'
import Library from './page/Library/Library';
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
            <PrivateRouter exact path="/files/sourcingPricing">
              <SourcingPricing></SourcingPricing>
            </PrivateRouter>
            <PrivateRouter exact path="/files/administrative">
              <Administrative></Administrative>
            </PrivateRouter>
            <PrivateRouter exact path="/files/storico">
              <Storico></Storico>
            </PrivateRouter>
            <PrivateRouter exact path="/files/spaceUp">
              <SpaceUp></SpaceUp>
            </PrivateRouter>
            <PrivateRouter exact path="/files/customerOrder">
              <CustomerOrder></CustomerOrder>
            </PrivateRouter>
            <PrivateRouter exact path="/myFiles">
              <Myfile></Myfile>
            </PrivateRouter>
            <PrivateRouter exact path="/manageFiles">
              <ManageFiles></ManageFiles>
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