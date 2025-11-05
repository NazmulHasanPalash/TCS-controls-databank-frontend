import * as React from 'react';
import './FileManager.css';
import { HashLink } from 'react-router-hash-link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolderOpen, // Library
  faTags, // Sourcing Pricing
  faGears, // Administrative
  faClockRotateLeft, // Storico (history/archival)
  faRocket, // Space UP
  faCartShopping, // Customer Order
} from '@fortawesome/free-solid-svg-icons';

function FileManager() {
  return (
    <div>
      <div className="row row-cols-1 row-cols-md-3 g-4 w-75 mx-auto my-5 text-center">
        <HashLink className="card-link-style" to="/files/library">
          <div className="col">
            <div className="card h-100 card-style">
              <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                <FontAwesomeIcon
                  icon={faFolderOpen}
                  size="3x"
                  className="text-primary mb-3"
                />
                <h5 className="card-title">Library</h5>
              </div>
            </div>
          </div>
        </HashLink>

        <HashLink className="card-link-style" to="/files/sourcingAndPricing">
          <div className="col">
            <div className="card h-100 card-style">
              <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                <FontAwesomeIcon
                  icon={faTags}
                  size="3x"
                  className="text-primary mb-3"
                />
                <h5 className="card-title">Sourcing Pricing</h5>
              </div>
            </div>
          </div>
        </HashLink>

        <HashLink className="card-link-style" to="/files/administrative">
          <div className="col">
            <div className="card h-100 card-style">
              <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                <FontAwesomeIcon
                  icon={faGears}
                  size="3x"
                  className="text-primary mb-3"
                />
                <h5 className="card-title">Administrative</h5>
              </div>
            </div>
          </div>
        </HashLink>

        <HashLink className="card-link-style" to="/files/storico">
          <div className="col">
            <div className="card h-100 card-style">
              <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                <FontAwesomeIcon
                  icon={faClockRotateLeft}
                  size="3x"
                  className="text-primary mb-3"
                />
                <h5 className="card-title">Space UP-1</h5>
              </div>
            </div>
          </div>
        </HashLink>

        <HashLink className="card-link-style" to="/files/spaceUp">
          <div className="col">
            <div className="card h-100 card-style">
              <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                <FontAwesomeIcon
                  icon={faRocket}
                  size="3x"
                  className="text-primary mb-3"
                />
                <h5 className="card-title">Space UP-2</h5>
              </div>
            </div>
          </div>
        </HashLink>

        <HashLink className="card-link-style" to="/files/customerOrder">
          <div className="col">
            <div className="card h-100 card-style">
              <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                <FontAwesomeIcon
                  icon={faCartShopping}
                  size="3x"
                  className="text-primary mb-3"
                />
                <h5 className="card-title">Customer Order</h5>
              </div>
            </div>
          </div>
        </HashLink>
      </div>
    </div>
  );
}

export default FileManager;
