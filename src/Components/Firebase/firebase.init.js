// src/firebase.init.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore, collection, serverTimestamp } from 'firebase/firestore';
// ❌ remove: import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase.config';

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore
export const db = getFirestore(app);
export const database = {
  users: collection(db, 'users'),
  docs: collection(db, 'docs'), // keep if you use it, or remove if not needed
  // ❌ remove: files: collection(db, 'files'),
  timestamp: serverTimestamp,
};

// ❌ remove Storage export and helper
// export const storage = getStorage(app);

export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return user.getIdToken();
}

export default app;
