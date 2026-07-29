import React, { useState } from 'react';
import { AppData, ReportSubTab, DocumentFile } from '../types';
import { MONTHS_AR, ZONES } from '../data/initialData';
import { Language, translations, MONTHS_FR } from '../utils/i18n';
import { ConfirmModal } from './ConfirmModal';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  FileText,
  Paperclip,
  Share2,
  Download,
  UploadCloud,
  Cloud,
  Settings,
  Plus,
  Trash2,
  FileCode,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  downloadWordReport,
  getMonthDocs,
  saveMonthDocs,
  getCloudCfg,
  getGistCfg,
  saveGistCfg,
  saveMonthSnapshot,
} from '../utils/storage';
import { uploadToCloudinary } from '../utils/cloudinary';
import { gistPush, gistPull } from '../utils/gist';

interface ReportsTabProps {
  db: AppData;
  lang?: Language;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
  onOpenGistSettings: () => void;
  onOpenCloudSettings: () => void;
  onOpenAddVisitModal: () => void;
  onOpenAddReportModal: () => void;
  onOpenBulkAbsenceModal: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  db,
  lang = 'ar',
  onUpdateDb,
  onOpenGistSettings,
  onOpenCloudSettings,
  onOpenAddVisitModal,
  onOpenAddReportModal,
  onOpenBulkAbsenceModal,
}) => {
  const t = translations[lang];
  const [subTab, setSubTab] = useState<ReportSubTab>('synthese');

  // Documents state
  const monthDocs = getMonthDocs(db.currentMonth);
  const [docAnimId, setDocAnimId] = useState<number | ''>('');
  const [docEcoleId, setDocEcoleId] = useState<number | ''>('');
  const [docDesc, setDocDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  const monthReports = db.reports.filter((r) => r.month === db.currentMonth);
  const totalEff = db.groupes.reduce((a, g) => a + g.eff, 0);
  const totalAbs = db.groupes.reduce((a, g) => a + g.absences, 0);
  const tauxAbs = totalEff > 0 ? Math.round((totalAbs / totalEff) * 100) : 0;

  const totalVisits = db.animateurs.reduce((a, an) => {
    const gs = db.groupes.filter((g) => g.animId === an.id);
    return a + gs.reduce((s, g) => s + (g.visits || 0), 0);
  }, 0);

  const visitedAnimsCount = db.animateurs.filter((an) =>
    db.groupes.filter((g) => g.animId === an.id).some((g) => (g.visits || 0) > 0)
  ).length;

  const coveragePct = db.animateurs.length > 0 ? Math.round((visitedAnimsCount / db.animateurs.length) * 100) : 0;

  // Cloud & Gist configs
  const cloudCfg = getCloudCfg();
  const cloudReady = Boolean(cloudCfg.cloudName && cloudCfg.uploadPreset);
  const gistCfg = getGistCfg();

  // Document Upload Handler
  const handleUploadDoc = async () => {
    if (!selectedFile) {
      alert(lang === 'fr' ? 'Veuillez choisir une image ou un fichier PDF.' : 'يرجى اختيار صورة أو ملف PDF أولاً.');
      return;
    }
    if (monthDocs.length >= 4) {
      alert(lang === 'fr' ? 'Limite maximale de 4 fichiers atteinte pour ce mois.' : 'وصلت للحد الأقصى مسموح به لهذا الشهر (4 ملفات). احذف ملفاً لإضافة آخر.');
      return;
    }
    if (!cloudReady) {
      alert(lang === 'fr' ? 'Veuillez configurer Cloudinary d\'abord.' : 'يرجى إعداد Cloudinary أولاً لرفع الملفات إلى السحابة.');
      onOpenCloudSettings();
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const res = await uploadToCloudinary(
        selectedFile,
        cloudCfg.cloudName,
        cloudCfg.uploadPreset,
        (pct) => setUploadProgress(pct)
      );

      const newDoc: DocumentFile = {
        name: selectedFile.name,
        type: selectedFile.type,
        url: res.secure_url,
        publicId: res.public_id,
        animId: docAnimId ? Number(docAnimId) : null,
        ecoleId: docEcoleId ? Number(docEcoleId) : null,
        desc: docDesc.trim(),
        date: new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-MA'),
      };

      saveMonthDocs(db.currentMonth, [...monthDocs, newDoc]);
      setSelectedFile(null);
      setDocDesc('');
      setDocAnimId('');
      setDocEcoleId('');
      alert(lang === 'fr' ? 'Fichier téléversé avec succès !' : '✅ تم رفع الملف إلى Cloudinary وحفظه بنجاح!');
    } catch (err: any) {
      alert(`❌ ${err.message || 'Error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDoc = (idx: number) => {
    const updated = [...monthDocs];
    updated.splice(idx, 1);
    saveMonthDocs(db.currentMonth, updated);
    onUpdateDb((prev) => ({ ...prev }));
  };

  const handleDeleteVisit = (animId: number) => {
    onUpdateDb((prev) => {
      const copy = { ...prev };
      const gs = copy.groupes.filter((g) => g.animId === animId);
      for (let i = gs.length - 1; i >= 0; i--) {
        if ((gs[i].visits || 0) > 0) {
          gs[i].visits! -= 1;
          break;
        }
      }
      return saveMonthSnapshot(copy, copy.currentMonth);
    });
  };

  const handleDeleteReport = (id: number) => {
    onUpdateDb((prev) => ({
      ...prev,
      reports: prev.reports.filter((r) => r.id !== id),
    }));
  };

  const handleGistPush = async () => {
    setIsSyncing(true);
    const res = await gistPush(db);
    setIsSyncing(false);
    alert(res.message);
    if (res.success) onUpdateDb((prev) => ({ ...prev }));
  };

  const handleGistPull = async () => {
    setIsSyncing(true);
    const res = await gistPull();
    setIsSyncing(false);

    if (!res.success) {
      alert(res.message);
      return;
    }

    if (
      window.confirm(
        lang === 'fr'
          ? `Restaurer les données depuis Gist ?\nDernière màj: ${res.updatedAt}`
          : `تأكيد استعادة البيانات من GitHub Gist؟\nآخر تحديث: ${res.updatedAt}\nسيتم استبدال البيانات الحالية.`
      )
    ) {
      if (res.db) {
        onUpdateDb(() => res.db!);
      }
      if (res.docs) {
        Object.entries(res.docs).forEach(([key, docs]) => {
          const m = parseInt(key.replace('m', ''), 10);
          if (m >= 1 && m <= 12) saveMonthDocs(m, docs);
        });
      }
      alert(lang === 'fr' ? 'Données restaurées !' : '✅ تم استعادة البيانات والوثائق بنجاح!');
    }
  };

  const currentMonthName = lang === 'fr' ? MONTHS_FR[db.currentMonth] : MONTHS_AR[db.currentMonth];

  const subTabs = [
    { id: 'synthese' as ReportSubTab, label: lang === 'fr' ? '📊 Synthèse' : '📊 الملخص' },
    { id: 'visites' as ReportSubTab, label: lang === 'fr' ? '✅ Visites' : '✅ الزيارات' },
    { id: 'absences' as ReportSubTab, label: lang === 'fr' ? '📋 Absences' : '📋 الغياب' },
    { id: 'notes' as ReportSubTab, label: lang === 'fr' ? '📝 Rapports' : '📝 التقارير' },
    { id: 'docs' as ReportSubTab, label: lang === 'fr' ? '📎 Documents' : '📎 الوثائق' },
    { id: 'partage' as ReportSubTab, label: lang === 'fr' ? '📤 Partage' : '📤 المشاركة' },
  ];

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      {/* Header Tabs */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-2xl p-3 shadow-md">
        <div className="text-center mb-2">
          <h2 className="text-base font-extrabold">
            {lang === 'fr' ? 'Rapport et Données Mensuelles' : 'التقرير والبيانات الشهرية'}
          </h2>
          <p className="text-xs text-blue-100 font-medium">
            {currentMonthName} 2026 — INDH CHICHAOUA
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {subTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex-1 min-w-[75px] py-1.5 px-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                subTab === t.id
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-100/80 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB: SYNTHESE */}
      {subTab === 'synthese' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
              <span className="text-2xl font-black text-blue-800 block">{totalVisits}</span>
              <span className="text-xs text-blue-900 font-bold mt-1 block">
                {lang === 'fr' ? 'Visites effectuées' : 'زيارة مُنجزة'}
              </span>
              <span className="text-[10px] text-blue-600 font-medium">
                {visitedAnimsCount} / {db.animateurs.length} {t.teacher.toLowerCase()}s
              </span>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
              <span className="text-2xl font-black text-rose-800 block">{totalAbs}</span>
              <span className="text-xs text-rose-900 font-bold mt-1 block">
                {lang === 'fr' ? 'Total absences' : 'غياب إجمالي'}
              </span>
              <span className="text-[10px] text-rose-600 font-medium">{tauxAbs}%</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <span className="text-2xl font-black text-emerald-800 block">{coveragePct}%</span>
              <span className="text-xs text-emerald-900 font-bold mt-1 block">
                {lang === 'fr' ? 'Couverture visites' : 'تغطية الزيارات'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                {db.animateurs.length - visitedAnimsCount} {lang === 'fr' ? 'restants' : 'متبقي'}
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <span className="text-2xl font-black text-amber-800 block">{totalEff}</span>
              <span className="text-xs text-amber-900 font-bold mt-1 block">
                {lang === 'fr' ? 'Total élèves' : 'إجمالي التلاميذ'}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">{db.groupes.length} {t.groupsCount}</span>
            </div>
          </div>

          {/* Zone Coverage Progress */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {lang === 'fr' ? '📍 Couverture par commune / zone' : '📍 تقدم تغطية الزيارات حسب المنطقة'}
            </h3>

            <div className="space-y-2.5">
              {ZONES.map((zone) => {
                const anims = db.animateurs.filter((a) => a.zone === zone);
                const visited = anims.filter((a) =>
                  db.groupes.filter((g) => g.animId === a.id).some((g) => (g.visits || 0) > 0)
                ).length;
                const pct = anims.length ? Math.round((visited / anims.length) * 100) : 0;

                return (
                  <div key={zone} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{zone}</span>
                      <span className={pct === 100 ? 'text-emerald-600' : 'text-blue-600'}>
                        {visited} / {anims.length} — {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unvisited Teachers */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{lang === 'fr' ? 'Enseignants en attente de visite' : 'أساتذة ينتظرون الزيارة هذا الشهر'}</span>
            </h3>

            {db.animateurs.filter(
              (a) => !db.groupes.filter((g) => g.animId === a.id).some((g) => (g.visits || 0) > 0)
            ).length === 0 ? (
              <div className="text-center py-4 text-emerald-600 text-xs font-bold">
                {lang === 'fr' ? 'Tous les enseignants ont été visités ce mois-ci !' : '✅ تمت زيارة جميع الأساتذة هذا الشهر!'}
              </div>
            ) : (
              <div className="space-y-2">
                {db.animateurs
                  .filter(
                    (a) => !db.groupes.filter((g) => g.animId === a.id).some((g) => (g.visits || 0) > 0)
                  )
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between bg-rose-50/70 border border-rose-100 p-3 rounded-xl"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{a.nom}</div>
                        <div className="text-[10px] text-slate-500">
                          {a.zone} · 📞 {a.tel}
                        </div>
                      </div>

                      <button
                        onClick={onOpenAddVisitModal}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg transition"
                      >
                        + Visite
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: VISITES */}
      {subTab === 'visites' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              {lang === 'fr' ? 'Total visites:' : 'إجمالي الزيارات:'} <b className="text-emerald-600">{totalVisits}</b>
            </span>
            <button
              onClick={onOpenAddVisitModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              {lang === 'fr' ? '+ Nouvelle visite' : '+ تسجيل زيارة جديدة'}
            </button>
          </div>

          <div className="space-y-2">
            {db.animateurs.map((a) => {
              const gs = db.groupes.filter((g) => g.animId === a.id);
              const totalV = gs.reduce((s, g) => s + (g.visits || 0), 0);
              const scores: number[] = Object.values(a.scores || {}).map((v) => Number(v));
              const avgScore = scores.length
                ? (Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 10) / 10).toFixed(1)
                : null;

              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-2xl p-3.5 border shadow-sm space-y-2 ${
                    totalV > 0 ? 'border-emerald-200 border-r-4 border-r-emerald-500' : 'border-rose-200 border-r-4 border-r-rose-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{a.nom}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {a.zone} · {gs.length} {t.groupsCount}
                      </p>
                      {avgScore !== null && (
                        <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                          ⭐ {lang === 'fr' ? 'Évaluation:' : 'التقييم التربوي:'} {avgScore} / 3
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-center px-2 py-1 bg-slate-50 rounded-xl border border-slate-100">
                        <span className={`text-base font-black ${totalV > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {totalV}
                        </span>
                        <span className="text-[9px] text-slate-400 block">{lang === 'fr' ? 'visite(s)' : 'زيارة'}</span>
                      </div>

                      {totalV > 0 && (
                        <button
                          onClick={() => handleDeleteVisit(a.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-xl transition cursor-pointer"
                          title="Supprimer visite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB: ABSENCES */}
      {subTab === 'absences' && (
        <div className="space-y-4">
          <button
            onClick={onOpenBulkAbsenceModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'fr' ? '📝 Saisie globale des absences' : '📝 تحديث غياب جميع الأفواج دفعة واحدة'}</span>
          </button>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {lang === 'fr' ? '📊 Absences par enseignant' : '📊 تفاصيل الغياب حسب الأستاذ'}
            </h3>

            <div className="space-y-2">
              {db.animateurs.map((a) => {
                const gs = db.groupes.filter((g) => g.animId === a.id);
                const eff = gs.reduce((s, g) => s + g.eff, 0);
                const abs = gs.reduce((s, g) => s + g.absences, 0);
                const taux = eff > 0 ? Math.round((abs / eff) * 100) : 0;

                return (
                  <div key={a.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{a.nom}</span>
                      <span className={`font-black ${taux > 15 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {abs} {lang === 'fr' ? 'absence(s)' : 'غياب'} ({taux}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          taux > 15 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(taux * 3, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: NOTES */}
      {subTab === 'notes' && (
        <div className="space-y-3">
          <button
            onClick={onOpenAddReportModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl shadow transition flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'fr' ? 'Ajouter un rapport ou une remarque' : 'إضافة تقرير أو ملاحظة جديدة'}</span>
          </button>

          {monthReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-400">
              {lang === 'fr' ? 'Aucun rapport pour ce mois' : 'لا توجد تقارير أو ملاحظات مسجلة لهذا الشهر'}
            </div>
          ) : (
            monthReports.map((r) => {
              const anim = db.animateurs.find((a) => a.id === r.animId);
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {r.type === 'visite' ? (lang === 'fr' ? 'Visite' : 'زيارة') : r.type === 'notes' ? (lang === 'fr' ? 'Remarque' : 'ملاحظة') : (lang === 'fr' ? 'Rapport' : 'تقرير')}
                    </span>
                    <button
                      onClick={() => handleDeleteReport(r.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs font-bold text-slate-800">{t.teacher}: {anim ? anim.nom : '—'}</p>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {r.text}
                  </p>
                  <span className="text-[10px] text-slate-400 block dir-ltr text-left">📅 {r.date}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB: DOCS */}
      {subTab === 'docs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800">📎 {lang === 'fr' ? `Documents de ${currentMonthName}` : `وثائق شهر ${currentMonthName}`}</h3>
                <p className="text-[10px] text-slate-500">{lang === 'fr' ? 'Jusqu\'à 4 fichiers PDF/images' : 'حتى 4 صور أو ملفات PDF مخزّنة على السحابة'}</p>
              </div>

              <button
                onClick={onOpenCloudSettings}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>⚙️ Cloudinary</span>
              </button>
            </div>

            <div className={`p-2.5 rounded-xl text-xs font-bold ${cloudReady ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              {cloudReady ? `✅ Cloudinary config (${cloudCfg.cloudName})` : '⚠️ Cloudinary non configuré'}
            </div>

            {/* Document upload form */}
            {monthDocs.length < 4 && (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={docAnimId}
                    onChange={(e) => setDocAnimId(e.target.value ? Number(e.target.value) : '')}
                    className="bg-white border border-slate-200 text-xs rounded-xl p-2 font-medium"
                  >
                    <option value="">— {lang === 'fr' ? 'Enseignant (optionnel)' : 'الأستاذ (اختياري)'} —</option>
                    {db.animateurs.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nom}
                      </option>
                    ))}
                  </select>

                  <select
                    value={docEcoleId}
                    onChange={(e) => setDocEcoleId(e.target.value ? Number(e.target.value) : '')}
                    className="bg-white border border-slate-200 text-xs rounded-xl p-2 font-medium"
                  >
                    <option value="">— {lang === 'fr' ? 'École (optionnel)' : 'المدرسة (اختياري)'} —</option>
                    {db.ecoles.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom.replace('ECOLE ', '')}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  placeholder={lang === 'fr' ? 'Description du document...' : 'وصف للوثيقة أو الصورة...'}
                  className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 h-16 focus:outline-none focus:border-blue-600"
                />

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-xl file:px-3 file:py-1.5 file:font-bold file:mr-2"
                />

                {isUploading && (
                  <div className="space-y-1">
                    <div className="text-[11px] text-blue-600 font-bold text-center">
                      ⏳ {uploadProgress}%
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUploadDoc}
                  disabled={isUploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{lang === 'fr' ? 'Téléverser le document' : 'رفع وحفظ الوثيقة'}</span>
                </button>
              </div>
            )}

            {/* Document list */}
            {monthDocs.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">{lang === 'fr' ? 'Aucun document téléversé' : 'لا توجد وثائق مرفوعة لهذا الشهر'}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {monthDocs.map((doc, idx) => {
                  const isPdf = doc.type === 'application/pdf';
                  const anim = doc.animId ? db.animateurs.find((a) => a.id === doc.animId) : null;
                  const ecole = doc.ecoleId ? db.ecoles.find((e) => e.id === doc.ecoleId) : null;

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      {isPdf ? (
                        <div className="h-24 bg-rose-50 flex flex-col items-center justify-center text-rose-600 gap-1">
                          <FileText className="w-8 h-8" />
                          <span className="text-[10px] font-black">PDF</span>
                        </div>
                      ) : (
                        <img
                          src={doc.url || doc.data}
                          alt={doc.name}
                          className="h-24 w-full object-cover cursor-pointer"
                          onClick={() => setPreviewDoc(doc)}
                        />
                      )}

                      <div className="p-2.5 space-y-1">
                        <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                          {doc.name}
                        </p>
                        {anim && <p className="text-[10px] text-blue-600 font-medium">👤 {anim.nom}</p>}
                        {ecole && (
                          <p className="text-[10px] text-emerald-600 font-medium">
                            🏫 {ecole.nom.replace('ECOLE ', '')}
                          </p>
                        )}
                        {doc.desc && <p className="text-[10px] text-slate-500 line-clamp-2">{doc.desc}</p>}

                        <div className="flex gap-1 pt-1">
                          <button
                            onClick={() => window.open(doc.url || doc.data, '_blank')}
                            className="flex-1 bg-slate-100 text-slate-700 text-[10px] font-bold py-1 rounded-lg"
                          >
                            {lang === 'fr' ? 'Voir' : 'معاينة'}
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(idx)}
                            className="bg-rose-50 text-rose-600 text-[10px] font-bold p-1 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: PARTAGE */}
      {subTab === 'partage' && (
        <div className="space-y-4">
          {/* GitHub Cloud Sync Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">
                    {lang === 'fr' ? 'Stockage & Maintien sur GitHub (Automatique)' : 'التخزين والمزامنة التلقائية عبر GitHub'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {lang === 'fr' ? 'Sauvegarde directe sans fichier manuel' : 'مزامنة تلقائية بضغطة زر واحدة دون الحاجة لملفات أو رفع يدوي'}
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenGistSettings}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>⚙️ {lang === 'fr' ? 'الإعدادات' : 'إعداد التوكن'}</span>
              </button>
            </div>

            {/* Connection Status Badge */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${gistCfg.token ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${gistCfg.token ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <span className="block font-black">
                    {gistCfg.token
                      ? (lang === 'fr' ? `الحساب مرتبط بـ GitHub Gist` : `حساب المشرف: ${db.supervisor?.nom || 'المشرف التربوي'} (متصل بـ GitHub)`)
                      : (lang === 'fr' ? 'GitHub non configuré' : 'لم يتم إدخال توكن GitHub بعد')}
                  </span>
                  {gistCfg.lastPush && (
                    <span className="text-[10px] opacity-80 block font-normal mt-0.5">
                      📅 {lang === 'fr' ? 'Dernière màj:' : 'آخر مزامنة:'} {new Date(gistCfg.lastPush).toLocaleString('ar-MA')}
                    </span>
                  )}
                </div>
              </div>

              {!gistCfg.token && (
                <button
                  onClick={onOpenGistSettings}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl transition"
                >
                  ربط الآن
                </button>
              )}
            </div>

            {/* Instant Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleGistPush}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold py-3 px-3 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>{lang === 'fr' ? 'Sauvegarder sur GitHub' : 'رفع البيانات تلقائياً لـ GitHub'}</span>
              </button>

              <button
                onClick={handleGistPull}
                disabled={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold py-3 px-3 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{lang === 'fr' ? 'Restaurer depuis GitHub' : 'استعادة تلقائية للبيانات من GitHub'}</span>
              </button>
            </div>

            {/* Explanatory Help Box */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
              <p className="font-bold text-slate-800 flex items-center gap-1">
                💡 <span>كيف تعمل المزامنة التلقائية؟</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><b>دون ملفات:</b> يتم إرسال واسترجاع جميع التقارير، قائمة الأساتذة، والأفواج برمجياً بضغطة زر واحدة عبر GitHub Gist.</li>
                <li><b>حساب خاص لكل مشرف:</b> كل جهاز يحتفظ ببيانات المشرف محلياً، ويمكن للمشرف مزامنتها مع حسابه الشخصي على GitHub.</li>
              </ul>
            </div>
          </div>

          {/* Download Word Report */}
          <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-2xl p-5 shadow-md text-center space-y-3">
            <Download className="w-10 h-10 mx-auto text-blue-200" />
            <div>
              <h3 className="text-base font-extrabold">{lang === 'fr' ? 'Rapport Mensuel Officiel' : 'التقرير الشهري الرسمي'}</h3>
              <p className="text-xs text-blue-100">{lang === 'fr' ? `Exporter le rapport de ${currentMonthName} (.doc)` : `تصدير تقرير شهر ${currentMonthName} بفرمتة Word (.doc)`}</p>
            </div>

            <button
              onClick={() => downloadWordReport(db, db.currentMonth)}
              className="w-full bg-white text-blue-900 hover:bg-blue-50 font-black py-3 px-4 rounded-xl shadow transition text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'fr' ? 'Télécharger le rapport Word (.doc)' : 'تحميل التقرير الكامل Word (.doc)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {previewDoc && (
        <div
          onClick={() => setPreviewDoc(null)}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white p-3 rounded-2xl max-w-lg w-full space-y-3">
            <img src={previewDoc.url || previewDoc.data} alt="preview" className="w-full max-h-[70vh] object-contain rounded-xl" />
            <p className="text-xs font-bold text-slate-800 text-center">{previewDoc.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};
