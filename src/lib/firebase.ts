/**
 * Firebase — Cross-Device Performance Sync
 * Project: rrb-group-d-mastery
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyD9qJUIdatMqFafpQGlnnxmD3E7Vc6lWf4",
  authDomain:        "rrb-group-d-mastery.firebaseapp.com",
  projectId:         "rrb-group-d-mastery",
  storageBucket:     "rrb-group-d-mastery.firebasestorage.app",
  messagingSenderId: "128235072124",
  appId:             "1:128235072124:web:87e7339518e8ee1c1ff7f9",
  measurementId:     "G-1E16BW58WW",
};

// Initialize only once (React StrictMode safe)
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence → works without internet, auto-syncs on reconnect
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs — only one can use IndexedDB persistence
    console.warn('[Firebase] Offline persistence: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('[Firebase] Offline persistence: not supported by this browser');
  }
});

/**
 * Convert email to a safe Firestore document ID.
 * e.g. ananda@gmail.com → ananda_gmail_com
 */
export function emailToDocId(email: string): string {
  return email.toLowerCase()
    .replace(/[@.]/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 100);
}
