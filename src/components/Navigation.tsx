import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  UserX,
  UserPlus,
  Users,
  School,
  CalendarDays,
  FileSpreadsheet,
} from 'lucide-react';
import { TabType } from '../types';
import { Language, translations } from '../utils/i18n';

interface NavigationProps {
  currentTab: TabType;
  lang: Language;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, lang, onSelectTab }) => {
  const t = translations[lang];

  const tabs = [
    { id: 'home' as TabType, label: t.home, icon: LayoutDashboard },
    { id: 'animateurs' as TabType, label: t.animateurs, icon: Users },
    { id: 'ecoles' as TabType, label: t.ecoles, icon: School },
    { id: 'schedule' as TabType, label: t.schedule, icon: CalendarDays },
    { id: 'visits' as TabType, label: t.visits, icon: ClipboardCheck },
    { id: 'absences' as TabType, label: t.absences, icon: UserX },
    { id: 'pupils' as TabType, label: t.pupils, icon: UserPlus },
    { id: 'reports' as TabType, label: t.reports, icon: FileSpreadsheet },
  ];

  return (
    <nav className="bg-white border-t border-slate-200 shadow-2xl flex-shrink-0 relative z-30 pb-safe">
      <div className="flex items-center overflow-x-auto scrollbar-none touch-pan-x w-full max-w-xl mx-auto px-1 py-1.5 gap-0.5 justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 min-w-[44px] sm:min-w-[54px] px-1 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-extrabold scale-102 ring-1 ring-blue-400/30'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-bold'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[8.5px] sm:text-[10px] leading-tight text-center truncate max-w-full px-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

