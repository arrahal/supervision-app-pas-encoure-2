import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
  onSnapshot,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppData } from '../types';
import { SupervisorAccount } from './accounts';

const app = initializeApp(firebaseConfig);
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

// Authenticate anonymously if enabled, or proceed seamlessly if disabled
let authPromise: Promise<void> | null = null;
export function ensureAuth(): Promise<void> {
  if (!authPromise) {
    authPromise = signInAnonymously(auth)
      .then(() => {
        // Logged in anonymously
      })
      .catch((err) => {
        // Anonymous auth not enabled in console, proceed unauthenticated
        console.warn('Firebase Anonymous Auth unavailable or restricted:', err?.message || err);
      });
  }
  return authPromise;
}

// Collections
const ACCOUNTS_COLLECTION = 'supervisorAccounts';
const WORKSPACE_COLLECTION = 'supervisorData';

// Quota circuit breaker to protect app from Firestore free tier quota errors
const TODAY_DATE = new Date().toISOString().split('T')[0];
const SAVED_QUOTA_DATE = localStorage.getItem('firestore_quota_date');
let isQuotaExhausted = SAVED_QUOTA_DATE === TODAY_DATE;

if (isQuotaExhausted) {
  disableNetwork(db).catch(() => {});
} else {
  enableNetwork(db).catch(() => {});
}

function isQuotaError(error: any): boolean {
  if (!error) return false;
  const code = String(error?.code || '');
  const msg = String(error?.message || error?.stack || error);
  return (
    code === 'resource-exhausted' ||
    code === 'unavailable' ||
    code === 'permission-denied' ||
    code === 'failed-precondition' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('Free daily write units') ||
    msg.includes('quota') ||
    msg.includes('429')
  );
}

function triggerQuotaFallback() {
  if (!isQuotaExhausted) {
    isQuotaExhausted = true;
    try {
      localStorage.setItem('firestore_quota_date', TODAY_DATE);
    } catch (e) {}
    console.warn('Firestore daily quota reached or unavailable. Falling back seamlessly to local storage.');
    disableNetwork(db).catch(() => {});
  }
}

// Global listener for unhandled quota rejections from Firebase SDK
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (isQuotaError(event.reason)) {
      triggerQuotaFallback();
      event.preventDefault(); // suppress unhandled rejection console noise
    }
  });
  window.addEventListener('error', (event) => {
    if (isQuotaError(event.error)) {
      triggerQuotaFallback();
      event.preventDefault();
    }
  });
}

// Helper to normalize username key for cloud doc IDs
export function normalizeAccountKey(username: string): string {
  return username.trim().toLowerCase().replace(/[\s\/\#\?\.\@]/g, '_');
}

/**
 * Sync supervisor accounts list from Firestore
 */
export async function fetchSupervisorAccountsCloud(): Promise<SupervisorAccount[]> {
  if (isQuotaExhausted) return [];
  try {
    await ensureAuth();
    const querySnapshot = await getDocs(collection(db, ACCOUNTS_COLLECTION));
    const accounts: SupervisorAccount[] = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SupervisorAccount;
        accounts.push(data);
      }
    });
    return accounts;
  } catch (error: any) {
    triggerQuotaFallback();
    console.warn('Firebase accounts sync fallback active:', error?.message || error);
    return [];
  }
}

/**
 * Listen to realtime updates of supervisor accounts from Firestore
 */
export function subscribeSupervisorAccountsCloud(
  callback: (accounts: SupervisorAccount[]) => void
): () => void {
  if (isQuotaExhausted) return () => {};
  let unsubFn: (() => void) | null = null;
  let isCancelled = false;

  ensureAuth()
    .then(() => {
      if (isCancelled || isQuotaExhausted) return;
      unsubFn = onSnapshot(
        collection(db, ACCOUNTS_COLLECTION),
        (snapshot) => {
          const accounts: SupervisorAccount[] = [];
          snapshot.forEach((docSnap) => {
            if (docSnap.exists()) {
              accounts.push(docSnap.data() as SupervisorAccount);
            }
          });
          callback(accounts);
        },
        (error: any) => {
          triggerQuotaFallback();
          console.warn('Realtime accounts fallback active:', error?.message || error);
        }
      );
    })
    .catch((err) => {
      triggerQuotaFallback();
      console.warn('Auth for accounts subscription fallback active:', err?.message || err);
    });

  return () => {
    isCancelled = true;
    if (unsubFn) unsubFn();
  };
}

