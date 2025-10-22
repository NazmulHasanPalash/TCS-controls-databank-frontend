// src/components/AdminControls.jsx
// Admin UI to look up a user by email, set role, and list all users.
// Backend:
//   GET  /api/admin/users?email=foo@bar.com  -> { ok, user }
//   GET  /api/admin/users                     -> { ok, items: [...] }
//   POST /api/admin/users                     -> { ok, user }

import * as React from 'react';
import './AdminControls.css';
import { api } from '../Api/Api';

const ROLES = ['operator', 'moderator', 'admin'];
const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'aol.com',
];

function fmtDate(x) {
  if (!x) return '—';
  try {
    if (typeof x === 'number') return new Date(x).toLocaleString();
    if (typeof x === 'string') return new Date(x).toLocaleString();
    if (x && typeof x === 'object') {
      if (typeof x.toDate === 'function') return x.toDate().toLocaleString();
      if (typeof x.seconds === 'number')
        return new Date(x.seconds * 1000).toLocaleString();
      if (x._seconds) return new Date(x._seconds * 1000).toLocaleString();
    }
  } catch {}
  return '—';
}

function RolePill({ value }) {
  const v = String(value || '').toLowerCase();
  return <span className={`pill pill--${v}`}>{v || '—'}</span>;
}

// Normalize .data vs raw
async function apiGet(url, config) {
  const res = await api.get(url, config);
  return res?.data ?? res;
}
async function apiPost(url, payload) {
  const res = await api.post(url, payload);
  return res?.data ?? res;
}

