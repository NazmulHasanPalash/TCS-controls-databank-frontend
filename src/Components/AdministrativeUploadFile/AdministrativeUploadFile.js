// src/Components/AdministrativeUploadFile/AdministrativeUploadFile.jsx
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button, Form, Modal, ProgressBar, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileUpload } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdministrativeUploadFile.css';

/* ================= Config ================= */
function ensureHttpBase(u) {
  let s = String(u || '').trim();
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s.replace(/\/+$/, '');
}
const API_BASE = ensureHttpBase(
  process.env.REACT_APP_API_BASE || 'http://localhost:5000'
);
const ADMIN_ROOT_RAW =
  process.env.REACT_APP_ADMIN_START_PATH || '/administrative';

/* ================= Helpers ================= */
const normalizePath = (p) =>
  (
    '/' +
    String(p || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
  )
    .replace(/\/{2,}/g, '/')
    .replace(/\/+$/, '') || '/administrative';

const ADMIN_ROOT = normalizePath(ADMIN_ROOT_RAW);

const clampToAdministrative = (dest) => {
  const root = ADMIN_ROOT;
  const wanted = normalizePath(dest || root);
  if (wanted === root) return root;
  return wanted.startsWith(root + '/') ? wanted : root;
};

const fmtBytes = (n) => {
  if (!Number.isFinite(n)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i ? 2 : v < 100 && i ? 1 : 0)} ${units[i]}`;
};

/* ================= Component ================= */
const AdministrativeUploadFile = ({ currentPath, userId, onFileUploaded }) => {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);

  // progress state
  const [isUploading, setIsUploading] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [bytesLoaded, setBytesLoaded] = useState(0);
  const [expectedBytes, setExpectedBytes] = useState(0); // file.size

  // cancel support
  const abortRef = useRef(null);

  const destPath = clampToAdministrative(currentPath || ADMIN_ROOT);

  const resetState = () => {
    setFile(null);
    setIsUploading(false);
    setProgressPct(0);
    setBytesLoaded(0);
    setExpectedBytes(0);
    abortRef.current = null;
  };

  const handleOpen = () => {
    resetState();
    setShowModal(true);
  };

  const handleCancelUpload = () => {
    try {
      abortRef.current?.abort();
      toast.info('⏹ Upload canceled.');
    } catch {}
    setIsUploading(false);
    abortRef.current = null;
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('⚠️ Please select a file!');
      return;
    }

    const fd = new FormData();
    fd.append('path', destPath);
    fd.append('file', file);
    if (userId != null) fd.append('userId', String(userId));

    // progress setup
    const size = Number(file.size) || 0;
    setExpectedBytes(size);
    setBytesLoaded(0);
    setProgressPct(0);
    setIsUploading(true);

    // controller for cancel
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await axios.post(`${API_BASE}/api/upload`, fd, {
        signal: controller.signal,
        onUploadProgress: (evt) => {
          const loaded = evt.loaded ?? 0;
          setBytesLoaded(loaded);
          const denom = size || evt.total || 1;
          setProgressPct(Math.min(100, Math.round((loaded / denom) * 100)));
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 0,
        withCredentials: true,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        validateStatus: () => true,
      });

      // Accept either { ok, uploaded: { to } } or { ok, to }
      const ok = res?.data?.ok;
      const savedTo = res?.data?.uploaded?.to || res?.data?.to;
      if (!ok || !savedTo) {
        throw new Error(res?.data?.error || 'Upload failed');
      }

      onFileUploaded?.({
        name: file.name,
        to: savedTo,
        dest: destPath,
        uid: userId,
      });

      toast.success(`✅ "${file.name}" uploaded to ${destPath}`);
      resetState();
      setShowModal(false);
    } catch (err) {
      if (err?.name === 'CanceledError' || axios.isCancel?.(err)) {
        // canceled by user; toast already shown
      } else {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Upload failed. Please try again.';
        toast.error(`❌ ${msg}`);
      }
    } finally {
      // finish bar visually only if it wasn't canceled
      setProgressPct((p) =>
        abortRef.current == null && isUploading ? Math.max(p, 100) : p
      );
      setIsUploading(false);
      abortRef.current = null;
    }
  };

  const modalTitle = isUploading
    ? 'Uploading...'
    : progressPct === 100
    ? 'Uploaded'
    : 'Upload File';

  return (
    <>
      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => (!isUploading ? setShowModal(false) : null)}
        centered
        backdrop={isUploading ? 'static' : true}
        keyboard={!isUploading}
      >
        <Modal.Header closeButton={!isUploading}>
          <Modal.Title>{modalTitle}</Modal.Title>
          {isUploading && (
            <div className="ms-auto">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleCancelUpload}
              >
                Cancel upload
              </Button>
            </div>
          )}
        </Modal.Header>
        <Modal.Body>
          {/* Uploading state */}
          {isUploading ? (
            <>
              <div className="small text-muted mb-2">
                Destination:&nbsp;<code>{destPath}</code>
              </div>
              {file && (
                <div className="small text-muted mb-2">
                  File:&nbsp;<strong>{file.name}</strong> • Size:&nbsp;
                  <strong>{fmtBytes(expectedBytes)}</strong>
                </div>
              )}
              <div className="d-flex align-items-center gap-2 mb-2">
                <Spinner animation="border" size="sm" />
                <span className="small text-muted">
                  Please keep this window open until upload completes…
                </span>
              </div>
              <ProgressBar now={progressPct} label={`${progressPct}%`} />
              <div className="d-flex justify-content-between small mt-1">
                <span>
                  Sent:&nbsp;<strong>{fmtBytes(bytesLoaded)}</strong>
                </span>
                <span>
                  File size:&nbsp;<strong>{fmtBytes(expectedBytes)}</strong>
                </span>
              </div>
            </>
          ) : progressPct === 100 ? (
            <>
              <div className="small text-muted mb-2">
                Destination:&nbsp;<code>{destPath}</code>
              </div>
              {file && (
                <div className="small text-muted mb-2">
                  File:&nbsp;<strong>{file.name}</strong> • Size:&nbsp;
                  <strong>{fmtBytes(file.size || 0)}</strong>
                </div>
              )}
              <div className="text-success">✅ Upload complete.</div>
              <div className="d-flex justify-content-end mt-3">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            // Initial form (any file type allowed)
            <Form onSubmit={handleFileSubmit} encType="multipart/form-data">
              <div className="small text-muted mb-2">
                Destination:&nbsp;<code>{destPath}</code>
              </div>
              <Form.Group controlId="formAdministrativeFile" className="my-2">
                <Form.Control
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={isUploading}
                />
              </Form.Group>

              {/* Show selected file name + size BEFORE uploading */}
              {file && (
                <div className="mt-2 small">
                  Selected:&nbsp;<strong>{file.name}</strong>
                  &nbsp;• Size:&nbsp;<strong>{fmtBytes(file.size || 0)}</strong>
                </div>
              )}

              <Button
                type="submit"
                className="w-100 mt-3"
                variant="primary"
                disabled={isUploading || !file}
              >
                Upload File
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Trigger button */}
      <Button
        onClick={handleOpen}
        variant="outline-dark"
        className="d-flex align-items-center rounded-2"
      >
        <FontAwesomeIcon icon={faFileUpload} />
        &nbsp; Upload File
      </Button>

      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
};

AdministrativeUploadFile.propTypes = {
  /** The exact path the user is viewing (e.g. "/administrative", "/administrative/HR/2024") */
  currentPath: PropTypes.string,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Callback so parent can refresh the listing after success */
  onFileUploaded: PropTypes.func,
};

export default AdministrativeUploadFile;
