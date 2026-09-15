import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK singleton for server-side (API route) use.
 *
 * Requires these environment variables (server-only, NOT prefixed with
 * NEXT_PUBLIC_ so they never reach the browser bundle):
 *
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (paste the full PEM key; \n line breaks are
 *                           auto-unescaped below so it works whether the
 *                           .env value uses literal newlines or "\n")
 *
 * These come from a Firebase service account JSON
 * (Firebase Console → Project Settings → Service Accounts → Generate new
 * private key).
 */
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment.',
    );
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let cachedDb: Firestore | null = null;

/** Get the server-side Firestore instance (Admin SDK — bypasses security rules). */
export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getAdminApp());
  return cachedDb;
}