export default function AdminControls() {
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('admin');
  const [updatedAt, setUpdatedAt] = React.useState(null);

  const [busy, setBusy] = React.useState(false);
  const [lookedUp, setLookedUp] = React.useState(false);

  const [msg, setMsg] = React.useState('');
  const [msgType, setMsgType] = React.useState('info'); // info | success | warning | danger

  // Users list
  const [users, setUsers] = React.useState([]);
  const [listBusy, setListBusy] = React.useState(false);
  const [filter, setFilter] = React.useState('');

  // Highlight last changed
  const [lastChangedUid, setLastChangedUid] = React.useState('');

  // Debounce for auto-lookup
  const debounceRef = React.useRef(null);
  const lastLookupEmailRef = React.useRef('');

  function flash(text, type = 'info') {
    setMsg(text);
    setMsgType(type);
  }

  // API helpers
  async function getUserByEmail(emailLower) {
    return apiGet('/api/admin/users', { params: { email: emailLower } });
  }
  async function setRoleByEmail(payload) {
    return apiPost('/api/admin/users', payload);
  }
  async function listAllUsers() {
    return apiGet('/api/admin/users');
  }

  // Email suggestions (existing users + common domains)
  const emailSuggestions = React.useMemo(() => {
    const q = email.trim().toLowerCase();
    const suggestions = new Set();
    users.forEach((u) => {
      const e = String(u.email || '').toLowerCase();
      if (e && (q.length < 2 || e.includes(q))) suggestions.add(e);
    });
    if (q && !q.includes('@')) {
      COMMON_EMAIL_DOMAINS.forEach((d) => suggestions.add(`${q}@${d}`));
    }
    return Array.from(suggestions).slice(0, 10);
  }, [email, users]);

  const lookup = async () => {
    flash('', 'info');
    setLookedUp(false);

    const q = String(email || '')
      .trim()
      .toLowerCase();
    if (!q) {
      flash('Please enter an email address.', 'warning');
      return;
    }
    try {
      setBusy(true);
      const data = await getUserByEmail(q);
      const user = data?.user || null;

      if (!user || !user.email) {
        setName('');
        setRole('admin');
        setUpdatedAt(null);
        setLookedUp(true);
        flash(
          'No existing user. Fill the fields and click Save to create.',
          'warning'
        );
        return;
      }

      setEmail(String(user.email || q));
      setName(String(user.name || ''));
      setRole(String(user.role || 'operator').toLowerCase());
      setUpdatedAt(user.updatedAt || null);
      setLookedUp(true);
      flash('User loaded from database.', 'success');
      lastLookupEmailRef.current = q;
    } catch (err) {
      const text =
        err?.response?.data?.error || err?.message || 'Lookup failed';
      flash(text, 'danger');
    } finally {
      setBusy(false);
    }
  };

  const save = async (e, opts = { reset: false }) => {
    e?.preventDefault?.();
    flash('', 'info');

    const q = String(email || '')
      .trim()
      .toLowerCase();
    if (!q) {
      flash('Email is required.', 'warning');
      return;
    }
    if (!ROLES.includes(role)) {
      flash('Invalid role selected.', 'warning');
      return;
    }

    try {
      setBusy(true);
      const payload = {
        email: q,
        role,
        name: String(name || '').trim() || undefined,
      };
      const res = await setRoleByEmail(payload);

      const newUpdated =
        res?.user?.updatedAt != null ? res.user.updatedAt : Date.now();
      setUpdatedAt(newUpdated);
      setLookedUp(true);

      // Refresh list & highlight
      await refreshList();
      if (res?.user?.id) {
        setLastChangedUid(res.user.id);
        setTimeout(() => setLastChangedUid(''), 3000);
      }

      flash('Saved successfully.', 'success');

      if (opts.reset) {
        setEmail('');
        setName('');
        setRole('admin');
        setUpdatedAt(null);
        setLookedUp(false);
      } else {
        lastLookupEmailRef.current = q;
      }
    } catch (err) {
      const text = err?.response?.data?.error || err?.message || 'Save failed';
      flash(text, 'danger');
    } finally {
      setBusy(false);
    }
  };

  const refreshList = React.useCallback(async () => {
    try {
      setListBusy(true);
      const data = await listAllUsers();
      const items = Array.isArray(data?.items) ? data.items : [];
      setUsers(items);
    } catch (err) {
      const text =
        err?.response?.data?.error || err?.message || 'Failed to load users';
      flash(text, 'danger');
    } finally {
      setListBusy(false);
    }
  }, []);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  // Debounced auto-lookup when email looks valid
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = email.trim().toLowerCase();
    if (!q) return;
    const looksLikeEmail = q.includes('@') && q.length >= 5;
    if (!looksLikeEmail) return;

    debounceRef.current = setTimeout(() => {
      if (!busy && q !== lastLookupEmailRef.current) lookup();
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email, busy]);

  const onEmailBlur = React.useCallback(() => {
    const q = email.trim().toLowerCase();
    if (!q || busy) return;
    if (q !== lastLookupEmailRef.current) lookup();
  }, [email, busy]);

  const filteredUsers = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const e = String(u.email || '').toLowerCase();
      const n = String(u.name || '').toLowerCase();
      const r = String(u.role || '').toLowerCase();
      return e.includes(q) || n.includes(q) || r.includes(q);
    });
  }, [users, filter]);

  return (
    <div className="ac-wrap">
      <header className="ac-header">
        <h3 className="ac-title">Admin — Add / Update Role</h3>
        <div className="ac-stats">
          <span className="ac-chip">Users: {users.length}</span>
          {busy && <span className="ac-chip ac-chip--busy">Working…</span>}
        </div>
      </header>

      {!!msg && (
        <div
          className={`ac-alert ac-alert--${msgType}`}
          role="status"
          aria-live="polite"
        >
          {msg}
        </div>
      )}

      <section className="ac-card ac-card--accent">
        <div className="ac-form ac-grid">
          <div className="ac-field ac-field--full">
            <label className="ac-label" htmlFor="ac-email">
              Email
            </label>
            <div className="ac-input-group">
              <input
                id="ac-email"
                list="email-suggest"
                type="email"
                className="ac-input"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={onEmailBlur}
                autoComplete="email"
                required
                aria-describedby="ac-email-help"
              />
              <span className="ac-input-addon">
                {lookedUp ? 'Loaded' : 'New'}
              </span>
            </div>
            <small id="ac-email-help" className="ac-help">
              Starts searching automatically as you type.
            </small>
            <datalist id="email-suggest">
              {emailSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="ac-field">
            <label className="ac-label" htmlFor="ac-name">
              Name
            </label>
            <input
              id="ac-name"
              className="ac-input"
              placeholder="Optional display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!email || busy}
            />
          </div>

          <div className="ac-field">
            <label className="ac-label" htmlFor="ac-role">
              Role
            </label>
            <select
              id="ac-role"
              className="ac-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={!email || busy}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="ac-actions ac-actions--stack">
            <button
              type="button"
              className="ac-btn ac-btn--primary"
              onClick={(e) => save(e, { reset: false })}
              disabled={!email || busy}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="ac-btn ac-btn--ghost"
              onClick={(e) => save(e, { reset: true })}
              disabled={!email || busy}
              title="Save and clear the form for adding another user"
            >
              {busy ? 'Saving…' : 'Save & New'}
            </button>
          </div>
        </div>
      </section>

      {lookedUp && (
        <div className="ac-tablewrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Name</th>
                <th style={{ width: '40%' }}>Email</th>
                <th style={{ width: '15%' }}>Role</th>
                <th style={{ width: '10%' }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{name || <span className="ac-muted">—</span>}</td>
                <td>
                  {email ? (
                    <a href={`mailto:${email}`} className="ac-link">
                      {email}
                    </a>
                  ) : (
                    <span className="ac-muted">—</span>
                  )}
                </td>
                <td>
                  <RolePill value={role} />
                </td>
                <td className="ac-small">{fmtDate(updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="ac-list-header">
        <h4 className="ac-subtitle">All Users</h4>
        <div className="ac-row">
          <input
            className="ac-input"
            placeholder="Filter by name/email/role…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            type="button"
            className="ac-btn ac-btn--ghost"
            onClick={refreshList}
            disabled={listBusy}
          >
            {listBusy ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="ac-tablewrap">
        <table className="ac-table">
          <thead>
            <tr>
              <th style={{ width: '26%' }}>UID</th>
              <th style={{ width: '28%' }}>Email</th>
              <th style={{ width: '20%' }}>Name</th>
              <th style={{ width: '14%' }}>Role</th>
              <th style={{ width: '12%' }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="ac-muted">
                  {listBusy ? 'Loading…' : 'No users found'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className={
                    u.id && u.id === lastChangedUid
                      ? 'ac-row--highlight'
                      : undefined
                  }
                >
                  <td className="ac-mono">{u.id}</td>
                  <td>
                    {u.email ? (
                      <a className="ac-link" href={`mailto:${u.email}`}>
                        {u.email}
                      </a>
                    ) : (
                      <span className="ac-muted">—</span>
                    )}
                  </td>
                  <td>{u.name || <span className="ac-muted">—</span>}</td>
                  <td>
                    <RolePill value={(u.role || '').toLowerCase()} />
                  </td>
                  <td className="ac-small">{fmtDate(u.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
