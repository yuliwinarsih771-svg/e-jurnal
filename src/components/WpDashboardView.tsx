import React, { useState, useMemo } from 'react';
import {
  Plus,
  Maximize2,
  Minimize2,
  ArrowRight,
  Trash2,
  BarChart3,
  FileText,
  Printer,
  BellRing,
  ChevronRight,
} from 'lucide-react';
import {
  Pegawai,
  KegiatanJurnal,
  PengaturanInstansi,
  PresensiRecord,
  PengingatJurnal,
} from '../types';

interface WpDashboardViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  kegiatanList: KegiatanJurnal[];
  presensiList?: PresensiRecord[];
  pengingatList?: PengingatJurnal[];
  pengaturan: PengaturanInstansi;
  onNavigateToTab: (tab: string) => void;
  onAddQuickDraft: (kegiatan: string, outputHasil: string) => Promise<void>;
  onDeleteKegiatan: (id: string) => void;
  onOpenJurnalModal: () => void;
}

const getTodayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calcDurationHours = (mulai?: string, selesai?: string): number => {
  if (!mulai || !selesai) return 0;
  const [mH, mM] = mulai.split(':').map(Number);
  const [sH, sM] = selesai.split(':').map(Number);
  if (Number.isNaN(mH) || Number.isNaN(mM) || Number.isNaN(sH) || Number.isNaN(sM)) return 0;
  const diff = sH * 60 + sM - (mH * 60 + mM);
  return diff > 0 ? diff / 60 : 0;
};

const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const parseIsoDateLocal = (iso?: string): Date | null => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const toIsoDateLocal = (dt: Date): string => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getWeekMonday = (dt: Date): Date => {
  const copy = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const day = copy.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMon);
  return copy;
};

const formatWeekShortRange = (monday: Date): string => {
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const d1 = String(monday.getDate()).padStart(2, '0');
  const d2 = String(sunday.getDate()).padStart(2, '0');
  const m1 = MONTHS_SHORT_ID[monday.getMonth()];
  const m2 = MONTHS_SHORT_ID[sunday.getMonth()];
  if (monday.getMonth() === sunday.getMonth()) {
    return `${d1}–${d2} ${m1}`;
  }
  return `${d1} ${m1}–${d2} ${m2}`;
};

const formatWeekFullRange = (monday: Date): string => {
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const d1 = String(monday.getDate()).padStart(2, '0');
  const d2 = String(sunday.getDate()).padStart(2, '0');
  const m1 = MONTHS_SHORT_ID[monday.getMonth()];
  const m2 = MONTHS_SHORT_ID[sunday.getMonth()];
  if (monday.getFullYear() === sunday.getFullYear()) {
    return `${d1} ${m1} – ${d2} ${m2} ${sunday.getFullYear()}`;
  }
  return `${d1} ${m1} ${monday.getFullYear()} – ${d2} ${m2} ${sunday.getFullYear()}`;
};

interface MetricTripleItem {
  label: string;
  actual: string | number;
  target: string | number;
  ratio: number; // 0 to 100
}

interface SubObjectiveCell {
  title: string;
  actual: string | number;
  target: string | number;
  ratio: number; // 0 to 100
}

const ProgressBarMicro: React.FC<{ ratio: number; color?: 'cyan' | 'amber' | 'emerald' }> = ({
  ratio,
  color = 'cyan',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(ratio)));
  const fillClass =
    color === 'amber'
      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.65)]'
      : color === 'emerald'
        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]'
        : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]';
  return (
    <div className="w-full h-[3px] bg-sky-950/90 rounded-full overflow-hidden mt-1.5">
      <div className={`h-full transition-all duration-300 ${fillClass}`} style={{ width: `${clamped}%` }} />
    </div>
  );
};

/* ============================================================================
   HOLOGRAPHIC STAGE SVG ILLUSTRATIONS (MATCHING 4 COMMAND CARDS)
   ============================================================================ */

const HoloJurnalChartStage: React.FC = () => (
  <div className="relative flex flex-col items-center justify-end h-28 select-none">
    <svg viewBox="0 0 180 105" className="w-40 h-26 drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
      <defs>
        <linearGradient id="stageGlow1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="barWarm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* Perspective glowing pedestal */}
      <polygon points="10,96 36,72 144,72 170,96" fill="url(#stageGlow1)" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.8" />
      <line x1="16" y1="93" x2="164" y2="93" stroke="#22d3ee" strokeWidth="1.8" strokeOpacity="0.85" />
      {/* Back holographic frame */}
      <rect x="44" y="14" width="92" height="62" rx="4" fill="#071a38" fillOpacity="0.7" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.55" />
      {/* Histogram bars */}
      <rect x="52" y="50" width="7" height="22" fill="url(#barCyan)" rx="1" />
      <rect x="63" y="38" width="7" height="34" fill="url(#barCyan)" rx="1" />
      <rect x="74" y="30" width="7" height="42" fill="url(#barWarm)" rx="1" />
      <rect x="85" y="24" width="7" height="48" fill="url(#barCyan)" rx="1" />
      <rect x="96" y="34" width="7" height="38" fill="url(#barWarm)" rx="1" />
      <rect x="107" y="42" width="7" height="30" fill="url(#barCyan)" rx="1" />
      <rect x="118" y="48" width="7" height="24" fill="url(#barWarm)" rx="1" />
      {/* Trend curve */}
      <polyline
        points="54,52 66,40 78,28 88,22 100,34 111,42 124,48"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="1.8"
      />
      <circle cx="88" cy="22" r="2.8" fill="#fb923c" />
      <circle cx="111" cy="42" r="2.2" fill="#38bdf8" />
    </svg>
  </div>
);

const HoloProductivityStage: React.FC = () => (
  <div className="relative flex flex-col items-center justify-end h-28 select-none">
    <svg viewBox="0 0 180 105" className="w-40 h-26 drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
      <defs>
        <linearGradient id="stageGlow2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Perspective platform */}
      <polygon points="10,96 36,72 144,72 170,96" fill="url(#stageGlow2)" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.8" />
      <line x1="16" y1="93" x2="164" y2="93" stroke="#22d3ee" strokeWidth="1.8" strokeOpacity="0.85" />
      {/* Briefcase / Console outline */}
      <path d="M76,18 L104,18 L104,24 L76,24 Z" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.7" />
      <rect x="44" y="24" width="92" height="54" rx="7" fill="#071a38" fillOpacity="0.75" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.7" />
      {/* Mini bars inside left */}
      <rect x="55" y="48" width="5" height="18" fill="#38bdf8" rx="1" />
      <rect x="63" y="42" width="5" height="24" fill="#fbbf24" rx="1" />
      <rect x="71" y="52" width="5" height="14" fill="#22d3ee" rx="1" />
      {/* Radial gauge inside right */}
      <circle cx="105" cy="51" r="16" fill="none" stroke="#1e3a5f" strokeWidth="5" />
      <circle
        cx="105"
        cy="51"
        r="16"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="5"
        strokeDasharray="62 100"
        strokeLinecap="round"
        transform="rotate(-90 105 51)"
      />
      <circle
        cx="105"
        cy="51"
        r="16"
        fill="none"
        stroke="#f43f5e"
        strokeWidth="5"
        strokeDasharray="24 100"
        strokeLinecap="round"
        transform="rotate(140 105 51)"
      />
      <circle cx="105" cy="51" r="6" fill="#0ea5e9" fillOpacity="0.25" stroke="#7dd3fc" strokeWidth="1" />
    </svg>
  </div>
);

