import React, { useState, useEffect } from 'react';
import { AppData, Animateur, Ecole, Groupe, Report, CloudConfig, GistConfig, SupervisorInfo } from '../types';
import { CRITERIA, DAYS, ZONES, INITIAL_SUPERVISOR, DEMO_SAMPLE_DATA } from '../data/initialData';
import {
  MOROCCO_REGIONS,
  getProvincesForRegion,
  getCommunesForProvince,
  DEFAULT_REGION,
  DEFAULT_PROVINCE,
  DEFAULT_COMMUNE,
} from '../data/moroccoLocations';
import { X, Star, Save, Plus, Trash2, Users, School, Layers, Check, MapPin, ExternalLink, Lock, Eye, EyeOff } from 'lucide-react';
import { saveMonthSnapshot, saveCloudCfg, saveGistCfg, getCloudCfg, getGistCfg } from '../utils/storage';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ================= VISIT MODAL =================
export const VisitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  animId: number;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, animId, db, onUpdateDb }) => {
  const [selectedAnimId, setSelectedAnimId] = useState<number>(animId || db.animateurs[0]?.id || 0);
  const [selectedGroupeId, setSelectedGroupeId] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    setSelectedAnimId(animId || db.animateurs[0]?.id || 0);
  }, [animId, db.animateurs]);

  // Find groups for selected animateur or all groups
  const availableGroups = db.groupes.filter((g) => g.animId === selectedAnimId);
  const groupsToDisplay = availableGroups.length > 0 ? availableGroups : db.groupes;

  useEffect(() => {
    if (groupsToDisplay.length > 0 && !selectedGroupeId) {
      setSelectedGroupeId(groupsToDisplay[0].id);
    }
  }, [selectedAnimId, db.groupes]);

  const selectedAnim = db.animateurs.find((a) => a.id === selectedAnimId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimId) {
      alert('الرجاء اختيار الأستاذ المؤطر');
      return;
    }

    onUpdateDb((prev) => {
      const nextRId = prev.nextId.r || 1;
      const updatedGroupes = prev.groupes.map((g) =>
        g.id === selectedGroupeId ? { ...g, visits: (g.visits || 0) + 1 } : g
      );

      const targetGroup = prev.groupes.find((g) => g.id === selectedGroupeId);

      const newReport: Report = {
        id: nextRId,
        month: prev.currentMonth,
        type: 'visite',
        animId: selectedAnimId,
        groupeId: selectedGroupeId,
        date,
        text: notes.trim() || `زيارة تأطيرية للأستاذ(ة) ${selectedAnim?.nom || ''} بمؤسسة ${targetGroup?.ecole || ''}`,
      };
      const updatedState: AppData = {
        ...prev,
        groupes: updatedGroupes,
        reports: [...prev.reports, newReport],
        nextId: { ...prev.nextId, r: nextRId + 1 },
      };
      return saveMonthSnapshot(updatedState, prev.currentMonth);
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل زيارة صفية ومواكبة تربوية">
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-slate-600 font-bold mb-1">اختيار الأستاذ المؤطر</label>
          <select
            value={selectedAnimId}
            onChange={(e) => setSelectedAnimId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            {db.animateurs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom} ({a.zone || 'شيشاوة'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">اختيار المدرسة والفوج</label>
          <select
            value={selectedGroupeId}
            onChange={(e) => setSelectedGroupeId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            {groupsToDisplay.map((g) => (
              <option key={g.id} value={g.id}>
                {g.ecole} — {g.groupe} ({g.eff} تلميذ)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">تاريخ الزيارة الميدانية</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">تقرير وملاحظات الزيارة</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="تسجيل ملاحظات المشرف حول الأنشطة، تفاعل التلاميذ، التوثيق والبيداغوجيا..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 h-24 font-medium text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            تأكيد وتسجيل الزيارة
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ================= EVALUATION MODAL =================
export const EvaluationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  animId: number;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, animId, db, onUpdateDb }) => {
  const anim = db.animateurs.find((a) => a.id === animId);
  const [scores, setScores] = useState<Record<number, number>>({});

  useEffect(() => {
    if (anim) setScores(anim.scores || {});
  }, [animId, anim]);

  if (!anim) return null;

  const handleStarClick = (critIdx: number, val: number) => {
    const updated = { ...scores, [critIdx]: val };
    setScores(updated);

    onUpdateDb((prev) => {
      const updatedAnims = prev.animateurs.map((a) =>
        a.id === animId ? { ...a, scores: updated } : a
      );
      const updatedState: AppData = {
        ...prev,
        animateurs: updatedAnims,
      };
      return saveMonthSnapshot(updatedState, prev.currentMonth);
    });
  };

  const scoreVals: number[] = Object.values(scores).map((v) => Number(v));
  const avg = scoreVals.length
    ? (Math.round((scoreVals.reduce((x, y) => x + y, 0) / scoreVals.length) * 10) / 10).toFixed(1)
    : '0';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تقييم الأداء التربوي — ${anim.nom}`}>
      <div className="space-y-4 text-xs">
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between">
          <span className="font-bold text-blue-900">المتوسط الحالي لـ 14 معياراً:</span>
          <span className="text-base font-black text-blue-700">{avg} / 3</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto p-1">
          {CRITERIA.map((crit, idx) => {
            const currentVal = scores[idx] || 0;
            return (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1.5 flex flex-col justify-between"
              >
                <span className="font-bold text-slate-800 text-[11px]">
                  {idx + 1}. {crit}
                </span>

                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => handleStarClick(idx, starVal)}
                      className={`flex-1 py-1 rounded-lg border text-[10px] font-extrabold transition cursor-pointer ${
                        currentVal >= starVal && starVal > 0
                          ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm'
                          : starVal === 0 && currentVal === 0
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-amber-50'
                      }`}
                    >
                      {starVal}★
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer"
        >
          حفظ وإغلاق
        </button>
      </div>
    </Modal>
  );
};

// ================= NOTES MODAL =================
export const NotesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  animId: number;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, animId, db, onUpdateDb }) => {
  const anim = db.animateurs.find((a) => a.id === animId);
  const [text, setText] = useState('');

  useEffect(() => {
    if (anim) setText(anim.notes || '');
  }, [animId, anim]);

  if (!anim) return null;

  const handleSave = () => {
    onUpdateDb((prev) => ({
      ...prev,
      animateurs: prev.animateurs.map((x) =>
        x.id === animId ? { ...x, notes: text.trim() } : x
      ),
    }));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`ملاحظات خاصة — ${anim.nom}`}>
      <div className="space-y-3 text-xs">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="إضافة ملاحظة توجيهية للأستاذ..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-28 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl cursor-pointer"
          >
            حفظ
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ================= ADD/EDIT ANIM MODAL =================
export const AddEditAnimModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  animId?: number;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, animId, db, onUpdateDb }) => {
  const isEdit = Boolean(animId);
  const anim = db.animateurs.find((a) => a.id === animId);

  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [zone, setZone] = useState('شيشاوة');
  const [dateContrat, setDateContrat] = useState('');
  const [diplome, setDiplome] = useState('');
  const [age, setAge] = useState('');

  useEffect(() => {
    if (isEdit && anim) {
      setNom(anim.nom);
      setTel(anim.tel);
      setZone(anim.zone || 'شيشاوة');
      setDateContrat(anim.dateContrat || '');
      setDiplome(anim.diplome || '');
      setAge(anim.age ? String(anim.age) : '');
    } else {
      setNom('');
      setTel('');
      setZone('شيشاوة');
      setDateContrat('');
      setDiplome('');
      setAge('');
    }
  }, [animId, anim, isEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNom = nom.trim();
    if (!trimmedNom) {
      alert('الاسم واللقب مطلوب');
      return;
    }

    onUpdateDb((prev) => {
      if (isEdit && animId) {
        return {
          ...prev,
          animateurs: prev.animateurs.map((a) =>
            a.id === animId
              ? {
                  ...a,
                  nom: trimmedNom,
                  tel: tel.trim(),
                  dateContrat: dateContrat.trim(),
                  diplome: diplome.trim(),
                  age: age ? Number(age) : '',
                }
              : a
          ),
        };
      } else {
        const exists = prev.animateurs.some(
          (a) => a.nom.trim().toLowerCase() === trimmedNom.toLowerCase()
        );
        if (exists) {
          return prev;
        }

        const maxId = prev.animateurs.reduce((m, a) => Math.max(m, a.id), 0);
        const nextAId = Math.max(prev.nextId?.a || 1, maxId + 1);
        const newAnimateur: Animateur = {
          id: nextAId,
          nom: trimmedNom,
          tel: tel.trim(),
          zone: 'شيشاوة',
          dateContrat: dateContrat.trim(),
          diplome: diplome.trim(),
          age: age ? Number(age) : '',
          notes: '',
          scores: {},
          visits: 0,
        };
        return {
          ...prev,
          animateurs: [...prev.animateurs, newAnimateur],
          nextId: { ...prev.nextId, a: nextAId + 1 },
        };
      }
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل بيانات الأستاذ' : 'إضافة أستاذ جديد'}>
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-slate-600 font-bold mb-1">الاسم الكامل للأستاذ(ة) *</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="مثال: أحمد العلمي"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 font-bold mb-1">رقم الهاتف</label>
            <input
              type="tel"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              placeholder="0612345678"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">العمر (سنة)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="مثال: 28"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 font-bold mb-1">الإجازة / المؤهل الدراسي</label>
            <input
              type="text"
              value={diplome}
              onChange={(e) => setDiplome(e.target.value)}
              placeholder="مثال: إجازة في الدراسات العربية"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">تاريخ بداية العقد</label>
            <input
              type="date"
              value={dateContrat}
              onChange={(e) => setDateContrat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            حفظ
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ================= ADD/EDIT ECOLE MODAL =================
export const AddEditEcoleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  ecoleId?: number;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, ecoleId, db, onUpdateDb }) => {
  const isEdit = Boolean(ecoleId);
  const ecole = db.ecoles.find((e) => e.id === ecoleId);

  const [nom, setNom] = useState('');
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [commune, setCommune] = useState(DEFAULT_COMMUNE);
  const [animId, setAnimId] = useState<number>(0);
  const [gpsUrl, setGpsUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Groups 1 to 8 configuration
  const [groupRows, setGroupRows] = useState<
    { name: string; active: boolean; garcons: number; filles: number }[]
  >([]);

  useEffect(() => {
    if (isEdit && ecole) {
      setNom(ecole.nom);
      const reg = ecole.region || DEFAULT_REGION;
      setRegion(reg);
      const provs = getProvincesForRegion(reg);
      const prov = ecole.province && provs.includes(ecole.province) ? ecole.province : provs[0] || DEFAULT_PROVINCE;
      setProvince(prov);
      const coms = getCommunesForProvince(reg, prov);
      setCommune(ecole.commune && coms.includes(ecole.commune) ? ecole.commune : coms[0] || DEFAULT_COMMUNE);
      setAnimId(ecole.animId || (db.animateurs[0]?.id || 0));
      setGpsUrl(ecole.gpsUrl || '');
      setNotes(ecole.notes || '');

      // Load existing groups for this ecole
      const schoolGroupes = db.groupes.filter((g) => g.ecole === ecole.nom);
      const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
        const gName = `فوج ${num}`;
        const found = schoolGroupes.find((g) => g.groupe === gName || g.groupe === `G${num}`);
        return {
          name: gName,
          active: Boolean(found) || num <= 2,
          garcons: found ? found.garcons : 10,
          filles: found ? found.filles : 10,
        };
      });
      setGroupRows(rows);
    } else {
      setNom('');
      setRegion(DEFAULT_REGION);
      const provs = getProvincesForRegion(DEFAULT_REGION);
      const firstProv = provs[0] || DEFAULT_PROVINCE;
      setProvince(firstProv);
      const coms = getCommunesForProvince(DEFAULT_REGION, firstProv);
      setCommune(coms[0] || DEFAULT_COMMUNE);
      setAnimId(db.animateurs[0]?.id || 0);
      setGpsUrl('');
      setNotes('');

      const defaultRows = [1, 2, 3, 4, 5, 6, 7, 8].map((num) => ({
        name: `فوج ${num}`,
        active: num <= 2,
        garcons: 10,
        filles: 10,
      }));
      setGroupRows(defaultRows);
    }
  }, [ecoleId, ecole, isEdit, isOpen, db.animateurs, db.groupes]);

  // Handle cascade changes
  const handleRegionChange = (newReg: string) => {
    setRegion(newReg);
    const provs = getProvincesForRegion(newReg);
    const firstProv = provs[0] || '';
    setProvince(firstProv);
    const coms = getCommunesForProvince(newReg, firstProv);
    setCommune(coms[0] || '');
  };

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const coms = getCommunesForProvince(region, newProv);
    setCommune(coms[0] || '');
  };

  const availableProvinces = getProvincesForRegion(region);
  const availableCommunes = getCommunesForProvince(region, province);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNom = nom.trim();
    if (!trimmedNom) {
      alert('اسم المدرسة مطلوب');
      return;
    }

    const assignedAnim = db.animateurs.find((a) => a.id === animId);

    onUpdateDb((prev) => {
      let nextEId = prev.nextId?.e || 1;
      let updatedEcoles = prev.ecoles;

      if (isEdit && ecoleId) {
        updatedEcoles = prev.ecoles.map((e) =>
          e.id === ecoleId
            ? {
                ...e,
                nom: trimmedNom,
                region,
                province,
                commune,
                animId,
                animNom: assignedAnim?.nom || '',
                gpsUrl: gpsUrl.trim(),
                notes,
              }
            : e
        );
      } else {
        const maxId = prev.ecoles.reduce((m, e) => Math.max(m, e.id), 0);
        nextEId = Math.max(prev.nextId?.e || 1, maxId + 1);
        const newSchool: Ecole = {
          id: nextEId,
          nom: trimmedNom,
          region,
          province,
          commune,
          animId,
          animNom: assignedAnim?.nom || '',
          groupes: groupRows.filter((r) => r.active).map((r) => r.name),
          gpsUrl: gpsUrl.trim(),
          notes,
        };
        updatedEcoles = [...prev.ecoles, newSchool];
      }

      // Sync Groups (Afwaj 1..8) into db.groupes
      const activeGroups = groupRows.filter((r) => r.active);
      let updatedGroupes = prev.groupes.filter((g) => g.ecole !== (ecole?.nom || trimmedNom));

      let nextGId = prev.nextId?.g || 1;

      activeGroups.forEach((r) => {
        const maxG = Math.max(nextGId, updatedGroupes.reduce((m, g) => Math.max(m, g.id), 0) + 1);
        nextGId = maxG;

        updatedGroupes.push({
          id: nextGId,
          ecole: trimmedNom,
          groupe: r.name,
          animId: animId || (prev.animateurs[0]?.id || 1),
          garcons: Number(r.garcons),
          filles: Number(r.filles),
          eff: Number(r.garcons) + Number(r.filles),
          absences: 0,
          niveau: 'دعم تربوي',
          niveauReel: 'دعم تربوي',
          horaires: {},
          visits: 0,
        });
      });

      return {
        ...prev,
        ecoles: updatedEcoles,
        groupes: updatedGroupes,
        nextId: {
          ...prev.nextId,
          e: isEdit ? prev.nextId.e : nextEId + 1,
          g: nextGId + 1,
        },
      };
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل بيانات المدرسة والأفواج' : 'إضافة مدرسة جديدة'}>
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Region / Province / Commune Cascading Selects */}
        <div>
          <label className="block text-slate-600 font-bold mb-1">الجهة (12 جهة بالمملكة المغربية)</label>
          <select
            value={region}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            {MOROCCO_REGIONS.map((r) => (
              <option key={r.region} value={r.region}>
                {r.region}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 font-bold mb-1">الإقليم / العمالة</label>
            <select
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            >
              {availableProvinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">الجماعة الترابية</label>
            <select
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            >
              {availableCommunes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* School Name */}
        <div>
          <label className="block text-slate-600 font-bold mb-1">اسم المدرسة</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="مثال: مدرسة أهديل المركزية"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            required
          />
        </div>

        {/* Animateur Selection */}
        <div>
          <label className="block text-slate-600 font-bold mb-1">الأستاذ المؤطر المسند للمدرسة</label>
          <select
            value={animId}
            onChange={(e) => setAnimId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            <option value={0}>-- اختيار الأستاذ من القائمة --</option>
            {db.animateurs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom} ({a.zone || a.province || 'شيشاوة'})
              </option>
            ))}
          </select>
        </div>

        {/* GPS Link */}
        <div>
          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>رابط الموقع الجغرافي (Google Maps / GPS)</span>
          </label>
          <input
            type="url"
            value={gpsUrl}
            onChange={(e) => setGpsUrl(e.target.value)}
            placeholder="https://maps.google.com/?q=..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-[11px] text-slate-800 dir-ltr text-left"
          />
        </div>

        {/* Groups 1 to 8 Setup Table */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>تحديد الأفواج (من 1 إلى 8) وعدد التلاميذ</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">اختر الأفواج وحدد إناث/ذكور</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {groupRows.map((row, idx) => (
              <div
                key={row.name}
                className={`flex items-center justify-between p-2 rounded-xl border transition ${
                  row.active
                    ? 'bg-white border-blue-200 shadow-sm'
                    : 'bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 min-w-[70px]">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(e) => {
                      const updated = [...groupRows];
                      updated[idx].active = e.target.checked;
                      setGroupRows(updated);
                    }}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span>{row.name}</span>
                </label>

                {row.active && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">ذكور:</span>
                      <input
                        type="number"
                        min="0"
                        value={row.garcons}
                        onChange={(e) => {
                          const updated = [...groupRows];
                          updated[idx].garcons = Number(e.target.value);
                          setGroupRows(updated);
                        }}
                        className="w-14 bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-slate-800"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">إناث:</span>
                      <input
                        type="number"
                        min="0"
                        value={row.filles}
                        onChange={(e) => {
                          const updated = [...groupRows];
                          updated[idx].filles = Number(e.target.value);
                          setGroupRows(updated);
                        }}
                        className="w-14 bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-slate-800"
                      />
                    </div>

                    <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded-lg text-[10px] font-black">
                      المجموع: {Number(row.garcons) + Number(row.filles)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            حفظ المدرسة والأفواج
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ================= GROUPS MODAL =================
export const GroupsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  animId: number;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
  onOpenAddGroupeModal: (animId: number) => void;
  onOpenEditGroupeModal: (groupeId: number) => void;
}> = ({
  isOpen,
  onClose,
  animId,
  db,
  onUpdateDb,
  onOpenAddGroupeModal,
  onOpenEditGroupeModal,
}) => {
  const anim = db.animateurs.find((a) => a.id === animId);
  const animGroups = db.groupes.filter((g) => g.animId === animId);

  if (!anim) return null;

  const handleDeleteGroup = (gid: number) => {
    if (!window.confirm('حذف هذا الفوج؟')) return;
    onUpdateDb((prev) => ({
      ...prev,
      groupes: prev.groupes.filter((g) => g.id !== gid),
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`أفواج الأستاذ — ${anim.nom}`}>
      <div className="space-y-3 text-xs">
        <div className="space-y-2 max-h-[50vh] overflow-y-auto p-1">
          {animGroups.length === 0 ? (
            <p className="text-center py-6 text-slate-400">لا توجد أفواج مسندة بعد</p>
          ) : (
            animGroups.map((g) => (
              <div
                key={g.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-extrabold text-slate-800 text-xs">
                    {g.ecole} — <span className="text-blue-700">{g.groupe}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {g.niveauReel || g.niveau} · 👥 {g.eff} تلميذ (👧 {g.filles} - 👦 {g.garcons})
                  </div>
                  <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                    🔴 الغياب: {g.absences}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEditGroupeModal(g.id);
                    }}
                    className="p-1.5 bg-white text-slate-700 border border-slate-200 hover:text-blue-600 rounded-lg"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(g.id)}
                    className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenAddGroupeModal(animId);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow transition cursor-pointer"
        >
          + إضافة فوج جديد لهذا الأستاذ
        </button>
      </div>
    </Modal>
  );
};

// ================= ADD/EDIT GROUPE MODAL =================
export const AddEditGroupeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  groupeId?: number;
  animIdForNew?: number;
  ecoleNomForNew?: string;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, groupeId, animIdForNew, ecoleNomForNew, db, onUpdateDb }) => {
  const isEdit = Boolean(groupeId);
  const groupe = db.groupes.find((g) => g.id === groupeId);

  const [ecole, setEcole] = useState('');
  const [groupeName, setGroupeName] = useState('G1');
  const [animId, setAnimId] = useState<number>(1);
  const [eff, setEff] = useState(20);
  const [filles, setFilles] = useState(10);
  const [garcons, setGarcons] = useState(10);
  const [niveauReel, setNiveauReel] = useState('5 AEP');
  const [absences, setAbsences] = useState(0);

  useEffect(() => {
    if (isEdit && groupe) {
      setEcole(groupe.ecole);
      setGroupeName(groupe.groupe);
      setAnimId(groupe.animId);
      setEff(groupe.eff);
      setFilles(groupe.filles);
      setGarcons(groupe.garcons);
      setNiveauReel(groupe.niveauReel || groupe.niveau);
      setAbsences(groupe.absences);
    } else {
      setEcole(ecoleNomForNew || db.ecoles[0]?.nom || '');
      setGroupeName('G1');
      setAnimId(animIdForNew || db.animateurs[0]?.id || 1);
      setEff(20);
      setFilles(10);
      setGarcons(10);
      setNiveauReel('5 AEP');
      setAbsences(0);
    }
  }, [groupeId, groupe, isEdit, isOpen, animIdForNew, ecoleNomForNew, db]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdateDb((prev) => {
      let updatedGroupes = prev.groupes;
      let nextGId = prev.nextId?.g || 1;

      if (isEdit && groupeId) {
        updatedGroupes = prev.groupes.map((g) =>
          g.id === groupeId
            ? {
                ...g,
                ecole,
                groupe: groupeName,
                animId,
                eff: Number(eff),
                filles: Number(filles),
                garcons: Number(garcons),
                niveauReel,
                absences: Number(absences),
              }
            : g
        );
      } else {
        const maxId = prev.groupes.reduce((m, g) => Math.max(m, g.id), 0);
        nextGId = Math.max(prev.nextId?.g || 1, maxId + 1);
        updatedGroupes = [
          ...prev.groupes,
          {
            id: nextGId,
            ecole,
            groupe: groupeName,
            animId,
            eff: Number(eff),
            filles: Number(filles),
            garcons: Number(garcons),
            absences: Number(absences),
            niveau: niveauReel,
            niveauReel,
            horaires: {},
            visits: 0,
          },
        ];
      }

      const updatedState: AppData = {
        ...prev,
        groupes: updatedGroupes,
        nextId: isEdit ? prev.nextId : { ...prev.nextId, g: nextGId + 1 },
      };
      return saveMonthSnapshot(updatedState, prev.currentMonth);
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل بيانات الفوج' : 'إضافة فوج جديد'}>
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-600 font-bold mb-1">المدرسة</label>
          <select
            value={ecole}
            onChange={(e) => setEcole(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            {db.ecoles.map((e) => (
              <option key={e.id} value={e.nom}>
                {e.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">الأستاذ المؤطر</label>
          <select
            value={animId}
            onChange={(e) => setAnimId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            {db.animateurs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom} ({a.zone})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 font-bold mb-1">اسم الفوج</label>
            <input
              type="text"
              value={groupeName}
              onChange={(e) => setGroupeName(e.target.value)}
              placeholder="G1"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">المستوى الحقيقي</label>
            <input
              type="text"
              value={niveauReel}
              onChange={(e) => setNiveauReel(e.target.value)}
              placeholder="5 AEP"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-slate-600 font-bold mb-1">إجمالي التلاميذ</label>
            <input
              type="number"
              value={eff}
              onChange={(e) => setEff(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">عدد الإناث</label>
            <input
              type="number"
              value={filles}
              onChange={(e) => setFilles(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">عدد الذكور</label>
            <input
              type="number"
              value={garcons}
              onChange={(e) => setGarcons(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">عدد الغيابات هذا الشهر</label>
          <input
            type="number"
            value={absences}
            onChange={(e) => setAbsences(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            حفظ
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ================= BULK ABSENCE MODAL =================
export const BulkAbsenceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, db, onUpdateDb }) => {
  const [absencesMap, setAbsencesMap] = useState<Record<number, number>>({});

  useEffect(() => {
    const initial: Record<number, number> = {};
    db.groupes.forEach((g) => {
      initial[g.id] = g.absences || 0;
    });
    setAbsencesMap(initial);
  }, [db, isOpen]);

  const handleSaveAll = () => {
    onUpdateDb((prev) => {
      const copy = { ...prev };
      copy.groupes.forEach((g) => {
        if (absencesMap[g.id] !== undefined) {
          g.absences = Number(absencesMap[g.id]);
        }
      });
      return saveMonthSnapshot(copy, copy.currentMonth);
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تحديث غياب جميع الأفواج الشهرية">
      <div className="space-y-3 text-xs">
        <div className="space-y-2 max-h-[50vh] overflow-y-auto p-1">
          {db.groupes.map((g) => {
            const anim = db.animateurs.find((a) => a.id === g.animId);
            return (
              <div
                key={g.id}
                className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {g.ecole.replace('ECOLE ', '')} — <span className="text-blue-700">{g.groupe}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {anim ? anim.nom.split(' ')[0] : ''} · {g.eff} تلميذ
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  value={absencesMap[g.id] ?? 0}
                  onChange={(e) =>
                    setAbsencesMap((prev) => ({
                      ...prev,
                      [g.id]: Number(e.target.value),
                    }))
                  }
                  className="w-16 bg-white border border-slate-300 rounded-lg text-center p-1 font-black text-rose-600 text-sm"
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSaveAll}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
        >
          💾 حفظ التغييرات للجميع
        </button>
      </div>
    </Modal>
  );
};

// ================= ADD SLOT MODAL =================
export const AddSlotModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  animId: number;
  defDay?: string;
  defTime?: string;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, animId, defDay = 'الاثنين', defTime = '09h-11h', db, onUpdateDb }) => {
  const animGroups = db.groupes.filter((g) => g.animId === animId);

  const [selectedGroupeId, setSelectedGroupeId] = useState<number>(animGroups[0]?.id || 0);
  const [day, setDay] = useState<string>(defDay || 'الاثنين');
  const [time, setTime] = useState<string>(defTime || '09h-11h');

  useEffect(() => {
    if (animGroups.length > 0) setSelectedGroupeId(animGroups[0].id);
    if (defDay) setDay(defDay);
    if (defTime) setTime(defTime);
  }, [animId, defDay, defTime, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time.trim()) return;

    onUpdateDb((prev) => {
      const updatedGroupes = prev.groupes.map((g) => {
        if (g.id === selectedGroupeId) {
          return {
            ...g,
            horaires: {
              ...(g.horaires || {}),
              [day]: time.trim(),
            },
          };
        }
        return g;
      });
      return {
        ...prev,
        groupes: updatedGroupes,
      };
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة حصة إلى جدول الأوقات">
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-slate-600 font-bold mb-1">الفوج والمدرسة</label>
          <select
            value={selectedGroupeId}
            onChange={(e) => setSelectedGroupeId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            {animGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.ecole.replace('ECOLE ', '')} — {g.groupe} ({g.niveauReel || g.niveau})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">اليوم</label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">التوقيت (مثال: 09h-11h)</label>
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="09h-11h"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 dir-ltr text-center"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            حفظ الحصة
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ================= EDIT GROUPE SCHEDULE MODAL =================
export const EditGroupeScheduleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  groupeId: number;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, groupeId, db, onUpdateDb }) => {
  const groupe = db.groupes.find((g) => g.id === groupeId);
  const [slots, setSlots] = useState<Array<{ day: string; time: string }>>([]);

  useEffect(() => {
    if (groupe) {
      const list = Object.entries(groupe.horaires || {}).map(([day, time]) => ({ day, time }));
      setSlots(list);
    }
  }, [groupeId, groupe, isOpen]);

  if (!groupe) return null;

  const handleAddRow = () => {
    setSlots((prev) => [...prev, { day: 'الاثنين', time: '09h-11h' }]);
  };

  const handleRemoveRow = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onUpdateDb((prev) => {
      const newH: Record<string, string> = {};
      slots.forEach((s) => {
        if (s.time.trim()) newH[s.day] = s.time.trim();
      });
      const updatedGroupes = prev.groupes.map((g) =>
        g.id === groupeId ? { ...g, horaires: newH } : g
      );
      return {
        ...prev,
        groupes: updatedGroupes,
      };
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تعديل جدول الحصص — ${groupe.ecole.replace('ECOLE ', '')} ${groupe.groupe}`}
    >
      <div className="space-y-3 text-xs">
        <div className="space-y-2 max-h-[50vh] overflow-y-auto p-1">
          {slots.length === 0 ? (
            <p className="text-center py-4 text-slate-400">لا توجد حصص لهذا الفوج بعد</p>
          ) : (
            slots.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={s.day}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlots((prev) => prev.map((item, i) => (i === idx ? { ...item, day: val } : item)));
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 flex-1"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={s.time}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlots((prev) => prev.map((item, i) => (i === idx ? { ...item, time: val } : item)));
                  }}
                  placeholder="09h-11h"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 flex-1 dir-ltr text-center"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة يوم وحصة جديدة</span>
        </button>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            حفظ التغييرات
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ================= ADD REPORT MODAL =================
export const AddReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, db, onUpdateDb }) => {
  const [animId, setAnimId] = useState<number>(db.animateurs[0]?.id || 1);
  const [type, setType] = useState<'visite' | 'notes' | 'taqrir'>('taqrir');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [text, setText] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('محتوى التقرير مطلوب');
      return;
    }

    onUpdateDb((prev) => {
      const maxId = prev.reports.reduce((m, r) => Math.max(m, r.id), 0);
      const nextRId = Math.max(prev.nextId?.r || 1, maxId + 1);
      const newReport: Report = {
        id: nextRId,
        month: prev.currentMonth,
        type,
        animId,
        date,
        text: text.trim(),
      };
      return {
        ...prev,
        reports: [...prev.reports, newReport],
        nextId: { ...prev.nextId, r: nextRId + 1 },
      };
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة تقرير أو ملاحظة جديدة">
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-slate-600 font-bold mb-1">الأستاذ المعني</label>
          <select
            value={animId}
            onChange={(e) => setAnimId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
          >
            {db.animateurs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom} ({a.zone})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 font-bold mb-1">النوع</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            >
              <option value="taqrir">تقرير</option>
              <option value="visite">زيارة</option>
              <option value="notes">ملاحظات</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">المحتوى التفصيلي</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="أدخل تفاصيل التقرير أو التوصيات التربوية..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 h-24 font-medium text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            حفظ
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ================= GIST SETTINGS MODAL =================
export const GistSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const cfg = getGistCfg();
  const [token, setToken] = useState(cfg.token);
  const [gistId, setGistId] = useState(cfg.gistId);

  useEffect(() => {
    setToken(cfg.token);
    setGistId(cfg.gistId);
  }, [isOpen]);

  const handleSave = () => {
    saveGistCfg(token, gistId);
    alert('✅ تم حفظ إعدادات GitHub Gist!');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ إعدادات GitHub Gist">
      <div className="space-y-3.5 text-xs">
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-blue-900 leading-relaxed font-medium space-y-2">
          <p className="font-bold text-blue-950">🔐 مزامنة سحابية آمنة ومباشرة مع حسابك على GitHub:</p>
          <a
            href="https://github.com/settings/tokens/new?description=SuperviseurPedagogiqueApp&scopes=gist"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-sm transition text-xs"
          >
            <span>🔗 اضغط هنا لإنشاء توكن GitHub جاهز بضغطة زر</span>
          </a>
        </div>

        {/* Step-by-step accordion guide */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-slate-700">
          <p className="font-extrabold text-slate-900 text-[11px] flex items-center gap-1">
            📖 <span>دليل الحصول على التوكن والمعرّف (خطوة بخطوة):</span>
          </p>

          <div className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
            <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-blue-900">1️⃣ الحصول على Personal Access Token:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
                <li>اضغط على الزر الأزرق أعلاه للانتقال لصفحة التوكن في GitHub.</li>
                <li>تأكد من تفعيل خيار <strong className="text-slate-800">gist</strong> (المسؤول عن تخزين الملفات).</li>
                <li>انزل لأسفل الصفحة واضغط <strong className="text-emerald-700">Generate token</strong>.</li>
                <li>انسخ الكود الناتج (يبدأ بـ <code className="bg-slate-100 px-1 rounded text-blue-700 dir-ltr font-mono">ghp_...</code>) والصقه بالأسفل.</li>
              </ol>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-indigo-900">2️⃣ معرف الـ Gist ID (اختياري/تلقائي):</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                <li><strong className="text-emerald-700">تلقائياً:</strong> اترك الخانة فارغة! عند أول عملية "رفع للبيانات"، سينشئ التطبيق Gist جديداً بحسابك ويملأ ID تلقائياً.</li>
                <li><strong className="text-slate-800">يدوياً (للاسترجاع على جهاز آخر):</strong> انسخ المعرّف الموجود في نهاية رابط الـ Gist بـ GitHub (مثال: <span className="font-mono text-[10px] bg-slate-100 p-0.5 rounded">gist.github.com/user/<b>6f8a9b2c...</b></span>).</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">🔑 GitHub Personal Access Token *</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 dir-ltr focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">🆔 Gist ID (يُملأ تلقائياً عند أول رفع)</label>
          <input
            type="text"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            placeholder="سيتم إنشاؤه وتعبئته تلقائياً عند الرفع الأول"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 dir-ltr focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ================= CLOUD SETTINGS MODAL =================
export const CloudSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const cfg = getCloudCfg();
  const [cloudName, setCloudName] = useState(cfg.cloudName || '');
  const [uploadPreset, setUploadPreset] = useState(cfg.uploadPreset || '');

  useEffect(() => {
    setCloudName(cfg.cloudName || '');
    setUploadPreset(cfg.uploadPreset || '');
  }, [isOpen]);

  const handleSave = () => {
    saveCloudCfg({ cloudName: cloudName.trim(), uploadPreset: uploadPreset.trim() });
    alert('✅ تم حفظ إعدادات Cloudinary!');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ إعداد حساب Cloudinary">
      <div className="space-y-3.5 text-xs">
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-blue-900 leading-relaxed font-medium">
          1️⃣ أنشئ حساباً مجانياً على <b>cloudinary.com</b><br />
          2️⃣ اذهب إلى Settings → Upload → Add upload preset<br />
          3️⃣ اختر <b>Unsigned</b> واحفظ اسم الـ preset<br />
          4️⃣ انسخ <b>Cloud Name</b> من لوحة التحكم
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Cloud Name</label>
          <input
            type="text"
            value={cloudName}
            onChange={(e) => setCloudName(e.target.value)}
            placeholder="مثال: my-cloud-123"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 dir-ltr"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1">Upload Preset (Unsigned)</label>
          <input
            type="text"
            value={uploadPreset}
            onChange={(e) => setUploadPreset(e.target.value)}
            placeholder="مثال: ml_default"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 dir-ltr"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer"
          >
            حفظ
          </button>
        </div>
      </div>
    </Modal>
  );
};

import { updateCurrentSupervisorAccount, getActiveAccountId } from '../utils/accounts';

// ================= SUPERVISOR PROFILE & DATA RESET MODAL =================
export const SupervisorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  db: AppData;
  onUpdateDb: (updater: (prev: AppData) => AppData) => void;
}> = ({ isOpen, onClose, db, onUpdateDb }) => {
  const sup = db.supervisor || INITIAL_SUPERVISOR;
  const [nom, setNom] = useState(sup.nom || '');
  const [project, setProject] = useState(sup.project || '');
  const [region, setRegion] = useState(sup.region || '');
  const [province, setProvince] = useState(sup.province || '');
  const [password, setPassword] = useState(sup.password || '123456');

  useEffect(() => {
    if (db.supervisor) {
      setNom(db.supervisor.nom || '');
      setProject(db.supervisor.project || '');
      setRegion(db.supervisor.region || '');
      setProvince(db.supervisor.province || '');
      setPassword(db.supervisor.password || '123456');
    }
  }, [isOpen, db.supervisor]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedNom = nom.trim() || 'المشرف التربوي';
    const updatedPass = password.trim() || '123456';
    const updatedProj = project.trim();
    const updatedReg = region.trim();
    const updatedProv = province.trim();

    updateCurrentSupervisorAccount(getActiveAccountId(), {
      nom: updatedNom,
      password: updatedPass,
      project: updatedProj,
      region: updatedReg,
      province: updatedProv,
    });

    onUpdateDb((prev) => ({
      ...prev,
      supervisor: {
        nom: updatedNom,
        project: updatedProj,
        region: updatedReg,
        province: updatedProv,
        password: updatedPass,
      },
    }));
    alert('✅ تم حفظ معلومات وحساب المشرف التربوي بنجاح!');
    onClose();
  };

  const handleResetData = () => {
    if (
      confirm(
        '⚠️ هل أنت أكتيد من مسح جميع البيانات الحالية والبدء بمشروع تأطيري جديد؟\nسيتم حذف الأساتذة والأفواج والتقارير الحالية.'
      )
    ) {
      onUpdateDb((prev) => ({
        ...prev,
        supervisor: {
          nom: nom.trim() || 'المشرف التربوي',
          project: project.trim(),
          region: region.trim(),
          province: province.trim(),
        },
        animateurs: [],
        ecoles: [],
        groupes: [],
        reports: [],
        nextId: { a: 1, e: 1, g: 1, r: 1 },
      }));
      alert('🗑️ تم مسح كافة البيانات وتفريغ التطبيق لاستعمالك الشخصي!');
      onClose();
    }
  };

  const handleLoadDemoData = () => {
    if (confirm('📥 هل تريد تحميل نموذج بيانات تجريبية لتجربة التطبيق؟')) {
      onUpdateDb(() => ({ ...DEMO_SAMPLE_DATA }));
      alert('✅ تم تحميل البيانات التجريبية بنجاح!');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👤 حساب المشرف التربوي وإعدادات المشروع">
      <form onSubmit={handleSave} className="space-y-3.5 text-xs">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-2xl text-blue-900 leading-relaxed font-medium">
          أهلاً بك! يمكنك هنا إدخال معلوماتك الشخصية واسم مشروعك والجهة والإقليم لتطبيق التقرير ولوحة القيادة على عملك الخاص.
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">اسم المشرف التربوي *</label>
          <input
            type="text"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="اسم المشرف التربوي"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">اسم المشروع / البرنامج</label>
          <input
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="اسم المشروع التربوي"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-700 font-bold mb-1">الجهة / الأكاديمية</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="الجهة / الأكاديمية"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">الإقليم / المديرية</label>
            <input
              type="text"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="المديرية الإقليمية"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">🔑 كلمة مرور دخول المشرف *</label>
          <input
            type="text"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور للدخول (الافتراضية: 123456)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-[10px] text-slate-500 mt-1">تُستخدم كلمة المرور هذه للتحقق وتسجيل دخول المشرف لحسابه في هذا الجهاز.</p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold py-3 rounded-xl shadow cursor-pointer text-sm"
          >
            💾 حفظ معلومات الحساب والمشروع
          </button>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetData}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 rounded-xl cursor-pointer transition text-xs"
            >
              🗑️ مسح جميع البيانات (بدء جديد)
            </button>

            <button
              type="button"
              onClick={handleLoadDemoData}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer transition text-xs"
            >
              📥 تحميل نموذج بيانات تجريبي
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

