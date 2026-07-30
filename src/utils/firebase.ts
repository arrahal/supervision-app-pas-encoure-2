import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
  disableNetwork,
  enableNetwork,
  deleteDoc,
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

function triggerQuotaFallback() {
  if (!isQuotaExhausted) {
    isQuotaExhausted = true;
    try {
      localStorage.setItem('firestore_quota_date', TODAY_DATE);
    } catch (e) {}
    console.warn('Firestore daily write/read quota limit reached. Disabling network background sync to fall back seamlessly to local storage.');
    disableNetwork(db).catch(() => {});
  }
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
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      triggerQuotaFallback();
    } else {
      console.error('Error fetching accounts from Firebase:', error);
    }
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
          if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
            triggerQuotaFallback();
          } else {
            console.error('Realtime accounts error:', error);
          }
        }
      );
    })
    .catch((err) => {
      console.error('Error in ensureAuth for supervisor accounts subscription:', err);
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
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      triggerQuotaFallback();
    } else {
      console.error('Error saving account to Firebase:', error);
    }
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
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      triggerQuotaFallback();
    } else {
      console.error('Error fetching workspace data from Firebase:', error);
    }
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
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      triggerQuotaFallback();
    } else {
      console.error('Error saving workspace data to Firebase:', error);
    }
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
          if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
            triggerQuotaFallback();
          } else {
            console.error('Realtime account data error:', error);
          }
        }
      );
    })
  return () => {
    isCancelled = true;
    if (unsubFn) unsubFn();
  };
}

/**
 * Delete all saved supervisor accounts and workspace data from Firebase Cloud
 */
export async function clearAllFirebaseDataCloud(): Promise<void> {
  if (isQuotaExhausted) return;
  try {
    await ensureAuth();

    // 1. Delete all supervisor accounts docs
    const accSnaps = await getDocs(collection(db, ACCOUNTS_COLLECTION));
    const deleteAccPromises: Promise<void>[] = [];
    accSnaps.forEach((docSnap) => {
      deleteAccPromises.push(deleteDoc(doc(db, ACCOUNTS_COLLECTION, docSnap.id)));
    });
    await Promise.all(deleteAccPromises);

    // 2. Delete all supervisor data workspace docs
    const workSnaps = await getDocs(collection(db, WORKSPACE_COLLECTION));
    const deleteWorkPromises: Promise<void>[] = [];
    workSnaps.forEach((docSnap) => {
      deleteWorkPromises.push(deleteDoc(doc(db, WORKSPACE_COLLECTION, docSnap.id)));
    });
    await Promise.all(deleteWorkPromises);

    console.log('Successfully cleared all Firebase Cloud documents.');
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      triggerQuotaFallback();
    } else {
      console.error('Error clearing Firebase data:', error);
    }
  }
}

/**
 * Purges old default data from localStorage and Firebase Cloud on first boot
 */
export async function purgeAllDataOnFirstRun(): Promise<void> {
  const isPurged = localStorage.getItem('firebase_data_purged_v3');
  if (!isPurged) {
    try {
      localStorage.removeItem('sup_accounts_list_v1');
      localStorage.removeItem('active_sup_account_id');
      localStorage.removeItem('supPed2');
      await clearAllFirebaseDataCloud();
      localStorage.setItem('firebase_data_purged_v3', 'true');
    } catch (e) {
      console.error('Failed to purge old data', e);
    }
  }
}

