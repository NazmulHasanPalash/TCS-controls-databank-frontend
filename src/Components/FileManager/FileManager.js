import * as React from 'react';
import './FileManager.css';
import { HashLink } from 'react-router-hash-link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolderOpen, // Library
  faTags, // Sourcing Pricing
  faGears, // Administrative
  faClockRotateLeft, // Space UP-1
  faRocket, // Space UP-2
  faCartShopping, // Customer Order
} from '@fortawesome/free-solid-svg-icons';

function FileManager() {
  return (
    <section className="tcs-fm-root my-5">
      <div className="tcs-fm-shell">
        {/* Header / title */}
        <header className="tcs-fm-header text-center">
          <h1 className="tcs-fm-title">TCS Databank</h1>
          <p className="tcs-fm-subtitle">
            Quickly access your core repositories with a clean, minimal, and
            focused layout.
          </p>
        </header>

        {/* Cards grid */}
        <div className="row row-cols-1 row-cols-md-3 g-4 tcs-fm-grid">
          {/* Library */}
          <HashLink
            className="card-link-style tcs-fm-card-link"
            to="/files/library"
          >
            <div className="col">
              <div className="card h-100 card-style tcs-fm-card tcs-fm-card-1">
                <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                  <div className="tcs-fm-icon-pill">
                    <FontAwesomeIcon
                      icon={faFolderOpen}
                      className="tcs-fm-icon"
                    />
                  </div>
                  <h5 className="card-title tcs-fm-card-title">Library</h5>
                  <p className="tcs-fm-card-text">
                    Central repository for shared reference documents.
                  </p>
                </div>
              </div>
            </div>
          </HashLink>

          {/* Sourcing Pricing */}
          <HashLink
            className="card-link-style tcs-fm-card-link"
            to="/files/sourcingAndPricing"
          >
            <div className="col">
              <div className="card h-100 card-style tcs-fm-card tcs-fm-card-2">
                <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                  <div className="tcs-fm-icon-pill">
                    <FontAwesomeIcon icon={faTags} className="tcs-fm-icon" />
                  </div>
                  <h5 className="card-title tcs-fm-card-title">
                    Sourcing &amp; Pricing
                  </h5>
                  <p className="tcs-fm-card-text">
                    Supplier quotes, pricing sheets, and sourcing docs.
                  </p>
                </div>
              </div>
            </div>
          </HashLink>

          {/* Administrative */}
          <HashLink
            className="card-link-style tcs-fm-card-link"
            to="/files/administrative"
          >
            <div className="col">
              <div className="card h-100 card-style tcs-fm-card tcs-fm-card-3">
                <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                  <div className="tcs-fm-icon-pill">
                    <FontAwesomeIcon icon={faGears} className="tcs-fm-icon" />
                  </div>
                  <h5 className="card-title tcs-fm-card-title">
                    Administrative
                  </h5>
                  <p className="tcs-fm-card-text">
                    Internal operations, forms, and administrative files.
                  </p>
                </div>
              </div>
            </div>
          </HashLink>

          {/* Space UP-1 */}
          <HashLink
            className="card-link-style tcs-fm-card-link"
            to="/files/storico"
          >
            <div className="col">
              <div className="card h-100 card-style tcs-fm-card tcs-fm-card-4">
                <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                  <div className="tcs-fm-icon-pill">
                    <FontAwesomeIcon
                      icon={faClockRotateLeft}
                      className="tcs-fm-icon"
                    />
                  </div>
                  <h5 className="card-title tcs-fm-card-title">Space UP-1</h5>
                  <p className="tcs-fm-card-text">
                    Structured archives and historical project materials.
                  </p>
                </div>
              </div>
            </div>
          </HashLink>

          {/* Space UP-2 */}
          <HashLink
            className="card-link-style tcs-fm-card-link"
            to="/files/spaceUp"
          >
            <div className="col">
              <div className="card h-100 card-style tcs-fm-card tcs-fm-card-5">
                <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                  <div className="tcs-fm-icon-pill">
                    <FontAwesomeIcon icon={faRocket} className="tcs-fm-icon" />
                  </div>
                  <h5 className="card-title tcs-fm-card-title">Space UP-2</h5>
                  <p className="tcs-fm-card-text">
                    Exploration space for conceptual or experimental files.
                  </p>
                </div>
              </div>
            </div>
          </HashLink>

          {/* Customer Order */}
          <HashLink
            className="card-link-style tcs-fm-card-link"
            to="/files/customerOrder"
          >
            <div className="col">
              <div className="card h-100 card-style tcs-fm-card tcs-fm-card-6">
                <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                  <div className="tcs-fm-icon-pill">
                    <FontAwesomeIcon
                      icon={faCartShopping}
                      className="tcs-fm-icon"
                    />
                  </div>
                  <h5 className="card-title tcs-fm-card-title">
                    Customer Order
                  </h5>
                  <p className="tcs-fm-card-text">
                    Order files, client deliverables, and related documents.
                  </p>
                </div>
              </div>
            </div>
          </HashLink>
        </div>
      </div>
    </section>
  );
}

export default FileManager;
