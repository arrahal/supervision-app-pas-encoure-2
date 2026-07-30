import React, { useState, useEffect } from 'react';
import { Lock, User, KeyRound, AlertCircle, Eye, EyeOff, LogIn, UserPlus, CheckCircle2, Loader2, Cloud, Trash2 } from 'lucide-react';
import { AppData } from '../types';
import { Language } from '../utils/i18n';
import {
  SupervisorAccount,
  getSupervisorAccounts,
  loadAccountData,
  createSupervisorAccount,
  setActiveAccountId,
  saveSupervisorAccountsList,
  saveAccountData,
} from '../utils/accounts';
import {
  fetchSupervisorAccountsCloud,
  fetchAccountDataCloud,
  subscribeSupervisorAccountsCloud,
  clearAllFirebaseDataCloud,
  purgeAllDataOnFirstRun,
} from '../utils/firebase';

interface LoginModalProps {
  db: AppData;
  lang: Language;
  onLoginSuccess: (account: SupervisorAccount, loadedDb: AppData) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ db, lang, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'create'>('create');
  const [accounts, setAccounts] = useState<SupervisorAccount[]>([]);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Login form state
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Create Account form state
  const [newName, setNewName] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newProject, setNewProject] = useState<string>('');
  const [newRegion, setNewRegion] = useState<string>('');
  const [newProvince, setNewProvince] = useState<string>('');

  // Load existing supervisor accounts on mount & subscribe to cloud accounts updates
  useEffect(() => {
    async function initAccounts() {
      await purgeAllDataOnFirstRun();
      const list = getSupervisorAccounts();
      setAccounts(list);
      if (list.length === 0) {
        setMode('create');
      } else {
        setMode('login');
        if (list[0].nom) {
          setUsernameInput(list[0].nom);
        }
      }
    }
    initAccounts();

    // Subscribe to Firebase Cloud accounts realtime updates
    const unsub = subscribeSupervisorAccountsCloud((cloudAccounts) => {
      if (cloudAccounts && cloudAccounts.length > 0) {
        setAccounts((prev) => {
          const mergedMap = new Map<string, SupervisorAccount>();
          prev.forEach((a) => mergedMap.set(a.nom.trim().toLowerCase(), a));
          cloudAccounts.forEach((ca) => mergedMap.set(ca.nom.trim().toLowerCase(), ca));
          const merged = Array.from(mergedMap.values());
          saveSupervisorAccountsList(merged);
          return merged;
        });
      }
    });

    return () => unsub();
  }, [db]);

  // Login action with Cloud Sync
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedName) {
      setErrorMsg(lang === 'fr' ? 'Veuillez saisir le nom du المشرف' : 'يرجى إدخال اسم المشرف التربوي');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg(lang === 'fr' ? 'Veuillez saisir le mot de passe' : 'يرجى إدخال كلمة المرور الخاصة بالمشرف');
      return;
    }

    setIsSyncingCloud(true);

    try {
      // 1. Check local list first
      let matchedAccount = accounts.find(
        (acc) => acc.nom.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      // 2. If not found locally, fetch latest accounts list directly from Firebase Cloud
      if (!matchedAccount) {
        const cloudAccounts = await fetchSupervisorAccountsCloud();
        if (cloudAccounts && cloudAccounts.length > 0) {
          matchedAccount = cloudAccounts.find(
            (acc) => acc.nom.trim().toLowerCase() === trimmedName.toLowerCase()
          );
          if (matchedAccount) {
            // Update local list
            const currentList = getSupervisorAccounts();
            const updated = [...currentList.filter((a) => a.nom.trim().toLowerCase() !== trimmedName.toLowerCase()), matchedAccount];
            saveSupervisorAccountsList(updated);
            setAccounts(updated);
          }
        }
      }

      // 3. Fallback match check with current db supervisor if single account
      if (!matchedAccount && db.supervisor) {
        if (
          db.supervisor.nom.trim().toLowerCase() === trimmedName.toLowerCase() &&
          (db.supervisor.password || '123456') === trimmedPass
        ) {
          const defaultAccount: SupervisorAccount = {
            id: 'sup_default',
            nom: db.supervisor.nom,
            password: db.supervisor.password || '123456',
            project: db.supervisor.project || '',
            region: db.supervisor.region || '',
            province: db.supervisor.province || '',
            createdAt: new Date().toISOString(),
          };

          // Try fetching cloud workspace data
          const cloudData = await fetchAccountDataCloud(defaultAccount.nom);
          const finalData = cloudData || db;
          saveAccountData(defaultAccount.id, finalData);

          setIsSyncingCloud(false);
          onLoginSuccess(defaultAccount, finalData);
          return;
        }
      }

      if (matchedAccount) {
        if (matchedAccount.password === trimmedPass) {
          setActiveAccountId(matchedAccount.id);

          // Attempt to fetch latest cloud workspace data for this account
          const cloudData = await fetchAccountDataCloud(matchedAccount.nom);
          const localData = loadAccountData(matchedAccount);
          const accountWorkspace = cloudData || localData;

          // Save combined data locally
          saveAccountData(matchedAccount.id, accountWorkspace);

          setIsSyncingCloud(false);
          onLoginSuccess(matchedAccount, accountWorkspace);
        } else {
          setIsSyncingCloud(false);
          setErrorMsg(
            lang === 'fr'
              ? `Mot de passe incorrect pour ${matchedAccount.nom}.`
              : `كلمة المرور غير صحيحة للمشرف: (${matchedAccount.nom}).`
          );
        }
      } else {
        setIsSyncingCloud(false);
        setErrorMsg(
          lang === 'fr'
            ? 'Aucun compte trouvé avec ce nom. Vous pouvez créer un nouveau compte.'
            : 'لم يتم العثور على حساب بهذا الاسم. يمكنك إنشاء حساب مشرف جديد من خيار "+ حساب مشرف جديد" بالأعلى.'
        );
      }
    } catch (err) {
      console.error('Login error:', err);
      setIsSyncingCloud(false);
      setErrorMsg('حدث خطأ أثناء الاتصال بالسحابة. يرجى التحقق من الاتصال بالإنترنت.');
    }
  };

  // Create Account action
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = newName.trim();
    const trimmedPass = newPassword.trim();

    if (!trimmedName) {
      setErrorMsg(lang === 'fr' ? 'Veuillez saisir le اسم المشرف' : 'يرجى إدخال اسم المشرف التربوي الجديد');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg(lang === 'fr' ? 'Veuillez définir un mot de passe' : 'يرجى إدخال كلمة مرور للحساب الجديد');
      return;
    }

    // Check if account name already exists
    const existing = accounts.find((a) => a.nom.trim().toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      setErrorMsg(
        lang === 'fr'
          ? 'Un compte existe déjà avec ce nom. Veuillez vous connecter.'
          : 'يوجد حساب مسجل بالفعل بهذا الاسم! يمكنك أدخال اسمك وكلمة المرور لتسجيل الدخول.'
      );
      return;
    }

    // Create supervisor account
    const { account, data } = createSupervisorAccount(
      trimmedName,
      trimmedPass,
      newProject,
      newRegion,
      newProvince
    );

    // Log in immediately as the newly created supervisor
    onLoginSuccess(account, data);
  };

  const handleClearFirebaseData = async () => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف جميع البيانات والحسابات المسجلة حالياً في Firebase وإعادة الضبط؟')) {
      return;
    }
    setIsPurging(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await clearAllFirebaseDataCloud();
      localStorage.removeItem('sup_accounts_list_v1');
      localStorage.removeItem('active_sup_account_id');
      localStorage.removeItem('supPed2');
      setAccounts([]);
      setMode('create');
      setSuccessMsg('تم حذف جميع البيانات القديمة من Firebase والمحفظة المحلية بنجاح!');
    } catch (e) {
      setErrorMsg('حدث خطأ أثناء محاولة حذف البيانات من Firebase');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm sm:max-w-md w-full p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[92dvh] overflow-y-auto">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/80 rounded-2xl p-1.5 shadow-inner flex items-center justify-center">
            <img src="/zakoura-logo.svg" alt="Fondation Zakoura" className="w-full h-full object-contain" />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
              {lang === 'fr' ? 'Espace Supervision Pédagogique' : 'بوابة حسابات المشرفين التربويين'}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              {lang === 'fr' ? 'مؤسسة زاكورة — Fondation Zakoura' : 'تأطير وتتبع الزيارات الميدانية — مؤسسة زاكورة'}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Login / Create Account */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login' ? 'bg-white text-blue-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('create');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'create' ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ حساب مشرف جديد</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-bold animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM 1: LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>اسم المشرف التربوي:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="أدخل اسم المشرف التربوي"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>كلمة المرور الخاصة بالمشرف:</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور الخاصة بالمشرف"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition outline-none font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Login */}
            <button
              type="submit"
              disabled={isSyncingCloud}
              className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 active:scale-98 text-white font-extrabold text-xs py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-75"
            >
              {isSyncingCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جاري المزامنة مع السحابة والتحقق...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول لحساب المشرف</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* FORM 2: CREATE ACCOUNT MODE */}
        {mode === 'create' && (
          <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl text-emerald-950 font-medium text-[11px] leading-relaxed">
              🌱 يمكنك إنشاء حساب مستقل لكل مشرف تربوي يحتفظ بكلمة مرور خاصة وبيانات مستقلة.
            </div>

            {/* New Name */}
            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">اسم المشرف التربوي الجديد *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="أدخل اسم المشرف"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">كلمة المرور الخاصة بالمشرف *</label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أنشئ كلمة مرور خاصة بهذا الحساب"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Project Name */}
            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">اسم المشروع التربوي</label>
              <input
                type="text"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="أدخل اسم المشروع التربوي"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Region & Province */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-bold mb-0.5">الجهة / الأكاديمية</label>
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="الجهة / الأكاديمية"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-0.5">المديرية الإقليمية</label>
                <input
                  type="text"
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                  placeholder="المديرية الإقليمية"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-[11px]"
                />
              </div>
            </div>

            {/* Submit Create Account */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-98 text-white font-extrabold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>إنشاء الحساب وبدء استخدام التطبيق</span>
            </button>
          </form>
        )}

        <div className="text-center pt-2.5 border-t border-slate-100 space-y-2">
          <p className="text-[10px] text-slate-400 font-medium">
            🔒 تضمن المؤسسة الخصوصية التامة والحفاظ على حسابات جميع المشرفين
          </p>

          <button
            type="button"
            onClick={handleClearFirebaseData}
            disabled={isPurging}
            className="w-full text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-98 transition py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isPurging ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري مسح وحذف كافة البيانات من Firebase...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف جميع البيانات السابقة من Firebase وإعادة الضبط</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
