// src/firebase.init.js
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore, collection, serverTimestamp } from 'firebase/firestore';

import firebaseConfig from './firebase.config'; // must export a config object

/* -------------------- App (singleton) -------------------- */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/* -------------------- Auth -------------------- */
const auth = getAuth(app);

// Set persistence once (don’t await at module top to avoid blocking)
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Google provider (select account each time)
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/* -------------------- Firestore -------------------- */
const db = getFirestore(app);

// Convenience handles to your common collections
const database = {
  users: collection(db, 'users'),
  docs: collection(db, 'docs'),
  timestamp: serverTimestamp, // call as database.timestamp()
};

/* -------------------- Token helper -------------------- */
async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return user.getIdToken(); // returns a Promise<string>
}

/* -------------------- Exports -------------------- */
export { app, auth, db, googleProvider, database, serverTimestamp, getIdToken };
export default app;
