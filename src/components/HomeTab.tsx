import React from 'react';
import { AppData, TabType } from '../types';
import { MONTHS_AR } from '../data/initialData';
import { Language, translations, MONTHS_FR } from '../utils/i18n';
import { Users, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, UserPlus, Building2, UserCog, PlusCircle } from 'lucide-react';

interface HomeTabProps {
  db: AppData;
  lang?: Language;
  onNavigateTab: (tab: TabType) => void;
  onQuickVisit: (animId: number) => void;
  onOpenSupervisorModal?: () => void;
  onOpenAddAnimModal?: () => void;
  onOpenAddEcoleModal?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  db,
  lang = 'ar',
  onNavigateTab,
  onQuickVisit,
  onOpenSupervisorModal,
  onOpenAddAnimModal,
  onOpenAddEcoleModal,
}) => {
  const t = translations[lang];
  const totalEff = db.groupes.reduce((a, g) => a + g.eff, 0);
  const totalFilles = db.groupes.reduce((a, g) => a + g.filles, 0);
  const totalAbs = db.groupes.reduce((a, g) => a + g.absences, 0);
  const tauxAbs = totalEff > 0 ? Math.round((totalAbs / totalEff) * 100) : 0;

  const sup = db.supervisor || {
    nom: t.supervisorDefaultName,
    project: t.projectDefaultName,
    region: lang === 'fr' ? 'Région' : 'الجهة',
    province: lang === 'fr' ? 'Province' : 'الإقليم',
  };

  const topAbsentGroups = [...db.groupes]
    .filter((g) => g.absences > 3)
    .sort((a, b) => b.absences - a.absences)
    .slice(0, 5);

  const isEmpty = db.animateurs.length === 0 && db.ecoles.length === 0;

  const monthName = lang === 'fr'
    ? (MONTHS_FR[db.currentMonth] || `Mois ${db.currentMonth}`)
    : (MONTHS_AR[db.currentMonth] || `شهر ${db.currentMonth}`);

  const NavArrow = lang === 'fr' ? ArrowRight : ArrowLeft;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-20">
      {/* Title & Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">
            {lang === 'fr' ? 'Tableau de bord — ' : 'لوحة القيادة — '}{monthName} {new Date().getFullYear()}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'fr' ? 'Suivi des performances et statistiques de supervision' : 'متابعة الأداء وإحصائيات التأطير التربوي'}
          </p>
        </div>

        {onOpenSupervisorModal && (
          <button
            onClick={onOpenSupervisorModal}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <UserCog className="w-3.5 h-3.5" />
            <span>{lang === 'fr' ? 'Paramètres' : 'إعدادات الحساب'}</span>
          </button>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 via-indigo-50/70 to-blue-100/60 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <div className="p-2.5 bg-blue-600 text-white rounded-xl flex-shrink-0 mt-0.5 shadow-sm">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-blue-950">{sup.project}</h3>
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
              {sup.nom}
            </span>
          </div>
          <p className="text-[11px] text-blue-800 font-medium leading-relaxed mt-1">
            {sup.province} · {sup.region} — {lang === 'fr'
              ? `Encadrement de ${db.ecoles.length} écoles · ${db.animateurs.length} enseignants · ${db.groupes.length} groupes`
              : `تأطير ومواكبة ${db.ecoles.length} مدرسة · ${db.animateurs.length} أستاذ · ${db.groupes.length} فوج`}
          </p>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-4 text-center shadow-md">
          <span className="text-2xl font-black block leading-none">{totalEff}</span>
          <span className="text-xs text-blue-100 font-bold mt-1.5 block">
            {lang === 'fr' ? 'Total Élèves' : 'إجمالي التلاميذ'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 text-center shadow-md">
          <span className="text-2xl font-black block leading-none">{totalFilles}</span>
          <span className="text-xs text-emerald-100 font-bold mt-1.5 block">
            {lang === 'fr' ? 'Filles' : 'إجمالي الإناث'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 text-center shadow-md">
          <span className="text-2xl font-black block leading-none">{totalAbs}</span>
          <span className="text-xs text-amber-100 font-bold mt-1.5 block">
            {lang === 'fr' ? 'Absences du mois' : 'غيابات الشهر'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl p-4 text-center shadow-md">
          <span className="text-2xl font-black block leading-none">{tauxAbs}%</span>
          <span className="text-xs text-rose-100 font-bold mt-1.5 block">
            {lang === 'fr' ? 'Taux d\'absence global' : 'نسبة الغياب العامة'}
          </span>
        </div>
      </div>

      {/* Empty State Banner when no animateurs */}
      {isEmpty && (
        <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {lang === 'fr' ? 'L\'application est prête pour vos données !' : 'التطبيق فارغ ومستعد لاستقبال بياناتك التربوية!'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {lang === 'fr'
                ? 'Vous pouvez maintenant ajouter des enseignants, des écoles et des groupes pour votre projet.'
                : 'يمكنك الآن إضافة الأساتذة المؤطرين والمدارس والأفواج الخاصة بمشروعك التربوي.'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {onOpenAddAnimModal && (
              <button
                onClick={onOpenAddAnimModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.addTeacher}</span>
              </button>
            )}

            {onOpenAddEcoleModal && (
              <button
                onClick={onOpenAddEcoleModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>{t.addSchool}</span>
              </button>
            )}

            {onOpenSupervisorModal && (
              <button
                onClick={onOpenSupervisorModal}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserCog className="w-4 h-4" />
                <span>{lang === 'fr' ? 'Modifier profil' : 'تعديل حساب المشرف'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Teacher Visit Summary */}
      {db.animateurs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {lang === 'fr' ? 'Enseignants — Suivi mensuel des visites' : 'الأساتذة — تقدم الزيارات الشهري'}
            </h3>
            <button
              onClick={() => onNavigateTab('animateurs')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'fr' ? `Voir tous (${db.animateurs.length})` : `عرض الكل (${db.animateurs.length})`}</span>
              <NavArrow className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {db.animateurs.slice(0, 5).map((a) => {
              const gs = db.groupes.filter((g) => g.animId === a.id);
              const visits = gs.reduce((s, g) => s + (g.visits || 0), 0);
              const eff = gs.reduce((s, g) => s + g.eff, 0);
              const pct = gs.length > 0 ? Math.min(Math.round((visits / gs.length) * 100), 100) : 0;

              return (
                <div key={a.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{a.nom}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {gs.length} {t.groupsCount} · {eff} {t.student}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <span
                          className={`text-sm font-black ${
                            visits > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {visits}
                        </span>
                        <span className="text-[10px] text-slate-400 block leading-tight">{t.visit}</span>
                      </div>

                      <button
                        onClick={() => onQuickVisit(a.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        {t.addVisit}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        visits > 0 ? 'bg-emerald-500' : 'bg-rose-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Absent Groups */}
      {db.groupes.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {lang === 'fr' ? 'Groupes avec le plus d\'absences ce mois' : 'الأفواج الأكثر غياباً هذا الشهر'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              {lang === 'fr' ? 'Détails' : 'تفاصيل الغياب'}
            </button>
          </div>

          {topAbsentGroups.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1.5 opacity-80" />
              <p>{lang === 'fr' ? 'Aucune absence élevée enregistrée ce mois' : 'لا توجد حالات غياب مرتفعة مسجلة هذا الشهر'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topAbsentGroups.map((g) => {
                const anim = db.animateurs.find((a) => a.id === g.animId);
                return (
                  <div
                    key={g.id}
                    className="flex items-center justify-between bg-rose-50/50 border border-rose-100 rounded-xl p-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {g.ecole} — <span className="text-blue-700">{g.groupe}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t.teacher}: {anim ? anim.nom.split(' ')[0] : '—'} · {g.eff} {t.student}
                      </div>
                    </div>

                    <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-full">
                      {g.absences} {t.absence}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
