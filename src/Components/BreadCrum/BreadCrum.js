// BreadCrum.jsx
import React, { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import './BreadCrum.css';
import { HashLink } from 'react-router-hash-link';

/**
 * Default roots; now includes:
 * Library, Sourcing & Pricing, Administrative, Administrative System,
 * Sales, Customer Order, Production, Finance, HR, Moderator, Operator, and Admin
 */
const DEFAULT_ROOTS = [
  '/library',
  '/sourcing-pricing',
  '/administrative',
  '/administrative-system',
  '/sales',
  '/customer-order',
  '/production',
  '/finance',
  '/hr',
  '/moderator',
  '/operator',
  '/admin',
];

/** Optional default labels (can be overridden via prop rootLabelMap) */
const DEFAULT_LABELS = {
  '/library': 'Library',
  '/sourcing-pricing': 'Sourcing & Pricing',
  '/administrative': 'Administrative',
  '/administrative-system': 'Administrative System',
  '/sales': 'Sales',
  '/customer-order': 'Customer Order',
  '/production': 'Production',
  '/finance': 'Finance',
  '/hr': 'HR',
  '/moderator': 'Moderator',
  '/operator': 'Operator',
  '/admin': 'Admin',
};

/* Normalize to POSIX: trim, convert backslashes, single leading slash, collapse // */
const normalize = (p) =>
  (
    '/' +
    String(p ?? '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
  ).replace(/\/{2,}/g, '/');

/** Ensure a root string is normalized without trailing slash (except '/') */
const normalizeRoot = (r) => {
  const n = normalize(r);
  return n.length > 1 ? n.replace(/\/+$/, '') : n;
};

/** Detect which allowed root the path belongs to (exact or descendant). Fallback to the first root. */
const detectRoot = (thePath, roots) => {
  const n = normalize(thePath);
  const normRoots = roots.map(normalizeRoot);
  // Prefer the longest matching root (handles similar prefixes)
  const match = normRoots
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((root) => n === root || n.startsWith(root + '/'));
  return match || normRoots[0] || '/';
};

/** Clamp path so it never goes above the detected root */
const clampToRoot = (p, roots) => {
  const n = normalize(p);
  const root = detectRoot(n, roots);
  if (n === root) return root;
  if (n.startsWith(root + '/')) return n;
  return root;
};

function BreadCrum({
  path,
  onNavigate,
  className,
  title,
  roots = DEFAULT_ROOTS,
  rootLabelMap = {},
}) {
  // If someone passes an empty array, fall back to DEFAULT_ROOTS
  const effectiveRoots = roots && roots.length ? roots : DEFAULT_ROOTS;

  // Fixed set of normalized roots we operate with
  const safeRoots = useMemo(
    () => effectiveRoots.map(normalizeRoot),
    [effectiveRoots]
  );

  // Merge default labels with caller overrides (caller wins)
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...rootLabelMap }),
    [rootLabelMap]
  );

  // Ensure the BreadCrum never goes above its root
  const safePath = useMemo(
    () => clampToRoot(path, safeRoots),
    [path, safeRoots]
  );

  const root = useMemo(
    () => detectRoot(safePath, safeRoots),
    [safePath, safeRoots]
  );

  // Build crumbs from the detected root and everything after it
  const crumbs = useMemo(() => {
    const rel = safePath.slice(root.length).replace(/^\/+/, ''); // portion after root
    const segments = rel ? rel.split('/').filter(Boolean) : [];

    // Label for the root; allow custom label map
    const rootLabel =
      labels[root] ||
      root.replace(/^\/+/, '') || // e.g. "library", "sourcing-pricing", "administrative", "administrative-system", "sales", "customer-order", "production", "finance", "hr", "moderator", "operator", "admin"
      'root';

    const list = [{ name: rootLabel, full: root }];

    // Accumulate each segment progressively
    let running = root;
    for (const seg of segments) {
      running = `${running}/${seg}`;
      list.push({ name: seg, full: running });
    }

    return list;
  }, [safePath, root, labels]);

  return (
    <nav
      className={`bc-root${className ? ' ' + className : ''}`}
      aria-label="BreadCrum"
      title={title}
    >
      <strong className="bc-label">
        <HashLink className="nav-link active text-primary" to="/home#home">
          Home:
        </HashLink>
      </strong>
      <ol className="bc-list">
        {crumbs.map((c, idx) => {
          const isCurrent = idx === crumbs.length - 1;
          return (
            <li key={c.full} className="bc-item">
              {idx > 0 && <span className="bc-sep">/</span>}
              <button
                type="button"
                className={`bc-link ${isCurrent ? 'is-current' : ''}`}
                title={c.full}
                onClick={() => {
                  if (!isCurrent && typeof onNavigate === 'function') {
                    onNavigate(c.full);
                  }
                }}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <span className="bc-seg">{c.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

BreadCrum.propTypes = {
  /**
   * Current absolute path
   * e.g. "/library/foo",
   * "/sourcing-pricing/2025/Q1",
   * "/administrative/hr",
   * "/administrative-system/policies",
   * "/sales/orders",
   * "/customer-order/12345",
   * "/production/batch-001",
   * "/finance/reports",
   * "/hr/policies",
   * "/moderator/reports",
   * "/operator/shifts",
   * "/admin/settings"
   */
  path: PropTypes.string.isRequired,
  /** Called with the full path when a crumb is clicked */
  onNavigate: PropTypes.func,
  /** Optional extra class for the root <nav> (e.g., "libd-BreadCrum") */
  className: PropTypes.string,
  /** Optional title for the root <nav> (used as tooltip) */
  title: PropTypes.string,
  /**
   * Allowed BreadCrum roots; defaults to:
   * ['/library', '/sourcing-pricing', '/administrative', '/administrative-system',
   *  '/sales', '/customer-order', '/production', '/finance', '/hr', '/moderator', '/operator', '/admin']
   */
  roots: PropTypes.arrayOf(PropTypes.string),
  /** Optional map for custom root labels */
  rootLabelMap: PropTypes.object,
};

export default memo(BreadCrum);
