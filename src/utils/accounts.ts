import { AppData } from '../types';
import { INITIAL_DATA, INITIAL_SUPERVISOR } from '../data/initialData';
import { saveData, loadData } from './storage';

export interface SupervisorAccount {
  id: string;
  nom: string;
  password: string;
  project: string;
  region: string;
  province: string;
  createdAt: string;
}

const ACCOUNTS_KEY = 'sup_accounts_list_v1';
const ACTIVE_ACCOUNT_ID_KEY = 'active_sup_account_id';

export function getSupervisorAccounts(): SupervisorAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse supervisor accounts list', e);
  }

  // Fallback to current db supervisor or default supervisor
  const currentDb = loadData();
  const currentSup = currentDb.supervisor || INITIAL_SUPERVISOR;

  const defaultAccount: SupervisorAccount = {
    id: 'sup_default',
    nom: currentSup.nom || 'المشرف التربوي',
    password: currentSup.password || '123456',
    project: currentSup.project || '',
    region: currentSup.region || '',
    province: currentSup.province || '',
    createdAt: new Date().toISOString(),
  };

  const initialList = [defaultAccount];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(initialList));
  return initialList;
}

export function saveSupervisorAccountsList(accounts: SupervisorAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts list', e);
  }
}

export function getActiveAccountId(): string {
  return localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY) || 'sup_default';
}

export function setActiveAccountId(id: string): void {
  localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, id);
}

export function loadAccountData(account: SupervisorAccount): AppData {
  try {
    const raw = localStorage.getItem(`supData_${account.id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return {
        ...parsed,
        supervisor: {
          nom: account.nom,
          password: account.password,
          project: account.project,
          region: account.region,
          province: account.province,
        },
      };
    }
  } catch (e) {
    console.error('Failed to load data for account', account.id, e);
  }

  // If first time for this account, clone current data with updated supervisor details
  const currentGlobal = loadData();
  const copy: AppData = JSON.parse(JSON.stringify(currentGlobal));
  copy.supervisor = {
    nom: account.nom,
    password: account.password,
    project: account.project,
    region: account.region,
    province: account.province,
  };
  return copy;
}

export function saveAccountData(accountId: string, data: AppData): void {
  try {
    localStorage.setItem(`supData_${accountId}`, JSON.stringify(data));
    saveData(data);
  } catch (e) {
    console.error('Failed to save account data', e);
  }
}

export function createSupervisorAccount(
  nom: string,
  password: string,
  project: string,
  region: string,
  province: string
): { account: SupervisorAccount; data: AppData } {
  const accounts = getSupervisorAccounts();
  const newId = `sup_${Date.now()}`;

  const newAcc: SupervisorAccount = {
    id: newId,
    nom: nom.trim(),
    password: password.trim() || '123456',
    project: project.trim(),
    region: region.trim(),
    province: province.trim(),
    createdAt: new Date().toISOString(),
  };

  const updatedAccounts = [...accounts, newAcc];
  saveSupervisorAccountsList(updatedAccounts);
  setActiveAccountId(newId);

  // Initialize workspace data for new supervisor account
  const initialWorkspace: AppData = JSON.parse(JSON.stringify(INITIAL_DATA));
  initialWorkspace.supervisor = {
    nom: newAcc.nom,
    password: newAcc.password,
    project: newAcc.project,
    region: newAcc.region,
    province: newAcc.province,
  };

  saveAccountData(newId, initialWorkspace);

  return { account: newAcc, data: initialWorkspace };
}

export function updateCurrentSupervisorAccount(
  accountId: string,
  updates: Partial<SupervisorAccount>
): void {
  const accounts = getSupervisorAccounts();
  const updatedAccounts = accounts.map((acc) => {
    if (acc.id === accountId) {
      return { ...acc, ...updates };
    }
    return acc;
  });
  saveSupervisorAccountsList(updatedAccounts);
}
