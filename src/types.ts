export interface SupervisorInfo {
  nom: string;
  project: string;
  region: string;
  province: string;
  password?: string;
}

export interface Animateur {
  id: number;
  nom: string;
  tel: string;
  region?: string;
  province?: string;
  commune?: string;
  zone: string;
  dateContrat?: string; // تاريخ العقد
  diplome?: string;     // الإجازة / المؤهل الدراسي
  age?: number | string; // العمر
  notes: string;
  gpsUrl?: string; // رابط الموقع الجغرافي
  scores: Record<number, number>;
  visits: number;
}

export interface Ecole {
  id: number;
  nom: string;
  region?: string;
  province: string;
  commune: string;
  animId?: number;     // الأستاذ المؤطر المسند
  animNom?: string;
  groupes: string[];
  notes: string;
  gpsUrl?: string; // رابط الموقع الجغرافي
}

export interface Groupe {
  id: number;
  ecole: string;
  groupe: string; // e.g., فوج 1 .. فوج 8
  animId: number;
  eff: number;
  filles: number;
  garcons: number;
  absences: number;
  jt?: number;
  niveau: string;
  niveauReel?: string;
  horaires: Record<string, string>;
  visits?: number;
}

export interface Report {
  id: number;
  month: number;
  type: 'visite' | 'notes' | 'taqrir';
  animId: number;
  groupeId?: number;
  date: string;
  text: string;
}

export interface DocumentFile {
  name: string;
  type: string;
  url?: string;
  data?: string;
  publicId?: string;
  animId?: number | null;
  ecoleId?: number | null;
  desc?: string;
  date: string;
}

export interface MonthGroupSnapshot {
  id: number;
  absences: number;
  visits: number;
}

export interface MonthAnimScoreSnapshot {
  id: number;
  scores: Record<number, number>;
  visits?: number;
}

export interface MonthSnapshot {
  groupes: MonthGroupSnapshot[];
  animScores: MonthAnimScoreSnapshot[];
  students?: StudentRecord[];
  inqitaat?: InqitaaRecord[];
  absencesList?: AbsenceRecord[];
  visitsList?: VisitRecord[];
  reports?: Report[];
}

export interface StudentRecord {
  id: number;
  code?: string; // كود التلميذ (مثال: E1...)
  nom: string;
  sexe: 'F' | 'M';
  dateNaissance?: string; // تاريخ الازدياد
  groupeId: number;
  groupeNom?: string;
  ecoleNom: string;
  month?: number; // الشهر
  dateInscription: string;
  parentTel?: string;
  status: 'actif' | 'inqitaa' | 'transfere';
  notes?: string;
}

export interface InqitaaRecord {
  id: number;
  code?: string; // كود التلميذ
  studentNom: string;
  sexe: 'F' | 'M';
  groupeId: number;
  groupeNom?: string;
  ecoleNom: string;
  age?: number | string; // العمر
  parentTel?: string; // رقم هاتف ولي الأمر
  month?: number; // الشهر
  dateInqitaa: string;
  cause: string; // سبب الانقطاع *
  actionsMowakaba?: string; // إجراءات المواكبة المزمعة
  status: 'monqatia' | 'irjaa' | 'mowataba';
  dateIrjaa?: string;
  notes?: string;
}

export interface AbsenceRecord {
  id: number;
  ecoleNom: string;
  groupeNom: string;
  groupeId?: number;
  studentCode: string; // كود التلميذ
  studentNom?: string;
  date: string;
  cause: string; // سبب الغياب
  month: number;
}

export interface VisitRecord {
  id: number;
  animId: number;
  ecoleNom?: string;
  groupeId?: number;
  date: string;
  scores: Record<number, number>;
  notes: string;
  recommandations?: string;
  gpsUrl?: string; // رابط الموقع الجغرافي للزيارة
  month: number;
}

export interface AppData {
  supervisor: SupervisorInfo;
  currentMonth: number;
  animateurs: Animateur[];
  ecoles: Ecole[];
  groupes: Groupe[];
  reports: Report[];
  students?: StudentRecord[];
  inqitaat?: InqitaaRecord[];
  absencesList?: AbsenceRecord[];
  visitsList?: VisitRecord[];
  nextId: {
    a: number;
    e: number;
    g: number;
    r: number;
    st?: number;
    inq?: number;
    abs?: number;
    v?: number;
  };
  monthData?: Record<string, MonthSnapshot>;
}

export interface CloudConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface GistConfig {
  token: string;
  gistId: string;
  lastPush?: string;
}

export type TabType = 'home' | 'animateurs' | 'ecoles' | 'schedule' | 'visits' | 'absences' | 'pupils' | 'reports';
export type ReportSubTab = 'synthese' | 'visites' | 'absences' | 'notes' | 'docs' | 'partage';

