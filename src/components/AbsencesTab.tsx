import React, { useState } from 'react';
import { AppData, Groupe } from '../types';
import { Language, translations } from '../utils/i18n';
import { UserX, Plus, Search, AlertTriangle, CheckCircle2, TrendingDown, School, Minus } from 'lucide-react';

interface AbsencesTabProps {
  db: AppData;
  lang?: Language;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
  onOpenBulkAbsenceModal: () => void;
}

export const AbsencesTab: React.FC<AbsencesTabProps> = ({ db, lang = 'ar', onUpdateDb, onOpenBulkAbsenceModal }) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEcole, setFilterEcole] = useState<string>('all');

  const totalEff = db.groupes.reduce((s, g) => s + g.eff, 0);
  const totalAbsences = db.groupes.reduce((s, g) => s + g.absences, 0);
  const tauxAbsence = totalEff > 0 ? Math.round((totalAbsences / totalEff) * 100) : 0;
  const highAbsenceGroupsCount = db.groupes.filter((g) => g.absences > 3).length;

  // Filter groups
  const filteredGroups = db.groupes.filter((g) => {
    const anim = db.animateurs.find((a) => a.id === g.animId);
    const matchesSearch =
      g.groupe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.ecole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (anim && anim.nom.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEcole = filterEcole === 'all' || g.ecole === filterEcole;
    return matchesSearch && matchesEcole;
  });

  const handleUpdateGroupAbsence = (groupeId: number, delta: number) => {
    onUpdateDb((prev) => ({
      ...prev,
      groupes: prev.groupes.map((g) => {
        if (g.id === groupeId) {
          const newAbs = Math.max(0, g.absences + delta);
          return { ...g, absences: newAbs };
        }
        return g;
      }),
    }));
  };

  const handleSetDirectAbsence = (groupeId: number, count: number) => {
    onUpdateDb((prev) => ({
      ...prev,
      groupes: prev.groupes.map((g) => (g.id === groupeId ? { ...g, absences: Math.max(0, count) } : g)),
    }));
  };

  const ecolesList = Array.from(new Set(db.groupes.map((g) => g.ecole)));

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-20">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
            <UserX className="w-5 h-5 text-rose-600" />
            <span>{lang === 'fr' ? 'Suivi des Absences des Élèves' : 'قسم تتبع وخصم غياب التلاميذ'}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'fr' ? 'Suivi mensuel de l\'assiduité et des absences par groupe' : 'متابعة المواظبة والغيابات الشهرية لكافة الأفواج'}
          </p>
        </div>

        <button
          onClick={onOpenBulkAbsenceModal}
          className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'fr' ? 'Saisie groupée' : 'تسجيل غياب جماعي'}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{totalAbsences}</span>
          <span className="text-[10px] text-rose-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Total absences' : 'إجمالي الغيابات'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{tauxAbsence}%</span>
          <span className="text-[10px] text-amber-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Taux d\'absence' : 'نسبة الغياب'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{highAbsenceGroupsCount}</span>
          <span className="text-[10px] text-indigo-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Groupes à risque (>3)' : 'أفواج متجاوزة (>3)'}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'fr' ? 'Rechercher école, enseignant, groupe...' : 'بحث بالمدرسة، الأستاذ، اسم الفوج...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <select
          value={filterEcole}
          onChange={(e) => setFilterEcole(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700"
        >
          <option value="all">{lang === 'fr' ? 'Toutes les écoles' : 'جميع المدارس'}</option>
          {ecolesList.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {/* Group Absences Table / Cards */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {lang === 'fr' ? 'Aucun résultat trouvé' : 'لا توجد نتائج مطابقة للبحث'}
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'fr' ? 'Ajoutez de nouveaux groupes ou modifiez les critères' : 'أضف أفواج جديدة أو غير معايير البحث لعرض الغيابات.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredGroups.map((g) => {
            const anim = db.animateurs.find((a) => a.id === g.animId);
            const isHighAbsence = g.absences > 3;

            return (
              <div
                key={g.id}
                className={`bg-white border rounded-2xl p-3.5 shadow-sm transition flex items-center justify-between gap-3 ${
                  isHighAbsence ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 truncate">{g.ecole}</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {g.groupe}
                    </span>
                    {isHighAbsence && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        {lang === 'fr' ? 'Élevé' : 'مرتفع'}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    {t.teacher}: {anim ? anim.nom : '—'} · {g.eff} {t.student} ({g.filles} {lang === 'fr' ? 'filles' : 'إناث'} / {g.garcons} {lang === 'fr' ? 'garçons' : 'ذكور'})
                  </p>
                </div>

                {/* Counter & Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleUpdateGroupAbsence(g.id, -1)}
                    title={lang === 'fr' ? 'Diminuer' : 'إنقاص غياب'}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={g.absences}
                    onChange={(e) => handleSetDirectAbsence(g.id, parseInt(e.target.value) || 0)}
                    className={`w-12 text-center py-1 rounded-xl text-sm font-black border ${
                      isHighAbsence
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  />

                  <button
                    onClick={() => handleUpdateGroupAbsence(g.id, 1)}
                    title={lang === 'fr' ? 'Augmenter' : 'زيادة غياب'}
                    className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold flex items-center justify-center cursor-pointer transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
