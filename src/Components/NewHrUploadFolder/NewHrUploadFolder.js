// src/Components/NewHrUploadFolder/NewHrUploadFolder.jsx
import React, { useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Button,
  Form,
  Modal,
  ProgressBar,
  Alert,
  Spinner,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './NewHrUploadFolder.css';

/* ================= Config ================= */
function ensureHttpBase(u) {
  let s = String(u || '').trim();
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s.replace(/\/+$/, '');
}
const API_BASE = ensureHttpBase(
  process.env.REACT_APP_API_BASE || 'https://databank.tcscontrols.com.my'
);

/** Hard root: cannot upload above this path for New HR */
const NEW_HR_ROOT =
  process.env.REACT_APP_NEW_HR_BASE ||
  process.env.REACT_APP_HR_BASE ||
  '/new-hr';

/* ================= Helpers ================= */
const normalizePath = (p) =>
  (
    '/' +
    String(p || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
  ).replace(/\/{2,}/g, '/');

const clampToNewHr = (dest) => {
  const root = normalizePath(NEW_HR_ROOT);
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

// Build a directory tree (for summary rendering)
function buildTree(relativePaths) {
  const root = { name: '', type: 'dir', children: new Map() };
  for (const p of relativePaths) {
    const parts = p.split('/').filter(Boolean);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const key = part + (isFile ? '::file' : '::dir');
      if (!node.children.has(key)) {
        node.children.set(key, {
          name: part,
          type: isFile ? 'file' : 'dir',
          children: isFile ? null : new Map(),
        });
      }
      node = node.children.get(key);
    }
  }
  return root;
}

function TreeView({ node, depth = 0 }) {
  const entries = node.children ? Array.from(node.children.values()) : [];
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
  return (
    <div style={{ marginLeft: depth ? 14 : 0 }}>
      {entries.map((child, idx) =>
        child.type === 'dir' ? (
          <div key={`d-${depth}-${idx}-${child.name}`}>
            <div className="text-muted small">📁 {child.name}</div>
            <TreeView node={child} depth={depth + 1} />
          </div>
        ) : (
          <div key={`f-${depth}-${idx}-${child.name}`} className="small">
            ▸ {child.name}
          </div>
        )
      )}
    </div>
  );
}

TreeView.propTypes = {
  node: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.oneOf(['dir', 'file']),
    children: PropTypes.instanceOf(Map),
  }),
  depth: PropTypes.number,
};

