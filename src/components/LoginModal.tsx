import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldCheck, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { AppData } from '../types';
import { Language } from '../utils/i18n';

interface LoginModalProps {
  db: AppData;
  lang: Language;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ db, lang, onLoginSuccess }) => {
  const supervisorName = db.supervisor?.nom || 'المشرف التربوي';
  const defaultPassword = db.supervisor?.password || '123456';

  const [usernameInput, setUsernameInput] = useState<string>(supervisorName);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedName) {
      setErrorMsg(lang === 'fr' ? 'Veuillez saisir le nom du المشرف' : 'يرجى إدخال اسم المشرف');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg(lang === 'fr' ? 'Veuillez saisir le mot de passe' : 'يرجى إدخال كلمة المرور');
      return;
    }

    // Verify password against stored password (default 123456)
    const expectedPass = db.supervisor?.password || '123456';

    if (trimmedPass === expectedPass) {
      onLoginSuccess();
    } else {
      setErrorMsg(
        lang === 'fr'
          ? 'Mot de passe incorrect. (Mot de passe par défaut : 123456)'
          : 'كلمة المرور غير صحيحة. (كلمة المرور الافتراضية هي: 123456)'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/80 rounded-2xl p-2.5 shadow-inner flex items-center justify-center">
            <img src="/zakoura-logo.svg" alt="Fondation Zakoura" className="w-full h-full object-contain" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {lang === 'fr' ? 'Espace Supervision Pédagogique' : 'بوابة تسجيل دخول المشرف التربوي'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {lang === 'fr' ? 'مؤسسة زاكورة — Fondation Zakoura' : 'تطبيق التتبع والتأطير التربوي — مؤسسة زاكورة'}
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'fr' ? 'Nom du Supérieur / المشرف' : 'اسم المشرف التربوي'}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="أدخل اسم المشرف"
                className="w-full pl-3 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'fr' ? 'Mot de passe' : 'كلمة المرور'}</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Default Password Hint */}
          <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-2xl flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>كلمة المرور الافتراضية: <strong className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-bold">123456</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setPasswordInput(defaultPassword)}
              className="text-blue-700 font-bold underline hover:text-blue-900 text-[10px] cursor-pointer"
            >
              ملء تلقائي
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 active:scale-98 text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{lang === 'fr' ? 'Se connecter' : 'دخول المشرف'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium">
            🔒 جميع البيانات محفوظة ومحميّة في هذا الجهاز بشكل آمن
          </p>
        </div>
      </div>
    </div>
  );
};
