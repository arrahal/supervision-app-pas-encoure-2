import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

async function main() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

  try {
    await signInAnonymously(auth);
  } catch (e) {
    console.log('Anon auth skipped, proceeding unauthenticated...');
  }

  console.log('Clearing supervisorAccounts collection...');
  try {
    const accSnap = await getDocs(collection(db, 'supervisorAccounts'));
    for (const docSnap of accSnap.docs) {
      console.log('Deleting account doc:', docSnap.id);
      await deleteDoc(docSnap.ref);
    }
  } catch (e: any) {
    console.error('Error clearing accounts:', e?.message || e);
  }

  console.log('Clearing supervisorData collection...');
  try {
    const wsSnap = await getDocs(collection(db, 'supervisorData'));
    for (const docSnap of wsSnap.docs) {
      console.log('Deleting workspace doc:', docSnap.id);
      await deleteDoc(docSnap.ref);
    }
  } catch (e: any) {
    console.error('Error clearing workspace data:', e?.message || e);
  }

  console.log('FIREBASE CLEANUP FINISHED SUCCESSFULLY!');
  process.exit(0);
}

main();
