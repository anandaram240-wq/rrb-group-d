/**
 * Firebase Configuration — Cross-Device Performance Sync
 * 
 * Set these env vars in Vercel dashboard:
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_APP_ID
 * 
 * Or fill them in below directly.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:             import.meta.env.VITE_FIREBASE_API_KEY       || "AIzaSyBxRRBGroupDMasteryProKey2026April",
  authDomain:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN   || "rrb-group-d-mastery.firebaseapp.com",
  projectId:          import.meta.env.VITE_FIREBASE_PROJECT_ID    || "rrb-group-d-mastery",
  storageBucket:      import.meta.env.VITE_FIREBASE_BUCKET        || "rrb-group-d-mastery.appspot.com",
  messagingSenderId:  import.meta.env.VITE_FIREBASE_SENDER_ID     || "323884124313",
  appId:              import.meta.env.VITE_FIREBASE_APP_ID        || "1:323884124313:web:rrbgroupdmastery2026",
};

// Initialize only once
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence (works offline, syncs when reconnected)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — only one can use persistence
    console.warn('[Firebase] Offline persistence disabled (multiple tabs)');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support
    console.warn('[Firebase] Offline persistence not supported');
  }
});

/**
 * Convert email to a safe Firestore document ID.
 * Firestore doc IDs can't have: / \ . * [ ] ` or be empty
 */
export function emailToDocId(email: string): string {
  return email.toLowerCase()
    .replace(/[@.]/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 100); // max 100 chars
}
