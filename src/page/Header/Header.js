import React from 'react';
import './Header.css';
import { HashLink } from 'react-router-hash-link';
import useAuth from '../../Components/Hooks/useAuth';

const Header = () => {
  const { user, loading, signOut, logOut } = useAuth(); // support either name from your provider

  const handleLogout = async () => {
    try {
      // call whichever exists
      if (typeof logOut === 'function') await logOut();
      else if (typeof signOut === 'function') await signOut();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Logout failed:', e);
    }
  };

  return (
    <div className="w-100 mx-auto margin-header">
      <nav className="navbar navbar-expand-lg navbar-dark header-style">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarTogglerDemo01"
            aria-controls="navbarTogglerDemo01"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
            {/* Use HashLink so SPA routing doesn’t reload the page */}
            <HashLink className="navbar-brand mx-auto" to="/home#home">
              <span className="span-style text-primary icon-style">
                <img
                  className="second-icon img-fluid"
                  src="image/img/tcscontrols.svg"
                  alt="TCS Controls"
                />
              </span>
            </HashLink>

            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 link-style d-flex align-items-center">
              {/* While auth is loading, avoid flicker */}
              {loading ? null : user?.email ? (
                <>
                  <li className="nav-item">
                    <HashLink
                      className="nav-link active header-text-style"
                      to="/home#home"
                    >
                      Home
                    </HashLink>
                  </li>

                  <li className="nav-item dropdown">
                    <button
                      className="btn header-text-style dropdown-toggle active"
                      id="fileManagerMenu"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      type="button"
                    >
                      File manager
                    </button>
                    <ul
                      className="dropdown-menu text-color w-100"
                      aria-labelledby="fileManagerMenu"
                    >
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/library"
                        >
                          Library
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/sourcingAndPricing"
                        >
                          Sourcing and Pricing
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/administrative"
                        >
                          Administrative
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/customerOrder"
                        >
                          Customer Order
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/spaceUp1"
                        >
                          Space UP-1
                        </HashLink>
                      </li>
                      <li>
                        <HashLink
                          className="nav-link active dropdown-text-style"
                          to="/files/spaceUp2"
                        >
                          Space UP-2
                        </HashLink>
                      </li>
                    </ul>
                  </li>

                  <li className="nav-item">
                    <HashLink
                      className="nav-link active header-text-style"
                      to="/moderator"
                    >
                      Moderator
                    </HashLink>
                  </li>
                  <li className="nav-item">
                    <HashLink
                      className="nav-link active header-text-style"
                      to="/operator"
                    >
                      Operator
                    </HashLink>
                  </li>
                  <li className="nav-item">
                    <HashLink
                      className="nav-link active header-text-style"
                      to="/admin"
                    >
                      Admin
                    </HashLink>
                  </li>

                  <li className="nav-item header-text-style">
                    <button
                      onClick={handleLogout}
                      type="button"
                      className="btn btn-light mx-5"
                    >
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <HashLink
                    className="nav-link active header-text-style"
                    to="/login"
                  >
                    Login
                  </HashLink>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
