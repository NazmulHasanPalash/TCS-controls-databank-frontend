// NewHrDisplay.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './NewHrDisplay.css';

import BredCrum from '../BreadCrum/BreadCrum';
import NewHrUploadFolder from '../NewHrUploadFolder/NewHrUploadFolder';
import NewHrCreateFolder from '../NewHrCreateFolder/NewHrCreateFolder';
import NewHrUploadFile from '../NewHrUploadFile/NewHrUploadFile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile } from '@fortawesome/free-solid-svg-icons';

/* ================= Config ================= */
function ensureHttpBase(u) {
  let s = String(u || '').trim();
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s.replace(/\/+$/, '');
}
const API_BASE = ensureHttpBase(
  process.env.REACT_APP_API_BASE || 'https://databank.tcscontrols.com.my'
);

const START_PATH =
  (process.env.REACT_APP_NEW_HR_START_PATH || '/new-hr').replace(/\/+$/, '') ||
  '/new-hr';

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
const isSvg = (n) => /\.svg$/i.test(n);
const isImg = (n) => /\.(png|jpe?g|gif|webp|bmp|tiff?|ico|icns)$/i.test(n); // svg handled separately
const isHtml = (n) => /\.html?$/i.test(n);
const isTxt = (n) =>
  /\.(txt|json|xml|csv|md|css|js|ts|tsx|jsx|yml|yaml|log)$/i.test(n);
const isPdf = (n) => /\.pdf$/i.test(n);
const isAud = (n) => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(n);
const isVid = (n) => /\.(mp4|m4v|webm|ogv|mov|mkv|3gp)$/i.test(n);
const isOffice = (n) => /\.(docx?|xlsx?|pptx?)$/i.test(n);

