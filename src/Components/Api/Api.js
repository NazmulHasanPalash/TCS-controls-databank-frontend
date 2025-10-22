// src/Components/Api/Api.js
import axios from 'axios';
import { auth } from '../Firebase/firebase.init'; // ← adjust if your path differs

// Resolve API base for both Vite and CRA
const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  'http://localhost:5000';

// Create a preconfigured Axios instance
const axiosClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ok even if unused; server allows credentials
  timeout: 60000, // 60s safety timeout
});

// Attach Firebase ID token to every request when available
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      config.headers = config.headers || {};
      const user = auth.currentUser;
      if (user && typeof user.getIdToken === 'function') {
        const token = await user.getIdToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore token fetch errors; request proceeds unauthenticated
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize backend / HTTP errors so the UI gets clean messages
function toErrorMessage(err) {
  // Prefer server-provided error message
  if (err?.response?.data?.error) return String(err.response.data.error);
  // Fallback to HTTP status
  if (typeof err?.response?.status === 'number')
    return `HTTP ${err.response.status}`;
  // Axios/network/message fallback
  return err?.message || 'Request failed';
}

export const api = {
  get: (url, params) =>
    axiosClient
      .get(url, { params })
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

  del: (url, body) =>
    axiosClient
      .delete(url, { data: body })
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      }),

  // Multipart upload for /api/upload
  // destPath: remote folder (e.g., "/my/folder"), file: File object
  uploadFile: (destPath, file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('path', destPath || '/'); // backend expects "path"
    // Do NOT set Content-Type manually; browser sets correct multipart boundary
    return axiosClient
      .post('/api/upload', fd)
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(toErrorMessage(e));
      });
  },

  // Optional: download helper (returns Blob)
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
