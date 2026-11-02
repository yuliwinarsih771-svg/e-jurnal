import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowLeft, 
  ArrowRight, 
  FileSpreadsheet, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CalendarDays,
  Sparkles,
  ClipboardList,
  Printer
} from 'lucide-react';
import { Pegawai, KegiatanJurnal, PresensiRecord, PengaturanInstansi } from '../types';
import { BULAN_INDONESIA, formatTanggalIndonesia } from '../utils/exportUtils';
import confetti from 'canvas-confetti';

interface MonitoringPegawaiHarianViewProps {
  currentPegawai: Pegawai; // Atasan yang sedang login
  allPegawai: Pegawai[];
  kegiatanList: KegiatanJurnal[];
  presensiList: PresensiRecord[];
  pengaturan: PengaturanInstansi;
  onApproveKegiatan: (id: string, catatan?: string) => void;
  onRejectKegiatan: (id: string, catatan: string) => void;
  onGoToVerifikasi?: () => void;
  onOpenPrintForPegawai?: (pegawai: Pegawai) => void;
}

export const MonitoringPegawaiHarianView: React.FC<MonitoringPegawaiHarianViewProps> = ({
  currentPegawai,
  allPegawai,
  kegiatanList,
  presensiList,
  pengaturan,
  onApproveKegiatan,
  onRejectKegiatan,
  onGoToVerifikasi,
  onOpenPrintForPegawai,
}) => {
  // Pegawai bawahan / staf yang dimonitor (untuk Super Admin: seluruh staf instansi non-superadmin)
  const subordinates = useMemo(() => {
    if (currentPegawai.role === 'superadmin') {
      return allPegawai.filter((p) => p.role !== 'superadmin');
    }
    return allPegawai.filter((p) => p.role === 'pegawai');
  }, [allPegawai, currentPegawai.role]);

  // Initial date: Check if there are existing dates in kegiatanList, prioritize the latest date or today
  const defaultDate = useMemo(() => {
    if (kegiatanList.length > 0) {
      // Find the most recent date from kegiatan
      const sortedDates = [...kegiatanList]
        .map((k) => k.tanggal)
        .sort((a, b) => b.localeCompare(a));
      return sortedDates[0];
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, [kegiatanList]);

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [filterStatus, setFilterStatus] = useState<'all' | 'sudah' | 'belum'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'harian' | 'matriks'>('harian');
  
  // Selected month/year for monthly compliance matrix
  const [matrixBulan, setMatrixBulan] = useState<number>(1); // Januari
  const [matrixTahun, setMatrixTahun] = useState<number>(2026);

  // Reminder Modal State
  const [reminderTarget, setReminderTarget] = useState<Pegawai | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Quick Action Approve Modal
  const [quickApproveId, setQuickApproveId] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState<string>('');

  // Format Indonesian full date label
  const formattedSelectedDate = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split('-');
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[dateObj.getDay()];
      const mName = BULAN_INDONESIA[parseInt(month, 10) - 1];
      return `${dayName}, ${parseInt(day, 10)} ${mName} ${year}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Date stepper handlers
  const handleStepDay = (step: number) => {
    try {
      const [year, month, day] = selectedDate.split('-');
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      dateObj.setDate(dateObj.getDate() + step);
      const newY = dateObj.getFullYear();
      const newM = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const newD = dateObj.getDate().toString().padStart(2, '0');
      setSelectedDate(`${newY}-${newM}-${newD}`);
    } catch {
      // ignore
    }
  };

  // Find all dates that have data for quick jumping
  const sampleDatesWithData = useMemo(() => {
    const dates = Array.from(new Set(kegiatanList.map((k) => k.tanggal))).sort((a, b) => b.localeCompare(a));
    return dates.slice(0, 6);
  }, [kegiatanList]);

  // Daily report status per subordinate for selectedDate
  const dailyPegawaiReports = useMemo(() => {
    return subordinates.map((pegawai) => {
      const kegiatanHariIni = kegiatanList.filter(
        (k) => k.pegawaiId === pegawai.id && k.tanggal === selectedDate
      ).sort((a, b) => a.waktuMulai.localeCompare(b.waktuMulai));

      const presensiHariIni = presensiList.find(
        (p) => p.pegawaiId === pegawai.id && p.tanggal === selectedDate
      );

      const hasFilled = kegiatanHariIni.length > 0;
      const countKegiatan = kegiatanHariIni.length;
      
      const countApproved = kegiatanHariIni.filter((k) => k.statusValidasi === 'Disetujui').length;
      const countPending = kegiatanHariIni.filter((k) => k.statusValidasi === 'Menunggu').length;
      const countRejected = kegiatanHariIni.filter((k) => k.statusValidasi === 'Ditolak').length;

      // Calculate total work minutes
      let totalMenit = 0;
      kegiatanHariIni.forEach((k) => {
        try {
          const [h1, m1] = k.waktuMulai.split(':').map(Number);
          const [h2, m2] = k.waktuSelesai.split(':').map(Number);
          const duration = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (duration > 0) totalMenit += duration;
        } catch {
          // ignore
        }
      });

      return {
        pegawai,
        hasFilled,
        kegiatanHariIni,
        presensiHariIni,
        countKegiatan,
        countApproved,
        countPending,
        countRejected,
        totalMenit,
      };
    });
  }, [subordinates, kegiatanList, presensiList, selectedDate]);

  // Filtered daily reports
  const filteredDailyReports = useMemo(() => {
    return dailyPegawaiReports.filter((item) => {
      // Filter by status
      if (filterStatus === 'sudah' && !item.hasFilled) return false;
      if (filterStatus === 'belum' && item.hasFilled) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.pegawai.nama.toLowerCase().includes(q);
        const matchNip = item.pegawai.nip.toLowerCase().includes(q);
        const matchJabatan = item.pegawai.jabatan.toLowerCase().includes(q);
        if (!matchName && !matchNip && !matchJabatan) return false;
      }

      return true;
    });
  }, [dailyPegawaiReports, filterStatus, searchQuery]);

  // Overall Statistics for selectedDate
  const stats = useMemo(() => {
    const totalPegawai = subordinates.length;
    const sudahMengisi = dailyPegawaiReports.filter((item) => item.hasFilled).length;
    const belumMengisi = totalPegawai - sudahMengisi;
    const persentase = totalPegawai > 0 ? Math.round((sudahMengisi / totalPegawai) * 100) : 0;
    
    const totalKegiatan = dailyPegawaiReports.reduce((acc, curr) => acc + curr.countKegiatan, 0);
    const totalPending = dailyPegawaiReports.reduce((acc, curr) => acc + curr.countPending, 0);
    const totalApproved = dailyPegawaiReports.reduce((acc, curr) => acc + curr.countApproved, 0);

    return {
      totalPegawai,
      sudahMengisi,
      belumMengisi,
      persentase,
      totalKegiatan,
      totalPending,
      totalApproved,
    };
  }, [subordinates.length, dailyPegawaiReports]);

  // Copy Reminder Message handler
  const handleCopyReminder = (pegawai: Pegawai) => {
    const message = `Yth. ${pegawai.nama} (NIP. ${pegawai.nip}),\n\n` +
      `Mengingatkan untuk segera mengisi Jurnal Harian Kinerja Pegawai untuk tanggal: ${formattedSelectedDate}.\n` +
      `Mohon agar dapat diselesaikan sebelum batas waktu hari ini agar dapat segera diverifikasi oleh Atasan Langsung.\n\n` +
      `Terima kasih.\n` +
      `Atasan Langsung: ${currentPegawai.nama}\n` +
      `(${pengaturan.bidangBagian || pengaturan.badanDinas})`;

    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Direct quick approve from monitoring
  const handleQuickApproveSubmit = () => {
    if (!quickApproveId) return;
    onApproveKegiatan(quickApproveId, quickNote.trim() || undefined);
    setQuickApproveId(null);
    setQuickNote('');
    confetti({ particleCount: 35, spread: 50 });
  };

  // Monthly Matrix Calculations
  const daysInMonth = useMemo(() => {
    return new Date(matrixTahun, matrixBulan, 0).getDate();
  }, [matrixBulan, matrixTahun]);

  const monthlyMatrixData = useMemo(() => {
    return subordinates.map((pegawai) => {
      const monthKegiatans = kegiatanList.filter((k) => {
        if (k.pegawaiId !== pegawai.id) return false;
        const [y, m] = k.tanggal.split('-').map(Number);
        return y === matrixTahun && m === matrixBulan;
      });

      // Distinct dates filled
      const filledDatesSet = new Set(monthKegiatans.map((k) => k.tanggal));

      // Build day by day status (1 .. daysInMonth)
      let filledWorkdays = 0;
      let totalWorkdays = 0;

      const dayDetails = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${matrixTahun}-${matrixBulan.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayOfWeek = new Date(matrixTahun, matrixBulan - 1, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun or Sat
        const hasData = filledDatesSet.has(dateStr);

        if (!isWeekend) {
          totalWorkdays++;
          if (hasData) filledWorkdays++;
        }

        dayDetails.push({
          day,
          dateStr,
          isWeekend,
          hasData,
        });
      }

      const complianceRate = totalWorkdays > 0 ? Math.round((filledWorkdays / totalWorkdays) * 100) : 0;

      return {
        pegawai,
        totalKegiatan: monthKegiatans.length,
        filledWorkdays,
        totalWorkdays,
        complianceRate,
        dayDetails,
      };
    });
  }, [subordinates, kegiatanList, matrixBulan, matrixTahun, daysInMonth]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Atasan Role Authority */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-950 uppercase tracking-wider flex items-center space-x-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {currentPegawai.role === 'superadmin' ? 'Hak Akses Super Admin' : 'Portal Khusus Atasan Langsung'}
                </span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200">
                {currentPegawai.role === 'superadmin' ? 'Monitoring Seluruh Jurnal Instansi' : 'Pejabat Penilai Kinerja'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentPegawai.role === 'superadmin' ? 'Monitoring & Pengecekan Seluruh Jurnal Pegawai' : 'Pengecekan Jurnal Harian Pegawai'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {currentPegawai.role === 'superadmin'
                ? 'Hak akses penuh Super Admin: Pantau kepatuhan seluruh pegawai dan pejabat instansi dalam mengisi jurnal harian setiap hari secara real-time.'
                : 'Pantau kepatuhan seluruh pegawai bawahan dalam mengisi jurnal harian setiap hari. Periksa uraian tugas, jam kerja, output, serta berikan pengingat bagi yang belum mengisi.'}
            </p>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
              <div>
                <span className="text-slate-400">Atasan Penilai:</span>{' '}
                <strong className="text-white font-semibold">{currentPegawai.nama}</strong>
              </div>
              <div>
                <span className="text-slate-400">NIP:</span>{' '}
                <span className="font-mono text-white">{currentPegawai.nip}</span>
              </div>
              <div>
                <span className="text-slate-400">Jabatan:</span>{' '}
                <span className="text-white">{currentPegawai.jabatan}</span>
              </div>
            </div>
          </div>

          {/* Quick Tab Switcher: Harian vs Matriks Bulanan */}
          <div className="bg-white/10 p-1.5 rounded-2xl flex items-center shrink-0 border border-white/15">
            <button
              onClick={() => setActiveSubTab('harian')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
                activeSubTab === 'harian'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Cek Harian</span>
            </button>
            <button
              onClick={() => setActiveSubTab('matriks')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
                activeSubTab === 'matriks'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Matriks Kepatuhan Bulanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: PENGECEKAN HARIAN */}
      {activeSubTab === 'harian' && (
        <div className="space-y-6">
          
          {/* Tanggal Picker & Navigation Toolbar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Active Date Display with Step buttons */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tanggal Pengecekan Jurnal
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
                    <span>{formattedSelectedDate}</span>
                  </div>
                </div>
              </div>

              {/* Controls: Date Input & Quick Jump Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Previous & Next Buttons */}
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    onClick={() => handleStepDay(-1)}
                    title="Hari Sebelumnya"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStepDay(1)}
                    title="Hari Berikutnya"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Date Picker Input */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                {/* Quick jump to Today */}
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedDate(today);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Hari Ini
                </button>

                {/* Quick jumps to sample dates with data */}
                {sampleDatesWithData.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`hidden sm:inline-flex px-3 py-2 rounded-xl text-xs font-bold transition ${
                      selectedDate === d
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Daily Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Total Pegawai Bawahan */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Total Pegawai</div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  {stats.totalPegawai} <span className="text-xs font-medium text-slate-400">Orang</span>
                </div>
              </div>
            </div>

            {/* Sudah Mengisi */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-xs bg-emerald-50/20 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-700">Sudah Mengisi</div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-900 mt-0.5">
                  {stats.sudahMengisi} <span className="text-xs font-medium text-emerald-600">({stats.persentase}%)</span>
                </div>
              </div>
            </div>

            {/* Belum Mengisi */}
            <div className={`rounded-2xl p-4 sm:p-5 border shadow-xs flex items-center space-x-4 ${
              stats.belumMengisi > 0
                ? 'bg-rose-50/50 border-rose-200'
                : 'bg-white border-slate-200'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                stats.belumMengisi > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-xs font-semibold ${stats.belumMengisi > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                  Belum Mengisi
                </div>
                <div className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${stats.belumMengisi > 0 ? 'text-rose-900' : 'text-slate-900'}`}>
                  {stats.belumMengisi} <span className="text-xs font-medium text-slate-400">Pegawai</span>
                </div>
              </div>
            </div>

            {/* Total Kegiatan */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Total Kegiatan</div>
                <div className="text-xl sm:text-2xl font-extrabold text-blue-900 mt-0.5">
                  {stats.totalKegiatan} <span className="text-xs font-medium text-slate-400">Entri</span>
                </div>
                {stats.totalPending > 0 && (
                  <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                    {stats.totalPending} menunggu verifikasi
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Pegawai ({subordinates.length})
              </button>
              <button
                onClick={() => setFilterStatus('sudah')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  filterStatus === 'sudah'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sudah Mengisi ({stats.sudahMengisi})</span>
              </button>
              <button
                onClick={() => setFilterStatus('belum')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  filterStatus === 'belum'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Belum Mengisi ({stats.belumMengisi})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau NIP pegawai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

          </div>

          {/* List of Subordinate Employee Daily Status Cards */}
          <div className="space-y-4">
            {filteredDailyReports.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  Tidak ada pegawai yang sesuai dengan filter
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Coba ubah kriteria pencarian atau status filter.
                </p>
              </div>
            ) : (
              filteredDailyReports.map((report) => {
                const { pegawai, hasFilled, kegiatanHariIni, presensiHariIni, countKegiatan, totalMenit } = report;
                const hours = Math.floor(totalMenit / 60);
                const mins = totalMenit % 60;

                return (
                  <div
                    key={pegawai.id}
                    className={`bg-white rounded-3xl border transition shadow-xs overflow-hidden ${
                      hasFilled
                        ? 'border-slate-200 hover:border-blue-300'
                        : 'border-rose-200 bg-rose-50/10'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                      
                      {/* Pegawai Info */}
                      <div className="flex items-start sm:items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                          hasFilled
                            ? 'bg-blue-100 text-blue-700 ring-4 ring-blue-50'
                            : 'bg-rose-100 text-rose-700 ring-4 ring-rose-50'
                        }`}>
                          {pegawai.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {pegawai.nama}
                            </h3>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              NIP. {pegawai.nip}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{pegawai.jabatan}</span>
                            <span>&bull;</span>
                            <span>{pegawai.pangkatGolongan}</span>
                            <span>&bull;</span>
                            <span className="text-slate-400">{pegawai.unitKerja}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        {hasFilled ? (
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1.5 shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Sudah Mengisi ({countKegiatan} Kegiatan)</span>
                            </span>
                            {totalMenit > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{hours > 0 ? `${hours}j ` : ''}{mins}m</span>
                              </span>
                            )}
                            {onOpenPrintForPegawai && (
                              <button
                                onClick={() => onOpenPrintForPegawai(pegawai)}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                                title="Cetak / Unduh PDF Dokumen Resmi Pegawai Ini"
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-600" />
                                <span>Cetak / PDF</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1.5 shadow-2xs">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Belum Mengisi Jurnal</span>
                            </span>
                            <button
                              onClick={() => {
                                setReminderTarget(pegawai);
                                handleCopyReminder(pegawai);
                              }}
                              className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition flex items-center space-x-1.5 shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Kirim Pengingat</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Body: Activity Details or Missing Notice */}
                    {hasFilled ? (
                      <div className="p-5 sm:p-6 bg-slate-50/50">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                          <span>Daftar Kegiatan yang Dilaporkan ({kegiatanHariIni.length})</span>
                          <span className="text-[11px] font-medium text-slate-500 lowercase">
                            jam kantor {pengaturan.jamMasukNormal} - {pengaturan.jamPulangNormal}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-white">
                                <th className="py-2.5 px-3 w-16 text-center">Waktu</th>
                                <th className="py-2.5 px-3 w-12 text-center">No</th>
                                <th className="py-2.5 px-3">Uraian Tugas / Kegiatan</th>
                                <th className="py-2.5 px-3">Output / Hasil Kerja</th>
                                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                                <th className="py-2.5 px-3 w-28 text-center">Aksi Cepat</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {kegiatanHariIni.map((keg) => (
                                <tr key={keg.id} className="hover:bg-blue-50/40 transition">
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-center whitespace-nowrap bg-slate-50/60">
                                    {keg.waktuMulai} - {keg.waktuSelesai}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-500 text-center">
                                    {keg.nomorKegiatan}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs sm:max-w-md">
                                    {keg.kegiatan}
                                    {keg.catatanAtasan && (
                                      <div className="mt-1 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                                        <strong>Catatan Atasan:</strong> {keg.catatanAtasan}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600">
                                    {keg.outputHasil}
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    {keg.statusValidasi === 'Disetujui' && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        ✓ Disetujui
                                      </span>
                                    )}
                                    {keg.statusValidasi === 'Menunggu' && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                        ⏳ Menunggu
                                      </span>
                                    )}
                                    {keg.statusValidasi === 'Ditolak' && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        ✕ Ditolak
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    {keg.statusValidasi === 'Menunggu' ? (
                                      <button
                                        onClick={() => {
                                          setQuickApproveId(keg.id);
                                          setQuickNote('Kegiatan disetujui dan telah diverifikasi');
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-2xs"
                                      >
                                        Setujui
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-slate-400">
                                        Tervalidasi
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    ) : (
                      <div className="p-6 bg-rose-50/20 text-center">
                        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-rose-900">
                          Belum Ada Laporan Jurnal Kinerja
                        </h4>
                        <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">
                          Pegawai ini belum memasukkan aktivitas pekerjaan untuk tanggal <strong>{formattedSelectedDate}</strong>.
                        </p>
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setReminderTarget(pegawai);
                              handleCopyReminder(pegawai);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 transition shadow-2xs"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Teks Pengingat untuk {pegawai.nama.split(' ')[0]}</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* VIEW MODE 2: MATRIKS KEPATUHAN BULANAN */}
      {activeSubTab === 'matriks' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          
          {/* Header & Month/Year Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Matriks Kepatuhan Pengisian Jurnal Bulanan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau keaktifan pegawai tiap tanggal dalam satu bulan penuh (Hijau = Mengisi, Merah = Belum Mengisi di Hari Kerja).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={matrixBulan}
                onChange={(e) => setMatrixBulan(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {BULAN_INDONESIA.map((bulan, idx) => (
                  <option key={bulan} value={idx + 1}>
                    {bulan}
                  </option>
                ))}
              </select>

              <select
                value={matrixTahun}
                onChange={(e) => setMatrixTahun(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-600">Sudah Mengisi Jurnal</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block" />
              <span className="text-slate-600">Bolong / Belum Mengisi (Hari Kerja)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 inline-block" />
              <span className="text-slate-400">Akhir Pekan (Sabtu / Minggu)</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-48 sticky left-0 bg-slate-100 z-10">Pegawai</th>
                  <th className="py-3 px-2 text-center w-20">Kepatuhan</th>
                  <th className="py-3 px-2 text-center w-16">Hari Isi</th>
                  
                  {/* Days 1 .. daysInMonth */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <th key={d} className="py-3 px-1.5 text-center min-w-[28px]">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {monthlyMatrixData.map((row) => (
                  <tr key={row.pegawai.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                      <div>{row.pegawai.nama}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">NIP. {row.pegawai.nip}</div>
                    </td>

                    <td className="py-3 px-2 text-center border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        row.complianceRate >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.complianceRate >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        {row.complianceRate}%
                      </span>
                    </td>

                    <td className="py-3 px-2 text-center font-bold text-slate-700 border-r border-slate-100">
                      {row.filledWorkdays}/{row.totalWorkdays}
                    </td>

                    {row.dayDetails.map((day) => {
                      const isTarget = selectedDate === day.dateStr;
                      return (
                        <td
                          key={day.day}
                          onClick={() => {
                            setSelectedDate(day.dateStr);
                            setActiveSubTab('harian');
                          }}
                          className={`py-3 px-1 text-center cursor-pointer transition relative ${
                            day.isWeekend
                              ? 'bg-slate-50/80 text-slate-300'
                              : day.hasData
                                ? 'bg-emerald-50/50 hover:bg-emerald-100'
                                : 'bg-rose-50/30 hover:bg-rose-100'
                          }`}
                          title={`${day.dateStr}: ${
                            day.isWeekend
                              ? 'Akhir Pekan'
                              : day.hasData
                                ? 'Sudah Mengisi (Klik untuk lihat)'
                                : 'Belum Mengisi (Klik untuk lihat)'
                          }`}
                        >
                          {day.isWeekend ? (
                            <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />
                          ) : day.hasData ? (
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white font-bold inline-flex items-center justify-center text-[9px] shadow-2xs">
                              ✓
                            </span>
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Reminder Pop-up / Modal */}
      {reminderTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-600">
                <Send className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">
                  Format Pesan Pengingat Jurnal
                </h3>
              </div>
              <button
                onClick={() => setReminderTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Kirimkan teguran / pengingat ramah kepada <strong>{reminderTarget.nama}</strong> untuk segera mengisi jurnal harian tanggal <strong>{formattedSelectedDate}</strong>:
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
              {`Yth. ${reminderTarget.nama} (NIP. ${reminderTarget.nip}),\n\n` +
              `Mengingatkan untuk segera mengisi Jurnal Harian Kinerja Pegawai untuk tanggal: ${formattedSelectedDate}.\n` +
              `Mohon agar dapat diselesaikan hari ini agar dapat segera diverifikasi oleh Atasan Langsung.\n\n` +
              `Terima kasih.\n` +
              `Atasan Langsung: ${currentPegawai.nama}\n` +
              `(${pengaturan.bidangBagian || pengaturan.badanDinas})`}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {isCopied ? (
                  <span className="text-emerald-600 font-bold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Teks berhasil disalin ke clipboard!</span>
                  </span>
                ) : (
                  'Salin dan kirim melalui WhatsApp atau pesan internal.'
                )}
              </span>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleCopyReminder(reminderTarget)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center space-x-1.5 shadow-xs"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Tersalin' : 'Salin Teks'}</span>
                </button>
                <button
                  onClick={() => setReminderTarget(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Approve Modal */}
      {quickApproveId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Persetujuan & Paraf Cepat
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Setujui kegiatan kinerja bawahan ini dan bubuhkan paraf elektronik Atasan Langsung. Anda dapat menambahkan catatan opsional jika diperlukan.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Arahan / Apresiasi (Opsional):
              </label>
              <textarea
                rows={3}
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Contoh: Kegiatan disetujui dan telah diverifikasi dengan baik."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setQuickApproveId(null);
                  setQuickNote('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleQuickApproveSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
              >
                Bubuhkan Paraf & Setujui
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
