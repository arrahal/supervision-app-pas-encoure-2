import React, { useState } from 'react';
import { AppData, StudentRecord, InqitaaRecord } from '../types';
import { Language, translations } from '../utils/i18n';
import { UserPlus, UserX, Search, Plus, RotateCcw, CheckCircle2, Phone, Calendar, Trash2, School, AlertCircle } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface PupilsTabProps {
  db: AppData;
  lang?: Language;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}

export const PupilsTab: React.FC<PupilsTabProps> = ({ db, lang = 'ar', onUpdateDb }) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'registrations' | 'inqitaat'>('registrations');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals inside Pupils Tab
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddInqitaaOpen, setIsAddInqitaaOpen] = useState(false);
  const [deleteStudentModal, setDeleteStudentModal] = useState<{ isOpen: boolean; studentId: number; studentName: string }>({
    isOpen: false,
    studentId: 0,
    studentName: '',
  });
  const [deleteInqitaaModal, setDeleteInqitaaModal] = useState<{ isOpen: boolean; inqId: number; inqName: string }>({
    isOpen: false,
    inqId: 0,
    inqName: '',
  });

  // Form states for New Student Registration
  const [stNom, setStNom] = useState('');
  const [stSexe, setStSexe] = useState<'F' | 'M'>('M');
  const [stCode, setStCode] = useState('E1');
  const [stDateNaissance, setStDateNaissance] = useState('');
  const [stGroupeId, setStGroupeId] = useState<number>(db.groupes[0]?.id || 1);
  const [stParentTel, setStParentTel] = useState('');
  const [stNotes, setStNotes] = useState('');

  // Form states for Dropout Registration
  const [inqNom, setInqNom] = useState('');
  const [inqSexe, setInqSexe] = useState<'F' | 'M'>('M');
  const [inqCode, setInqCode] = useState('E1');
  const [inqAge, setInqAge] = useState('');
  const [inqParentTel, setInqParentTel] = useState('');
  const [inqGroupeId, setInqGroupeId] = useState<number>(db.groupes[0]?.id || 1);
  const [inqCause, setInqCause] = useState(lang === 'fr' ? 'Éloignement et chemins difficiles' : 'بعد المسافة وصعوبة المسالك');
  const [inqActionsMowakaba, setInqActionsMowakaba] = useState('');

  const studentsList = db.students || [];
  const inqitaatList = db.inqitaat || [];

  const handleRegisterNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stNom.trim()) return;

    const grp = db.groupes.find((g) => g.id === stGroupeId);
    if (!grp) return;

    const newId = (db.nextId?.st || 1) + 1;
    const autoCode = stCode.trim() || `E${newId}`;

    const newStudent: StudentRecord = {
      id: newId,
      code: autoCode,
      nom: stNom.trim(),
      sexe: stSexe,
      dateNaissance: stDateNaissance.trim(),
      groupeId: stGroupeId,
      ecoleNom: grp.ecole,
      month: db.currentMonth,
      dateInscription: new Date().toISOString().split('T')[0],
      parentTel: stParentTel.trim(),
      status: 'actif',
      notes: stNotes.trim(),
    };

    onUpdateDb((prev) => {
      const updatedGroupes = prev.groupes.map((g) => {
        if (g.id === stGroupeId) {
          return {
            ...g,
            eff: g.eff + 1,
            filles: stSexe === 'F' ? g.filles + 1 : g.filles,
            garcons: stSexe === 'M' ? g.garcons + 1 : g.garcons,
          };
        }
        return g;
      });

      return {
        ...prev,
        groupes: updatedGroupes,
        students: [newStudent, ...(prev.students || [])],
        nextId: { ...prev.nextId, st: newId + 1 },
      };
    });

    setStNom('');
    setStCode('E1');
    setStDateNaissance('');
    setStParentTel('');
    setStNotes('');
    setIsAddStudentOpen(false);
  };

  const handleRegisterInqitaa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inqNom.trim()) return;

    const grp = db.groupes.find((g) => g.id === inqGroupeId);
    if (!grp) return;

    const newId = (db.nextId?.inq || 1) + 1;
    const newInqitaa: InqitaaRecord = {
      id: newId,
      code: inqCode.trim() || `E${newId}`,
      studentNom: inqNom.trim(),
      sexe: inqSexe,
      groupeId: inqGroupeId,
      ecoleNom: grp.ecole,
      age: inqAge ? Number(inqAge) : '',
      parentTel: inqParentTel.trim(),
      month: db.currentMonth,
      dateInqitaa: new Date().toISOString().split('T')[0],
      cause: inqCause.trim(),
      actionsMowakaba: inqActionsMowakaba.trim(),
      status: 'monqatia',
      notes: '',
    };

    onUpdateDb((prev) => {
      // Reduce group pupil count (eff) when student drops out
      const updatedGroupes = prev.groupes.map((g) => {
        if (g.id === inqGroupeId) {
          return {
            ...g,
            eff: Math.max(0, g.eff - 1),
            filles: inqSexe === 'F' ? Math.max(0, g.filles - 1) : g.filles,
            garcons: inqSexe === 'M' ? Math.max(0, g.garcons - 1) : g.garcons,
          };
        }
        return g;
      });

      return {
        ...prev,
        groupes: updatedGroupes,
        inqitaat: [newInqitaa, ...(prev.inqitaat || [])],
        nextId: { ...prev.nextId, inq: newId + 1 },
      };
    });

    setInqNom('');
    setInqCode('E1');
    setInqAge('');
    setInqParentTel('');
    setInqActionsMowakaba('');
    setIsAddInqitaaOpen(false);
  };

  const handleToggleIrjaa = (inqId: number) => {
    onUpdateDb((prev) => {
      const item = (prev.inqitaat || []).find((i) => i.id === inqId);
      if (!item) return prev;

      const isBecomingIrjaa = item.status === 'monqatia'; // Changing to 'irjaa'
      const targetGroupeId = item.groupeId;

      const updatedGroupes = prev.groupes.map((g) => {
        if (g.id === targetGroupeId) {
          if (isBecomingIrjaa) {
            // Student reinstated -> increase pupil count (eff)
            return {
              ...g,
              eff: g.eff + 1,
              filles: item.sexe === 'F' ? g.filles + 1 : g.filles,
              garcons: item.sexe === 'M' ? g.garcons + 1 : g.garcons,
            };
          } else {
            // Changing back to monqatia -> decrease pupil count (eff)
            return {
              ...g,
              eff: Math.max(0, g.eff - 1),
              filles: item.sexe === 'F' ? Math.max(0, g.filles - 1) : g.filles,
              garcons: item.sexe === 'M' ? Math.max(0, g.garcons - 1) : g.garcons,
            };
          }
        }
        return g;
      });

      const updatedInqitaat = (prev.inqitaat || []).map((i) => {
        if (i.id === inqId) {
          const nextStatus: 'monqatia' | 'irjaa' = isBecomingIrjaa ? 'irjaa' : 'monqatia';
          return {
            ...i,
            status: nextStatus,
            dateIrjaa: nextStatus === 'irjaa' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return i;
      });

      return {
        ...prev,
        groupes: updatedGroupes,
        inqitaat: updatedInqitaat,
      };
    });
  };

  const handleDeleteStudent = (id: number) => {
    onUpdateDb((prev) => {
      const st = (prev.students || []).find((s) => s.id === id);
      const updatedGroupes = prev.groupes.map((g) => {
        if (st && g.id === st.groupeId) {
          return {
            ...g,
            eff: Math.max(0, g.eff - 1),
            filles: st.sexe === 'F' ? Math.max(0, g.filles - 1) : g.filles,
            garcons: st.sexe === 'M' ? Math.max(0, g.garcons - 1) : g.garcons,
          };
        }
        return g;
      });

      return {
        ...prev,
        groupes: updatedGroupes,
        students: (prev.students || []).filter((s) => s.id !== id),
      };
    });
  };

  const handleDeleteInqitaa = (id: number) => {
    onUpdateDb((prev) => {
      const item = (prev.inqitaat || []).find((i) => i.id === id);
      let updatedGroupes = prev.groupes;

      if (item && item.status === 'monqatia') {
        updatedGroupes = prev.groupes.map((g) => {
          if (g.id === item.groupeId) {
            return {
              ...g,
              eff: g.eff + 1,
              filles: item.sexe === 'F' ? g.filles + 1 : g.filles,
              garcons: item.sexe === 'M' ? g.garcons + 1 : g.garcons,
            };
          }
          return g;
        });
      }

      return {
        ...prev,
        groupes: updatedGroupes,
        inqitaat: (prev.inqitaat || []).filter((i) => i.id !== id),
      };
    });
  };

  // Metrics
  const activeDropoutsCount = inqitaatList.filter((i) => i.status === 'monqatia').length;
  const returnedCount = inqitaatList.filter((i) => i.status === 'irjaa').length;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-20">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>{lang === 'fr' ? 'Inscriptions, Décrochage & Réintégrations' : 'تسجيل التلاميذ وتتبع الانقطاع والإرجاع'}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'fr' ? 'Gestion des nouveaux élèves et suivi des abandons scolaires' : 'تسجيل الجدد، تتبع حالات الهدر والانقطاع المدرسي'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {activeSubTab === 'registrations' ? (
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'fr' ? 'Nouvel élève' : 'تلميذ جديد'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddInqitaaOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'fr' ? 'Cas de décrochage' : 'حالة انقطاع'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{studentsList.length}</span>
          <span className="text-[10px] text-indigo-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Inscrits' : 'تلاميذ مسجلون جدد'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{activeDropoutsCount}</span>
          <span className="text-[10px] text-amber-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Cas de décrochage' : 'حالات انقطاع قائمة'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-3 shadow-sm">
          <span className="text-xl font-black block leading-none">{returnedCount}</span>
          <span className="text-[10px] text-emerald-100 font-bold mt-1 block">
            {lang === 'fr' ? 'Réintégrés' : 'تلاميذ تم إرجاعهم'}
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setActiveSubTab('registrations')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'registrations'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>{lang === 'fr' ? 'Nouveaux inscrits' : 'سجل التسجيلات الجديدة'} ({studentsList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inqitaat')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'inqitaat'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>{lang === 'fr' ? 'Suivi du décrochage' : 'تتبع حالات الانقطاع'} ({inqitaatList.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={lang === 'fr' ? 'Rechercher élève, école...' : 'بحث باسم التلميذ أو المدرسة...'}
          className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* ================= VIEW 1: REGISTRATIONS LIST ================= */}
      {activeSubTab === 'registrations' && (
        <div className="space-y-3">
          {studentsList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3 shadow-sm">
              <UserPlus className="w-12 h-12 text-indigo-300 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {lang === 'fr' ? 'Aucun élève inscrit pour le moment' : 'لم يتم تسجيل تلاميذ جدد بعد'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'fr' ? 'Vous pouvez inscrire un nouvel élève directement.' : 'يمكنك تسجيل التلميذ الجديد مباشرة وإلحاقه بأحد الأفواج والمؤسسات.'}
                </p>
              </div>
              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'fr' ? 'Inscrire un élève' : 'تسجيل أول تلميذ جديد'}</span>
              </button>
            </div>
          ) : (
            studentsList
              .filter(
                (s) =>
                  s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.ecoleNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((s) => {
                const grp = db.groupes.find((g) => g.id === s.groupeId);
                return (
                  <div
                    key={s.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {s.code && (
                          <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-black px-2 py-0.5 rounded-lg">
                            {s.code}
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-800">{s.nom}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {s.sexe === 'F' ? (lang === 'fr' ? 'F' : 'أنثى') : (lang === 'fr' ? 'M' : 'ذكر')}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {s.dateInscription}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium bg-slate-50/80 p-2.5 rounded-xl">
                      <div>{t.school}: <b className="text-slate-800">{s.ecoleNom}</b></div>
                      <div>{t.group}: <b className="text-slate-800">{grp?.groupe || '—'}</b></div>
                      {s.dateNaissance && <div>{lang === 'fr' ? 'Date de naissance' : 'تاريخ الازدياد'}: <b className="text-slate-800">{s.dateNaissance}</b></div>}
                      {s.parentTel && <div>{lang === 'fr' ? 'Tél. Tuteur' : 'هاتف الولي'}: <b className="text-slate-800 font-mono">{s.parentTel}</b></div>}
                    </div>

                    {s.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                        {s.notes}
                      </p>
                    )}

                    <div className="flex justify-end border-t border-slate-100 pt-1.5">
                      <button
                        onClick={() => setDeleteStudentModal({ isOpen: true, studentId: s.id, studentName: s.nom })}
                        className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.delete}</span>
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ================= VIEW 2: DROP-OUTS LIST ================= */}
      {activeSubTab === 'inqitaat' && (
        <div className="space-y-3">
          {inqitaatList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3 shadow-sm">
              <UserX className="w-12 h-12 text-amber-300 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {lang === 'fr' ? 'Aucun cas de décrochage enregistré' : 'لا توجد حالات انقطاع مسجلة'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'fr' ? 'Vous pouvez enregistrer les abandons et suivre leur réintégration.' : 'يمكنك تسجيل حالات الانقطاع ومتابعة جهود إعادة إدماجهم بالمدارس.'}
                </p>
              </div>
              <button
                onClick={() => setIsAddInqitaaOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'fr' ? 'Enregistrer un cas de décrochage' : 'تسجيل حالة انقطاع'}</span>
              </button>
            </div>
          ) : (
            inqitaatList
              .filter(
                (i) =>
                  i.studentNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  i.ecoleNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (i.code && i.code.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((i) => {
                const grp = db.groupes.find((g) => g.id === i.groupeId);
                const isReturned = i.status === 'irjaa';

                return (
                  <div
                    key={i.id}
                    className={`bg-white border rounded-2xl p-3.5 shadow-sm space-y-2 ${
                      isReturned ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {i.code && (
                          <span className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono font-black px-2 py-0.5 rounded-lg">
                            {i.code}
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-800">{i.studentNom}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            i.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {i.sexe === 'F' ? (lang === 'fr' ? 'F' : 'أنثى') : (lang === 'fr' ? 'M' : 'ذكر')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isReturned
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {isReturned
                            ? (lang === 'fr' ? 'Réintégré' : 'تمت العودة للمدرسة ✅')
                            : (lang === 'fr' ? 'Décroché' : 'منقطع عن الدراسة ⚠️')}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">{i.dateInqitaa}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                      <div>{t.school}: <b className="text-slate-800">{i.ecoleNom}</b></div>
                      <div>{t.group}: <b className="text-slate-800">{grp?.groupe || '—'}</b></div>
                      {i.age && <div>{lang === 'fr' ? 'Âge' : 'العمر'}: <b className="text-slate-800">{i.age} {lang === 'fr' ? 'ans' : 'سنة'}</b></div>}
                      {i.parentTel && <div>{lang === 'fr' ? 'Tél. Tuteur' : 'هاتف الولي'}: <b className="text-slate-800 font-mono">{i.parentTel}</b></div>}
                      <div className="col-span-2">{lang === 'fr' ? 'Cause' : 'سبب الانقطاع'}: <b className="text-amber-800">{i.cause}</b></div>
                    </div>

                    {i.actionsMowakaba && (
                      <div className="text-[11px] bg-blue-50/80 border border-blue-100 p-2 rounded-xl text-blue-900 font-medium">
                        <span className="font-bold text-blue-800 block mb-0.5">
                          {lang === 'fr' ? 'Actions de suivi prévues :' : 'إجراءات المواكبة المزمعة:'}
                        </span>
                        {i.actionsMowakaba}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <button
                        onClick={() => handleToggleIrjaa(i.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                          isReturned
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>
                          {isReturned
                            ? (lang === 'fr' ? 'Annuler la réintégration' : 'إلغاء وضعية الإرجاع')
                            : (lang === 'fr' ? 'Enregistrer la réintégration' : 'تسجيل إرجاع التلميذ للمدرسة')}
                        </span>
                      </button>

                      <button
                        onClick={() => setDeleteInqitaaModal({ isOpen: true, inqId: i.id, inqName: i.studentNom })}
                        className="text-xs font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ================= MODAL: ADD NEW STUDENT ================= */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'fr' ? 'Inscrire un nouvel élève' : 'تسجيل تلميذ جديد في الفوج'}</span>
            </h3>

            <form onSubmit={handleRegisterNewStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Nom complet' : 'اسم التلميذ الكامل'} *</label>
                <input
                  type="text"
                  required
                  value={stNom}
                  onChange={(e) => setStNom(e.target.value)}
                  placeholder={lang === 'fr' ? 'Ex: Youssef El Abdellaoui' : 'مثال: يوسف العبدلاوي'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Genre' : 'النوع'} *</label>
                  <select
                    value={stSexe}
                    onChange={(e) => setStSexe(e.target.value as 'F' | 'M')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                  >
                    <option value="M">{lang === 'fr' ? 'Masculin' : 'ذكر'}</option>
                    <option value="F">{lang === 'fr' ? 'Féminin' : 'أنثى'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Code élève' : 'الكود الخاص بالتلميذ'}</label>
                  <input
                    type="text"
                    value={stCode}
                    onChange={(e) => setStCode(e.target.value)}
                    placeholder="E1..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'École & Groupe' : 'المدرسة والفوج'} *</label>
                <select
                  value={stGroupeId}
                  onChange={(e) => setStGroupeId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                >
                  {db.groupes.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.ecole} — {g.groupe} ({g.eff} {t.student})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Date de naissance' : 'تاريخ الازدياد'}</label>
                  <input
                    type="date"
                    value={stDateNaissance}
                    onChange={(e) => setStDateNaissance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Tél. Tuteur' : 'هاتف الولي'}</label>
                  <input
                    type="tel"
                    value={stParentTel}
                    onChange={(e) => setStParentTel(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Remarques' : 'ملاحظات إضافية'}</label>
                <textarea
                  value={stNotes}
                  onChange={(e) => setStNotes(e.target.value)}
                  placeholder={lang === 'fr' ? 'Remarques...' : 'مستوى التحصيل، ملاحظات أولية...'}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
                >
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD DROPOUT ================= */}
      {isAddInqitaaOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2 flex items-center gap-1.5">
              <UserX className="w-4 h-4 text-amber-600" />
              <span>{lang === 'fr' ? 'Enregistrer un cas de décrochage' : 'تسجيل حالة انقطاع عن الدراسة'}</span>
            </h3>

            <form onSubmit={handleRegisterInqitaa} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Nom de l\'élève' : 'اسم التلميذ المنقطع'} *</label>
                <input
                  type="text"
                  required
                  value={inqNom}
                  onChange={(e) => setInqNom(e.target.value)}
                  placeholder={lang === 'fr' ? 'Ex: Fatima El Bakkali' : 'مثال: فاطمة الزهراء البقالي'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Genre' : 'النوع'} *</label>
                  <select
                    value={inqSexe}
                    onChange={(e) => setInqSexe(e.target.value as 'F' | 'M')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                  >
                    <option value="M">{lang === 'fr' ? 'Masculin' : 'ذكر'}</option>
                    <option value="F">{lang === 'fr' ? 'Féminin' : 'أنثى'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Code élève' : 'الكود الخاص بالتلميذ'}</label>
                  <input
                    type="text"
                    value={inqCode}
                    onChange={(e) => setInqCode(e.target.value)}
                    placeholder="E1..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'École & Groupe' : 'المدرسة والفوج'} *</label>
                <select
                  value={inqGroupeId}
                  onChange={(e) => setInqGroupeId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                >
                  {db.groupes.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.ecole} — {g.groupe}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Âge (ans)' : 'العمر (سنة)'}</label>
                  <input
                    type="number"
                    value={inqAge}
                    onChange={(e) => setInqAge(e.target.value)}
                    placeholder="12..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Tél. Tuteur' : 'رقم هاتف ولي الأمر'}</label>
                  <input
                    type="tel"
                    value={inqParentTel}
                    onChange={(e) => setInqParentTel(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Cause du décrochage' : 'سبب الانقطاع'} *</label>
                <select
                  value={inqCause}
                  onChange={(e) => setInqCause(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                >
                  {lang === 'fr' ? (
                    <>
                      <option value="Éloignement et chemins difficiles">Éloignement et chemins difficiles</option>
                      <option value="Conditions familiales ou sociales">Conditions familiales ou sociales</option>
                      <option value="Difficultés d'apprentissage">Difficultés d'apprentissage</option>
                      <option value="Déménagement">Déménagement</option>
                      <option value="Autres motifs">Autres motifs</option>
                    </>
                  ) : (
                    <>
                      <option value="بعد المسافة وصعوبة المسالك">بعد المسافة وصعوبة المسالك</option>
                      <option value="ظروف عائلية أو اجتماعية">ظروف عائلية أو اجتماعية</option>
                      <option value="صعوبات في التعلم والتحصيل">صعوبات في التعلم والتحصيل</option>
                      <option value="انتقال السكن">انتقال السكن</option>
                      <option value="أسباب أخرى">أسباب أخرى</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'fr' ? 'Actions de suivi prévues' : 'إجراءات المواكبة المزمعة'}</label>
                <textarea
                  value={inqActionsMowakaba}
                  onChange={(e) => setInqActionsMowakaba(e.target.value)}
                  placeholder={lang === 'fr' ? 'Visite à domicile, contact parents...' : 'زيارة منزلية لمقر السكن، تواصل مع الولي، الدعم النفسي والتربوي...'}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
                >
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddInqitaaOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modals */}
      <ConfirmModal
        isOpen={deleteStudentModal.isOpen}
        onClose={() => setDeleteStudentModal({ isOpen: false, studentId: 0, studentName: '' })}
        onConfirm={() => handleDeleteStudent(deleteStudentModal.studentId)}
        title={t.confirmDelete}
        message={lang === 'fr' ? `Êtes-vous sûr de vouloir supprimer l'élève "${deleteStudentModal.studentName}" ?` : `هل أنت تأكد من حذف تسجيل التلميذ(ة) "${deleteStudentModal.studentName}"؟`}
        confirmText={t.delete}
        cancelText={t.cancel}
        type="danger"
      />

      <ConfirmModal
        isOpen={deleteInqitaaModal.isOpen}
        onClose={() => setDeleteInqitaaModal({ isOpen: false, inqId: 0, inqName: '' })}
        onConfirm={() => handleDeleteInqitaa(deleteInqitaaModal.inqId)}
        title={t.confirmDelete}
        message={lang === 'fr' ? `Êtes-vous sûr de vouloir supprimer le cas de décrochage de "${deleteInqitaaModal.inqName}" ?` : `هل أنت تأكد من حذف حالة انقطاع التلميذ(ة) "${deleteInqitaaModal.inqName}"؟`}
        confirmText={t.delete}
        cancelText={t.cancel}
        type="danger"
      />
    </div>
  );
};
