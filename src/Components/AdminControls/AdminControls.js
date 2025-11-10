// src/components/AdminControls.jsx
// Admin UI to set a user's role, list all users, and DELETE users by UID.

import * as React from 'react';
import './AdminControls.css';
// Robust import: supports default export, named { api }, or both.
import ApiDefault, { api as apiNamed } from '../Api/Api';

const api = apiNamed || ApiDefault;

// Include 'user' so operator and user are distinct & selectable.
const ROLES = ['user', 'operator', 'moderator', 'admin'];

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
async function apiDelete(url, data) {
  // axios.delete(url, { data }) shape is supported
  const res = await api.delete(url, data ? { data } : undefined);
  return res?.data ?? res;
}

export default function AdminControls() {
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  // Safer default than 'admin'
  const [role, setRole] = React.useState('operator');
  const [updatedAt, setUpdatedAt] = React.useState(null);

  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [msgType, setMsgType] = React.useState('info'); // info | success | warning | danger

  // Users list
  const [users, setUsers] = React.useState([]);
  const [listBusy, setListBusy] = React.useState(false);
  const [filter, setFilter] = React.useState('');

  // Highlight last changed
  const [lastChangedUid, setLastChangedUid] = React.useState('');

  function flash(text, type = 'info') {
    setMsg(text);
    setMsgType(type);
  }

  // API helpers
  async function setRoleByEmail(payload) {
    return apiPost('/api/admin/users', payload);
  }
  async function listAllUsers() {
    return apiGet('/api/admin/users');
  }
  async function deleteByUid(uid) {
    return apiDelete(`/api/admin/users/${encodeURIComponent(uid)}`);
  }

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
        // Reset back to safer default instead of admin
        setRole('operator');
        setUpdatedAt(null);
      }
    } catch (err) {
      const text = err?.response?.data?.error || err?.message || 'Save failed';
      flash(text, 'danger');
    } finally {
      setBusy(false);
    }
  };

  // Delete by UID from list row
  const onDeleteByUid = async (u) => {
    if (!u?.id) return;
    const ok = window.confirm(
      `Delete user:\n\nUID: ${u.id}\nEmail: ${
        u.email || '—'
      }\n\nThis cannot be undone.`
    );
    if (!ok) return;

    try {
      setListBusy(true);
      const res = await deleteByUid(u.id);
      if (res?.ok) {
        flash(`Deleted ${u.email || u.id} successfully.`, 'success');
      } else {
        flash(res?.error || 'Delete failed', 'danger');
      }
      await refreshList();
    } catch (err) {
      const text =
        err?.response?.data?.error || err?.message || 'Delete failed';
      flash(text, 'danger');
    } finally {
      setListBusy(false);
    }
  };

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
    <div className="ac-container mx-auto w-75 my-4">
      <header className="ac-header">
        <h3 className="ac-title">Admin — Dashboard</h3>
        <div className="ac-stats" role="status" aria-live="polite">
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
        <form
          className="ac-form ac-grid ac-grid--responsive"
          onSubmit={(e) => save(e, { reset: false })}
        >
          <div className="ac-field ac-field--full">
            <label className="ac-label" htmlFor="ac-email">
              Email
            </label>
            <input
              id="ac-email"
              type="email"
              className="ac-input"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <small className="ac-help">
              Enter an email and choose a role, then click Save.
            </small>
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
              type="submit"
              className="ac-btn ac-btn--primary"
              disabled={!email || busy}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </section>

      <div className="ac-list-header">
        <h4 className="ac-subtitle">All Users</h4>
        <div className="ac-row ac-row--wrap">
          <input
            className="ac-input ac-input--grow"
            placeholder="Filter by name/email/role…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter users"
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

      {/* Users table with vertical scrollbar and sticky header */}
      <div className="ac-tablewrap ac-tablewrap--large">
        <table className="ac-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>UID</th>
              <th style={{ width: '24%' }}>Email</th>
              <th style={{ width: '18%' }}>Name</th>
              <th style={{ width: '12%' }}>Role</th>
              <th style={{ width: '14%' }}>Updated</th>
              <th style={{ width: '10%' }} aria-label="Actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="ac-muted">
                  {listBusy ? 'Loading…' : 'No users found'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => (
                <tr
                  key={u.id || u.email || idx}
                  className={
                    u.id && u.id === lastChangedUid
                      ? 'ac-row--highlight'
                      : undefined
                  }
                >
                  <td className="ac-mono ac-nowrap">{u.id || '—'}</td>
                  <td className="ac-nowrap">
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
                  <td>
                    <button
                      type="button"
                      className="ac-btn ac-btn--danger ac-btn--sm"
                      onClick={() => onDeleteByUid(u)}
                      disabled={listBusy}
                      title="Delete this user"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
