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
      <div className="flex items-center overflow-x-auto scrollbar-none touch-pan-x w-full max-w-xl mx-auto px-2 py-2 gap-1.5 justify-start sm:justify-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-shrink-0 px-2.5 py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer min-w-[62px] ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-extrabold scale-102 ring-2 ring-blue-400/30'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-bold'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] leading-tight text-center whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