const HoloHumanResourceStage: React.FC = () => (
  <div className="relative flex flex-col items-center justify-end h-28 select-none">
    <svg viewBox="0 0 180 105" className="w-40 h-26 drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
      <defs>
        <linearGradient id="stageGlow3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="hrFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      {/* Perspective platform */}
      <polygon points="10,96 36,72 144,72 170,96" fill="url(#stageGlow3)" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.8" />
      <line x1="16" y1="93" x2="164" y2="93" stroke="#22d3ee" strokeWidth="1.8" strokeOpacity="0.85" />
      {/* Glowing rounded HUD frame */}
      <rect x="52" y="18" width="76" height="58" rx="9" fill="#081d3d" fillOpacity="0.78" stroke="url(#hrFrame)" strokeWidth="1.6" />
      {/* Scan lines */}
      <line x1="60" y1="30" x2="78" y2="30" stroke="#fb923c" strokeWidth="1" strokeOpacity="0.65" />
      <line x1="104" y1="35" x2="120" y2="35" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.65" />
      <line x1="104" y1="45" x2="118" y2="45" stroke="#34d399" strokeWidth="1" strokeOpacity="0.65" />
      {/* Human silhouette */}
      <circle cx="90" cy="34" r="5.5" fill="none" stroke="#e0f2fe" strokeWidth="1.5" />
      <path d="M81,43 C81,40 99,40 99,43 L97,56 L94,56 L94,68 L86,68 L86,56 L83,56 Z" fill="#38bdf8" fillOpacity="0.22" stroke="#bae6fd" strokeWidth="1.3" />
    </svg>
  </div>
);

const HoloProcessStage: React.FC = () => (
  <div className="relative flex flex-col items-center justify-end h-28 select-none">
    <svg viewBox="0 0 180 105" className="w-40 h-26 drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
      <defs>
        <linearGradient id="stageGlow4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Perspective platform */}
      <polygon points="10,96 36,72 144,72 170,96" fill="url(#stageGlow4)" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.8" />
      <line x1="16" y1="93" x2="164" y2="93" stroke="#22d3ee" strokeWidth="1.8" strokeOpacity="0.85" />
      {/* Outer process case */}
      <path d="M77,17 L103,17 L103,23 L77,23 Z" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
      <rect x="46" y="23" width="88" height="54" rx="10" fill="#071a38" fillOpacity="0.75" stroke="#38bdf8" strokeWidth="1.4" strokeOpacity="0.75" />
      {/* Workflow circuit path */}
      <polyline points="62,50 82,50 82,38 112,38" fill="none" stroke="#fb7185" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="68,50 74,44" fill="none" stroke="#fb7185" strokeWidth="2.2" strokeLinecap="round" />
      <polyline points="68,50 74,56" fill="none" stroke="#fb7185" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="114" cy="38" r="4" fill="#fb923c" />
      <rect x="92" y="52" width="24" height="12" rx="2" fill="#0ea5e9" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.2" />
      <line x1="84" y1="58" x2="92" y2="58" stroke="#38bdf8" strokeWidth="1.4" />
    </svg>
  </div>
);

