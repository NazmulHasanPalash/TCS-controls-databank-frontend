// src/Components/AdministrativeCreateFolder/AdministrativeCreateFolder.jsx
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdministrativeCreateFolder.css';

// Your API base + administrative base on FTP
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const ADMIN_BASE = '/administrative';

/** Build the parent FTP path based on your folder object shape */
function resolveParentPath(currentFolder) {
  if (
    !currentFolder ||
    currentFolder === 'root folder' ||
    currentFolder._id === 'root'
  ) {
    return ADMIN_BASE;
  }

  // Prefer a direct path if present
  const fullPath =
    currentFolder.ftpPath ||
    currentFolder.fullPath ||
    currentFolder.pathOnFtp ||
    currentFolder.data?.ftpPath ||
    currentFolder.data?.fullPath;

  if (typeof fullPath === 'string' && fullPath.trim()) return fullPath.trim();

  // Fallback: build from breadcrumb data
  const crumbs = currentFolder?.data?.path ?? currentFolder?.path ?? [];
  const names = Array.isArray(crumbs)
    ? crumbs.map((c) => c?.name).filter(Boolean)
    : [];
  const leafName = currentFolder?.data?.name ?? currentFolder?.name ?? '';

  const parts = [ADMIN_BASE, ...names, leafName].filter(Boolean);
  return parts.join('/').replace(/\/{2,}/g, '/');
}

/** Sanitize a folder name: remove slashes, collapse spaces, limit chars, disallow "."/".." */
function sanitizeFolderName(raw) {
  const name = String(raw || '')
    .trim()
    .replace(/[\\/]+/g, '-') // no slashes
    .replace(/\s+/g, ' ') // collapse spaces
    .replace(/[^A-Za-z0-9 _.-]/g, ''); // keep common safe chars
  if (!name || name === '.' || name === '..') return '';
  return name;
}

const AdministrativeCreateFolder = ({
  currentFolder,
  onAdministrativeCreateFolder,
  siblings, // optional array of sibling folder names or objects with {name}
  buttonVariant,
  buttonClassName,
  modalTitle,
}) => {
  const [show, setShow] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);

  const parentPath = useMemo(
    () => resolveParentPath(currentFolder),
    [currentFolder]
  );

  const normalizedSiblings = useMemo(() => {
    if (!Array.isArray(siblings)) return new Set();
    return new Set(
      siblings
        .map((s) => (typeof s === 'string' ? s : s?.name))
        .filter(Boolean)
        .map((n) => String(n).toLowerCase())
    );
  }, [siblings]);

  const reset = () => {
    setFolderName('');
    setShow(false);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // guard double submit

    const clean = sanitizeFolderName(folderName);
    if (!clean) {
      toast.error('⚠️ Please enter a valid folder name.');
      return;
    }
    if (normalizedSiblings.has(clean.toLowerCase())) {
      toast.error('⚠️ A folder with this name already exists here.');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/folder/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // add credentials: 'include' if your server uses cookies/sessions
        body: JSON.stringify({ parent: parentPath, name: clean }),
        signal: controller.signal,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.error || res.statusText || 'Folder create failed'
        );
      }

      toast.success(`✅ Folder "${clean}" created successfully!`);

      onAdministrativeCreateFolder?.({
        id: json.created,
        name: clean,
        parent: parentPath,
        ftpPath: json.created,
        path: [{ id: json.created, name: clean }],
      });

      reset();
    } catch (err) {
      if (err?.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        // eslint-disable-next-line no-console
        console.error(err);
        toast.error(
          `❌ Failed to create folder: ${err?.message || 'Unknown error'}`
        );
      }
      setLoading(false);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={() => setShow(true)}
        variant={buttonVariant}
        className={buttonClassName || 'd-flex align-items-center rounded-2'}
      >
        <FontAwesomeIcon icon={faFolderPlus} />
        <span className="ms-2">Create Folder</span>
      </Button>

      {/* Modal */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="mb-2 small text-muted">
              Parent path: <code>{parentPath}</code>
            </div>
            <Form.Group controlId="formFolderName" className="mb-3">
              <Form.Control
                type="text"
                placeholder="Enter folder name…"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </Form.Group>
            <Button
              type="submit"
              className="w-100"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Add Folder'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Toasts */}
      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
};

AdministrativeCreateFolder.propTypes = {
  currentFolder: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onAdministrativeCreateFolder: PropTypes.func, // (meta) => void
  siblings: PropTypes.array,
  buttonVariant: PropTypes.string,
  buttonClassName: PropTypes.string,
  modalTitle: PropTypes.string,
};

AdministrativeCreateFolder.defaultProps = {
  currentFolder: 'root folder',
  onAdministrativeCreateFolder: undefined,
  siblings: undefined,
  buttonVariant: 'outline-dark',
  buttonClassName: undefined,
  modalTitle: 'Create New Folder',
};

export default AdministrativeCreateFolder;
