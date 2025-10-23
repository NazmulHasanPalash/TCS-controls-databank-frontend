// CustomerOrderDisplay.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './CustomerOrderDisplay.css';

import BredCrum from '../BreadCrum/BreadCrum';
import CustomerOrderUploadFolder from '../CustomerOrderUploadFolder/CustomerOrderUploadFolder';
import CustomerOrderCreateFolder from '../CustomerOrderCreateFolder/CustomerOrderCreateFolder';
import CustomerOrderUploadFile from '../CustomerOrderUploadFile/CustomerOrderUploadFile';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile } from '@fortawesome/free-solid-svg-icons';

/* ================= Config ================= */
const API_BASE = (
  process.env.REACT_APP_API_BASE || 'http://localhost:5000'
).replace(/\/+$/, '');
const START_PATH =
  (
    process.env.REACT_APP_CUSTOMER_ORDER_START_PATH || '/customer-order'
  ).replace(/\/+$/, '') || '/customer-order';

/* ================= Helpers ================= */
const normalizePath = (p) =>
  (
    '/' +
    String(p || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
  ).replace(/\/{2,}/g, '/');

const joinPosix = (a, b) => normalizePath(`${a || ''}/${b || ''}`);

const fmtBytes = (bytes) => {
  if (bytes == null || isNaN(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = Number(bytes);
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const date =
      typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  } catch {
    return '—';
  }
};

/* ---- file type helpers ---- */
const isImg = (n) => /\.(png|jpe?g|gif|webp|svg)$/i.test(n);
const isTxt = (n) =>
  /\.(txt|json|xml|csv|md|html?|css|js|ts|tsx|jsx|yml|yaml|log)$/i.test(n);
const isPdf = (n) => /\.pdf$/i.test(n);
const isAud = (n) => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(n);
const isVid = (n) => /\.(mp4|webm|ogv|mov|mkv)$/i.test(n);
const isOffice = (n) => /\.(docx?|xlsx?|pptx?)$/i.test(n); // non-previewable here

const sortItems = (items) =>
  [...items].sort((a, b) => {
    const da = a.isDirectory ? 0 : 1;
    const db = b.isDirectory ? 0 : 1;
    if (da !== db) return da - db;
    return String(a.name).localeCompare(String(b.name), undefined, {
      sensitivity: 'base',
    });
  });

const clampToBase = (targetPath) => {
  const base = normalizePath(START_PATH);
  if (!targetPath) return base;
  const normalized = normalizePath(targetPath);
  if (base === '/') return normalized;
  return normalized.startsWith(base) ? normalized : base;
};

const triggerDownload = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  if (filename) a.setAttribute('download', filename);
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/** Collapse selection so parents remove their children (avoid double delete) */
const collapseSelection = (paths) => {
  const sorted = [...paths].sort((a, b) => a.localeCompare(b));
  const result = [];
  for (const p of sorted) {
    const hasAncestor = result.some(
      (parent) => p !== parent && p.startsWith(parent + '/')
    );
    if (!hasAncestor) result.push(p);
  }
  return result;
};

/* =============== Small Modal =============== */
function Modal({ title, children, onClose, showClose = true }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="libd-modal-overlay"
      onMouseDown={onClose}
    >
      <div className="libd-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="libd-modal-header">
          <div className="libd-modal-title">{title}</div>
          {showClose && (
            <button
              onClick={onClose}
              className="libd-icon-btn"
              aria-label="Close"
            >
              ✖
            </button>
          )}
        </div>
        <div className="libd-modal-body">{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  showClose: PropTypes.bool,
};

/* =============== Confirm Delete Modal =============== */
function ConfirmDeleteModal({ open, items, submitting, onCancel, onConfirm }) {
  if (!open) return null;

  const total = items.length;
  const first = items[0];
  const title =
    total === 1
      ? `Delete ${first.isDirectory ? 'folder' : 'file'} "${first.name}"?`
      : `Delete ${total} selected items?`;

  return (
    <Modal
      title="Confirm Delete"
      onClose={!submitting ? onCancel : () => {}}
      showClose={!submitting}
    >
      <div className="libd-confirm">
        <div className="libd-confirm-title">{title}</div>
        {total > 1 && (
          <div className="libd-confirm-list">
            {items.slice(0, 8).map((it) => (
              <div key={it.fullPath} className="libd-confirm-item">
                {it.isDirectory ? '📁' : '📄'} {it.name}
              </div>
            ))}
            {total > 8 && (
              <div className="libd-muted small">…and {total - 8} more</div>
            )}
          </div>
        )}
        <div className="libd-modal-actions libd-gap">
          <button
            onClick={onCancel}
            className="libd-btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="libd-btn-danger"
            disabled={submitting}
          >
            {submitting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

ConfirmDeleteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  items: PropTypes.array.isRequired, // [{name, fullPath, isDirectory}]
  submitting: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

/* ================= Component ================= */
function CustomerOrderDisplay() {
  const [path, setPath] = useState(() => normalizePath(START_PATH));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  // Folder-size cache
  const [folderSizes, setFolderSizes] = useState({});

  // Context menu
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 });
  const [ctxTarget, setCtxTarget] = useState(null);
  const ctxRef = useRef(null);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState({
    type: 'text',
    url: '',
    text: '',
  });

  // Rename modal
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Deleting/working flag
  const [working, setWorking] = useState(false);

  // Confirm delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItems, setConfirmItems] = useState([]); // [{name, fullPath, isDirectory}]
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  /* ===== Fetcher ===== */
  const fetchList = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/list?path=${encodeURIComponent(path)}`,
        { signal: controller.signal }
      );
      if (!data?.ok) throw new Error(data?.error || 'Failed to fetch.');
      const normalized = (data.items || []).map((it) => ({
        name: it.name,
        size: it.size,
        isDirectory: !!it.isDirectory,
        modifiedAt: it.modifiedAt
          ? new Date(it.modifiedAt)
          : it.rawModifiedAt
          ? new Date(it.rawModifiedAt)
          : null,
      }));
      setItems(sortItems(normalized));
      setFolderSizes({});
    } catch (err) {
      if (axios.isCancel?.(err) || err?.name === 'CanceledError') return;
      setErrorMsg(err?.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [path]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* ===== Lazy folder-size fetch ===== */
  useEffect(() => {
    let cancelled = false;

    const dirs = items
      .filter((it) => it.isDirectory)
      .map((it) => ({ it, full: joinPosix(path, it.name) }))
      .filter(
        ({ it, full }) =>
          typeof it.size !== 'number' && folderSizes[full] == null
      );

    if (dirs.length === 0) return;

    const concurrency = 4;
    const queue = [...dirs];

    const runNext = async () => {
      if (cancelled) return;
      const job = queue.shift();
      if (!job) return;

      const { full } = job;

      try {
        let got = null;
        try {
          const r1 = await axios.get(`${API_BASE}/api/size`, {
            params: { path: full },
          });
          if (r1?.data?.ok && typeof r1.data.size === 'number')
            got = r1.data.size;
        } catch {}
        if (got == null) {
          try {
            const r2 = await axios.get(`${API_BASE}/api/folder/size`, {
              params: { path: full },
            });
            if (r2?.data?.ok && typeof r2.data.size === 'number')
              got = r2.data.size;
          } catch {}
        }

        if (!cancelled && got != null) {
          setFolderSizes((prev) => ({ ...prev, [full]: got }));
        }
      } finally {
        if (!cancelled && queue.length) runNext();
      }
    };

    for (let i = 0; i < Math.min(concurrency, queue.length); i++) runNext();

    return () => {
      cancelled = true;
    };
  }, [items, path, folderSizes]);

  /* ===== Close context menu on outside click/scroll/resize ===== */
  useEffect(() => {
    const close = (e) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target))
        setCtxOpen(false);
    };
    const closeAny = () => setCtxOpen(false);
    document.addEventListener('click', close);
    window.addEventListener('scroll', closeAny, true);
    window.addEventListener('resize', closeAny);
    return () => {
      document.removeEventListener('click', close);
      window.removeEventListener('scroll', closeAny, true);
      window.removeEventListener('resize', closeAny);
    };
  }, []);

  /* ===== Selection helpers ===== */
  const keyOf = (item) => joinPosix(path, item.name);
  const isSelected = (k) => selected.has(k);
  const toggleOne = (k) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  // Map for quick lookup (used by bulk delete)
  const itemByKey = useMemo(
    () => new Map(items.map((it) => [joinPosix(path, it.name), it])),
    [items, path]
  );

  /* ===== Row actions / nav ===== */
  const onRowContextMenu = (e, item) => {
    e.preventDefault();
    setCtxTarget(item);
    const pad = 8;
    const approxW = 220;
    const approxH = 160;
    const x = Math.max(
      pad,
      Math.min(window.innerWidth - pad - approxW, e.clientX)
    );
    const y = Math.max(
      pad,
      Math.min(window.innerHeight - pad - approxH, e.clientY)
    );
    setCtxPos({ x, y });
    setCtxOpen(true);
  };

  const onRowDoubleClick = (item) => {
    if (item.isDirectory) {
      setPath((prev) => clampToBase(joinPosix(prev, item.name)));
      clearSelection();
    } else {
      handlePreview(item);
    }
  };

  const goUp = () => {
    const base = normalizePath(START_PATH);
    if (normalizePath(path) === base) return;
    const parent =
      normalizePath(path)
        .replace(/\/+$/, '')
        .split('/')
        .slice(0, -1)
        .join('/') || '/';
    setPath(clampToBase(parent || base));
    clearSelection();
  };

  const refresh = () => fetchList();

  /* ===== File ops (single-item) ===== */
  const handleDownload = (item) => {
    if (item.isDirectory) {
      alert('Use "Download as ZIP" to download folders.');
      return;
    }
    const filePath = joinPosix(path, item.name);
    const url = `${API_BASE}/api/download?path=${encodeURIComponent(filePath)}`;
    triggerDownload(url, item.name);
    setCtxOpen(false);
  };

  const zipAndDownloadFolder = async (folderName) => {
    const fullPath = joinPosix(path, folderName);
    try {
      const { data } = await axios.post(`${API_BASE}/api/zip`, {
        path: fullPath,
      });
      if (data && data.ok && data.downloadId) {
        const url = `${API_BASE}/api/zip/${encodeURIComponent(
          data.downloadId
        )}`;
        triggerDownload(url, data.filename || `${folderName}.zip`);
      } else {
        alert('ZIP creation failed: backend did not return a download link.');
      }
    } catch (e) {
      alert(`ZIP creation failed: ${e?.message || 'unknown error'}`);
    }
  };

  /* ===== Delete (open confirmation modal) ===== */
  const openConfirmDeleteSingle = (item) => {
    const fullPath = joinPosix(path, item.name);
    setConfirmItems([
      { name: item.name, fullPath, isDirectory: item.isDirectory },
    ]);
    setConfirmOpen(true);
    setCtxOpen(false);
  };

  const openConfirmDeleteBulk = () => {
    if (selected.size === 0) return;
    const minimal = collapseSelection(Array.from(selected));
    const list = minimal.map((p) => {
      const it = itemByKey.get(p);
      return {
        name: p.split('/').pop(),
        fullPath: p,
        isDirectory: !!it?.isDirectory,
      };
    });
    setConfirmItems(list);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    setConfirmSubmitting(true);
    setWorking(true);
    try {
      if (confirmItems.length === 1) {
        const one = confirmItems[0];
        const res = await axios.post(
          `${API_BASE}/api/delete`,
          { path: one.fullPath },
          { validateStatus: () => true }
        );
        if (!(res.status === 200 && res.data?.ok)) {
          throw new Error(res.data?.error || 'Delete failed.');
        }
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(one.fullPath);
          return next;
        });
      } else {
        // delete one-by-one (or add /api/delete-multi on the backend)
        for (const it of confirmItems) {
          const res = await axios.post(
            `${API_BASE}/api/delete`,
            { path: it.fullPath },
            { validateStatus: () => true }
          );
          if (!(res.status === 200 && res.data?.ok)) {
            throw new Error(res.data?.error || `Delete failed: ${it.name}`);
          }
        }
        clearSelection();
      }

      await fetchList();
      setConfirmOpen(false);
      setConfirmItems([]);
    } catch (err) {
      alert(`Delete failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setConfirmSubmitting(false);
      setWorking(false);
    }
  };

  /* ===== Rename ===== */
  const openRename = (item) => {
    setRenameValue(item?.name || '');
    setRenameOpen(true);
    setCtxOpen(false);
    setCtxTarget(item);
  };

  const submitRename = async () => {
    const item = ctxTarget;
    const newName = (renameValue || '').trim();
    if (!item || !newName || newName === item.name) {
      setRenameOpen(false);
      return;
    }
    setWorking(true);
    try {
      const from = joinPosix(path, item.name);
      if (item.isDirectory) {
        const to = joinPosix(path, newName);
        const { data } = await axios.put(`${API_BASE}/api/folder`, {
          from,
          to,
        });
        if (!data?.ok) throw new Error(data?.error || 'Rename failed.');
      } else {
        const { data } = await axios.post(`${API_BASE}/api/file/rename`, {
          from,
          newName,
        });
        if (!data?.ok) throw new Error(data?.error || 'Rename failed.');
      }
      setRenameOpen(false);
      setCtxTarget(null);
      fetchList();
    } catch (err) {
      alert(`Rename failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setWorking(false);
    }
  };

  /* ===== Preview (uses /api/preview for inline rendering) ===== */
  const handlePreview = async (item) => {
    if (item.isDirectory) return;
    const filePath = joinPosix(path, item.name);
    const previewURL = `${API_BASE}/api/preview?path=${encodeURIComponent(
      filePath
    )}`;

    try {
      if (isImg(item.name)) {
        setPreviewData({ type: 'image', url: previewURL, text: '' });
        setPreviewOpen(true);
      } else if (isPdf(item.name)) {
        setPreviewData({ type: 'pdf', url: previewURL, text: '' });
        setPreviewOpen(true);
      } else if (isAud(item.name)) {
        setPreviewData({ type: 'audio', url: previewURL, text: '' });
        setPreviewOpen(true);
      } else if (isVid(item.name)) {
        setPreviewData({ type: 'video', url: previewURL, text: '' });
        setPreviewOpen(true);
      } else if (isTxt(item.name)) {
        // fetch raw text from /api/preview
        const resp = await axios.get(previewURL, {
          responseType: 'text',
          transformResponse: [(v) => v],
          validateStatus: () => true,
        });
        if (resp.status >= 200 && resp.status < 300) {
          setPreviewData({
            type: 'text',
            url: '',
            text: String(resp.data || ''),
          });
          setPreviewOpen(true);
        } else {
          throw new Error(resp?.data?.error || 'Preview failed.');
        }
      } else if (isOffice(item.name)) {
        // Not handled inline — download instead
        handleDownload(item);
      } else {
        // Unknown type -> try open inline in a new tab
        window.open(previewURL, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert(`Preview failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setCtxOpen(false);
    }
  };

  /* ===== Folder upload success hook ===== */
  const handleFolderUploaded = useCallback(() => {
    setSuccessMsg('The folder uploaded successfully');
    fetchList();
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [fetchList]);

  /* ===== Filtered list (search) ===== */
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const visibleItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((it) =>
      String(it.name).toLowerCase().includes(normalizedQuery)
    );
  }, [items, normalizedQuery]);

  const renderHighlightedName = (name) => {
    if (!normalizedQuery) return name;
    const lower = String(name).toLowerCase();
    const idx = lower.indexOf(normalizedQuery);
    if (idx === -1) return name;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + normalizedQuery.length);
    const after = name.slice(idx + normalizedQuery.length);
    return (
      <>
        {before}
        <mark>{match}</mark>
        {after}
      </>
    );
  };

  /* ===== Toggle-all respects search results ===== */
  const toggleAll = useCallback(() => {
    if (visibleItems.length === 0) return;
    setSelected((prev) => {
      const allKeys = visibleItems.map((it) => joinPosix(path, it.name));
      const allSelected = allKeys.every((k) => prev.has(k));
      return new Set(allSelected ? [] : allKeys);
    });
  }, [visibleItems, path]);

  /* ================= Render ================= */
  return (
    <div className="libd-root">
      {/* Toolbar wrapper */}
      <div className="libd-toolbar" style={{ display: 'block', width: '100%' }}>
        {/* Row 1: Breadcrumb path */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <BredCrum
            className="libd-breadcrumb"
            path={path}
            onNavigate={(p) => {
              const target = p === '/' ? START_PATH : p;
              setPath(clampToBase(target));
              clearSelection();
            }}
            title={path}
          />
        </div>

        {/* Row 2: Buttons (left) + Search (right) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <div className="libd-actions" style={{ marginLeft: 0 }}>
            <CustomerOrderUploadFile
              currentPath={path}
              onFileUploaded={fetchList}
            />
            <CustomerOrderUploadFolder
              currentPath={path}
              onFolderUploaded={handleFolderUploaded}
            />
            <CustomerOrderCreateFolder
              currentFolder={{
                fullPath: path,
                name: path.split('/').filter(Boolean).pop() || 'customer-order',
              }}
              onLibraryCreateFolder={fetchList}
              onCustomerOrderCreateFolder={fetchList}
              buttonVariant="outline-dark"
            />
            <button onClick={goUp} title="Up" className="libd-pill">
              ⬆ Up
            </button>
            <button onClick={refresh} title="Refresh" className="libd-pill">
              🔄 Refresh
            </button>
            <button
              onClick={openConfirmDeleteBulk}
              disabled={selected.size === 0 || working}
              className="libd-pill libd-danger"
              title="Delete selected"
            >
              🗑 Delete Selected ({selected.size})
            </button>
          </div>

          <input
            ref={searchInputRef}
            type="text"
            className="libd-input"
            placeholder="Search in this folder…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchTerm('');
            }}
            aria-label="Search files and folders in this folder"
            style={{ width: 'min(420px, 90vw)' }}
          />
        </div>
      </div>

      {/* Notices */}
      {successMsg && (
        <div className="libd-alert libd-alert-success" role="status">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="libd-alert libd-alert-error">{errorMsg}</div>
      )}
      {loading && <div className="libd-alert libd-alert-info">Loading…</div>}

      {/* Table */}
      <div className="libd-table">
        {/* Sticky header */}
        <div className="libd-thead">
          <input
            type="checkbox"
            aria-label="Select all"
            checked={
              visibleItems.length > 0 &&
              visibleItems.every((it) => selected.has(joinPosix(path, it.name)))
            }
            onChange={(e) => {
              e.stopPropagation();
              toggleAll();
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div>Name</div>
          <div className="libd-right">Size</div>
          <div className="libd-right libd-col-mod">Last modified</div>
        </div>

        {/* Vertically scrollable body */}
        <div className="libd-tbody-scroll">
          {visibleItems.length === 0 && !loading ? (
            <div className="libd-empty" role="status">
              {normalizedQuery
                ? 'No matching files or folders.'
                : 'No files or folders'}
            </div>
          ) : (
            visibleItems.map((item) => {
              const k = keyOf(item);
              const full = joinPosix(path, item.name);
              const sizeToShow = item.isDirectory
                ? typeof item.size === 'number'
                  ? item.size
                  : folderSizes[full]
                : item.size;
              return (
                <div
                  key={k}
                  onDoubleClick={() => onRowDoubleClick(item)}
                  onContextMenu={(e) => onRowContextMenu(e, item)}
                  className={`libd-row ${isSelected(k) ? 'is-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.name}`}
                    checked={isSelected(k)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleOne(k);
                    }}
                    onClick={(e) => e.stopPropagation()} // don't open folder/file when clicking checkbox
                  />
                  <div className="libd-name" title={item.name}>
                    <FontAwesomeIcon
                      icon={item.isDirectory ? faFolder : faFile}
                      className={`libd-fa ${
                        item.isDirectory ? 'libd-folder' : 'libd-file'
                      }`}
                      style={
                        item.isDirectory ? { color: '#f4c20d' } : undefined
                      }
                    />
                    {renderHighlightedName(item.name)}
                  </div>
                  <div className="libd-right libd-muted">
                    {typeof sizeToShow === 'number'
                      ? fmtBytes(sizeToShow)
                      : '—'}
                  </div>
                  <div className="libd-right libd-muted libd-col-mod">
                    {fmtDate(item.modifiedAt)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Context Menu */}
      {ctxOpen && ctxTarget && (
        <div
          ref={ctxRef}
          className="libd-menu"
          style={{ top: ctxPos.y, left: ctxPos.x }}
        >
          <div className="libd-menu-title">
            {ctxTarget.isDirectory ? 'Folder' : 'File'}: {ctxTarget.name}
          </div>

          {ctxTarget.isDirectory ? (
            <>
              <button
                onClick={async () => {
                  try {
                    await zipAndDownloadFolder(ctxTarget.name);
                  } finally {
                    setCtxOpen(false);
                  }
                }}
                className="libd-menu-btn"
              >
                ⬇️ Download as ZIP
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handlePreview(ctxTarget)}
                className="libd-menu-btn"
              >
                👁 Preview
              </button>
              <button
                onClick={() => handleDownload(ctxTarget)}
                className="libd-menu-btn"
              >
                ⬇️ Download
              </button>
            </>
          )}

          <button
            onClick={() => openRename(ctxTarget)}
            className="libd-menu-btn"
          >
            ✏️ Rename
          </button>
          <button
            onClick={() => openConfirmDeleteSingle(ctxTarget)}
            disabled={working}
            className="libd-menu-btn libd-menu-danger"
          >
            🗑 Delete…
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <Modal onClose={() => setPreviewOpen(false)} title="Preview">
          {previewData.type === 'image' && (
            <img
              src={previewData.url}
              alt="preview"
              className="libd-preview-media"
            />
          )}
          {previewData.type === 'pdf' && (
            <iframe
              title="pdf"
              src={previewData.url}
              className="libd-preview-pdf"
            />
          )}
          {previewData.type === 'audio' && (
            <audio controls className="libd-preview-audio">
              <source src={previewData.url} />
              Your browser does not support the audio element.
            </audio>
          )}
          {previewData.type === 'video' && (
            <video controls className="libd-preview-media">
              <source src={previewData.url} />
              Your browser does not support the video element.
            </video>
          )}
          {previewData.type === 'text' && (
            <pre className="libd-preview-text">{previewData.text}</pre>
          )}
          <div className="libd-modal-actions">
            <button
              onClick={() => setPreviewOpen(false)}
              className="libd-btn-primary"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Rename Modal */}
      {renameOpen && ctxTarget && (
        <Modal
          onClose={() => setRenameOpen(false)}
          title={`Rename ${ctxTarget.isDirectory ? 'Folder' : 'File'}`}
        >
          <div className="libd-field">
            <label className="libd-label">New name</label>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="libd-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setRenameOpen(false);
              }}
            />
          </div>
          <div className="libd-modal-actions libd-gap">
            <button
              onClick={() => setRenameOpen(false)}
              className="libd-btn-secondary"
            >
              Cancel
            </button>
            <button onClick={submitRename} className="libd-btn-primary">
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Modal (single + bulk) */}
      <ConfirmDeleteModal
        open={confirmOpen}
        items={confirmItems}
        submitting={confirmSubmitting}
        onCancel={() => {
          if (!confirmSubmitting) {
            setConfirmOpen(false);
            setConfirmItems([]);
          }
        }}
        onConfirm={performDelete}
      />
    </div>
  );
}

CustomerOrderDisplay.propTypes = {};

export default CustomerOrderDisplay;
