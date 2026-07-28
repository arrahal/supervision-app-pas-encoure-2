import React, { useState } from 'react';
import { AppData } from '../types';
import { Search, Plus, Edit2, Trash2, Building2, Users, Layers, MapPin } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { Language, translations } from '../utils/i18n';

interface EcolesTabProps {
  db: AppData;
  lang?: Language;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
  onOpenAddEcoleModal: () => void;
  onOpenEditEcoleModal: (ecoleId: number) => void;
  onOpenAddGroupeToEcoleModal: (ecoleNom: string) => void;
  onOpenEditGroupeModal: (groupeId: number) => void;
}

export const EcolesTab: React.FC<EcolesTabProps> = ({
  db,
  lang = 'ar',
  onUpdateDb,
  onOpenAddEcoleModal,
  onOpenEditEcoleModal,
  onOpenAddGroupeToEcoleModal,
  onOpenEditGroupeModal,
}) => {
  const t = translations[lang];
  const [search, setSearch] = useState('');
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [deleteEcoleModal, setDeleteEcoleModal] = useState<{ isOpen: boolean; ecoleId: number; ecoleName: string }>({
    isOpen: false,
    ecoleId: 0,
    ecoleName: '',
  });

  // Extract unique communes from existing ecoles
  const uniqueCommunes = Array.from(new Set(db.ecoles.map((e) => e.commune).filter(Boolean)));

  const filtered = db.ecoles.filter((e) => {
    const matchesSearch =
      !search ||
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      (e.commune && e.commune.toLowerCase().includes(search.toLowerCase())) ||
      (e.province && e.province.toLowerCase().includes(search.toLowerCase()));
    const matchesCommune = selectedCommune === 'all' || e.commune === selectedCommune;
    return matchesSearch && matchesCommune;
  });

  const handleDeleteEcole = (ecoleId: number, ecoleNom: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      ecoles: prev.ecoles.filter((e) => e.id !== ecoleId),
      groupes: prev.groupes.filter((g) => g.ecole !== ecoleNom),
    }));
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchSchool}
          className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
        />
      </div>

      {/* Commune Filter Chips */}
      {uniqueCommunes.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.communesFilter}:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCommune('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCommune === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.all} ({db.ecoles.length})
            </button>
            {uniqueCommunes.map((c) => {
              const count = db.ecoles.filter((e) => e.commune === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCommune(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCommune === c
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* School List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
          <Building2 className="w-12 h-12 text-emerald-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t.noSchools}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.noSchoolsSub}</p>
          </div>
          <button
            onClick={onOpenAddEcoleModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addSchool}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const gs = db.groupes.filter((g) => g.ecole === e.nom);
            const totalEff = gs.reduce((s, g) => s + g.eff, 0);

            return (
              <div
                key={e.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 hover:border-blue-200 transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{e.nom}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1">
                      {e.commune && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md font-bold">
                          {t.commune}: {e.commune}
                        </span>
                      )}
                      {e.province && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          {t.province}: {e.province}
                        </span>
                      )}
                      {e.region && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {e.region}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditEcoleModal(e.id)}
                      className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                      title={t.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteEcoleModal({ isOpen: true, ecoleId: e.id, ecoleName: e.nom })}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Assigned Teacher Badge */}
                {(() => {
                  const anim = db.animateurs.find((a) => a.id === e.animId);
                  const animName = anim ? anim.nom : e.animNom;
                  if (!animName) return null;
                  return (
                    <div className="bg-blue-50/80 border border-blue-100 p-2 rounded-xl text-xs font-bold text-blue-900 flex items-center justify-between">
                      <span>{t.assignedTeacher}: <b className="text-blue-700">{animName}</b></span>
                      {anim?.tel && <span className="text-[10px] text-blue-600 dir-ltr font-mono">{anim.tel}</span>}
                    </div>
                  );
                })()}

                {/* GPS Location Link */}
                {e.gpsUrl && (
                  <a
                    href={e.gpsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-semibold dir-ltr text-left"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{t.gpsLocation}</span>
                  </a>
                )}

                {/* Summary badges */}
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{gs.length} {t.groupsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{totalEff} {t.student}</span>
                  </div>
                </div>

                {/* Groups Details */}
                {gs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {gs.map((g) => {
                      const anim = db.animateurs.find((a) => a.id === g.animId);
                      return (
                        <div
                          key={g.id}
                          className="flex items-center justify-between bg-slate-50/80 border border-slate-100 rounded-xl px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md text-[11px]">
                              {g.groupe}
                            </span>
                            <div>
                              <div className="font-bold text-slate-800 text-[11px]">
                                {g.niveauReel || g.niveau}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {t.teacher}: {anim ? anim.nom.split(' ')[0] : '—'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600">
                              👥 {g.eff}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                g.absences > 3
                                  ? 'bg-rose-100 text-rose-800'
                                  : g.absences > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              🔴 {g.absences}
                            </span>

                            <button
                              onClick={() => onOpenEditGroupeModal(g.id)}
                              className="text-[10px] font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-2 py-1 rounded-lg transition cursor-pointer"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {e.notes && (
                  <p className="text-xs text-slate-600 bg-amber-50/80 border border-amber-200 p-2 rounded-xl">
                    {e.notes}
                  </p>
                )}

                <button
                  onClick={() => onOpenAddGroupeToEcoleModal(e.nom)}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addGroupToSchool}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add School Button */}
      <button
        onClick={onOpenAddEcoleModal}
        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        <span>{t.addSchoolBtn}</span>
      </button>

      {/* Delete School Confirm Modal */}
      <ConfirmModal
        isOpen={deleteEcoleModal.isOpen}
        onClose={() => setDeleteEcoleModal({ isOpen: false, ecoleId: 0, ecoleName: '' })}
        onConfirm={() => handleDeleteEcole(deleteEcoleModal.ecoleId, deleteEcoleModal.ecoleName)}
        title={t.confirmDelete}
        message={`هل أنت تأكد من حذف مدرسة "${deleteEcoleModal.ecoleName}"؟ سيتم مسحها وحذف جميع الأفواج التابعة لها.`}
        confirmText={t.delete}
        cancelText={t.cancel}
        type="danger"
      />
    </div>
  );
};

