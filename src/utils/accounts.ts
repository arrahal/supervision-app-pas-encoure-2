import { AppData } from '../types';
import { INITIAL_DATA, INITIAL_SUPERVISOR } from '../data/initialData';
import { saveData, loadData } from './storage';
import {
  saveSupervisorAccountCloud,
  saveAccountDataCloud,
  fetchAccountDataCloud,
  fetchSupervisorAccountsCloud,
} from './firebase';

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
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse supervisor accounts list', e);
  }

  return [];
}

export function saveSupervisorAccountsList(accounts: SupervisorAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    // Save all to cloud
    accounts.forEach((acc) => saveSupervisorAccountCloud(acc));
  } catch (e) {
    console.error('Failed to save accounts list', e);
  }
}

export function getActiveAccountId(): string {
  return localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY) || '';
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

  // Initial fresh clean workspace data for new supervisor account
  const initialWorkspace: AppData = {
    supervisor: {
      nom: account.nom,
      password: account.password,
      project: account.project,
      region: account.region,
      province: account.province,
    },
    currentMonth: new Date().getMonth() + 1,
    animateurs: [],
    ecoles: [],
    groupes: [],
    reports: [],
    nextId: { a: 1, e: 1, g: 1, r: 1 },
    monthData: {},
  };
  return initialWorkspace;
}

export function saveAccountData(accountId: string, data: AppData): void {
  try {
    localStorage.setItem(`supData_${accountId}`, JSON.stringify(data));
    saveData(data);
    if (data.supervisor?.nom) {
      saveAccountDataCloud(data.supervisor.nom, data);
    }
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

  // Initialize clean workspace data for new supervisor account
  const initialWorkspace: AppData = {
    supervisor: {
      nom: newAcc.nom,
      password: newAcc.password,
      project: newAcc.project,
      region: newAcc.region,
      province: newAcc.province,
    },
    currentMonth: new Date().getMonth() + 1,
    animateurs: [],
    ecoles: [],
    groupes: [],
    reports: [],
    nextId: { a: 1, e: 1, g: 1, r: 1 },
    monthData: {},
  };

  saveAccountData(newId, initialWorkspace);
  saveSupervisorAccountCloud(newAcc);
  saveAccountDataCloud(newAcc.nom, initialWorkspace);

  return { account: newAcc, data: initialWorkspace };
}

export function updateCurrentSupervisorAccount(
  accountId: string,
  updates: Partial<SupervisorAccount>
): void {
  const accounts = getSupervisorAccounts();
  const updatedAccounts = accounts.map((acc) => {
    if (acc.id === accountId) {
      const updated = { ...acc, ...updates };
      saveSupervisorAccountCloud(updated);
      return updated;
    }
    return acc;
  });
  saveSupervisorAccountsList(updatedAccounts);
}

