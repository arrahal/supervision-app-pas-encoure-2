import React from 'react';
import { Calendar, UserCog, Edit3, Globe, Lock } from 'lucide-react';
import { AppData } from '../types';
import { MONTHS_AR } from '../data/initialData';
import { Language, translations, MONTHS_FR } from '../utils/i18n';

interface HeaderProps {
  db: AppData;
  lang: Language;
  onToggleLang: () => void;
  onOpenMonthSelector: () => void;
  onOpenSupervisorModal: () => void;
  onLockApp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  db,
  lang,
  onToggleLang,
  onOpenMonthSelector,
  onOpenSupervisorModal,
  onLockApp,
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
    <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 text-white px-3 sm:px-4 pt-2.5 pb-2.5 shadow-md flex-shrink-0">
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl p-1 shadow-md border border-white/20 flex items-center justify-center flex-shrink-0">
            <img src="/zakoura-logo.svg" alt="Fondation Zakoura" className="w-full h-full object-contain" />
          </div>
          <button
            onClick={onOpenSupervisorModal}
            className="text-right group hover:opacity-90 transition cursor-pointer min-w-0 flex-1"
          >
            <div className="flex items-center gap-1">
              <h1 className="text-xs sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1">
                <span className="truncate max-w-[140px] xs:max-w-none">{supervisorName}</span>
                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70 group-hover:opacity-100 flex-shrink-0" />
              </h1>
            </div>
            {project && (
              <p className="text-[10px] sm:text-[11px] text-blue-100/90 font-medium truncate">
                {project} {location ? `— ${location}` : ''}
              </p>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Language Toggle Button */}
          <button
            onClick={onToggleLang}
            title={lang === 'ar' ? 'Passer en Français' : 'التحويل إلى العربية'}
            className="flex items-center gap-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 active:scale-95 transition px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold border border-amber-300/40 backdrop-blur-sm cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'ar' ? 'FR' : 'العربية'}</span>
          </button>

          <button
            onClick={onOpenSupervisorModal}
            title={t.supervisorAccount}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 transition text-white px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border border-white/30 backdrop-blur-sm cursor-pointer"
          >
            <UserCog className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.supervisorAccount}</span>
          </button>

          <button
            onClick={onOpenMonthSelector}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 transition text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border border-white/30 backdrop-blur-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="truncate max-w-[70px] sm:max-w-none">{monthName}</span>
          </button>

          {onLockApp && (
            <button
              onClick={onLockApp}
              title={lang === 'fr' ? 'Verrouiller / Se déconnecter' : 'قفل التطبيق / خروج'}
              className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 active:scale-95 transition p-1.5 rounded-full text-[11px] sm:text-xs font-semibold border border-rose-300/40 backdrop-blur-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-rose-300" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Ticker */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-none text-center touch-pan-x">
        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl px-2.5 py-1 min-w-[62px] sm:min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-sm sm:text-base font-extrabold text-white leading-tight">{db.animateurs.length}</span>
          <span className="text-[9px] sm:text-[10px] text-blue-100/80 font-medium whitespace-nowrap">{t.teacher}</span>
        </div>

        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl px-2.5 py-1 min-w-[62px] sm:min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-sm sm:text-base font-extrabold text-white leading-tight">{db.ecoles.length}</span>
          <span className="text-[9px] sm:text-[10px] text-blue-100/80 font-medium whitespace-nowrap">{t.school}</span>
        </div>

        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl px-2.5 py-1 min-w-[62px] sm:min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-sm sm:text-base font-extrabold text-white leading-tight">{db.groupes.length}</span>
          <span className="text-[9px] sm:text-[10px] text-blue-100/80 font-medium whitespace-nowrap">{t.group}</span>
        </div>

        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl px-2.5 py-1 min-w-[62px] sm:min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-sm sm:text-base font-extrabold text-white leading-tight">{totalEff}</span>
          <span className="text-[9px] sm:text-[10px] text-blue-100/80 font-medium whitespace-nowrap">{t.student}</span>
        </div>

        <div className="bg-emerald-500/25 border border-emerald-300/40 backdrop-blur-md rounded-xl px-2.5 py-1 min-w-[62px] sm:min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-sm sm:text-base font-extrabold text-emerald-200 leading-tight">{totalVisits}</span>
          <span className="text-[9px] sm:text-[10px] text-emerald-100 font-medium whitespace-nowrap">{t.visit}</span>
        </div>

        <div className="bg-rose-500/25 border border-rose-300/40 backdrop-blur-md rounded-xl px-2.5 py-1 min-w-[62px] sm:min-w-[70px] flex-1 flex flex-col items-center">
          <span className="text-sm sm:text-base font-extrabold text-rose-200 leading-tight">{totalAbs}</span>
          <span className="text-[9px] sm:text-[10px] text-rose-100 font-medium whitespace-nowrap">{t.absence}</span>
        </div>
      </div>
    </header>
  );
};

