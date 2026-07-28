import React, { useState } from 'react';
import { AppData } from '../types';
import { DAYS } from '../data/initialData';
import { Language, translations } from '../utils/i18n';
import { CalendarDays, Plus, Clock, Edit3, UserCheck } from 'lucide-react';

interface ScheduleTabProps {
  db: AppData;
  lang?: Language;
  onOpenAddSlotModal: (animId: number, day?: string, time?: string) => void;
  onOpenEditGroupeScheduleModal: (groupeId: number) => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  db,
  lang = 'ar',
  onOpenAddSlotModal,
  onOpenEditGroupeScheduleModal,
}) => {
  const t = translations[lang];
  const [selectedAnimId, setSelectedAnimId] = useState<number>(
    db.animateurs.length > 0 ? db.animateurs[0].id : 0
  );

  const DAYS_MAP: Record<string, string> = lang === 'fr' ? {
    'الإثنين': 'Lundi',
    'الثلاثاء': 'Mardi',
    'الأربعاء': 'Mercredi',
    'الخميس': 'Jeudi',
    'الجمعة': 'Vendredi',
    'السبت': 'Samedi',
    'الأحد': 'Dimanche',
  } : {};

  const selectedAnim = db.animateurs.find((a) => a.id === selectedAnimId);
  const animGroups = db.groupes.filter((g) => g.animId === selectedAnimId);

  // Matrix construction
  const matrix: Record<string, Record<string, Array<{ id: number; ecole: string; groupe: string }>>> = {};
  animGroups.forEach((g) => {
    Object.entries(g.horaires || {}).forEach(([day, time]: [string, string]) => {
      if (!matrix[day]) matrix[day] = {};
      const dayObj = matrix[day];
      if (!dayObj[time]) dayObj[time] = [];
      dayObj[time].push({ id: g.id, ecole: g.ecole, groupe: g.groupe });
    });
  });

  const rawTimes: string[] = animGroups.flatMap((g) => Object.values(g.horaires || {}));
  const allTimes: string[] = Array.from(new Set(rawTimes)).sort();

  const usedDays = DAYS.filter((d) => matrix[d]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      {/* Teacher Selection Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {db.animateurs.map((a) => {
          const isSelected = a.id === selectedAnimId;
          const firstName = a.nom.split(' ')[0];
          return (
            <button
              key={a.id}
              onClick={() => setSelectedAnimId(a.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{firstName}</span>
            </button>
          );
        })}
      </div>

      {selectedAnim ? (
        <div className="space-y-4">
          {/* Main Timetable Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">{selectedAnim.nom}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {animGroups.length} {t.groupsCount}
                </p>
              </div>

              <button
                onClick={() => onOpenAddSlotModal(selectedAnim.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'fr' ? '+ Séance' : 'إضافة حصة'}</span>
              </button>
            </div>

            {/* Matrix Table */}
            {usedDays.length === 0 || allTimes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-300" />
                <p>{lang === 'fr' ? 'Aucun emploi du temps enregistré pour cet enseignant' : 'لا يوجد جدول أوقات جديد مسجل لهذا الأستاذ بعد'}</p>
                <button
                  onClick={() => onOpenAddSlotModal(selectedAnim.id)}
                  className="mt-2 text-blue-600 font-bold hover:underline"
                >
                  {lang === 'fr' ? 'Cliquez ici pour ajouter une séance' : 'اضغط هنا لإضافة أوقات الحصص'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-700 text-white font-bold">
                      <th className="p-2 border border-blue-800 font-bold min-w-[70px]">
                        {lang === 'fr' ? 'Heure' : 'الوقت'}
                      </th>
                      {usedDays.map((d) => (
                        <th key={d} className="p-2 border border-blue-800 font-bold">
                          {lang === 'fr' ? (DAYS_MAP[d] || d) : d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTimes.map((t) => (
                      <tr key={t} className="hover:bg-slate-50/80 transition">
                        <td className="p-2 font-bold bg-slate-100 text-slate-700 border border-slate-200 text-[11px] dir-ltr">
                          {t}
                        </td>
                        {usedDays.map((d) => {
                          const dayObj = matrix[d];
                          const slots = dayObj ? dayObj[t] || [] : [];
                          if (slots.length === 0) {
                            return (
                              <td
                                key={d}
                                onClick={() => onOpenAddSlotModal(selectedAnim.id, d, t)}
                                className="p-2 border border-slate-200 text-slate-300 hover:bg-blue-50 hover:text-blue-600 cursor-pointer font-bold transition"
                                title={lang === 'fr' ? 'Ajouter séance' : 'إضافة حصة هنا'}
                              >
                                +
                              </td>
                            );
                          }
                          return (
                            <td key={d} className="p-2 border border-slate-200 bg-blue-50/70 text-blue-900 font-bold text-[10px]">
                              {slots.map((s, idx) => (
                                <div key={idx} className="leading-tight">
                                  <span>{s.ecole.replace('ECOLE ', '')}</span>
                                  <span className="block text-blue-600 text-[9px]">{s.groupe}</span>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Group Schedule Cards */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              {lang === 'fr' ? 'Détails des emplois du temps par groupe' : 'جدول الأفواج تفصيلياً'}
            </h4>

            {animGroups.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {g.ecole.replace('ECOLE ', '')} — <span className="text-blue-700">{g.groupe}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {g.niveauReel || g.niveau} · {g.eff} élèves
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(g.horaires || {}).length === 0 ? (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {lang === 'fr' ? 'Aucune séance programmée' : 'لا توجد حصص مبرمجة'}
                      </span>
                    ) : (
                      Object.entries(g.horaires || {}).map(([day, time]) => (
                        <span
                          key={day}
                          className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md"
                        >
                          {lang === 'fr' ? (DAYS_MAP[day] || day) : day}: {time}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onOpenEditGroupeScheduleModal(g.id)}
                  className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition flex items-center gap-1 text-xs font-bold flex-shrink-0 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.edit}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          {lang === 'fr' ? 'Aucun enseignant enregistré' : 'لا يوجد أساتذة في النظام'}
        </div>
      )}
    </div>
  );
};
