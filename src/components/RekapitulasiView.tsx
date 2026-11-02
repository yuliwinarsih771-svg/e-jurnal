import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  User, 
  Building2,
  FileCheck,
  AlertCircle,
  Clock3,
  FileText,
  Download,
  Filter,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Search,
  ArrowRight
} from 'lucide-react';
import { Pegawai, PengaturanInstansi, KegiatanJurnal, PresensiRecord } from '../types';
import { BULAN_INDONESIA, formatTanggalIndonesia, exportJurnalToExcel, exportJurnalToWord } from '../utils/exportUtils';

interface RekapitulasiViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  pengaturan: PengaturanInstansi;
  kegiatanList: KegiatanJurnal[];
  presensiList: PresensiRecord[];
  selectedBulan: number;
  setSelectedBulan: (bulan: number) => void;
  selectedTahun: number;
  setSelectedTahun: (tahun: number) => void;
  selectedPegawaiId?: string;
  setSelectedPegawaiId?: (id: string) => void;
  onOpenPrintModal: () => void;
  onNavigateToJurnal?: () => void;
}

export const RekapitulasiView: React.FC<RekapitulasiViewProps> = ({
  currentPegawai,
  allPegawai,
  pengaturan,
  kegiatanList,
  presensiList,
  selectedBulan,
  setSelectedBulan,
  selectedTahun,
  setSelectedTahun,
  selectedPegawaiId,
  setSelectedPegawaiId,
  onOpenPrintModal,
  onNavigateToJurnal,
}) => {
  const isRegularPegawai = currentPegawai.role === 'pegawai';
  
  // Tab view for superiors/admin: 'personal' (per user) or 'all' (matrix of all employees)
  // For regular employee, it is always 'personal' (their own account)
  const [viewMode, setViewMode] = useState<'personal' | 'all'>('personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Disetujui' | 'Menunggu' | 'Ditolak'>('all');

  // Determine active target user for per-user recap
  const activeUserId = isRegularPegawai ? currentPegawai.id : (selectedPegawaiId || currentPegawai.id);
  const activeUser = useMemo(() => {
    return allPegawai.find(p => p.id === activeUserId) || currentPegawai;
  }, [allPegawai, activeUserId, currentPegawai]);

  // Compute stats for active user for the selected month & year
  const userMonthlyData = useMemo(() => {
    const userKegiatan = kegiatanList.filter((k) => {
      if (k.pegawaiId !== activeUser.id) return false;
      if (!k.tanggal) return false;
      const [y, m] = k.tanggal.split('-');
      return parseInt(y, 10) === selectedTahun && parseInt(m, 10) === selectedBulan;
    });

    const userPresensi = presensiList.filter((p) => {
      if (p.pegawaiId !== activeUser.id) return false;
      if (!p.tanggal) return false;
      const [y, m] = p.tanggal.split('-');
      return parseInt(y, 10) === selectedTahun && parseInt(m, 10) === selectedBulan;
    });

    const totalKegiatan = userKegiatan.length;
    const approvedKegiatan = userKegiatan.filter(k => k.statusValidasi === 'Disetujui').length;
    const pendingKegiatan = userKegiatan.filter(k => k.statusValidasi === 'Menunggu').length;
    const rejectedKegiatan = userKegiatan.filter(k => k.statusValidasi === 'Ditolak').length;

    // Total effective minutes & hours
    let totalMenit = 0;
    const activeDates = new Set<string>();

    userKegiatan.forEach(k => {
      if (k.tanggal) activeDates.add(k.tanggal);
      if (k.waktuMulai && k.waktuSelesai) {
        const [sh, sm] = k.waktuMulai.split(':').map(Number);
        const [eh, em] = k.waktuSelesai.split(':').map(Number);
        const duration = (eh * 60 + em) - (sh * 60 + sm);
        if (duration > 0) totalMenit += duration;
      }
    });

    const totalJam = (totalMenit / 60).toFixed(1);
    const totalHariKerjaAktif = activeDates.size;
    const avgJamPerHari = totalHariKerjaAktif > 0 ? (totalMenit / 60 / totalHariKerjaAktif).toFixed(1) : '0';

    // Attendance breakdown
    const hadir = userPresensi.filter(p => p.status === 'Hadir').length;
    const dinasLuar = userPresensi.filter(p => p.status === 'Dinas Luar').length;
    const wfh = userPresensi.filter(p => p.status === 'WFH').length;
    const izinSakit = userPresensi.filter(p => p.status === 'Sakit' || p.status === 'Izin').length;

    // Percentage approved
    const persenDisetujui = totalKegiatan > 0 ? Math.round((approvedKegiatan / totalKegiatan) * 100) : 100;

    // Kinerja Predikat
    let predikat = 'Cukup';
    let predikatBadge = 'bg-amber-100 text-amber-800 border-amber-300';
    let predikatProgress = 60;
    if (totalKegiatan >= 15 && persenDisetujui >= 85) {
      predikat = 'Sangat Baik';
      predikatBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      predikatProgress = 95;
    } else if (totalKegiatan >= 8 && persenDisetujui >= 70) {
      predikat = 'Baik';
      predikatBadge = 'bg-blue-100 text-blue-800 border-blue-300';
      predikatProgress = 80;
    } else if (totalKegiatan === 0) {
      predikat = 'Belum Ada Entri';
      predikatBadge = 'bg-slate-100 text-slate-600 border-slate-300';
      predikatProgress = 0;
    }

    // Filtered activities for detail table
    const filteredKegiatan = userKegiatan
      .filter((k) => {
        if (statusFilter === 'all') return true;
        return k.statusValidasi === statusFilter;
      })
      .filter((k) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          k.kegiatan.toLowerCase().includes(term) ||
          k.outputHasil.toLowerCase().includes(term) ||
          k.nomorKegiatan.includes(term) ||
          k.hari.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
        return a.waktuMulai.localeCompare(b.waktuMulai);
      });

    return {
      userKegiatan,
      filteredKegiatan,
      totalKegiatan,
      approvedKegiatan,
      pendingKegiatan,
      rejectedKegiatan,
      totalMenit,
      totalJam,
      totalHariKerjaAktif,
      avgJamPerHari,
      persenDisetujui,
      predikat,
      predikatBadge,
      predikatProgress,
      hadir,
      dinasLuar,
      wfh,
      izinSakit,
    };
  }, [activeUser.id, kegiatanList, presensiList, selectedBulan, selectedTahun, statusFilter, searchTerm]);

  // Overall comparison stats across all employees (available for atasan/admin)
  const allStaffStats = useMemo(() => {
    return allPegawai.map((peg) => {
      const pegKegiatan = kegiatanList.filter((k) => {
        if (k.pegawaiId !== peg.id) return false;
        const [y, m] = k.tanggal.split('-');
        return parseInt(y, 10) === selectedTahun && parseInt(m, 10) === selectedBulan;
      });

      const totalKegiatan = pegKegiatan.length;
      const approvedKegiatan = pegKegiatan.filter(k => k.statusValidasi === 'Disetujui').length;
      const pendingKegiatan = pegKegiatan.filter(k => k.statusValidasi === 'Menunggu').length;
      const rejectedKegiatan = pegKegiatan.filter(k => k.statusValidasi === 'Ditolak').length;

      let totalMenit = 0;
      pegKegiatan.forEach(k => {
        const [sh, sm] = k.waktuMulai.split(':').map(Number);
        const [eh, em] = k.waktuSelesai.split(':').map(Number);
        const duration = (eh * 60 + em) - (sh * 60 + sm);
        if (duration > 0) totalMenit += duration;
      });
      const totalJam = (totalMenit / 60).toFixed(1);

      let predikat = 'Cukup';
      let predikatColor = 'bg-amber-100 text-amber-800 border-amber-200';
      if (totalKegiatan >= 10 && approvedKegiatan >= totalKegiatan * 0.8) {
        predikat = 'Sangat Baik';
        predikatColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      } else if (totalKegiatan >= 5) {
        predikat = 'Baik';
        predikatColor = 'bg-blue-100 text-blue-800 border-blue-300';
      }

      return {
        pegawai: peg,
        totalKegiatan,
        approvedKegiatan,
        pendingKegiatan,
        rejectedKegiatan,
        totalJam,
        predikat,
        predikatColor,
      };
    });
  }, [allPegawai, kegiatanList, selectedBulan, selectedTahun]);

  const handleExportUserExcel = () => {
    exportJurnalToExcel(activeUser, pengaturan, userMonthlyData.userKegiatan, selectedBulan, selectedTahun);
  };

  const handleExportUserWord = () => {
    exportJurnalToWord(activeUser, pengaturan, userMonthlyData.userKegiatan, selectedBulan, selectedTahun);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 tracking-wider uppercase">
                {isRegularPegawai ? 'Rekapitulasi Akun Saya' : 'Rekapitulasi Kinerja Bulanan'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {pengaturan.badanDinas}
              </span>
            </div>
            
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
              Rekapitulasi Bulanan Per User ({activeUser.nama})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Periode Bulan {BULAN_INDONESIA[selectedBulan - 1]} Tahun {selectedTahun} • Evaluasi Kinerja & Catatan Harian Pegawai
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportUserExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              title="Unduh Rekap Bulanan Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleExportUserWord}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              title="Unduh Rekap Bulanan Word"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Word</span>
            </button>

            <button
              onClick={onOpenPrintModal}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              title="Cetak Sesuai Format Resmi / PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF Rekap</span>
            </button>
          </div>
        </div>

        {/* Filter Controls (User Selector, Bulan, Tahun, View Toggle) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* If Admin/Atasan, allow choosing which user to inspect */}
            {!isRegularPegawai && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Pilih Pegawai
                </label>
                <select
                  value={activeUserId}
                  onChange={(e) => {
                    if (setSelectedPegawaiId) {
                      setSelectedPegawaiId(e.target.value);
                    }
                  }}
                  className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {allPegawai.map((peg) => (
                    <option key={peg.id} value={peg.id}>
                      {peg.nama} ({peg.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Bulan Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Bulan Evaluasi
              </label>
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(parseInt(e.target.value, 10))}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {BULAN_INDONESIA.map((nama, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Tahun
              </label>
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(parseInt(e.target.value, 10))}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {[2023, 2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Switch for Admin/Atasan */}
          {!isRegularPegawai && (
            <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'personal'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rekap Per Pegawai
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'all'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Matriks Seluruh Pegawai ({allPegawai.length})
              </button>
            </div>
          )}

        </div>
      </div>

      {/* VIEW MODE 1: REKAPITULASI BULANAN PER USER (Primary for Pegawai & Individual View) */}
      {viewMode === 'personal' && (
        <div className="space-y-6">

          {/* Identity Card for the Active User */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-2xl p-5 sm:p-6 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/40 border border-blue-400/30 flex items-center justify-center text-xl font-black text-white shrink-0 shadow-inner">
                  {activeUser.nama.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base sm:text-lg font-bold text-white">
                      {activeUser.nama}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase">
                      {activeUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    NIP. {activeUser.nip} • {activeUser.pangkatGolongan || 'Penata Muda'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-300 mt-1.5">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>{activeUser.jabatan}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{activeUser.unitKerja}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Atasan Langsung Box */}
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-xs shrink-0 max-w-xs">
                <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                  Atasan Langsung / Penilai
                </div>
                <div className="font-bold text-white mt-1">
                  {pengaturan.namaAtasan || '-'}
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  NIP. {pengaturan.nipAtasan || '-'}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  {pengaturan.jabatanAtasan}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Scorecards for User's Monthly Recapitulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Kegiatan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total Aktivitas
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                {userMonthlyData.totalKegiatan}
              </div>
              <div className="flex items-center space-x-1.5 mt-2 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Bulan {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}</span>
              </div>
            </div>

            {/* 2. Kegiatan Disetujui */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Telah Disetujui
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-950 mt-2 font-mono">
                {userMonthlyData.approvedKegiatan}
              </div>
              <div className="flex items-center space-x-1 mt-2 text-xs text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{userMonthlyData.persenDisetujui}% Berparaf Digital</span>
              </div>
            </div>

            {/* 3. Menunggu / Ditolak */}
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Status Verifikasi
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Clock3 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline space-x-3 mt-2">
                <div className="text-3xl font-black text-amber-900 font-mono">
                  {userMonthlyData.pendingKegiatan}
                  <span className="text-xs font-semibold text-amber-700 ml-1">menunggu</span>
                </div>
                {userMonthlyData.rejectedKegiatan > 0 && (
                  <div className="text-xs font-bold text-red-600 font-mono">
                    ({userMonthlyData.rejectedKegiatan} revisi)
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-amber-700">
                {userMonthlyData.pendingKegiatan > 0 
                  ? 'Menunggu pemeriksaan atasan' 
                  : 'Semua kegiatan telah tervalidasi'}
              </div>
            </div>

            {/* 4. Total Jam Efektif & Predikat */}
            <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Total Jam Efektif
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-indigo-950 mt-2 font-mono">
                {userMonthlyData.totalJam} <span className="text-xs font-normal text-slate-500">Jam</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500 font-medium">
                  {userMonthlyData.totalHariKerjaAktif} hari kerja aktif
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${userMonthlyData.predikatBadge}`}>
                  {userMonthlyData.predikat}
                </span>
              </div>
            </div>

          </div>

          {/* Detailed Monthly Activities Table for this user */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Daftar Rincian Rekapitulasi Kegiatan Bulanan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bulan {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun} • Pegawai: {activeUser.nama}
                </p>
              </div>

              {/* Status Filter & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari uraian tugas..."
                    className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-40 sm:w-48"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="all">Semua Status</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {userMonthlyData.filteredKegiatan.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">Tidak ada kegiatan pada periode ini</p>
                <p className="text-xs text-slate-500 mt-1">
                  Belum ada catatan aktivitas jurnal di bulan {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}.
                </p>
                {onNavigateToJurnal && (
                  <button
                    onClick={onNavigateToJurnal}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center space-x-1.5"
                  >
                    <span>Isi Jurnal Harian Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-300 font-bold">
                      <th className="py-3 px-3 text-center w-12">No.</th>
                      <th className="py-3 px-3">Hari & Tanggal</th>
                      <th className="py-3 px-3 text-center">No. Keg.</th>
                      <th className="py-3 px-3 text-center">Waktu</th>
                      <th className="py-3 px-4 min-w-[200px]">Uraian Pekerjaan / Tugas</th>
                      <th className="py-3 px-4 min-w-[180px]">Keluaran (Output/Hasil)</th>
                      <th className="py-3 px-3 text-center">Status & Paraf Digital</th>
                      <th className="py-3 px-3">Catatan Verifikator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {userMonthlyData.filteredKegiatan.map((keg, idx) => (
                      <tr key={keg.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-center font-medium text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{keg.hari}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {formatTanggalIndonesia(keg.tanggal)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {keg.nomorKegiatan || (idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700 whitespace-nowrap">
                          {keg.waktuMulai} - {keg.waktuSelesai}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {keg.kegiatan}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {keg.outputHasil}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {keg.statusValidasi === 'Disetujui' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paraf Digital</span>
                            </span>
                          ) : keg.statusValidasi === 'Ditolak' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Perlu Revisi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Menunggu</span>
                            </span>
                          )}
                          {keg.tanggalValidasi && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {keg.tanggalValidasi}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 italic text-[11px]">
                          {keg.catatanAtasan || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total Recap Footer in Document format */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-4">
                <span className="font-bold text-slate-800">
                  TOTAL AKTIVITAS: <span className="font-mono text-blue-700 text-sm">{userMonthlyData.totalKegiatan}</span>
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">
                  DISETUJUI: <span className="font-mono font-bold text-emerald-700">{userMonthlyData.approvedKegiatan}</span>
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">
                  JAM EFEKTIF: <span className="font-mono font-bold text-indigo-700">{userMonthlyData.totalJam} Jam</span>
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Penetapan: <span className="font-semibold text-slate-700">{pengaturan.kotaPenetapan}</span> • Atasan: <span className="font-semibold text-slate-700">{pengaturan.namaAtasan}</span>
              </div>
            </div>

          </div>

          {/* Legal Signatures Info Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Lembar Validasi & Pengesahan Rekapitulasi Kinerja Bulanan
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Pegawai Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Yang Membuat / Melaporkan:</div>
                <div className="text-sm font-bold text-slate-900 mt-2">{activeUser.nama}</div>
                <div className="text-slate-600 font-mono mt-0.5">NIP. {activeUser.nip}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">{activeUser.pangkatGolongan} • {activeUser.jabatan}</div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center space-x-2 text-emerald-700 text-[11px] font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Telah diverifikasi sesuai entri akun pengguna</span>
                </div>
              </div>

              {/* Atasan Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Mengetahui / Menyetujui:</div>
                <div className="text-sm font-bold text-slate-900 mt-2">{pengaturan.namaAtasan}</div>
                <div className="text-slate-600 font-mono mt-0.5">NIP. {pengaturan.nipAtasan}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">{pengaturan.pangkatAtasan} • {pengaturan.jabatanAtasan}</div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center space-x-2 text-blue-700 text-[11px] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Validasi pejabat berwenang penilai kinerja</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* VIEW MODE 2: MATRIKS SELURUH PEGAWAI (Only accessible to Atasan / Admin) */}
      {viewMode === 'all' && !isRegularPegawai && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Matriks Evaluasi Kinerja Seluruh Pegawai ({BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun})</span>
            </h3>
            <span className="text-xs text-slate-500">
              {allStaffStats.length} Pegawai Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="py-3 px-3 text-center w-12">No.</th>
                  <th className="py-3 px-4">Nama Pegawai & NIP</th>
                  <th className="py-3 px-4">Jabatan & Unit Kerja</th>
                  <th className="py-3 px-3 text-center">Total Tugas</th>
                  <th className="py-3 px-3 text-center">Disetujui</th>
                  <th className="py-3 px-3 text-center">Menunggu</th>
                  <th className="py-3 px-3 text-center">Jam Kerja</th>
                  <th className="py-3 px-3 text-center">Tingkat Validasi</th>
                  <th className="py-3 px-4 text-center">Predikat Kinerja</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allStaffStats.map((stat, idx) => (
                  <tr key={stat.pegawai.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-3 text-center font-medium text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{stat.pegawai.nama}</div>
                      <div className="text-[11px] font-mono text-slate-500">NIP. {stat.pegawai.nip}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{stat.pegawai.jabatan}</div>
                      <div className="text-[10px] text-slate-500">{stat.pegawai.unitKerja}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-900 font-mono text-sm">
                      {stat.totalKegiatan}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-700 font-mono">
                      {stat.approvedKegiatan}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-600 font-mono">
                      {stat.pendingKegiatan}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-700">
                      {stat.totalJam} Jam
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-emerald-700 font-bold">
                      {stat.totalKegiatan > 0 ? Math.round((stat.approvedKegiatan / stat.totalKegiatan) * 100) : 100}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${stat.predikatColor}`}>
                        {stat.predikat}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => {
                          if (setSelectedPegawaiId) {
                            setSelectedPegawaiId(stat.pegawai.id);
                          }
                          setViewMode('personal');
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        Lihat Rekap
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>* Penilaian kinerja mengacu pada bukti dukung keluaran / outcome harian yang divalidasi oleh atasan langsung.</span>
            <span className="font-semibold text-slate-700">Diverifikasi oleh: {pengaturan.namaAtasan}</span>
          </div>
        </div>
      )}

    </div>
  );
};
