import { AppData, DocumentFile, CloudConfig, GistConfig } from '../types';
import { INITIAL_DATA, INITIAL_SUPERVISOR, MONTHS_AR } from '../data/initialData';

const STORAGE_KEY = 'supPed2';
const CLOUD_CFG_KEY = 'cloudinary_cfg';
const GIST_TOKEN_KEY = 'gist_token';
const GIST_ID_KEY = 'gist_id';
const GIST_LAST_PUSH_KEY = 'gist_last_push';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const copy = JSON.parse(JSON.stringify(INITIAL_DATA)) as AppData;
      if (!copy.monthData) copy.monthData = {};
      if (!copy.supervisor) copy.supervisor = { ...INITIAL_SUPERVISOR };
      return copy;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.monthData) parsed.monthData = {};
    if (!parsed.supervisor) parsed.supervisor = { ...INITIAL_SUPERVISOR };
    if (!parsed.supervisor.password) parsed.supervisor.password = '123456';
    
    // Deduplicate animateurs and ecoles if duplicate entries exist in storage
    const seenAnimKeys = new Set<string>();
    const uniqueAnimateurs = (parsed.animateurs || []).filter((a) => {
      const key = `${a.nom.trim().toLowerCase()}_${a.tel.trim()}_${a.zone}`;
      if (seenAnimKeys.has(key)) return false;
      seenAnimKeys.add(key);
      return true;
    });

    const seenEcoleKeys = new Set<string>();
    const uniqueEcoles = (parsed.ecoles || []).filter((e) => {
      const key = `${e.nom.trim().toLowerCase()}_${e.commune.trim().toLowerCase()}`;
      if (seenEcoleKeys.has(key)) return false;
      seenEcoleKeys.add(key);
      return true;
    });

    return {
      ...parsed,
      animateurs: uniqueAnimateurs,
      ecoles: uniqueEcoles,
    };
  } catch (e) {
    console.error('Failed to parse localStorage data', e);
    const copy = JSON.parse(JSON.stringify(INITIAL_DATA)) as AppData;
    if (!copy.monthData) copy.monthData = {};
    if (!copy.supervisor) copy.supervisor = { ...INITIAL_SUPERVISOR };
    return copy;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export function saveMonthSnapshot(data: AppData, month: number): AppData {
  const key = `m${month}`;
  const existingMonthData = data.monthData || {};

  const updatedMonthData = {
    ...existingMonthData,
    [key]: {
      groupes: data.groupes.map((g) => ({
        id: g.id,
        absences: g.absences || 0,
        visits: g.visits || 0,
      })),
      animScores: data.animateurs.map((a) => ({
        id: a.id,
        scores: JSON.parse(JSON.stringify(a.scores || {})),
        visits: a.visits || 0,
      })),
      students: data.students ? JSON.parse(JSON.stringify(data.students)) : [],
      inqitaat: data.inqitaat ? JSON.parse(JSON.stringify(data.inqitaat)) : [],
      absencesList: data.absencesList ? JSON.parse(JSON.stringify(data.absencesList)) : [],
      visitsList: data.visitsList ? JSON.parse(JSON.stringify(data.visitsList)) : [],
      reports: data.reports ? JSON.parse(JSON.stringify(data.reports)) : [],
    },
  };

  const updated: AppData = {
    ...data,
    monthData: updatedMonthData,
  };

  saveData(updated);
  return updated;
}

export function loadMonthSnapshot(data: AppData, month: number): AppData {
  const key = `m${month}`;
  const snap = (data.monthData || {})[key];

  let updatedGroupes = data.groupes;
  let updatedAnimateurs = data.animateurs;
  let loadedStudents: any[] = [];
  let loadedInqitaat: any[] = [];
  let loadedAbsencesList: any[] = [];
  let loadedVisitsList: any[] = [];
  let loadedReports: any[] = [];

  if (snap) {
    if (snap.groupes) {
      const snapGroupesMap = new Map(snap.groupes.map((sg) => [sg.id, sg]));
      updatedGroupes = data.groupes.map((g) => {
        const sg = snapGroupesMap.get(g.id);
        if (sg) {
          return { ...g, absences: sg.absences ?? 0, visits: sg.visits ?? 0 };
        }
        return { ...g, absences: 0, visits: 0 };
      });
    }
    if (snap.animScores) {
      const snapAnimMap = new Map(snap.animScores.map((sa) => [sa.id, sa]));
      updatedAnimateurs = data.animateurs.map((a) => {
        const sa = snapAnimMap.get(a.id);
        if (sa) {
          return {
            ...a,
            scores: JSON.parse(JSON.stringify(sa.scores || {})),
            visits: sa.visits ?? 0,
          };
        }
        return { ...a, scores: {}, visits: 0 };
      });
    }
    loadedStudents = snap.students || [];
    loadedInqitaat = snap.inqitaat || [];
    loadedAbsencesList = snap.absencesList || [];
    loadedVisitsList = snap.visitsList || [];
    loadedReports = snap.reports || [];
  } else {
    // Fresh snapshot for new month
    updatedGroupes = data.groupes.map((g) => ({ ...g, absences: 0, visits: 0 }));
    updatedAnimateurs = data.animateurs.map((a) => ({ ...a, scores: {}, visits: 0 }));
    loadedStudents = (data.students || []).filter((s) => s.month === month);
    loadedInqitaat = (data.inqitaat || []).filter((i) => i.month === month);
    loadedAbsencesList = (data.absencesList || []).filter((a) => a.month === month);
    loadedVisitsList = (data.visitsList || []).filter((v) => v.month === month);
    loadedReports = (data.reports || []).filter((r) => r.month === month);
  }

  const updated: AppData = {
    ...data,
    currentMonth: month,
    animateurs: updatedAnimateurs, // Teachers retained across all months
    ecoles: data.ecoles,           // Schools retained across all months
    groupes: updatedGroupes,       // Group structures & student count (eff) retained across all months
    students: loadedStudents,
    inqitaat: loadedInqitaat,
    absencesList: loadedAbsencesList,
    visitsList: loadedVisitsList,
    reports: loadedReports,
    monthData: data.monthData || {},
  };

  saveData(updated);
  return updated;
}

// Documents
export function getMonthDocs(month: number): DocumentFile[] {
  try {
    const raw = localStorage.getItem(`supPedDocs_m${month}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveMonthDocs(month: number, docs: DocumentFile[]): void {
  try {
    localStorage.setItem(`supPedDocs_m${month}`, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save docs', e);
  }
}

export function getAllDocs(): Record<string, DocumentFile[]> {
  const all: Record<string, DocumentFile[]> = {};
  for (let m = 1; m <= 12; m++) {
    const docs = getMonthDocs(m);
    if (docs.length > 0) {
      all[`m${m}`] = docs;
    }
  }
  return all;
}

export function restoreAllDocs(all: Record<string, DocumentFile[]>): void {
  if (!all || typeof all !== 'object') return;
  Object.keys(all).forEach((key) => {
    const m = parseInt(key.replace('m', ''), 10);
    if (m >= 1 && m <= 12 && Array.isArray(all[key])) {
      saveMonthDocs(m, all[key]);
    }
  });
}

// Cloudinary
export function getCloudCfg(): CloudConfig {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_CFG_KEY) || '{}');
  } catch (e) {
    return { cloudName: '', uploadPreset: '' };
  }
}

export function saveCloudCfg(cfg: CloudConfig): void {
  localStorage.setItem(CLOUD_CFG_KEY, JSON.stringify(cfg));
}

// Gist Config
export function getGistCfg(): GistConfig {
  return {
    token: localStorage.getItem(GIST_TOKEN_KEY) || '',
    gistId: localStorage.getItem(GIST_ID_KEY) || '',
    lastPush: localStorage.getItem(GIST_LAST_PUSH_KEY) || undefined,
  };
}

export function saveGistCfg(token: string, gistId: string): void {
  localStorage.setItem(GIST_TOKEN_KEY, token.trim());
  localStorage.setItem(GIST_ID_KEY, gistId.trim());
}

export function setGistLastPush(isoDate: string): void {
  localStorage.setItem(GIST_LAST_PUSH_KEY, isoDate);
}

// Download Word Report (.doc)
export function downloadWordReport(db: AppData, month: number): void {
  const monthName = MONTHS_AR[month] || `شهر ${month}`;
  const totalEff = db.groupes.reduce((a, g) => a + g.eff, 0);
  const totalAbs = db.groupes.reduce((a, g) => a + g.absences, 0);
  const tauxAbs = totalEff > 0 ? Math.round((totalAbs / totalEff) * 100) : 0;
  const totalVisits = db.animateurs.reduce((a, an) => {
    return a + db.groupes.filter((g) => g.animId === an.id).reduce((s, g) => s + (g.visits || 0), 0);
  }, 0);
  const animVisited = db.animateurs.filter((an) =>
    db.groupes.filter((g) => g.animId === an.id).some((g) => (g.visits || 0) > 0)
  ).length;
  const tauxVisite = db.animateurs.length > 0 ? Math.round((animVisited / db.animateurs.length) * 100) : 0;
  const monthReports = db.reports.filter((r) => r.month === month);

  const animRows = db.animateurs
    .map((a) => {
      const gs = db.groupes.filter((g) => g.animId === a.id);
      const visits = gs.reduce((s, g) => s + (g.visits || 0), 0);
      const eff = gs.reduce((s, g) => s + g.eff, 0);
      const abs = gs.reduce((s, g) => s + g.absences, 0);
      const taux = eff > 0 ? Math.round((abs / eff) * 100) : 0;
      const scoreVals = Object.values(a.scores || {});
      const avgScore = scoreVals.length
        ? (Math.round((scoreVals.reduce((x, y) => x + y, 0) / scoreVals.length) * 10) / 10).toFixed(1)
        : '-';
      const visitRelated = db.reports.filter((r) => r.animId === a.id && r.month === month && r.type === 'visite');
      const visitDates = visitRelated.map((r) => r.date).join('، ') || (visits > 0 ? 'مسجلة' : '-');

      return `<tr style="border-bottom:1px solid #ddd">
      <td style="padding:8px 6px;font-size:12px;border:1px solid #ccc;font-weight:600">${a.nom}</td>
      <td style="padding:8px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${a.zone}</td>
      <td style="padding:8px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${gs.length}</td>
      <td style="padding:8px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${eff}</td>
      <td style="padding:8px 6px;font-size:12px;border:1px solid #ccc;text-align:center;color:${visits > 0 ? '#2E7D32' : '#C62828'};font-weight:700">${visits}</td>
      <td style="padding:8px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${visitDates}</td>
      <td style="padding:8px 6px;font-size:12px;border:1px solid #ccc;text-align:center;color:${taux > 20 ? '#C62828' : taux > 10 ? '#E65100' : '#2E7D32'}">${abs} (${taux}%)</td>
      <td style="padding:8px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${avgScore}</td>
    </tr>`;
    })
    .join('');

  const sup = db.supervisor || {
    nom: 'المشرف التربوي',
    project: 'مشروع الدعم التربوي',
    region: 'الجهة',
    province: 'المديرية الإقليمية',
  };

  const dynamicZones = Array.from(
    new Set(
      [
        ...db.animateurs.map((a) => a.zone),
        ...db.ecoles.map((e) => e.commune || e.province),
      ].filter(Boolean)
    )
  );
  const zonesToReport = dynamicZones.length > 0 ? dynamicZones : ['المنطقة العامة'];

  const zoneRows = zonesToReport
    .map((zone) => {
      const anims = db.animateurs.filter((a) => a.zone === zone);
      const visited = anims.filter((a) => db.groupes.filter((g) => g.animId === a.id).some((g) => (g.visits || 0) > 0)).length;
      const zEff = db.groupes.filter((g) => anims.some((a) => a.id === g.animId)).reduce((s, g) => s + g.eff, 0);
      const zAbs = db.groupes.filter((g) => anims.some((a) => a.id === g.animId)).reduce((s, g) => s + g.absences, 0);
      const zTaux = zEff > 0 ? Math.round((zAbs / zEff) * 100) : 0;
      const pct = anims.length ? Math.round((visited / anims.length) * 100) : 0;

      return `<tr>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;font-weight:600">${zone}</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${anims.length}</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${visited}/${anims.length} (${pct}%)</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${zEff}</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;text-align:center;color:${zTaux > 15 ? '#C62828' : '#2E7D32'}">${zAbs} (${zTaux}%)</td>
    </tr>`;
    })
    .join('');

  const topAbsentGroups = [...db.groupes]
    .sort((a, b) => b.absences - a.absences)
    .filter((g) => g.absences > 0)
    .slice(0, 10)
    .map((g) => {
      const anim = db.animateurs.find((a) => a.id === g.animId);
      const taux = g.eff > 0 ? Math.round((g.absences / g.eff) * 100) : 0;
      return `<tr>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc">${g.ecole.replace('ECOLE ', '')}</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${g.groupe}</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc">${anim ? anim.nom.split(' ')[0] : '—'}</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${g.eff}</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;text-align:center;color:${taux > 20 ? '#C62828' : '#E65100'};font-weight:700">${g.absences}</td>
      <td style="padding:7px 6px;font-size:12px;border:1px solid #ccc;text-align:center">${taux}%</td>
    </tr>`;
    })
    .join('');

  const notesSection =
    monthReports.length > 0
      ? `
    <h3 style="color:#1565C0;border-bottom:2px solid #1565C0;padding-bottom:4px;margin-top:30px">4. الملاحظات والتقارير</h3>
    ${monthReports
      .map((r) => {
        const a = db.animateurs.find((x) => x.id === r.animId);
        const typeLabel = r.type === 'visite' ? 'زيارة' : r.type === 'notes' ? 'ملاحظة' : 'تقرير';
        return `<div style="border-right:4px solid #1565C0;padding:10px 14px;margin-bottom:10px;background:#f8f9fa;border-radius:4px">
        <div style="font-weight:700;font-size:13px;color:#1565C0">[${typeLabel}] ${a ? a.nom : ''} — ${r.date || ''}</div>
        <div style="font-size:12px;margin-top:6px;color:#333">${r.text || ''}</div>
      </div>`;
      })
      .join('')}`
      : '';

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  body{font-family:'Arial',sans-serif;margin:40px;color:#222;direction:rtl;font-size:13px;line-height:1.6}
  .header-box{background:#1565C0;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px;text-align:center}
  .header-box h1{font-size:20px;margin:0 0 4px;letter-spacing:1px}
  .header-box p{margin:0;font-size:13px;opacity:.9}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
  .stat-box{border:2px solid #1565C0;border-radius:8px;padding:14px;text-align:center}
  .stat-box .val{font-size:28px;font-weight:800;color:#1565C0}
  .stat-box .lbl{font-size:11px;color:#555;margin-top:3px}
  h3{color:#1565C0;border-bottom:2px solid #1565C0;padding-bottom:4px;margin-top:28px;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#1565C0;color:#fff;padding:9px 6px;font-size:12px;border:1px solid #ccc;text-align:center}
  tr:nth-child(even){background:#f0f4f8}
  .footer{margin-top:40px;border-top:2px solid #1565C0;padding-top:12px;text-align:center;font-size:11px;color:#888}
</style>
</head>
<body>
<div class="header-box">
  <h1>التقرير الشهري — ${sup.project}</h1>
  <p>${sup.region} · ${sup.province} · المشرف التربوي: ${sup.nom}</p>
  <p style="margin-top:6px;font-size:14px;font-weight:700">شهر ${monthName} ${new Date().getFullYear()}</p>
</div>

<div class="stats-grid">
  <div class="stat-box">
    <div class="val">${totalVisits}</div>
    <div class="lbl">زيارة مُنجزة</div>
  </div>
  <div class="stat-box" style="border-color:#C62828">
    <div class="val" style="color:#C62828">${totalAbs}</div>
    <div class="lbl">غياب إجمالي (${tauxAbs}%)</div>
  </div>
  <div class="stat-box" style="border-color:#2E7D32">
    <div class="val" style="color:#2E7D32">${tauxVisite}%</div>
    <div class="lbl">نسبة تغطية الزيارات</div>
  </div>
  <div class="stat-box" style="border-color:#E65100">
    <div class="val" style="color:#E65100">${totalEff}</div>
    <div class="lbl">إجمالي التلاميذ</div>
  </div>
</div>

<h3>1. ملخص الإنجاز حسب المنطقة</h3>
<table>
  <tr>
    <th>المنطقة</th>
    <th>عدد الأساتذة</th>
    <th>الزيارات المنجزة</th>
    <th>التلاميذ</th>
    <th>الغياب</th>
  </tr>
  ${zoneRows}
</table>

<h3>2. تفصيل الزيارات والغياب حسب الأستاذ</h3>
<table>
  <tr>
    <th>اسم الأستاذ</th>
    <th>المنطقة</th>
    <th>الأفواج</th>
    <th>التلاميذ</th>
    <th>الزيارات</th>
    <th>تاريخ الزيارة</th>
    <th>الغياب</th>
    <th>التقييم</th>
  </tr>
  ${animRows}
</table>

<h3>3. الأفواج الأكثر غياباً</h3>
<table>
  <tr>
    <th>المدرسة</th>
    <th>الفوج</th>
    <th>الأستاذ</th>
    <th>التلاميذ</th>
    <th>الغياب</th>
    <th>النسبة</th>
  </tr>
  ${topAbsentGroups}
</table>

${notesSection}

<div class="footer">
  تم إنجاز هذا التقرير بتاريخ ${new Date().toLocaleDateString('ar-MA')} · المشرف التربوي: ${sup.nom} · ${sup.project}
</div>
</body></html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير_شهر_${monthName}_${sup.nom.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
