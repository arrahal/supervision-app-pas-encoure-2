import React, { useState } from 'react';
import { AppData, Report } from '../types';
import { CRITERIA, MONTHS_AR } from '../data/initialData';
import { Language, translations } from '../utils/i18n';
import { ClipboardCheck, Plus, Search, Star, Calendar, FileText, Trash2, UserCheck, AlertCircle } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface VisitsTabProps {
  db: AppData;
  lang?: Language;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
  onOpenVisitModal: (animId: number) => void;
}

export const VisitsTab: React.FC<VisitsTabProps> = ({ db, lang = 'ar', onUpdateDb, onOpenVisitModal }) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnimFilter, setSelectedAnimFilter] = useState<number | 'all'>('all');
  const [deleteVisitModal, setDeleteVisitModal] = useState<{ isOpen: boolean; visitId: number }>({
    isOpen: false,
    visitId: 0,
  });

  // Filter visits from reports (type === 'visite') and scores from animateurs
  const visitReports = db.reports.filter((r) => r.type === 'visite');

  const filteredVisits = visitReports.filter((r) => {
    const anim = db.animateurs.find((a) => a.id === r.animId);
    const matchesSearch =
      (anim && anim.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.date && r.date.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAnim = selectedAnimFilter === 'all' || r.animId === selectedAnimFilter;
    return matchesSearch && matchesAnim;
  });

  // Calculate visit metrics
  const totalVisitsCount = db.groupes.reduce((s, g) => s + (g.visits || 0), 0);
  const visitedTeachersCount = db.animateurs.filter((a) =>
    db.groupes.some((g) => g.animId === a.id && (g.visits || 0) > 0)
  ).length;

  const handleDeleteVisit = (visitId: number) => {
    onUpdateDb((prev) => ({
      ...prev,
      reports: prev.reports.filter((r) => r.id !== visitId),
    }));
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-20">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'fr' ? 'Visites d\'inspection & Suivi' : 'قسم الزيارات التفقدية والمواكبة'}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'fr' ? 'Registre des visites de classe et évaluations pédagogiques' : 'سجل الزيارات الصفية والتقييمات البيداغوجية'}
          </p>
        </div>

        <button
          onClick={() => {
            const defaultAnimId = db.animateurs[0]?.id || 1;
            onOpenVisitModal(defaultAnimId);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addVisit}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{totalVisitsCount}</span>
          <span className="text-[10px] text-emerald-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Total visites' : 'إجمالي الزيارات'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{visitedTeachersCount}</span>
          <span className="text-[10px] text-blue-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Enseignants visités' : 'أساتذة تم إشرافهم'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{db.animateurs.length}</span>
          <span className="text-[10px] text-purple-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Total enseignants' : 'مجموع المؤطرين'}
          </span>
        </div>
      </div>

      {/* Search & Teacher Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher par enseignant, rapport, date...' : 'بحث باسم الأستاذ، التقرير، التاريخ...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedAnimFilter}
            onChange={(e) => setSelectedAnimFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700"
          >
            <option value="all">{lang === 'fr' ? 'Tous les enseignants' : 'جميع الأساتذة'}</option>
            {db.animateurs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visits List */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {lang === 'fr' ? 'Aucune visite ne correspond à la recherche' : 'لا توجد زيارات مسجلة تطابق البحث'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {lang === 'fr'
                ? 'Vous pouvez enregistrer une visite de classe pour chaque enseignant avec l\'évaluation des critères.'
                : 'يمكنك تسجيل أول زيارة صفية ومواكبة تربوية لكل أستاذ مع تقييم المعايير المعتمدة.'}
            </p>
          </div>
          {db.animateurs.length > 0 && (
            <button
              onClick={() => onOpenVisitModal(db.animateurs[0].id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'fr' ? 'Enregistrer une visite' : 'تسجيل زيارة ميدانية جديدة'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisits.map((v) => {
            const anim = db.animateurs.find((a) => a.id === v.animId);
            const groupe = db.groupes.find((g) => g.id === v.groupeId);

            // Compute score average for this animateur if available
            const scoreValues: number[] = Object.values(anim?.scores || {}).map((x) => Number(x));
            const avgScore = scoreValues.length
              ? (Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10).toFixed(1)
              : null;

            return (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{anim ? anim.nom : (lang === 'fr' ? 'Enseignant' : 'أستاذ')}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        {anim?.zone || 'Zone'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {groupe ? `${groupe.ecole} — ${groupe.groupe}` : (lang === 'fr' ? 'Établissement' : 'مؤسسة تعليمية')}
                    </p>
                  </div>

                  <div className="text-left flex flex-col items-end">
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {v.date}
                    </span>
                    {avgScore && (
                      <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 mt-1 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {avgScore} / 5
                      </span>
                    )}
                  </div>
                </div>

                {/* Visit Observation / Report Text */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === 'fr' ? 'Remarques et directives de l\'inspecteur :' : 'ملاحظات وتوجيهات المشرف التربوي:'}</span>
                  </div>
                  {v.text}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    onClick={() => anim && onOpenVisitModal(anim.id)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{lang === 'fr' ? 'Modifier l\'évaluation et la visite' : 'تعديل التقييم والزيارة'}</span>
                  </button>

                  <button
                    onClick={() => setDeleteVisitModal({ isOpen: true, visitId: v.id })}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.delete}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteVisitModal.isOpen}
        onClose={() => setDeleteVisitModal({ isOpen: false, visitId: 0 })}
        onConfirm={() => handleDeleteVisit(deleteVisitModal.visitId)}
        title={t.confirmDelete}
        message={lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce rapport de visite ?' : 'هل أنت تأكد من حذف تقرير هذه الزيارة الصفية؟'}
        confirmText={t.delete}
        cancelText={t.cancel}
        type="danger"
      />
    </div>
  );
};