const guessVideoMime = (name, fallback = 'video/mp4') => {
  if (/\.mp4$/i.test(name) || /\.m4v$/i.test(name)) return 'video/mp4';
  if (/\.webm$/i.test(name)) return 'video/webm';
  if (/\.ogv$/i.test(name)) return 'video/ogg';
  if (/\.mov$/i.test(name)) return 'video/quicktime';
  if (/\.mkv$/i.test(name)) return 'video/x-matroska';
  if (/\.3gp$/i.test(name)) return 'video/3gpp';
  return fallback;
};

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
  a.rel = 'noopener noreferrer';
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
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="libd-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="libd-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="document"
      >
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
function NewHrDisplay() {
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
    type: 'text', // image | pdf | audio | video | text | iframe | office | svg
    url: '',
    text: '',
    name: '',
    mime: '', // used for video source type
  });

  // Blob URL tracking
  const objectUrlRef = useRef('');

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
      const { data } = await axios.get(`${API_BASE}/api/list`, {
        params: { path },
        signal: controller.signal,
      });
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
  const buildDownloadUrl = (filePath) =>
    `${API_BASE}/api/download?path=${encodeURIComponent(filePath)}`;

  // NEW: streaming endpoint for videos (supports HTTP Range)
  const buildStreamUrl = (filePath) =>
    `${API_BASE}/api/stream?path=${encodeURIComponent(filePath)}`;

  const handleDownload = (item) => {
    if (item.isDirectory) {
      alert('Use "Download as ZIP" to download folders.');
      return;
    }
    const filePath = joinPosix(path, item.name);
    triggerDownload(buildDownloadUrl(filePath), item.name);
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

  /* ===== Preview helpers (blob/object URL) ===== */
  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch {}
      objectUrlRef.current = '';
    }
  };

  const fetchBlobUrl = async (filePath) => {
    const res = await axios.get(`${API_BASE}/api/download`, {
      params: { path: filePath },
      responseType: 'blob',
      validateStatus: () => true,
    });

    if (!(res.status >= 200 && res.status < 300)) {
      throw new Error(`Preview request failed (${res.status})`);
    }

    const ct = res.headers?.['content-type'] || 'application/octet-stream';
    const blob = new Blob([res.data], { type: ct });
    return { url: URL.createObjectURL(blob), type: ct };
  };

  /* ===== Preview ===== */
  const handlePreview = async (item) => {
    if (item.isDirectory) return;
    const filePath = joinPosix(path, item.name);

    revokeObjectUrl();

    try {
      // SVG
      if (isSvg(item.name)) {
        const { data } = await axios.get(`${API_BASE}/api/file/content`, {
          params: { path: filePath, encoding: 'utf8' },
          validateStatus: () => true,
        });
        if (!data?.ok) throw new Error(data?.error || 'Preview failed.');
        const svgText = String(data.content || '');
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        objectUrlRef.current = url;
        setPreviewData({
          type: 'svg',
          url,
          text: '',
          name: item.name,
          mime: '',
        });
        setPreviewOpen(true);
      }
      // Image (non-SVG)
      else if (isImg(item.name)) {
        const { url } = await fetchBlobUrl(filePath);
        objectUrlRef.current = url;
        setPreviewData({
          type: 'image',
          url,
          text: '',
          name: item.name,
          mime: '',
        });
        setPreviewOpen(true);
      }
      // PDF
      else if (isPdf(item.name)) {
        const { url } = await fetchBlobUrl(filePath);
        objectUrlRef.current = url;
        setPreviewData({
          type: 'pdf',
          url,
          text: '',
          name: item.name,
          mime: '',
        });
        setPreviewOpen(true);
      }
      // Audio
      else if (isAud(item.name)) {
        const { url } = await fetchBlobUrl(filePath);
        objectUrlRef.current = url;
        setPreviewData({
          type: 'audio',
          url,
          text: '',
          name: item.name,
          mime: '',
        });
        setPreviewOpen(true);
      }
      // Video — stream directly to enable HTTP Range (seeking)
      else if (isVid(item.name)) {
        const streamUrl = buildStreamUrl(filePath);
        setPreviewData({
          type: 'video',
          url: streamUrl,
          text: '',
          name: item.name,
          mime: guessVideoMime(item.name),
        });
        setPreviewOpen(true);
      }
      // HTML (sandboxed)
      else if (isHtml(item.name)) {
        const { url } = await fetchBlobUrl(filePath);
        objectUrlRef.current = url;
        setPreviewData({
          type: 'iframe',
          url,
          text: '',
          name: item.name,
          mime: '',
        });
        setPreviewOpen(true);
      }
      // Office via Microsoft viewer
      else if (isOffice(item.name)) {
        const publicUrl = buildDownloadUrl(filePath);
        const officeViewerUrl =
          'https://view.officeapps.live.com/op/embed.aspx?src=' +
          encodeURIComponent(publicUrl);
        setPreviewData({
          type: 'office',
          url: officeViewerUrl,
          text: '',
          name: item.name,
          mime: '',
        });
        setPreviewOpen(true);
      }
      // Text-like
      else if (isTxt(item.name)) {
        const { data } = await axios.get(`${API_BASE}/api/file/content`, {
          params: { path: filePath, encoding: 'utf8' },
          validateStatus: () => true,
        });
        if (!data?.ok) throw new Error(data?.error || 'Preview failed.');
        setPreviewData({
          type: 'text',
          url: '',
          text: String(data.content || ''),
          name: item.name,
          mime: '',
        });
        setPreviewOpen(true);
      }
      // Fallback
      else {
        const rawUrl = buildDownloadUrl(filePath);
        window.open(rawUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      revokeObjectUrl();
      alert(`Preview failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setCtxOpen(false);
    }
  };

  useEffect(() => {
    if (!previewOpen) {
      revokeObjectUrl();
      setPreviewData((p) => ({ ...p, url: '' }));
    }
    return () => revokeObjectUrl();
  }, [previewOpen]);

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

  /* ===== RENAME ===== */
  const openRename = useCallback((item) => {
    setCtxOpen(false);
    setCtxTarget(item);
    setRenameValue(item?.name || '');
    setRenameOpen(true);
  }, []);

  const submitRename = useCallback(async () => {
    if (!ctxTarget) return;
    const newName = (renameValue || '').trim();

    if (!newName) {
      alert('Please enter a new name.');
      return;
    }
    if (/[\\/]/.test(newName)) {
      alert('Name cannot include slashes.');
      return;
    }
    if (newName === ctxTarget.name) {
      setRenameOpen(false);
      return;
    }

    setWorking(true);
    try {
      const fromPath = joinPosix(path, ctxTarget.name);

      if (ctxTarget.isDirectory) {
        const toPath = joinPosix(path, newName);
        const res = await axios.put(
          `${API_BASE}/api/folder`,
          { from: fromPath, to: toPath, overwrite: false },
          { validateStatus: () => true }
        );
        if (!(res.status === 200 && res.data?.ok)) {
          throw new Error(res.data?.error || 'Folder rename failed.');
        }
      } else {
        const res = await axios.post(
          `${API_BASE}/api/file/rename`,
          { from: fromPath, newName, overwrite: false },
          { validateStatus: () => true }
        );
        if (!(res.status === 200 && res.data?.ok)) {
          throw new Error(res.data?.error || 'File rename failed.');
        }
      }

      setRenameOpen(false);
      setCtxTarget(null);
      await fetchList();
    } catch (err) {
      alert(err?.message || 'Rename failed.');
    } finally {
      setWorking(false);
    }
  }, [ctxTarget, renameValue, path, fetchList]);

  /* ================= Render ================= */
  return (
    <div className="libd-root">
      {/* Toolbar wrapper */}
      <div className="libd-toolbar">
        {/* Row 1: Breadcrumb path */}
        <div className="libd-toolbar-row">
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

        {/* Row 2: Buttons + Search */}
        <div className="libd-toolbar-row libd-toolbar-actions">
          <div className="libd-actions">
            <NewHrUploadFile currentPath={path} onFileUploaded={fetchList} />
            <NewHrUploadFolder
              currentPath={path}
              onFolderUploaded={handleFolderUploaded}
            />
            <NewHrCreateFolder
              currentFolder={{
                fullPath: path,
                name: path.split('/').filter(Boolean).pop() || 'new-hr',
              }}
              onNewHrCreateFolder={fetchList}
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
            className="libd-input libd-input-search"
            placeholder="Search in this folder…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchTerm('');
            }}
            aria-label="Search files and folders in this folder"
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

      {/* ================== Scrollable table ================== */}
      <div className="libd-table">
        {/* Header row */}
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

        {/* Body with its own vertical scrollbar */}
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
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Name */}
                  <div className="libd-name" title={item.name}>
                    <FontAwesomeIcon
                      icon={item.isDirectory ? faFolder : faFile}
                      className={`libd-fa ${
                        item.isDirectory ? 'libd-folder' : 'libd-file'
                      }`}
                    />
                    {renderHighlightedName(item.name)}
                  </div>

                  {/* Size */}
                  <div className="libd-right libd-muted" data-label="Size">
                    {typeof sizeToShow === 'number'
                      ? fmtBytes(sizeToShow)
                      : '—'}
                  </div>

                  {/* Last modified */}
                  <div
                    className="libd-right libd-muted libd-col-mod"
                    data-label="Last modified"
                  >
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
        <Modal
          onClose={() => setPreviewOpen(false)}
          title={previewData.name ? `Preview — ${previewData.name}` : 'Preview'}
        >
          {/* SVG */}
          {previewData.type === 'svg' && (
            <div className="libd-preview-media">
              <object
                data={previewData.url}
                type="image/svg+xml"
                className="libd-preview-object"
                aria-label="SVG preview"
              >
                <img src={previewData.url} alt="SVG preview" />
              </object>
            </div>
          )}

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
            <audio controls className="libd-preview-audio" preload="metadata">
              <source src={previewData.url} />
              Your browser does not support the audio element.
            </audio>
          )}

          {/* ✅ Video preview with native controller (HTTP Range via stream URL) */}
          {previewData.type === 'video' && (
            <video
              key={previewData.url} /* force reload when URL changes */
              controls
              playsInline
              preload="metadata"
              className="libd-preview-video libd-preview-media"
              style={{ pointerEvents: 'auto' }}
              onError={() => {
                try {
                  window.open(previewData.url, '_blank', 'noopener,noreferrer');
                } catch {}
              }}
            >
              <source
                src={previewData.url}
                type={previewData.mime || 'video/mp4'}
              />
              Your browser does not support the video tag.
            </video>
          )}

          {previewData.type === 'iframe' && (
            <iframe
              title="html"
              src={previewData.url}
              className="libd-preview-pdf"
              sandbox="allow-same-origin allow-forms allow-scripts"
            />
          )}

          {/* Office Online viewer */}
          {previewData.type === 'office' && (
            <iframe
              title="office"
              src={previewData.url}
              className="libd-preview-pdf"
            />
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

NewHrDisplay.propTypes = {};

export default NewHrDisplay;
