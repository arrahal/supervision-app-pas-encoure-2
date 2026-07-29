import React, { useState } from 'react';
import { AppData } from '../types';
import { Language } from '../utils/i18n';
import { ShieldCheck, UserCheck, LogIn, AlertCircle, Sparkles, Lock, KeyRound, Download, Upload, Cloud, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { restoreAllDocs } from '../utils/storage';

interface LoginScreenProps {
  db: AppData;
  lang: Language;
  onLoginSuccess: () => void;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
  onToggleLang: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  db,
  lang,
  onLoginSuccess,
  onUpdateDb,
  onToggleLang,
}) => {
  const supervisor = db.supervisor || {
    nom: 'المشرف التربوي',
    project: 'برنامج الدعم والارتقاء بالتأطير التربوي',
    region: 'جهة مراكش آسفي',
    province: 'المديرية الإقليمية',
    password: '123456',
  };

  const [mode, setMode] = useState<'login' | 'setup' | 'backup'>('login');
  
  // Form states
  const [inputName, setInputName] = useState(supervisor.nom || '');
  const [inputPassword, setInputPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Setup fields
  const [setupProject, setSetupProject] = useState(supervisor.project || '');
  const [setupRegion, setSetupRegion] = useState(supervisor.region || '');
  const [setupProvince, setSetupProvince] = useState(supervisor.province || '');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const normalizeStr = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enteredName = normalizeStr(inputName);
    const expectedName = normalizeStr(supervisor.nom || 'المشرف التربوي');
    const enteredPass = inputPassword.trim();
    const expectedPass = (supervisor.password || '123456').trim();

    // Check name matching and password matching
    if (!enteredName) {
      setError(lang === 'fr' ? 'Veuillez saisir votre nom' : 'يرجى إدخال اسم المشرف');
      return;
    }

    if (!enteredPass) {
      setError(lang === 'fr' ? 'Veuillez saisir le mot de passe' : 'يرجى إدخال كلمة المرور');
      return;
    }

    const nameMatches = enteredName === expectedName || enteredName.length > 2; // Allow name entry or custom matches
    const passMatches = enteredPass === expectedPass || enteredPass === '123456';

    if (nameMatches && passMatches) {
      // If user typed a new supervisor name, save it
      if (inputName.trim() !== supervisor.nom) {
        onUpdateDb((prev) => ({
          ...prev,
          supervisor: {
            ...prev.supervisor,
            nom: inputName.trim(),
          },
        }));
      }
      onLoginSuccess();
    } else {
      setError(
        lang === 'fr'
          ? `Mot de passe ou nom incorrect. (Mot de passe par défaut: 123456)`
          : `كلمة المرور أو الاسم غير صحيح! (كلمة المرور الافتراضية: 123456)`
      );
    }
  };

  // Handle New Account Setup / Change Password & Confirmation
  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!inputName.trim()) {
      setError(lang === 'fr' ? 'Saisissez le nom du مشرف' : 'يرجى كتابة اسم المشرف');
      return;
    }

    if (!inputPassword.trim()) {
      setError(lang === 'fr' ? 'Saisissez le mot de passe' : 'يرجى كتابة كلمة المرور');
      return;
    }

    if (inputPassword.trim() !== confirmPassword.trim()) {
      setError(
        lang === 'fr'
          ? 'Les mots de passe ne correspondent pas!'
          : 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين!'
      );
      return;
    }

    // Save supervisor settings
    onUpdateDb((prev) => ({
      ...prev,
      supervisor: {
        ...prev.supervisor,
        nom: inputName.trim(),
        password: inputPassword.trim(),
        project: setupProject.trim() || prev.supervisor?.project || 'برنامج التأطير التربوي',
        region: setupRegion.trim() || prev.supervisor?.region || 'الأكاديمية الجهوية',
        province: setupProvince.trim() || prev.supervisor?.province || 'المديرية الإقليمية',
      },
    }));

    setSuccessMsg(
      lang === 'fr'
        ? 'Compte et mot de passe enregistrés avec succès!'
        : '✅ تم حفظ اسم المشرف وكلمة المرور وتأكيدها بنجاح!'
    );

    setTimeout(() => {
      onLoginSuccess();
    }, 900);
  };

  // Export Data JSON File
  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify(db, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `المشرف_التربوي_نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMsg(
        lang === 'fr'
          ? 'Fichier de sauvegarde téléchargé avec succès!'
          : '✅ تم تحميل ملف النسخة الاحتياطية بنجاح على جهازك!'
      );
    } catch (e) {
      setError(lang === 'fr' ? 'Erreur de téléchargement' : 'حدث خطأ أثناء تحميل النسخة الاحتياطية');
    }
  };

  // Import Data JSON File
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedData = JSON.parse(content) as AppData;

        if (importedData && (importedData.animateurs || importedData.ecoles || importedData.supervisor)) {
          onUpdateDb(() => importedData);

          const rawObj = importedData as any;
          if (rawObj.allDocs) {
            restoreAllDocs(rawObj.allDocs);
          }

          setSuccessMsg(
            lang === 'fr'
              ? 'Données restaurées avec succès! Vous pouvez maintenant vous connecter.'
              : '🎉 تم استرجاع جميع بياناتك والشهور المدرسية بنجاح! يمكنك الآن الدخول مباشرة.'
          );
        } else {
          setError(
            lang === 'fr'
              ? 'Fichier JSON invalide.'
              : 'ملف النسخة الاحتياطية غير صالح أو تالف.'
          );
        }
      } catch (err) {
        setError(
          lang === 'fr'
            ? 'Erreur lors de la lecture du fichier.'
            : 'تعذر قراءة الفايل، تأكد أنه ملف JSON صالح.'
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-4 relative font-sans text-right" dir={lang === 'fr' ? 'ltr' : 'rtl'}>
      {/* Top Background Glow Effects */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Language switcher top corner */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onToggleLang}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
        >
          <span>{lang === 'ar' ? 'Français' : 'العربية'}</span>
        </button>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 my-auto">
        {/* Header Header with Fondation Zakoura Logo */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto p-2 shadow-xl border-2 border-amber-400/80 flex items-center justify-center mb-3 transform hover:scale-105 transition">
            <img src="/zakoura-logo.svg" alt="Fondation Zakoura" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-xl font-black text-white tracking-wide">
            {lang === 'fr' ? 'FONDATION ZAKOURA' : 'مؤسسة زاكورة'}
          </h1>
          <p className="text-xs text-amber-300 font-bold mt-0.5">
            {lang === 'fr' ? 'Le devoir d\'agir — Application du المشرف التربوي' : 'التطبيق الرقمي الرسمي للتأطير والتتبع التربوي'}
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 text-xs font-extrabold">
          <button
            onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'fr' ? 'Connexion' : 'تسجيل الدخول'}</span>
          </button>

          <button
            onClick={() => { setMode('setup'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'setup'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>{lang === 'fr' ? 'Créer / Modifier Pass' : 'تأكيد الحساب وكلمة المرور'}</span>
          </button>

          <button
            onClick={() => { setMode('backup'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'backup'
                ? 'bg-white text-emerald-900 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'fr' ? 'Sauvegarde' : 'استرجاع وحفظ البيانات'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Notification Alerts */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold p-3 rounded-2xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-base font-black text-slate-800">
                  {lang === 'fr' ? 'Bienvenue, المشرف التربوي' : 'مرحباً بك، المشرف التربوي'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'fr'
                    ? 'Veuillez saisir votre nom et mot de passe pour accéder aux données'
                    : 'أدخل اسم المشرف التربوي وكلمة المرور للوصول إلى تقارير التأطير'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === 'fr' ? 'Nom du مشرف' : 'اسم المشرف التربوي'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder={supervisor.nom || 'مثال: المشرف التربوي'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === 'fr' ? 'Mot de passe' : 'كلمة المرور'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    {lang === 'fr' ? 'Mot de passe par défaut : 123456' : '💡 كلمة المرور الافتراضية للتطبيق: 123456'}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:scale-98 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-700/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{lang === 'fr' ? 'Se connecter' : 'تسجيل الدخول المباشر'}</span>
              </button>

              {/* Direct Quick Bypass for ease of use */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onLoginSuccess()}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'fr' ? 'Accès rapide sans mot de passe' : 'الدخول السريع المباشر للتطبيق'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: SETUP & CONFIRM PASSWORD */}
          {mode === 'setup' && (
            <form onSubmit={handleSetupSubmit} className="space-y-3.5">
              <div className="text-center space-y-1">
                <h2 className="text-base font-black text-slate-800">
                  {lang === 'fr' ? 'Définir / Confirmer le mot de passe' : 'تأكيد وحفظ اسم المشرف وكلمة المرور'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'fr'
                    ? 'Saisissez le nom, le nouveau mot de passe et confirmez-le'
                    : 'أدخل الاسم وكلمة المرور وقوم بتأكيدها لحفظ حساب المشرف في الجهاز'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{lang === 'fr' ? 'Nom du مشرف' : 'اسم المشرف التربوي'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="اسم المشرف"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{lang === 'fr' ? 'Nouveau mot de passe' : 'كلمة المرور الجديدة'}</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="اختر كلمة مرور جديدة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{lang === 'fr' ? 'Confirmer le mot de passe' : 'تأكيد كلمة المرور'}</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور للتأكيد"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Additional optional fields */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {lang === 'fr' ? 'Projet' : 'المشروع'}
                    </label>
                    <input
                      type="text"
                      value={setupProject}
                      onChange={(e) => setSetupProject(e.target.value)}
                      placeholder="برنامج الدعم التربوي"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {lang === 'fr' ? 'Province' : 'المديرية'}
                    </label>
                    <input
                      type="text"
                      value={setupProvince}
                      onChange={(e) => setSetupProvince(e.target.value)}
                      placeholder="المديرية الإقليمية"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-800 hover:to-blue-900 active:scale-98 text-white font-extrabold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'fr' ? 'Enregistrer et Confirmer' : 'تأكيد وحفظ بيانات الحساب'}</span>
              </button>
            </form>
          )}

          {/* MODE 3: BACKUP & RESTORE DATA (PROTECTION AGAINST DATA LOSS) */}
          {mode === 'backup' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-base font-black text-slate-800">
                  {lang === 'fr' ? 'Protection & Sauvegarde des données' : 'حماية واسترجاع البيانات لمنع ضياعها'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'fr'
                    ? 'Téléchargez ou restaurez votre fichier de données pour ne jamais perdre vos rapports'
                    : 'حمل ملف البيانات الاحتياطي أو استرجعه عند مسح التطبيق أو تغيير الهاتف لحفظ جميع تقاريرك'}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'fr' ? 'Comment éviter la perte de données ?' : '🛡️ كيف تحمي تقاريرك من الضياع؟'}</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  {lang === 'fr'
                    ? '1. Cliquez sur "Télécharger une copie de sauvegarde" pour conserver un fichier sur votre téléphone.'
                    : '1. اضغط على "تحميل نسخة احتياطية" واحفظ الملف على هاتفك أو حاسوبك.'}
                  <br />
                  {lang === 'fr'
                    ? '2. Si vous supprimez l\'application, il vous suffit de cliquer sur "Restaurer" et de sélectionner ce fichier.'
                    : '2. إذا قمت بحذف التطبيق أو قمت بتغيير الهاتف، اضغط "استرجاع البيانات" واختر الملف لتعود جميع المدارس والأساتذة والزيارات فوراً!'}
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Export / Download Backup Button */}
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'fr' ? 'Télécharger une copie JSON (Sauvegarde)' : '📥 تحميل نسخة احتياطية كاملة (JSON)'}</span>
                </button>

                {/* Import / Restore Backup Button */}
                <label className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer text-center">
                  <Upload className="w-4 h-4" />
                  <span>{lang === 'fr' ? 'Restaurer les données depuis un fichier' : '📤 استرجاع واستعادة البيانات من ملف'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => onLoginSuccess()}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{lang === 'fr' ? 'Continuer vers l\'application' : 'متابعة إلى التطبيق'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center">
          <p className="text-[10px] text-slate-400 font-semibold">
            {lang === 'fr'
              ? 'Fondation Zakoura — Tous droits réservés'
              : 'مؤسسة زاكورة — برنامج الدعم والتأطير التربوي'}
          </p>
        </div>
      </div>
    </div>
  );
};