export const WpDashboardView: React.FC<WpDashboardViewProps> = ({
  currentPegawai,
  allPegawai,
  kegiatanList,
  presensiList = [],
  pengingatList = [],
  pengaturan,
  onNavigateToTab,
  onDeleteKegiatan,
  onOpenJurnalModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Weekly Achievement Diagram states
  const [chartMetric, setChartMetric] = useState<'kegiatan' | 'jam'>('kegiatan');
  const [chartScope, setChartScope] = useState<'saya' | 'unit'>('saya');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);

  const todayIso = useMemo(getTodayIso, []);
  const isSupervisorView =
    currentPegawai.role === 'superadmin' || currentPegawai.role === 'atasan';

  // Scope activities & attendance based on logged-in user (or full org for superadmin/atasan monitoring overview)
  const userKegiatan = useMemo(
    () => kegiatanList.filter((k) => k.pegawaiId === currentPegawai.id),
    [kegiatanList, currentPegawai.id]
  );

  const scopeKegiatan = useMemo(
    () => (isSupervisorView ? kegiatanList : userKegiatan),
    [isSupervisorView, kegiatanList, userKegiatan]
  );

  const scopePresensi = useMemo(
    () =>
      isSupervisorView
        ? presensiList
        : presensiList.filter((p) => p.pegawaiId === currentPegawai.id),
    [isSupervisorView, presensiList, currentPegawai.id]
  );

  // Real KPI calculations
  const metrics = useMemo(() => {
    const totalEntri = scopeKegiatan.length;
    const disetujui = scopeKegiatan.filter((k) => k.statusValidasi === 'Disetujui').length;
    const menunggu = scopeKegiatan.filter((k) => k.statusValidasi === 'Menunggu').length;
    const ditolak = scopeKegiatan.filter((k) => k.statusValidasi === 'Ditolak').length;

    const totalJam = scopeKegiatan.reduce(
      (acc, k) => acc + calcDurationHours(k.waktuMulai, k.waktuSelesai),
      0
    );
    const jamHariIni = scopeKegiatan
      .filter((k) => k.tanggal === todayIso)
      .reduce((acc, k) => acc + calcDurationHours(k.waktuMulai, k.waktuSelesai), 0);

    const denganOutput = scopeKegiatan.filter((k) => Boolean(k.outputHasil?.trim())).length;
    const denganBukti = scopeKegiatan.filter((k) => Boolean(k.tautanBukti?.trim())).length;

    const pagiCount = scopeKegiatan.filter((k) => {
      const hour = parseInt((k.waktuMulai || '08:00').split(':')[0], 10);
      return !Number.isNaN(hour) && hour < 12;
    }).length;
    const siangCount = totalEntri - pagiCount;

    const uniqueHariAktif = new Set(scopeKegiatan.map((k) => k.tanggal)).size;
    const rataRataPerHari = uniqueHariAktif > 0 ? totalEntri / uniqueHariAktif : 0;

    // SDM & Accounts
    const totalPegawai = allPegawai.length;
    const nonSuperAdmin = allPegawai.filter((p) => p.role !== 'superadmin');
    const atasanCount = allPegawai.filter((p) => p.role === 'atasan').length;
    const filledTodayIds = new Set(
      kegiatanList.filter((k) => k.tanggal === todayIso).map((k) => k.pegawaiId)
    );
    const belumIsiHariIni = nonSuperAdmin.filter((p) => !filledTodayIds.has(p.id)).length;

    // Presensi
    const totalPresensi = scopePresensi.length;
    const hadirKantor = scopePresensi.filter((p) => p.status === 'Hadir').length;
    const wfhDinas = scopePresensi.filter(
      (p) => p.status === 'WFH' || p.status === 'Dinas Luar'
    ).length;
    const izinSakitCuti = scopePresensi.filter(
      (p) => p.status === 'Izin' || p.status === 'Sakit' || p.status === 'Cuti'
    ).length;
    const hadirTotal = hadirKantor + wfhDinas;
    const terlambatCount = scopePresensi.filter((p) => (p.terlambatMenit || 0) > 0).length;
    const tepatWaktuCount = Math.max(0, hadirTotal - terlambatCount);
    const totalMenitTelat = scopePresensi.reduce((acc, p) => acc + (p.terlambatMenit || 0), 0);

    // Pengingat
    const myPengingat = pengingatList.filter((pg) => pg.pegawaiId === currentPegawai.id);
    const myUnreadPengingat = myPengingat.filter((pg) => pg.status === 'unread').length;
    const totalPengingatSent = pengingatList.length;
    const totalPengingatRead = pengingatList.filter(
      (pg) => pg.status === 'read' || pg.status === 'resolved'
    ).length;
    const totalPengingatResolved = pengingatList.filter((pg) => pg.status === 'resolved').length;

    // Targets & Percentages
    const targetEntriBulan = Math.max(20, isSupervisorView ? nonSuperAdmin.length * 10 : 20);
    const targetJamBulan = Math.max(40, isSupervisorView ? nonSuperAdmin.length * 40 : 120);
    const targetHariKerja = 22;

    const pctEntri = Math.min(100, Math.round((totalEntri / targetEntriBulan) * 100));
    const pctDisetujui = totalEntri > 0 ? Math.round((disetujui / totalEntri) * 100) : 0;
    const pctJam = Math.min(100, Math.round((totalJam / targetJamBulan) * 100));
    const pctBukti = totalEntri > 0 ? Math.round((denganBukti / totalEntri) * 100) : 0;
    const pctOutput = totalEntri > 0 ? Math.round((denganOutput / totalEntri) * 100) : 0;
    const pctHadir =
      totalPresensi > 0 ? Math.round((hadirTotal / totalPresensi) * 100) : totalEntri > 0 ? 100 : 0;
    const pctTepatWaktu =
      hadirTotal > 0 ? Math.round((tepatWaktuCount / hadirTotal) * 100) : 100;
    const pctHariAktif = Math.min(100, Math.round((uniqueHariAktif / targetHariKerja) * 100));
    const pctPengingatSelesai =
      totalPengingatSent > 0
        ? Math.round((totalPengingatResolved / totalPengingatSent) * 100)
        : 100;

    return {
      totalEntri,
      disetujui,
      menunggu,
      ditolak,
      totalJam,
      jamHariIni,
      denganOutput,
      denganBukti,
      pagiCount,
      siangCount,
      uniqueHariAktif,
      rataRataPerHari,
      totalPegawai,
      atasanCount,
      belumIsiHariIni,
      nonSuperAdminCount: nonSuperAdmin.length,
      totalPresensi,
      hadirKantor,
      wfhDinas,
      izinSakitCuti,
      hadirTotal,
      terlambatCount,
      tepatWaktuCount,
      totalMenitTelat,
      myUnreadPengingat,
      totalPengingatSent,
      totalPengingatRead,
      totalPengingatResolved,
      targetEntriBulan,
      targetJamBulan,
      targetHariKerja,
      pctEntri,
      pctDisetujui,
      pctJam,
      pctBukti,
      pctOutput,
      pctHadir,
      pctTepatWaktu,
      pctHariAktif,
      pctPengingatSelesai,
    };
  }, [scopeKegiatan, scopePresensi, allPegawai, kegiatanList, pengingatList, currentPegawai.id, todayIso, isSupervisorView]);

  // Top 4 Theme In-depth Analysis Cards
  const topAnalysisCards: {
    id: string;
    title: string;
    targetTab: string;
    stage: React.ReactNode;
    triples: MetricTripleItem[];
    footerLabel: string;
    footerValue: string;
  }[] = [
    {
      id: 'jurnal',
      title: 'Analisis Jurnal Harian',
      targetTab: 'jurnal-harian',
      stage: <HoloJurnalChartStage />,
      triples: [
        {
          label: 'Total Entri',
          actual: metrics.totalEntri,
          target: metrics.targetEntriBulan,
          ratio: metrics.pctEntri,
        },
        {
          label: 'Disetujui',
          actual: metrics.disetujui,
          target: Math.max(metrics.totalEntri, 1),
          ratio: metrics.pctDisetujui,
        },
        {
          label: 'Menunggu',
          actual: metrics.menunggu,
          target: 0,
          ratio: metrics.totalEntri > 0 ? Math.max(10, 100 - Math.round((metrics.menunggu / metrics.totalEntri) * 100)) : 100,
        },
      ],
      footerLabel: 'Tingkat Capaian / Persetujuan Jurnal',
      footerValue: `${metrics.pctEntri}% | ${metrics.pctDisetujui}%`,
    },
    {
      id: 'jam-output',
      title: 'Analisis Jam & Produktivitas',
      targetTab: 'rekapitulasi',
      stage: <HoloProductivityStage />,
      triples: [
        {
          label: 'Jam Efektif',
          actual: metrics.totalJam.toFixed(1),
          target: metrics.targetJamBulan,
          ratio: metrics.pctJam,
        },
        {
          label: 'Output Valid',
          actual: metrics.denganOutput,
          target: Math.max(metrics.totalEntri, 1),
          ratio: metrics.pctOutput,
        },
        {
          label: 'Bukti Link',
          actual: metrics.denganBukti,
          target: Math.max(metrics.totalEntri, 1),
          ratio: metrics.pctBukti,
        },
      ],
      footerLabel: 'Efektivitas Jam Kerja / Kelengkapan Output',
      footerValue: `${metrics.pctJam}% | ${metrics.pctOutput}%`,
    },
    {
      id: 'sdm-hadir',
      title: 'Analisis SDM & Kehadiran',
      targetTab: isSupervisorView ? 'monitoring' : 'jurnal-harian',
      stage: <HoloHumanResourceStage />,
      triples: [
        {
          label: 'Pegawai',
          actual: metrics.totalPegawai,
          target: metrics.totalPegawai,
          ratio: 100,
        },
        {
          label: 'Hadir Kerja',
          actual: metrics.hadirTotal,
          target: Math.max(metrics.totalPresensi, metrics.targetHariKerja),
          ratio: metrics.pctHadir,
        },
        {
          label: 'Terlambat',
          actual: metrics.terlambatCount,
          target: 0,
          ratio: metrics.pctTepatWaktu,
        },
      ],
      footerLabel: 'Rasio Kehadiran / Ketepatan Waktu',
      footerValue: `${metrics.pctHadir}% / ${metrics.pctTepatWaktu}%`,
    },
    {
      id: 'proses-pengingat',
      title: 'Analisis Proses & Pengingat',
      targetTab: 'pengingat',
      stage: <HoloProcessStage />,
      triples: [
        {
          label: 'Hari Aktif',
          actual: metrics.uniqueHariAktif,
          target: metrics.targetHariKerja,
          ratio: metrics.pctHariAktif,
        },
        {
          label: 'Pengingat',
          actual: isSupervisorView ? metrics.totalPengingatSent : metrics.myUnreadPengingat,
          target: 0,
          ratio: metrics.pctPengingatSelesai,
        },
        {
          label: 'Revisi',
          actual: metrics.ditolak,
          target: 0,
          ratio: metrics.totalEntri > 0 ? Math.max(0, 100 - Math.round((metrics.ditolak / metrics.totalEntri) * 100)) : 100,
        },
      ],
      footerLabel: 'Progres Hari Kerja / Penyelesaian Pengingat',
      footerValue: `${metrics.pctHariAktif}% / ${metrics.pctPengingatSelesai}%`,
    },
  ];

  // Bottom 4 Strategic Objectives Panels (6 cells each)
  const strategicPanels: {
    id: string;
    title: string;
    cells: SubObjectiveCell[];
  }[] = [
    {
      id: 'capaian-jurnal',
      title: 'Capaian Jurnal',
      cells: [
        {
          title: 'Total Kegiatan',
          actual: metrics.totalEntri,
          target: metrics.targetEntriBulan,
          ratio: metrics.pctEntri,
        },
        {
          title: 'Disetujui Atasan',
          actual: metrics.disetujui,
          target: Math.max(metrics.totalEntri, 1),
          ratio: metrics.pctDisetujui,
        },
        {
          title: 'Menunggu Paraf',
          actual: metrics.menunggu,
          target: 0,
          ratio: metrics.totalEntri > 0 ? Math.max(5, 100 - Math.round((metrics.menunggu / metrics.totalEntri) * 100)) : 100,
        },
        {
          title: 'Revisi / Ditolak',
          actual: metrics.ditolak,
          target: 0,
          ratio: metrics.ditolak === 0 ? 100 : 40,
        },
        {
          title: 'Hari Mengisi',
          actual: metrics.uniqueHariAktif,
          target: metrics.targetHariKerja,
          ratio: metrics.pctHariAktif,
        },
        {
          title: 'Rata-rata / Hari',
          actual: metrics.rataRataPerHari.toFixed(1),
          target: '3.0',
          ratio: Math.min(100, (metrics.rataRataPerHari / 3) * 100),
        },
      ],
    },
    {
      id: 'pegawai-pengingat',
      title: 'Pegawai & Pengingat',
      cells: [
        {
          title: 'Akun Terdaftar',
          actual: metrics.totalPegawai,
          target: metrics.totalPegawai,
          ratio: 100,
        },
        {
          title: 'Atasan Penilai',
          actual: metrics.atasanCount,
          target: Math.max(metrics.atasanCount, 1),
          ratio: metrics.atasanCount > 0 ? 100 : 20,
        },
        {
          title: 'Belum Isi Hari Ini',
          actual: metrics.belumIsiHariIni,
          target: 0,
          ratio:
            metrics.nonSuperAdminCount > 0
              ? Math.round(((metrics.nonSuperAdminCount - metrics.belumIsiHariIni) / metrics.nonSuperAdminCount) * 100)
              : 100,
        },
        {
          title: 'Pengingat Terkirim',
          actual: metrics.totalPengingatSent,
          target: Math.max(metrics.totalPengingatSent, 1),
          ratio: metrics.totalPengingatSent > 0 ? 80 : 100,
        },
        {
          title: 'Sudah Dibaca',
          actual: metrics.totalPengingatRead,
          target: Math.max(metrics.totalPengingatSent, 1),
          ratio:
            metrics.totalPengingatSent > 0
              ? Math.round((metrics.totalPengingatRead / metrics.totalPengingatSent) * 100)
              : 100,
        },
        {
          title: 'Pengingat Akun Anda',
          actual: metrics.myUnreadPengingat,
          target: 0,
          ratio: metrics.myUnreadPengingat === 0 ? 100 : 35,
        },
      ],
    },
    {
      id: 'proses-aktivitas',
      title: 'Proses Aktivitas',
      cells: [
        {
          title: 'Jam Kerja Efektif',
          actual: metrics.totalJam.toFixed(1),
          target: metrics.targetJamBulan,
          ratio: metrics.pctJam,
        },
        {
          title: 'Jam Hari Ini',
          actual: metrics.jamHariIni.toFixed(1),
          target: '7.5',
          ratio: Math.min(100, (metrics.jamHariIni / 7.5) * 100),
        },
        {
          title: 'Sesi Pagi (<12.00)',
          actual: metrics.pagiCount,
          target: Math.max(metrics.totalEntri, 1),
          ratio: metrics.totalEntri > 0 ? Math.round((metrics.pagiCount / metrics.totalEntri) * 100) : 0,
        },
        {
          title: 'Sesi Siang (>=12.00)',
          actual: metrics.siangCount,
          target: Math.max(metrics.totalEntri, 1),
          ratio: metrics.totalEntri > 0 ? Math.round((metrics.siangCount / metrics.totalEntri) * 100) : 0,
        },
        {
          title: 'Bukti Tautan (%)',
          actual: `${metrics.pctBukti}%`,
          target: '100%',
          ratio: metrics.pctBukti,
        },
        {
          title: 'Kelengkapan Output',
          actual: `${metrics.pctOutput}%`,
          target: '100%',
          ratio: metrics.pctOutput,
        },
      ],
    },
    {
      id: 'disiplin-kehadiran',
      title: 'Disiplin & Kehadiran',
      cells: [
        {
          title: 'Hadir Kantor',
          actual: metrics.hadirKantor,
          target: Math.max(metrics.totalPresensi, metrics.targetHariKerja),
          ratio: metrics.totalPresensi > 0 ? Math.round((metrics.hadirKantor / metrics.totalPresensi) * 100) : 0,
        },
        {
          title: 'WFH / Dinas Luar',
          actual: metrics.wfhDinas,
          target: Math.max(metrics.wfhDinas, 1),
          ratio: metrics.totalPresensi > 0 ? Math.round((metrics.wfhDinas / metrics.totalPresensi) * 100) : 0,
        },
        {
          title: 'Izin / Sakit / Cuti',
          actual: metrics.izinSakitCuti,
          target: 0,
          ratio: metrics.izinSakitCuti === 0 ? 100 : 50,
        },
        {
          title: 'Tepat Waktu',
          actual: metrics.tepatWaktuCount,
          target: Math.max(metrics.hadirTotal, 1),
          ratio: metrics.pctTepatWaktu,
        },
        {
          title: 'Menit Terlambat',
          actual: metrics.totalMenitTelat,
          target: 0,
          ratio: metrics.totalMenitTelat === 0 ? 100 : Math.max(15, 100 - metrics.totalMenitTelat),
        },
        {
          title: 'Rasio Disiplin (%)',
          actual: `${metrics.pctTepatWaktu}%`,
          target: '100%',
          ratio: metrics.pctTepatWaktu,
        },
      ],
    },
  ];

  // Recent 5 activities for logged-in user (sorted newest-first)
  const recentKegiatan = useMemo(() => {
    const extractOrderNum = (id: string): number => {
      const match = id.match(/(\d+)(?!.*\d)/);
      return match ? Number(match[1]) : 0;
    };

    return [...userKegiatan]
      .sort((a, b) => {
        const dateDiff = (b.tanggal || '').localeCompare(a.tanggal || '');
        if (dateDiff !== 0) return dateDiff;

        const startDiff = (b.waktuMulai || '').localeCompare(a.waktuMulai || '');
        if (startDiff !== 0) return startDiff;

        const endDiff = (b.waktuSelesai || '').localeCompare(a.waktuSelesai || '');
        if (endDiff !== 0) return endDiff;

        const idNumDiff = extractOrderNum(b.id) - extractOrderNum(a.id);
        if (idNumDiff !== 0) return idNumDiff;

        return (b.id || '').localeCompare(a.id || '');
      })
      .slice(0, 5);
  }, [userKegiatan]);

  // Weekly achievement buckets (6 consecutive weeks ending on latest active week)
  const weeklyStats = useMemo(() => {
    const sourceList =
      isSupervisorView && chartScope === 'unit' ? kegiatanList : userKegiatan;

    const validDates = sourceList
      .map((k) => parseIsoDateLocal(k.tanggal))
      .filter((d): d is Date => d !== null);

    const todayDate = parseIsoDateLocal(todayIso) ?? new Date();
    const anchorDate =
      validDates.length > 0
        ? new Date(Math.max(...validDates.map((d) => d.getTime())))
        : todayDate;

    const latestMonday = getWeekMonday(anchorDate);
    const weekCount = 6;

    const nonSuperAdminTotal = Math.max(
      1,
      allPegawai.filter((p) => p.role !== 'superadmin').length
    );
    const targetPerWeekTasks =
      isSupervisorView && chartScope === 'unit' ? nonSuperAdminTotal * 5 : 10;
    const targetPerWeekHours =
      isSupervisorView && chartScope === 'unit' ? nonSuperAdminTotal * 37.5 : 37.5;

    const buckets = Array.from({ length: weekCount }, (_, idx) => {
      const offsetWeeks = weekCount - 1 - idx;
      const monday = new Date(
        latestMonday.getFullYear(),
        latestMonday.getMonth(),
        latestMonday.getDate() - offsetWeeks * 7
      );
      const weekKey = toIsoDateLocal(monday);

      return {
        index: idx,
        weekLabel: `M${idx + 1}`,
        weekKey,
        shortRange: formatWeekShortRange(monday),
        fullRange: formatWeekFullRange(monday),
        total: 0,
        disetujui: 0,
        menunggu: 0,
        ditolak: 0,
        jamEfektif: 0,
      };
    });

    const bucketMap = new Map(buckets.map((b) => [b.weekKey, b]));

    for (const item of sourceList) {
      const dt = parseIsoDateLocal(item.tanggal);
      if (!dt) continue;
      const monKey = toIsoDateLocal(getWeekMonday(dt));
      const targetBucket = bucketMap.get(monKey);
      if (!targetBucket) continue;

      targetBucket.total += 1;
      if (item.statusValidasi === 'Disetujui') targetBucket.disetujui += 1;
      else if (item.statusValidasi === 'Ditolak') targetBucket.ditolak += 1;
      else targetBucket.menunggu += 1;
      targetBucket.jamEfektif += calcDurationHours(item.waktuMulai, item.waktuSelesai);
    }

    const enriched = buckets.map((b) => {
      const capaianTasksPct = Math.min(
        100,
        Math.round((b.total / Math.max(1, targetPerWeekTasks)) * 100)
      );
      const capaianHoursPct = Math.min(
        100,
        Math.round((b.jamEfektif / Math.max(1, targetPerWeekHours)) * 100)
      );
      return {
        ...b,
        jamRounded: Number(b.jamEfektif.toFixed(1)),
        capaianTasksPct,
        capaianHoursPct,
      };
    });

    const totalTasks6W = enriched.reduce((acc, b) => acc + b.total, 0);
    const totalApproved6W = enriched.reduce((acc, b) => acc + b.disetujui, 0);
    const totalHours6W = enriched.reduce((acc, b) => acc + b.jamEfektif, 0);
    const activeWeeksCount = Math.max(
      1,
      enriched.filter((b) => b.total > 0).length
    );
    const avgTasksPerWeek = totalTasks6W / activeWeeksCount;
    const avgHoursPerWeek = totalHours6W / activeWeeksCount;

    const rawMaxTasks = Math.max(
      targetPerWeekTasks,
      ...enriched.map((b) => b.total),
      5
    );
    const rawMaxHours = Math.max(
      targetPerWeekHours,
      ...enriched.map((b) => b.jamEfektif),
      10
    );

    return {
      sourceCount: sourceList.length,
      buckets: enriched,
      targetPerWeekTasks,
      targetPerWeekHours,
      maxTasksScale: Math.ceil(rawMaxTasks / 5) * 5,
      maxHoursScale: Math.ceil(rawMaxHours / 10) * 10,
      totalTasks6W,
      totalApproved6W,
      totalHours6W: Number(totalHours6W.toFixed(1)),
      avgTasksPerWeek: Number(avgTasksPerWeek.toFixed(1)),
      avgHoursPerWeek: Number(avgHoursPerWeek.toFixed(1)),
    };
  }, [isSupervisorView, chartScope, kegiatanList, userKegiatan, todayIso, allPegawai]);

  const activeWeekDetail = useMemo(() => {
    const idx =
      selectedWeekIndex !== null &&
      selectedWeekIndex >= 0 &&
      selectedWeekIndex < weeklyStats.buckets.length
        ? selectedWeekIndex
        : weeklyStats.buckets.length - 1;
    return weeklyStats.buckets[idx];
  }, [selectedWeekIndex, weeklyStats.buckets]);

  return (
    <div
      className={`${
        isExpanded
          ? 'fixed inset-0 z-50 overflow-y-auto p-3 sm:p-5'
          : 'rounded-lg overflow-hidden'
      } bg-[#030b1a] text-slate-100 border border-sky-500/30 shadow-[0_0_35px_rgba(2,132,199,0.2)] font-sans relative`}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(14, 116, 184, 0.25) 0%, rgba(3, 11, 26, 0.96) 55%), linear-gradient(to right, rgba(14, 165, 233, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(14, 165, 233, 0.05) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 34px 34px, 34px 34px',
      }}
    >
      <div className="p-2.5 sm:p-4 space-y-4 max-w-[1560px] mx-auto">
        {/* ====================================================================
            TOP CYBER COMMAND HEADER STRIP (Matches reference top bar)
           ==================================================================== */}
        <div className="relative flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 pb-1 border-b border-sky-500/25">
          {/* Left: Date + 2 Quick Nav Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="px-3 py-1.5 bg-[#061836]/90 border border-sky-500/35 text-cyan-200 font-mono tabular-nums text-xs font-semibold tracking-wide shrink-0">
              {todayIso}
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab('dashboard')}
              className="px-4 py-1.5 bg-[#0a234c] border border-cyan-400/50 border-b-2 border-b-amber-400 text-white text-xs font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer transition hover:bg-[#0e3066]"
            >
              Dasbor
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('jurnal-harian')}
              className="px-4 py-1.5 bg-[#061836]/80 border border-sky-500/30 text-sky-200 hover:text-white hover:border-cyan-400/60 text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 cursor-pointer transition"
            >
              Jurnal Harian
            </button>
          </div>

          {/* Center: Main System Banner */}
          <div className="flex-1 flex justify-center">
            <div className="w-full lg:max-w-md px-5 py-2 bg-gradient-to-b from-[#0f3e7a] via-[#0a2b57] to-[#051633] border border-cyan-400/45 shadow-[0_0_20px_rgba(34,211,238,0.2)] text-center rounded-b-lg">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                Sistem Manajemen E-Jurnal Kinerja
              </h1>
              <p className="text-[10px] text-cyan-200/80 truncate">
                {pengaturan.namaInstansi || 'E-Jurnal Kinerja Pegawai'}
              </p>
            </div>
          </div>

          {/* Right: 2 Quick Nav Tabs + Primary Action */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onNavigateToTab(isSupervisorView ? 'monitoring' : 'rekapitulasi')}
              className="px-3.5 py-1.5 bg-[#061836]/80 border border-sky-500/30 text-sky-200 hover:text-white hover:border-cyan-400/60 text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 cursor-pointer transition"
            >
              {isSupervisorView ? 'Monitoring' : 'Rekapitulasi'}
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('pengingat')}
              className="px-3.5 py-1.5 bg-[#061836]/80 border border-sky-500/30 text-sky-200 hover:text-white hover:border-cyan-400/60 text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 cursor-pointer transition flex items-center gap-1.5"
            >
              <span>Pengingat</span>
              {metrics.myUnreadPengingat > 0 && (
                <span className="font-mono tabular-nums text-amber-300 font-bold">
                  ({metrics.myUnreadPengingat})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenJurnalModal}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer transition flex items-center gap-1 shadow-[0_0_12px_rgba(56,189,248,0.45)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kegiatan</span>
            </button>
          </div>
        </div>

        {/* ====================================================================
            TOP INTERACTIVE WORKSPACE: AKTIVITAS TERBARU & DRAF CEPAT
           ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Left: Recent Activities (Terbaru di urutan atas) */}
          <div className="bg-[#051226]/90 border border-sky-500/30 flex flex-col justify-between">
            <div>
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#071c3d] to-[#0a2754] border-b border-sky-500/25 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-sky-100">
                  Aktivitas &amp; Riwayat Tugas Terbaru Anda
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('jurnal-harian')}
                  className="text-[11px] text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>Semua Jurnal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3.5">
                {recentKegiatan.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                    <p>Belum ada catatan aktivitas jurnal untuk akun Anda saat ini.</p>
                    <button
                      type="button"
                      onClick={onOpenJurnalModal}
                      className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Catat Kegiatan Pertama</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-sky-500/15">
                    {recentKegiatan.map((keg) => (
                      <div
                        key={keg.id}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-cyan-300/90 font-mono tabular-nums">
                            <span>
                              {keg.hari}, {keg.tanggal}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {keg.waktuMulai} - {keg.waktuSelesai}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                keg.statusValidasi === 'Disetujui'
                                  ? 'text-emerald-400 font-semibold'
                                  : keg.statusValidasi === 'Ditolak'
                                    ? 'text-rose-400 font-semibold'
                                    : 'text-amber-300 font-semibold'
                              }
                            >
                              {keg.statusValidasi}
                            </span>
                          </div>
                          <div className="font-semibold text-white truncate mt-0.5">
                            {keg.kegiatan}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            Output: {keg.outputHasil}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteKegiatan(keg.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer shrink-0"
                          title="Hapus kegiatan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Identity Footer inside card */}
            <div className="px-3.5 py-2.5 bg-[#040d1d] border-t border-sky-500/20 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div className="truncate">
                <strong className="text-white">{currentPegawai.nama}</strong>{' '}
                <span className="font-mono text-cyan-300">({currentPegawai.nip})</span>
              </div>
              <div className="text-slate-400 truncate">
                Atasan Penilai: <span className="text-slate-200">{pengaturan.namaAtasan || '-'}</span>
              </div>
            </div>
          </div>

          {/* Right: Diagram Pencapaian Perminggu */}
          <div className="bg-[#051226]/90 border border-sky-500/30 flex flex-col justify-between">
            <div>
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#071c3d] to-[#0a2754] border-b border-sky-500/25 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-semibold text-sky-100 truncate">
                    Diagram Pencapaian Perminggu
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                  {isSupervisorView && (
                    <div className="flex items-center bg-[#030b1a] border border-sky-500/30 p-0.5 rounded">
                      <button
                        type="button"
                        onClick={() => setChartScope('saya')}
                        className={`px-2 py-0.5 rounded-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          chartScope === 'saya'
                            ? 'bg-sky-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Saya
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartScope('unit')}
                        className={`px-2 py-0.5 rounded-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          chartScope === 'unit'
                            ? 'bg-sky-500 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Unit
                      </button>
                    </div>
                  )}

                  <div className="flex items-center bg-[#030b1a] border border-sky-500/30 p-0.5 rounded">
                    <button
                      type="button"
                      onClick={() => setChartMetric('kegiatan')}
                      className={`px-2 py-0.5 rounded-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        chartMetric === 'kegiatan'
                          ? 'bg-cyan-400 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Tugas
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric('jam')}
                      className={`px-2 py-0.5 rounded-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        chartMetric === 'jam'
                          ? 'bg-cyan-400 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Jam Kerja
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToTab('cetak')}
                    className="ml-1 text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 space-y-3 text-xs">
                {/* Summary Strip (tabular-nums, hairline dividers) */}
                <div className="grid grid-cols-3 divide-x divide-sky-500/20 pb-2.5 border-b border-sky-500/20">
                  <div className="pr-2">
                    <div className="text-[10px] text-slate-400">Total 6 Minggu</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-white mt-0.5">
                      {chartMetric === 'kegiatan'
                        ? `${weeklyStats.totalTasks6W} Tugas`
                        : `${weeklyStats.totalHours6W} Jam`}
                    </div>
                  </div>
                  <div className="px-2.5">
                    <div className="text-[10px] text-slate-400">Rata-rata / Minggu</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-cyan-300 mt-0.5">
                      {chartMetric === 'kegiatan'
                        ? `${weeklyStats.avgTasksPerWeek} Tugas`
                        : `${weeklyStats.avgHoursPerWeek} Jam`}
                    </div>
                  </div>
                  <div className="pl-2.5">
                    <div className="text-[10px] text-slate-400">
                      {chartMetric === 'kegiatan' ? 'Disetujui (6 Mg)' : 'Target Mingguan'}
                    </div>
                    <div className="text-sm font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                      {chartMetric === 'kegiatan'
                        ? `${weeklyStats.totalApproved6W} Tugas`
                        : `${weeklyStats.targetPerWeekHours} Jam`}
                    </div>
                  </div>
                </div>

                {weeklyStats.sourceCount === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                    <p>Belum ada data kegiatan mingguan untuk ditampilkan pada diagram.</p>
                    <button
                      type="button"
                      onClick={onOpenJurnalModal}
                      className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kegiatan</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Weekly Bar + Trend Line Chart */}
                    {(() => {
                      const maxVal =
                        chartMetric === 'kegiatan'
                          ? weeklyStats.maxTasksScale
                          : weeklyStats.maxHoursScale;
                      const targetVal =
                        chartMetric === 'kegiatan'
                          ? weeklyStats.targetPerWeekTasks
                          : weeklyStats.targetPerWeekHours;
                      const targetPct = Math.min(100, Math.round((targetVal / maxVal) * 100));

                      const trendPoints = weeklyStats.buckets
                        .map((b, idx) => {
                          const val = chartMetric === 'kegiatan' ? b.total : b.jamEfektif;
                          const x = ((idx + 0.5) / weeklyStats.buckets.length) * 100;
                          const y = 100 - Math.min(100, (val / maxVal) * 100);
                          return `${x.toFixed(2)},${y.toFixed(2)}`;
                        })
                        .join(' ');

                      return (
                        <div className="space-y-2">
                          {/* Legend */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-sky-500/80 border border-cyan-300 inline-block rounded-xs" />
                                <span>
                                  {chartMetric === 'kegiatan' ? 'Total Kegiatan' : 'Jam Efektif'}
                                </span>
                              </span>
                              {chartMetric === 'kegiatan' && (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 bg-emerald-400 inline-block rounded-xs" />
                                  <span>Disetujui</span>
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-3 border-t border-dashed border-amber-400 inline-block" />
                                <span>
                                  Target ({targetVal} {chartMetric === 'kegiatan' ? 'tugas' : 'jam'})
                                </span>
                              </span>
                            </div>
                            <span className="text-slate-400 font-mono tabular-nums">
                              Klik batang untuk detail
                            </span>
                          </div>

                          {/* Plot Area */}
                          <div className="relative flex gap-2 pt-2">
                            {/* Y-axis ticks */}
                            <div className="w-7 h-36 flex flex-col justify-between text-[10px] font-mono tabular-nums text-slate-400 text-right pr-1 select-none shrink-0">
                              <span>{maxVal}</span>
                              <span>{Math.round(maxVal * 0.5)}</span>
                              <span>0</span>
                            </div>

                            {/* Chart canvas */}
                            <div className="relative flex-1 h-36 border-l border-b border-sky-500/35">
                              {/* Horizontal Gridlines */}
                              <div className="absolute inset-x-0 top-0 border-t border-sky-500/15 pointer-events-none" />
                              <div className="absolute inset-x-0 top-1/2 border-t border-sky-500/15 pointer-events-none" />
                              <div className="absolute inset-x-0 top-1/4 border-t border-sky-500/10 pointer-events-none" />
                              <div className="absolute inset-x-0 top-3/4 border-t border-sky-500/10 pointer-events-none" />

                              {/* Target dashed line */}
                              <div
                                className="absolute inset-x-0 border-t border-dashed border-amber-400/75 pointer-events-none z-10"
                                style={{ bottom: `${targetPct}%` }}
                              />

                              {/* SVG Trend Polyline Overlay */}
                              <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
                              >
                                <polyline
                                  points={trendPoints}
                                  fill="none"
                                  stroke="#7dd3fc"
                                  strokeWidth="1.5"
                                  vectorEffect="non-scaling-stroke"
                                  strokeOpacity="0.85"
                                />
                              </svg>

                              {/* 6 Weekly Interactive Columns */}
                              <div className="relative z-20 grid grid-cols-6 gap-2 h-full px-2 items-end">
                                {weeklyStats.buckets.map((bucket) => {
                                  const primaryVal =
                                    chartMetric === 'kegiatan'
                                      ? bucket.total
                                      : bucket.jamRounded;
                                  const totalHeightPct = Math.min(
                                    100,
                                    Math.round((primaryVal / maxVal) * 100)
                                  );
                                  const approvedHeightPct =
                                    bucket.total > 0
                                      ? Math.min(
                                          100,
                                          Math.round((bucket.disetujui / bucket.total) * 100)
                                        )
                                      : 0;
                                  const isSelected = activeWeekDetail.weekKey === bucket.weekKey;

                                  return (
                                    <button
                                      key={bucket.weekKey}
                                      type="button"
                                      onClick={() => setSelectedWeekIndex(bucket.index)}
                                      onMouseEnter={() => setSelectedWeekIndex(bucket.index)}
                                      title={`${bucket.fullRange}: ${bucket.total} tugas (${bucket.disetujui} disetujui), ${bucket.jamRounded} jam`}
                                      className={`group relative h-full flex flex-col justify-end items-center cursor-pointer focus-visible:outline-1 focus-visible:outline-cyan-400 transition-colors ${
                                        isSelected ? 'bg-sky-500/10' : 'hover:bg-sky-500/5'
                                      }`}
                                    >
                                      {/* Value label above bar */}
                                      <span
                                        className={`text-[10px] font-mono tabular-nums mb-1 leading-none transition-colors ${
                                          isSelected
                                            ? 'text-cyan-200 font-bold'
                                            : 'text-slate-300'
                                        }`}
                                      >
                                        {primaryVal}
                                      </span>

                                      {/* Vertical Bar */}
                                      <div
                                        className={`w-full max-w-[30px] relative rounded-t-xs transition-all duration-200 border ${
                                          isSelected
                                            ? 'border-cyan-300 bg-sky-500/45 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                                            : 'border-sky-400/50 bg-sky-500/30 group-hover:bg-sky-500/40'
                                        }`}
                                        style={{
                                          height: `${primaryVal > 0 ? Math.max(8, totalHeightPct) : 2}%`,
                                        }}
                                      >
                                        {chartMetric === 'kegiatan' && bucket.disetujui > 0 && (
                                          <div
                                            className="absolute inset-x-0 bottom-0 bg-emerald-400/80 rounded-b-none"
                                            style={{ height: `${approvedHeightPct}%` }}
                                          />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* X-Axis Week Range Labels */}
                          <div className="flex gap-2">
                            <div className="w-7 shrink-0" />
                            <div className="flex-1 grid grid-cols-6 gap-2 px-2">
                              {weeklyStats.buckets.map((bucket) => {
                                const isSelected = activeWeekDetail.weekKey === bucket.weekKey;
                                return (
                                  <button
                                    key={bucket.weekKey}
                                    type="button"
                                    onClick={() => setSelectedWeekIndex(bucket.index)}
                                    className={`text-center cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'text-cyan-300 font-semibold'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    <div className="text-[10px] font-mono tabular-nums truncate">
                                      {bucket.shortRange}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Selected Week Breakdown Readout */}
                    <div className="pt-2 border-t border-sky-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                      <div className="truncate">
                        <span className="text-slate-400">Periode: </span>
                        <span className="font-semibold text-white font-mono tabular-nums">
                          {activeWeekDetail.fullRange}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                        <span className="text-cyan-300">
                          {activeWeekDetail.total} Tugas
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-emerald-400">
                          {activeWeekDetail.disetujui} Disetujui
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-sky-200">
                          {activeWeekDetail.jamRounded} Jam
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-amber-300 font-semibold">
                          {chartMetric === 'kegiatan'
                            ? `${activeWeekDetail.capaianTasksPct}%`
                            : `${activeWeekDetail.capaianHoursPct}%`}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Command Controls (Expand + Quick Links) */}
            <div className="px-3.5 py-2.5 bg-[#040d1d] border-t border-sky-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex flex-wrap items-center gap-2 text-slate-300">
                <button
                  type="button"
                  onClick={() => onNavigateToTab('rekapitulasi')}
                  className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  <span>Rekapitulasi</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                <span aria-hidden="true" className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('pengingat')}
                  className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <BellRing className="w-3 h-3" />
                  <span>Pengingat WhatsApp</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2.5 py-1 bg-[#081c3a] hover:bg-[#0e2d5c] border border-sky-500/40 text-cyan-200 rounded flex items-center gap-1.5 cursor-pointer transition"
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Kecilkan</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Perluas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================================
            SECTION 1 BANNER: ANALISIS KINERJA MENDALAM
           ==================================================================== */}
        <div className="relative py-1.5 px-4 bg-gradient-to-r from-transparent via-[#0b3163]/90 to-transparent border-y border-cyan-500/35 flex items-center justify-center">
          <div className="hidden sm:block absolute left-4 w-20 h-[2px] bg-gradient-to-r from-transparent to-cyan-400/70" />
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-wider">
            Analisis Kinerja Mendalam
          </h2>
          <div className="hidden sm:block absolute right-4 w-20 h-[2px] bg-gradient-to-l from-transparent to-cyan-400/70" />
        </div>

        {/* ====================================================================
            TOP 4 HOLOGRAPHIC ANALYSIS CARDS
           ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {topAnalysisCards.map((card) => (
            <div
              key={card.id}
              onClick={() => onNavigateToTab(card.targetTab)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigateToTab(card.targetTab);
                }
              }}
              className="group bg-[#051226]/90 border border-sky-500/30 hover:border-cyan-400/70 transition-colors duration-200 flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              {/* Card Title Bar */}
              <div className="px-3 py-2 bg-gradient-to-r from-[#071c3d] via-[#0c2d61] to-[#071c3d] border-b border-sky-500/25 text-center">
                <h3 className="text-xs sm:text-sm font-semibold text-sky-100 group-hover:text-cyan-300 transition-colors">
                  {card.title}
                </h3>
              </div>

              {/* Holographic Stage */}
              <div className="px-3 pt-2 pb-1">{card.stage}</div>

              {/* 3-Column Actual / Target Metric Strip */}
              <div className="px-3 py-2 grid grid-cols-3 gap-2 border-t border-sky-500/20 bg-[#040e1f]/80">
                {card.triples.map((metric) => (
                  <div key={metric.label} className="min-w-0">
                    <div className="text-[10px] text-slate-300 text-center truncate mb-1">
                      {metric.label}
                    </div>
                    <div className="flex items-center justify-between text-[10px] gap-1">
                      <span className="text-cyan-400">Aktual</span>
                      <span className="text-white font-bold font-mono tabular-nums">
                        {metric.actual}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] gap-1 mt-0.5">
                      <span className="text-cyan-400/80">Target</span>
                      <span className="text-sky-200 font-semibold font-mono tabular-nums">
                        {metric.target}
                      </span>
                    </div>
                    <ProgressBarMicro ratio={metric.ratio} />
                  </div>
                ))}
              </div>

              {/* Card Bottom Completion Summary */}
              <div className="px-3 py-2 border-t border-sky-500/20 bg-[#06152e]/85 text-center">
                <div className="text-[10px] text-slate-300">{card.footerLabel}</div>
                <div className="text-xs font-bold font-mono tabular-nums text-white mt-0.5">
                  {card.footerValue}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ====================================================================
            SECTION 2 BANNER: SASARAN STRATEGIS KINERJA
           ==================================================================== */}
        <div className="relative py-1.5 px-4 bg-gradient-to-r from-transparent via-[#0b3163]/90 to-transparent border-y border-cyan-500/35 flex items-center justify-center">
          <div className="hidden sm:block absolute left-4 w-20 h-[2px] bg-gradient-to-r from-transparent to-cyan-400/70" />
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-wider">
            Sasaran Strategis Kinerja
          </h2>
          <div className="hidden sm:block absolute right-4 w-20 h-[2px] bg-gradient-to-l from-transparent to-cyan-400/70" />
        </div>

        {/* ====================================================================
            BOTTOM 4 KPI MATRIX PANELS (6 SUB-CELLS EACH = 24 LIVE KPI METRICS)
           ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {strategicPanels.map((panel) => (
            <div
              key={panel.id}
              className="bg-[#051226]/90 border border-sky-500/30 flex flex-col"
            >
              {/* Panel Header */}
              <div className="px-3 py-2 bg-gradient-to-r from-[#071c3d] via-[#0c2d61] to-[#071c3d] border-b border-sky-500/25 text-center">
                <h3 className="text-xs sm:text-sm font-semibold text-sky-100">
                  {panel.title}
                </h3>
              </div>

              {/* 3x2 Sub-Cells Grid */}
              <div className="p-2.5 grid grid-cols-3 gap-2">
                {panel.cells.map((cell) => (
                  <div
                    key={cell.title}
                    className="p-2 bg-[#040d1d]/85 border border-sky-500/15 flex flex-col justify-between min-w-0"
                  >
                    <div
                      className="text-[10px] text-slate-200 font-medium text-center leading-tight min-h-[24px] flex items-center justify-center"
                      title={cell.title}
                    >
                      <span className="line-clamp-2">{cell.title}</span>
                    </div>

                    <div className="mt-1.5 space-y-0.5 text-[10px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-cyan-400">Aktual</span>
                        <span className="text-white font-bold font-mono tabular-nums">
                          {cell.actual}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-cyan-400/80">Target</span>
                        <span className="text-sky-200 font-semibold font-mono tabular-nums">
                          {cell.target}
                        </span>
                      </div>
                    </div>

                    <ProgressBarMicro ratio={cell.ratio} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
