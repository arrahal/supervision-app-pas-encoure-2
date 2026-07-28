import { AppData, SupervisorInfo } from '../types';

export const MONTHS_AR: Record<number, string> = {
  1: 'يناير',
  2: 'فبراير',
  3: 'مارس',
  4: 'أبريل',
  5: 'ماي',
  6: 'يونيو',
  7: 'يوليوز',
  8: 'غشت',
  9: 'سبتمبر',
  10: 'أكتوبر',
  11: 'نونبر',
  12: 'دجنبر',
};

export const CRITERIA: string[] = [
  'المظهر العام',
  'النظافة',
  'الانضباط',
  'احترام الوقت',
  'التحضير',
  'العلاقة مع الأطفال',
  'تحقيق الأهداف',
  'التقييم',
  'الابتكار',
  'المقاربة البيداغوجية',
  'مشاركة التلاميذ',
  'تصحيح الأخطاء',
  'إنجاز الأهداف',
  'إعادة توظيف المكتسبات',
];

export const DAYS: string[] = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ZONES: string[] = ['المنطقة 1', 'المنطقة 2', 'المنطقة 3', 'المنطقة 4'];

export const INITIAL_SUPERVISOR: SupervisorInfo = {
  nom: 'المشرف التربوي',
  project: 'برنامج الدعم التربوي والتأطير',
  region: 'جهة مراكش آسفي',
  province: 'المديرية الإقليمية',
};

export const INITIAL_DATA: AppData = {
  supervisor: { ...INITIAL_SUPERVISOR },
  currentMonth: new Date().getMonth() + 1,
  animateurs: [],
  ecoles: [],
  groupes: [],
  reports: [],
  nextId: { a: 1, e: 1, g: 1, r: 1 },
};

// Sample demo data if supervisor wishes to populate with demo records
export const DEMO_SAMPLE_DATA: AppData = {
  supervisor: {
    nom: 'أحمد العلمي',
    project: 'مشروع الدعم والارتقاء بالتأطير التربوي',
    region: 'جهة مراكش آسفي',
    province: 'مديرية مراكش',
  },
  currentMonth: new Date().getMonth() + 1,
  animateurs: [
    { id: 1, nom: 'خالد الكرامي', tel: '0661000001', zone: 'المنطقة الأولى', notes: 'ممتاز في التواصل', scores: { 1: 5, 2: 5, 3: 4 }, visits: 1 },
    { id: 2, nom: 'مريم الناصري', tel: '0661000002', zone: 'المنطقة الثانية', notes: 'التزام تام بالمواعيد', scores: { 1: 4, 2: 5 }, visits: 1 },
  ],
  ecoles: [
    { id: 1, nom: 'مدرسة المسيرة الخضراء', commune: 'الجماعة المركزية', groupes: ['G1', 'G2'], province: 'المديرية الإقليمية', notes: '' },
    { id: 2, nom: 'مدرسة النور', commune: 'المنطقة الثانية', groupes: ['G3'], province: 'المديرية الإقليمية', notes: '' },
  ],
  groupes: [
    { id: 1, ecole: 'مدرسة المسيرة الخضراء', groupe: 'G1', animId: 1, eff: 22, filles: 12, garcons: 10, absences: 2, jt: 6, niveau: '5 AEP', niveauReel: '5 AEP', horaires: { 'الاثنين': '09h-11h', 'الاربعاء': '14h-16h' }, visits: 1 },
    { id: 2, ecole: 'مدرسة المسيرة الخضراء', groupe: 'G2', animId: 1, eff: 20, filles: 10, garcons: 10, absences: 1, jt: 6, niveau: '6 AEP', niveauReel: '6 AEP', horaires: { 'الثلاثاء': '10h-12h' }, visits: 0 },
    { id: 3, ecole: 'مدرسة النور', groupe: 'G3', animId: 2, eff: 25, filles: 13, garcons: 12, absences: 3, jt: 8, niveau: '4 AEP', niveauReel: '4 AEP', horaires: { 'الخميس': '09h-11h' }, visits: 1 },
  ],
  reports: [
    { id: 1, month: new Date().getMonth() + 1, type: 'visite', animId: 1, groupeId: 1, date: new Date().toISOString().split('T')[0], text: 'زيارة تفقدية وإيجابية للفوج الأول.' }
  ],
  nextId: { a: 3, e: 3, g: 4, r: 2 },
};
