import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppData } from '../types';
import { SupervisorAccount } from './accounts';

const app = initializeApp(firebaseConfig);
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

// Authenticate anonymously so security rules work seamlessly
let authPromise: Promise<void> | null = null;
export function ensureAuth(): Promise<void> {
  if (!authPromise) {
    authPromise = signInAnonymously(auth)
      .then(() => {
        console.log('Firebase anonymous auth active');
      })
      .catch((err) => {
        console.error('Firebase Auth failed:', err);
      });
  }
  return authPromise;
}

// Collections
const ACCOUNTS_COLLECTION = 'supervisorAccounts';
const WORKSPACE_COLLECTION = 'supervisorData';

// Helper to normalize username key for cloud doc IDs
export function normalizeAccountKey(username: string): string {
  return username.trim().toLowerCase().replace(/[\s\/\#\?\.\@]/g, '_');
}

/**
 * Sync supervisor accounts list from Firestore
 */
export async function fetchSupervisorAccountsCloud(): Promise<SupervisorAccount[]> {
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
  } catch (error) {
    console.error('Error fetching accounts from Firebase:', error);
    return [];
  }
}

/**
 * Listen to realtime updates of supervisor accounts from Firestore
 */
export function subscribeSupervisorAccountsCloud(
  callback: (accounts: SupervisorAccount[]) => void
): () => void {
  ensureAuth();
  const unsubscribe = onSnapshot(
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
    (error) => {
      console.error('Realtime accounts error:', error);
    }
  );
  return unsubscribe;
}

/**
 * Save a supervisor account doc to Firestore
 */
export async function saveSupervisorAccountCloud(account: SupervisorAccount): Promise<void> {
  try {
    await ensureAuth();
    const docKey = normalizeAccountKey(account.nom);
    await setDoc(doc(db, ACCOUNTS_COLLECTION, docKey), {
      ...account,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving account to Firebase:', error);
  }
}

/**
 * Fetch account workspace data from Firestore
 */
export async function fetchAccountDataCloud(accountNom: string): Promise<AppData | null> {
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
  } catch (error) {
    console.error('Error fetching workspace data from Firebase:', error);
  }
  return null;
}

/**
 * Save account workspace data to Firestore (Clean replace for accurate additions/deletions)
 */
export async function saveAccountDataCloud(accountNom: string, data: AppData): Promise<void> {
  try {
    await ensureAuth();
    const docKey = normalizeAccountKey(accountNom);
    if (!docKey) return;
    await setDoc(doc(db, WORKSPACE_COLLECTION, docKey), {
      accountNom,
      data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving workspace data to Firebase:', error);
  }
}

/**
 * Subscribe to real-time changes of account workspace data from Firestore
 */
export function subscribeAccountDataCloud(
  accountNom: string,
  callback: (data: AppData) => void
): () => void {
  ensureAuth();
  const docKey = normalizeAccountKey(accountNom);
  if (!docKey) return () => {};

  const unsubscribe = onSnapshot(
    doc(db, WORKSPACE_COLLECTION, docKey),
    (docSnap) => {
      if (docSnap.exists()) {
        const payload = docSnap.data();
        if (payload && payload.data) {
          callback(payload.data as AppData);
        }
      }
    },
    (error) => {
      console.error('Realtime account data error:', error);
    }
  );
  return unsubscribe;
}
