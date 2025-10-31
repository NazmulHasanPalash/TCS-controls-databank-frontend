// src/Components/ModeratorCreateFolder/ModeratorCreateFolder.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ModeratorCreateFolder.css';

/* ======================== Config ======================== */
const RAW_API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const MOD_BASE =
  process.env.REACT_APP_MODERATOR_START_PATH ||
  process.env.REACT_APP_MOD_BASE ||
  '/moderator';

/** Ensure API base has scheme and no trailing slash */
function normalizeBaseUrl(url) {
  let u = String(url || '').trim();
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u.replace(/\/+$/, '');
}
const API_BASE = normalizeBaseUrl(RAW_API_BASE);

/* ======================== Helpers ======================== */

/** Build the parent path based on your folder object shape */
function resolveParentPath(currentFolder) {
  if (
    !currentFolder ||
    currentFolder === 'root folder' ||
    currentFolder._id === 'root'
  ) {
    return MOD_BASE;
  }

  // Prefer a direct path if present
  const fullPath =
    currentFolder.ftpPath ||
    currentFolder.fullPath ||
    currentFolder.pathOnFtp ||
    currentFolder.data?.ftpPath ||
    currentFolder.data?.fullPath;

  if (typeof fullPath === 'string' && fullPath.trim()) {
    return fullPath.trim().replace(/\/{2,}/g, '/');
  }

  // Fallback: build from breadcrumb data
  const crumbs = currentFolder?.data?.path ?? currentFolder?.path ?? [];
  const names = Array.isArray(crumbs)
    ? crumbs.map((c) => c?.name).filter(Boolean)
    : [];
  const leafName = currentFolder?.data?.name ?? currentFolder?.name ?? '';

  const parts = [MOD_BASE, ...names, leafName].filter(Boolean);
  return parts.join('/').replace(/\/{2,}/g, '/');
}

/** Sanitize a folder name: remove slashes, collapse spaces, disallow "."/".." */
function sanitizeFolderName(raw) {
  const name = String(raw || '')
    .trim()
    .replace(/[\\/]+/g, '-') // no slashes
    .replace(/\s+/g, ' ') // collapse spaces
    .replace(/[^A-Za-z0-9 _.-]/g, ''); // keep common safe chars
  if (!name || name === '.' || name === '..') return '';
  // avoid leading/trailing dots/spaces
  return name.replace(/^[.\s]+|[.\s]+$/g, '');
}

/* ======================== Component ======================== */

const ModeratorCreateFolder = ({
  currentFolder,
  onModeratorCreateFolder,
  siblings,
  buttonVariant,
  buttonClassName,
  modalTitle,
}) => {
  const [show, setShow] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

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
        .map((n) => String(n).trim().toLowerCase())
    );
  }, [siblings]);

  useEffect(() => {
    // cleanup pending request on unmount/close
    return () => {
      try {
        abortRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  const reset = () => {
    setFolderName('');
    setShow(false);
    setLoading(false);
    try {
      abortRef.current?.abort();
    } catch {
      /* noop */
    }
    abortRef.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

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
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/folder/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include', // enable if your backend uses cookies/sessions
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

      // Notify parent
      onModeratorCreateFolder?.({
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
      abortRef.current = null;
    }
  };

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={() => setShow(true)}
        variant={buttonVariant}
        className={buttonClassName || 'd-flex align-items-center rounded-2'}
        aria-label="Create folder"
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
                maxLength={255}
                required
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

      {/* Toasts (remove if you have a global container) */}
      <ToastContainer position="top-right" autoClose={2000} newestOnTop />
    </>
  );
};

ModeratorCreateFolder.propTypes = {
  currentFolder: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onModeratorCreateFolder: PropTypes.func, // (meta) => void
  siblings: PropTypes.array,
  buttonVariant: PropTypes.string,
  buttonClassName: PropTypes.string,
  modalTitle: PropTypes.string,
};

ModeratorCreateFolder.defaultProps = {
  currentFolder: 'root folder',
  onModeratorCreateFolder: undefined,
  siblings: undefined,
  buttonVariant: 'outline-dark',
  buttonClassName: undefined,
  modalTitle: 'Create New Folder',
};

export default ModeratorCreateFolder;
