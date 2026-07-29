import React from 'react';
import { Calendar, UserCog, Edit3, Globe, LogOut } from 'lucide-react';
import { AppData } from '../types';
import { MONTHS_AR } from '../data/initialData';
import { Language, translations, MONTHS_FR } from '../utils/i18n';

interface HeaderProps {
  db: AppData;
  lang: Language;
  onToggleLang: () => void;
  onOpenMonthSelector: () => void;
  onOpenSupervisorModal: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  db,
  lang,
  onToggleLang,
  onOpenMonthSelector,
  onOpenSupervisorModal,
  onLogout,
}) => {
  const t = translations[lang];
  const totalEff = db.groupes.reduce((a, g) => a + g.eff, 0);
  const totalAbs = db.groupes.reduce((a, g) => a + g.absences, 0);
  const totalVisits = db.groupes.reduce((a, g) => a + (g.visits || 0), 0);

  const supervisorName = db.supervisor?.nom || t.supervisorDefaultName;
  const project = db.supervisor?.project || t.projectDefaultName;
  const location = [db.supervisor?.province, db.supervisor?.region].filter(Boolean).join(' · ');

  const monthName = lang === 'fr'
    ? (MONTHS_FR[db.currentMonth] || `Mois ${db.currentMonth}`)
    : (MONTHS_AR[db.currentMonth] || `شهر ${db.currentMonth}`);

  return (
    <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 text-white px-4 pt-3 pb-3 shadow-md flex-shrink-0">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-md border border-white/20 flex items-center justify-center flex-shrink-0">
            <img src="/zakoura-logo.svg" alt="Fondation Zakoura" className="w-full h-full object-contain" />
          </div>
          <button
            onClick={onOpenSupervisorModal}
            className="text-right group hover:opacity-90 transition cursor-pointer min-w-0 flex-1"
          >
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span className="truncate">{supervisorName}</span>
                <Edit3 className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 flex-shrink-0" />
              </h1>
            </div>
            <p className="text-[11px] text-blue-100/90 font-medium mt-0.5 truncate">
              {project} {location ? `— ${location}` : ''}
            </p>
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Language Toggle Button */}
          <button
            onClick={onToggleLang}
            title={lang === 'ar' ? 'Passer en Français' : 'التحويل إلى العربية'}
            className="flex items-center gap-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 active:scale-95 transition px-2.5 py-1.5 rounded-full text-xs font-bold border border-amber-300/40 backdrop-blur-sm cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'ar' ? 'FR' : 'العربية'}</span>
          </button>

          <button
            onClick={onOpenSupervisorModal}
            title={t.supervisorAccount}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 transition text-white px-2.5 py-1.5 rounded-full text-xs font-semibold border border-white/30 backdrop-blur-sm cursor-pointer"
          >
            <UserCog className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.supervisorAccount}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title={lang === 'fr' ? 'Déconnexion / Verrouiller' : 'تسجيل الخروج / قفل'}
              className="flex items-center gap-1 bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 active:scale-95 transition px-2 py-1.5 rounded-full text-xs font-bold border border-rose-300/40 backdrop-blur-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-200" />
            </button>
          )}

          <button
            onClick={onOpenMonthSelector}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 transition text-white px-3 py-1.5 rounded-full text-xs font-semibold border border-white/30 backdrop-blur-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{monthName}</span>
          </button>
        </div>
      </div>

      {/* Stats Ticker */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-center">
        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-base font-extrabold text-white leading-tight">{db.animateurs.length}</span>
          <span className="text-[10px] text-blue-100/80 font-medium">{t.teacher}</span>
        </div>

        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-base font-extrabold text-white leading-tight">{db.ecoles.length}</span>
          <span className="text-[10px] text-blue-100/80 font-medium">{t.school}</span>
        </div>

        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-base font-extrabold text-white leading-tight">{db.groupes.length}</span>
          <span className="text-[10px] text-blue-100/80 font-medium">{t.group}</span>
        </div>

        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-base font-extrabold text-white leading-tight">{totalEff}</span>
          <span className="text-[10px] text-blue-100/80 font-medium">{t.student}</span>
        </div>

        <div className="bg-emerald-500/25 border border-emerald-300/40 backdrop-blur-md rounded-xl px-3 py-1.5 min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-base font-extrabold text-emerald-200 leading-tight">{totalVisits}</span>
          <span className="text-[10px] text-emerald-100 font-medium">{t.visit}</span>
        </div>

        <div className="bg-rose-500/25 border border-rose-300/40 backdrop-blur-md rounded-xl px-3 py-1.5 min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-base font-extrabold text-rose-200 leading-tight">{totalAbs}</span>
          <span className="text-[10px] text-rose-100 font-medium">{t.absence}</span>
        </div>
      </div>
    </header>
  );
};

