/**
 * Firebase — Cross-Device Performance Sync
 * Project: rrb-group-d-mastery
 * 
 * Uses Firebase Auth (Google) so Firestore rules can verify identity.
 * Each user can only read/write their own data.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

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
export const db  = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence → works without internet, syncs on reconnect
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[Firebase] Offline persistence: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('[Firebase] Offline persistence: not supported');
  }
});

/**
 * Sign into Firebase using the Google credential token from Google Identity Services.
 * This gives us a verified Firebase user (auth.currentUser.uid).
 * The uid is then used as the Firestore document key — so rules can enforce
 * "only the real owner can read/write their data".
 */
export async function firebaseSignInWithGoogle(googleIdToken: string): Promise<string | null> {
  try {
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const result = await signInWithCredential(auth, credential);
    return result.user.uid;
  } catch (err) {
    console.warn('[Firebase] Auth sign-in failed:', err);
    return null;
  }
}

/**
 * Get the current Firebase Auth UID (null if not signed in).
 */
export function getFirebaseUid(): string | null {
  return auth.currentUser?.uid ?? null;
}
