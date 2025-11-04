// src/Components/Api/Api.js
import axios from 'axios';

// ---- Robust Firebase auth import (works with named or default exports) ----
import * as FirebaseInit from '../Firebase/firebase.init';
// try named export first, then default.auth, then default itself (if it IS the auth)
const auth =
  FirebaseInit.auth ||
  (FirebaseInit.default && FirebaseInit.default.auth) ||
  (FirebaseInit.default &&
  typeof FirebaseInit.default.currentUser !== 'undefined'
    ? FirebaseInit.default
    : null);

/* ------------------ Resolve API base (Vite or CRA) ------------------ */
const RAW_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  'https://databank.tcscontrols.com.my';

const API_BASE = String(RAW_BASE).replace(/\/+$/, ''); // strip trailing slash

/* ------------------ Axios instance ------------------ */
const axiosClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // keep if you use cookies; harmless otherwise
  timeout: 60_000,
  headers: {
    Accept: 'application/json',
  },
});

/* ---- Attach Firebase ID token (Bearer) when available ---- */
axiosClient.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};

    const user = auth?.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      try {
        const token = await user.getIdToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // send request without Authorization if token fetch fails
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ------------------ Error normalization ------------------ */
function toErrorMessage(err) {
  // Backend-provided message
  if (err?.response?.data?.error) return String(err.response.data.error);

  // HTTP status
  if (typeof err?.response?.status === 'number') {
    const status = err.response.status;
    const text = err.response.statusText || 'Error';
    return `HTTP ${status}${text ? ` ${text}` : ''}`;
  }

  // Network/timeout/etc.
  return err?.message || 'Request failed';
}

/* ------------------ GET config normalization ------------------ */
function normalizeGetConfig(arg) {
  if (
    arg &&
    typeof arg === 'object' &&
    (Object.prototype.hasOwnProperty.call(arg, 'params') ||
      Object.prototype.hasOwnProperty.call(arg, 'headers') ||
      Object.prototype.hasOwnProperty.call(arg, 'responseType') ||
      Object.prototype.hasOwnProperty.call(arg, 'timeout'))
  ) {
    return arg; // already axios config
  }
  return arg ? { params: arg } : undefined; // treat plain object as params
}

/* ------------------ API wrapper ------------------ */
export const api = {
  get: (url, configOrParams) =>
    axiosClient
      .get(url, normalizeGetConfig(configOrParams))
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      }),

  post: (url, body) =>
    axiosClient
      .post(url, body)
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      }),

  put: (url, body) =>
    axiosClient
      .put(url, body)
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      }),

  patch: (url, body) =>
    axiosClient
      .patch(url, body)
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      }),

  // DELETE with optional body (Axios accepts { data })
  delete: (url, body) =>
    axiosClient
      .delete(url, body ? { data: body } : undefined)
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      }),

  // Alias if you prefer api.del()
  del: (url, body) =>
    axiosClient
      .delete(url, body ? { data: body } : undefined)
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      }),

  // Multipart file upload — backend expects "file" and "path"
  uploadFile: (destPath, file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('path', destPath || '/'); // backend uses req.body.path

    // IMPORTANT: do not set Content-Type; the browser sets the multipart boundary
    return axiosClient
      .post('/api/upload', fd)
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      });
  },

  // Optional: download helper that returns a Blob
  download: (url, params) =>
    axiosClient
      .get(url, { params, responseType: 'blob' })
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      }),
};

export { axiosClient };
export default api;
