import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import './LibraryCreateFile.css';

// Your Node/Express API base
const API_BASE = 'http://localhost:5000';

const ALLOWED_EXTENSIONS = new Set([
  'html',
  'php',
  'js',
  'jsx',
  'txt',
  'xml',
  'css',
  'c',
  'cpp',
  'java',
  'cs',
  'py',
  'json',
]);

// Basic filename guard: no slashes, control chars, or pure dots
function sanitizeBaseName(name) {
  return String(name)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-') // forbidden chars + slash
    .replace(/\s+/g, ' ')
    .replace(/^\.+$/, ''); // "." or ".."
}

const LibraryCreateFile = ({
  currentFolder,
  userFiles = [],
  userId = null, // not sent here (kept for parity)
  onFileCreated, // optional callback to update parent state
}) => {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setFile('');
    setShowModal(false);
  };

  // Where to place the file on FTP (adjust for your structure)
  const resolveDestPath = () => '/library';

  const handleFileSubmit = async (e) => {
    e.preventDefault();

    // Guard against double submit
    if (loading) return;

    // ---- VALIDATION ----
    const rawInput = (file || '').trim();
    if (!rawInput) {
      toast.error('Please enter a file name!');
      return;
    }

    const parts = rawInput.split('.');
    const rawExt =
      parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    const extension = rawExt || 'txt';

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      toast.error(`Files with .${extension} extension are not allowed!`);
      return;
    }

    const basePart = rawExt ? parts.slice(0, -1).join('.') : rawInput;
    const baseName = sanitizeBaseName(basePart);
    if (!baseName) {
      toast.error('Please provide a valid filename before the extension.');
      return;
    }

    const fileName = `${baseName}.${extension}`;

    // Duplicate check in current folder (case-insensitive)
    const isRoot =
      currentFolder === 'root folder' ||
      !currentFolder ||
      currentFolder._id === 'root';

    const siblings = isRoot
      ? userFiles.filter((f) => (f?.data?.parent ?? '') === '')
      : userFiles.filter(
          (f) => (f?.data?.parent ?? '') === currentFolder?.docId
        );

    const exists = siblings.some(
      (f) =>
        String(f?.data?.name || '').toLowerCase() === fileName.toLowerCase()
    );
    if (exists) {
      toast.error('This file already exists in the folder!');
      return;
    }

    // ---- REQUEST ----
    const payload = {
      dest: resolveDestPath(),
      name: fileName,
      content: '', // default empty file
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Read once safely: handle empty body too
      const text = await res.text();
      let json;
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!res.ok || json.ok === false) {
        throw new Error(json?.error || res.statusText || 'Create failed');
      }

      // Success path — show exactly one success toast
      toast.success(`File "${fileName}" created successfully 🎉`);

      // Let parent update its data (optional)
      if (typeof onFileCreated === 'function') {
        onFileCreated({ name: fileName, path: json?.created || '' });
      }

      // Close modal & reset after success
      reset();
    } catch (err) {
      clearTimeout(timeoutId);
      // eslint-disable-next-line no-console
      console.error(err);
      const msg =
        err?.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : err?.message || 'Please try again.';
      toast.error(`Failed to create file. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Open modal button */}
      <button
        type="button"
        className="btn btn-outline-dark border-1 d-flex align-items-center justify-content-between rounded-2"
        onClick={() => setShowModal(true)}
      >
        <FontAwesomeIcon icon={faFileAlt} />
        <span className="ms-2">Create File</span>
      </button>

      {/* Modal */}
      {showModal && (
        <>
          <div
            className="modal fade show"
            tabIndex="-1"
            role="dialog"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create File</h5>
                  <button
                    type="button"
                    className="btn btn-white"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <form onSubmit={handleFileSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. index.html, index.js, index.txt"
                        value={file}
                        onChange={(e) => setFile(e.target.value)}
                        autoFocus
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Add File'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  );
};

LibraryCreateFile.propTypes = {
  currentFolder: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  userFiles: PropTypes.array,
  userId: PropTypes.string,
  onFileCreated: PropTypes.func,
};

LibraryCreateFile.defaultProps = {
  currentFolder: 'root folder',
  userFiles: [],
  userId: null,
  onFileCreated: undefined,
};

export default LibraryCreateFile;