/* ================= Component ================= */
function NewHrUploadFolder({ currentPath, userId, onFolderUploaded }) {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Progress tracking
  const [progressPct, setProgressPct] = useState(0);
  const [bytesLoaded, setBytesLoaded] = useState(0);
  const [expectedBytes, setExpectedBytes] = useState(0); // total size of the selected folder

  const [rootFolderName, setRootFolderName] = useState('');
  const [selectedMeta, setSelectedMeta] = useState(null); // {count, totalBytes, relPaths}
  const [uploadedSummary, setUploadedSummary] = useState(null); // { base, relPaths }
  const [missing, setMissing] = useState([]); // rel paths not uploaded

  const inputRef = useRef(null);
  const abortRef = useRef(null); // for cancel

  const destBase = clampToNewHr(currentPath || NEW_HR_ROOT);
  const displayTarget = rootFolderName
    ? `${destBase.replace(/\/+$/, '')}/${rootFolderName}`
    : destBase;

  const resetState = () => {
    setProgressPct(0);
    setBytesLoaded(0);
    setExpectedBytes(0);
    setIsUploading(false);
    setRootFolderName('');
    setSelectedMeta(null);
    setUploadedSummary(null);
    setMissing([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleOpen = () => {
    resetState();
    setShowModal(true);
  };

  const handleFolderPicked = () => {
    const fileList = inputRef.current?.files;
    if (!fileList || fileList.length === 0) {
      setRootFolderName('');
      setSelectedMeta(null);
      setExpectedBytes(0);
      return;
    }
    const files = Array.from(fileList);

    const first = files.find((f) => f.webkitRelativePath) || files[0];
    if (first && first.webkitRelativePath) {
      const firstSeg = first.webkitRelativePath.split('/')[0] || '';
      setRootFolderName(firstSeg);
    } else {
      setRootFolderName('');
    }

    const relPaths = files.map((f) =>
      (f.webkitRelativePath || f.name).replace(/\\/g, '/')
    );
    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

    setSelectedMeta({
      count: files.length,
      totalBytes,
      relPaths,
    });
    setExpectedBytes(totalBytes);
  };

  const handleCancelUpload = () => {
    try {
      abortRef.current?.abort();
      toast.info('⏹ Upload canceled.');
    } catch {}
    setIsUploading(false);
    abortRef.current = null;
  };

  const handleFolderSubmit = async (e) => {
    e.preventDefault();

    const fileList = inputRef.current?.files;
    if (!fileList || fileList.length === 0) {
      toast.error('⚠️ Please select a folder to upload.');
      return;
    }

    const fd = new FormData();
    fd.append('dest', destBase);

    const files = Array.from(fileList);
    const relPaths = files.map((f) =>
      (f.webkitRelativePath || f.name).replace(/\\/g, '/')
    );

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const rel = (f.webkitRelativePath || f.name).replace(/\\/g, '/');
      fd.append('files', f, f.name);
      fd.append('paths', rel);
    }

    const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0);
    setExpectedBytes((prev) => (prev > 0 ? prev : totalBytes));
    setBytesLoaded(0);
    setIsUploading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await axios.post(`${API_BASE}/api/upload-folder`, fd, {
        signal: controller.signal,
        onUploadProgress: (evt) => {
          const loaded = evt.loaded ?? 0;
          setBytesLoaded(loaded);
          const denom = expectedBytes || totalBytes || 1;
          const pct = Math.min(100, Math.round((loaded / denom) * 100));
          setProgressPct(pct);
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 0,
        withCredentials: true,
      });

      if (!res?.data?.ok) throw new Error(res?.data?.error || 'Upload failed');

      const base = (res.data.base || destBase).replace(/\/+$/, '');
      const uploadedAbs = (res.data.uploaded || [])
        .map((u) => String(u.to || ''))
        .filter(Boolean);

      const uploadedRel = uploadedAbs
        .map((abs) =>
          abs.startsWith(base + '/') ? abs.slice(base.length + 1) : abs
        )
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

      setUploadedSummary({ base, relPaths: uploadedRel });

      // Verify: ensure server has everything we selected
      const expectedSet = new Set(relPaths.map((p) => p.replace(/^\/+/, '')));
      const gotSet = new Set(uploadedRel.map((p) => p.replace(/^\/+/, '')));
      const missingList = [];
      for (const p of expectedSet) {
        if (!gotSet.has(p)) missingList.push(p);
      }
      setMissing(missingList);

      onFolderUploaded?.({
        uid: userId,
        name: rootFolderName || 'Folder Upload',
        count: res.data.count,
        base,
        uploaded: res.data.uploaded,
        currentPath: destBase,
      });

      toast.success(
        `✅ Uploaded ${res.data.count} file(s) to ${displayTarget}`
      );
      if (missingList.length === 0) {
        toast.success('All files uploaded successfully.');
      } else {
        toast.error('Some files were not confirmed on the server.');
      }
    } catch (err) {
      if (err?.name === 'CanceledError' || axios.isCancel?.(err)) {
        // canceled by user
      } else {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Upload failed. Please try again.';
        toast.error(`❌ ${msg}`);
      }
    } finally {
      setProgressPct((p) => (p < 100 && abortRef.current == null ? p : 100));
      setIsUploading(false);
      abortRef.current = null;
    }
  };

  const tree = useMemo(() => {
    if (!uploadedSummary) return null;
    return buildTree(uploadedSummary.relPaths);
  }, [uploadedSummary]);

  const selectedCount = selectedMeta?.count || 0;

  const modalTitle = isUploading
    ? 'Uploading...'
    : uploadedSummary
    ? 'Uploaded'
    : 'Upload Folder';

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={handleOpen}
        variant="outline-dark"
        className="d-flex align-items-center rounded-2"
      >
        <FontAwesomeIcon icon={faFolderPlus} />
        &nbsp; Upload Folder
      </Button>

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => (!isUploading ? setShowModal(false) : null)}
        centered
        size="lg"
        backdrop={isUploading ? 'static' : true}
        keyboard={!isUploading}
      >
        <Modal.Header closeButton={!isUploading}>
          <Modal.Title>{modalTitle}</Modal.Title>
          {/* Single cancel button in the header while uploading */}
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
          {/* While request is in-flight, keep explicit loading hint */}
          {isUploading && (
            <div className="d-flex align-items-center gap-2 mb-2">
              <Spinner animation="border" size="sm" />
              <span className="small text-muted">
                Please keep this window open until upload completes…
              </span>
            </div>
          )}

          {/* Progress (percentage is based on folder size) */}
          {(isUploading || progressPct > 0) && expectedBytes > 0 && (
            <>
              <ProgressBar now={progressPct} label={`${progressPct}%`} />
              <div className="d-flex justify-content-between small mt-1">
                <span>
                  Sent:&nbsp;<strong>{fmtBytes(bytesLoaded)}</strong>
                </span>
                <span>
                  Folder size:&nbsp;<strong>{fmtBytes(expectedBytes)}</strong>
                </span>
              </div>
              {selectedMeta && (
                <div className="small text-muted">
                  Files selected: <strong>{selectedMeta.count}</strong>
                </div>
              )}
            </>
          )}

          {/* After-upload verification summary */}
          {uploadedSummary ? (
            <>
              {missing.length === 0 ? (
                <Alert variant="success" className="py-2">
                  ✅ All files confirmed on server. Nothing missing.
                </Alert>
              ) : (
                <Alert variant="danger" className="py-2">
                  ⚠️ Some files are missing on the server ({missing.length}).
                </Alert>
              )}

              <div className="mb-2 small">
                Uploaded to:&nbsp;<code>{uploadedSummary.base}</code>
              </div>

              <div
                className="border rounded p-2"
                style={{ maxHeight: 320, overflow: 'auto' }}
              >
                {tree ? (
                  <TreeView node={tree} />
                ) : (
                  <div className="small text-muted">No files?</div>
                )}
              </div>

              <div className="mt-2 small text-muted">
                Server-confirmed files:&nbsp;
                <strong>{uploadedSummary.relPaths.length}</strong>
                {selectedCount ? (
                  <>
                    &nbsp;| Selected:&nbsp;<strong>{selectedCount}</strong>
                  </>
                ) : null}
              </div>

              {missing.length > 0 && (
                <details className="mt-2">
                  <summary className="small text-danger">
                    Show missing files
                  </summary>
                  <div
                    className="border rounded p-2 mt-2"
                    style={{ maxHeight: 200, overflow: 'auto' }}
                  >
                    {missing.map((m) => (
                      <div key={m} className="small text-danger">
                        ✗ {m}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <div className="d-flex gap-2 justify-content-end mt-3">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            // Upload form (initial / when not uploading)
            <>
              <Form onSubmit={handleFolderSubmit} encType="multipart/form-data">
                {/* Read-only destination preview */}
                <div className="small text-muted mb-2">
                  Destination:&nbsp;<code>{destBase}</code>
                </div>

                {/* Folder selection */}
                <Form.Group controlId="formFolder" className="my-2">
                  <Form.Label className="fw-semibold">
                    Choose a folder
                  </Form.Label>
                  <Form.Control
                    ref={inputRef}
                    type="file"
                    /* ✅ Folder picker that sends the whole tree */
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={handleFolderPicked}
                    disabled={isUploading}
                  />
                  <div className="mt-2 small text-muted">
                    Target:&nbsp;<code>{displayTarget}</code>
                  </div>

                  {selectedMeta && (
                    <div className="mt-2 small">
                      Selected files:&nbsp;<strong>{selectedMeta.count}</strong>
                      &nbsp;• Folder size:&nbsp;
                      <strong>{fmtBytes(selectedMeta.totalBytes)}</strong>
                    </div>
                  )}
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 mt-3"
                  variant="primary"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading…' : 'Upload Folder'}
                </Button>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Toasts */}
      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
}

NewHrUploadFolder.propTypes = {
  currentPath: PropTypes.string,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onFolderUploaded: PropTypes.func,
};

export default NewHrUploadFolder;