/**
 * Save a supervisor account doc to Firestore
 */
export async function saveSupervisorAccountCloud(account: SupervisorAccount): Promise<void> {
  if (isQuotaExhausted) return;
  try {
    await ensureAuth();
    const docKey = normalizeAccountKey(account.nom);
    await setDoc(doc(db, ACCOUNTS_COLLECTION, docKey), {
      ...account,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    triggerQuotaFallback();
    console.warn('Firebase account save fallback active:', error?.message || error);
  }
}

/**
 * Fetch account workspace data from Firestore
 */
export async function fetchAccountDataCloud(accountNom: string): Promise<AppData | null> {
  if (isQuotaExhausted) return null;
  try {
    await ensureAuth();
    const docKey = normalizeAccountKey(accountNom);
    if (!docKey) return null;
    const docSnap = await getDoc(doc(db, WORKSPACE_COLLECTION, docKey));
    if (docSnap.exists()) {
      const payload = docSnap.data();
      if (payload && payload.data) {
        return payload.data as AppData;
      }
    }
  } catch (error: any) {
    triggerQuotaFallback();
    console.warn('Firebase workspace fetch fallback active:', error?.message || error);
  }
  return null;
}

/**
 * Save account workspace data to Firestore (Clean replace for accurate additions/deletions)
 */
export async function saveAccountDataCloud(accountNom: string, data: AppData): Promise<void> {
  if (isQuotaExhausted) return;
  try {
    await ensureAuth();
    const docKey = normalizeAccountKey(accountNom);
    if (!docKey) return;
    await setDoc(doc(db, WORKSPACE_COLLECTION, docKey), {
      accountNom,
      data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    triggerQuotaFallback();
    console.warn('Firebase workspace save fallback active:', error?.message || error);
  }
}

/**
 * Subscribe to real-time changes of account workspace data from Firestore
 */
export function subscribeAccountDataCloud(
  accountNom: string,
  callback: (data: AppData) => void
): () => void {
  if (isQuotaExhausted) return () => {};
  const docKey = normalizeAccountKey(accountNom);
  if (!docKey) return () => {};

  let unsubFn: (() => void) | null = null;
  let isCancelled = false;

  ensureAuth()
    .then(() => {
      if (isCancelled || isQuotaExhausted) return;
      unsubFn = onSnapshot(
        doc(db, WORKSPACE_COLLECTION, docKey),
        (docSnap) => {
          if (docSnap.exists()) {
            const payload = docSnap.data();
            if (payload && payload.data) {
              callback(payload.data as AppData);
            }
          }
        },
        (error: any) => {
          triggerQuotaFallback();
          console.warn('Realtime account data fallback active:', error?.message || error);
        }
      );
    })
    .catch((err) => {
      triggerQuotaFallback();
      console.warn('Auth for account data subscription fallback active:', err?.message || err);
    });

  return () => {
    isCancelled = true;
    if (unsubFn) unsubFn();
  };
}

/**
 * Delete all accounts and workspace data stored in Firebase Firestore
 */
export async function clearAllCloudData(): Promise<boolean> {
  try {
    await ensureAuth();
    const accountsSnap = await getDocs(collection(db, ACCOUNTS_COLLECTION));
    const deletePromises: Promise<void>[] = [];
    accountsSnap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });

    const dataSnap = await getDocs(collection(db, WORKSPACE_COLLECTION));
    dataSnap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });

    await Promise.all(deletePromises);
    console.log('Successfully cleared all Firebase cloud data.');
    return true;
  } catch (error: any) {
    triggerQuotaFallback();
    console.warn('Firebase clear cloud data fallback active:', error?.message || error);
    return false;
  }
}
