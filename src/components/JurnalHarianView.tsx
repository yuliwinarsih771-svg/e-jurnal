import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  Info,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  FileDown,
  Loader2,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { KegiatanJurnal, Pegawai, PengaturanInstansi } from '../types';
import { BULAN_INDONESIA, formatTanggalIndonesia, exportJurnalToExcel, exportJurnalToWord, exportJurnalHtmlToPdf } from '../utils/exportUtils';
import { EditProfilJurnalModal } from './EditProfilJurnalModal';
import { PRESET_LOGO_PEMDA } from '../utils/presetLogos';

interface JurnalHarianViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  pengaturan: PengaturanInstansi;
  kegiatanList: KegiatanJurnal[];
  onAddKegiatan: () => void;
  onEditKegiatan: (kegiatan: KegiatanJurnal) => void;
  onDeleteKegiatan: (id: string) => void;
  onBatchDeleteKegiatan?: (ids: string[]) => void;
  onOpenPrintModal: (mode?: 'harian' | 'mingguan' | 'bulanan', tanggal?: string) => void;
  selectedBulan: number;
  setSelectedBulan: (bulan: number) => void;
  selectedTahun: number;
  setSelectedTahun: (tahun: number) => void;
  selectedPegawaiId: string;
  setSelectedPegawaiId: (id: string) => void;
  onNavigateToRekap?: () => void;
  onUpdatePegawai?: (pegawaiId: string, updatedData: Partial<Pegawai>) => void;
  onUpdatePengaturan?: (pegawaiId: string, updatedSettings: Partial<PengaturanInstansi>) => void;
  initialPeriodeMode?: 'harian' | 'mingguan' | 'bulanan';
}

export const JurnalHarianView: React.FC<JurnalHarianViewProps> = ({
  currentPegawai,
  allPegawai,
  pengaturan,
  kegiatanList,
  onAddKegiatan,
  onEditKegiatan,
  onDeleteKegiatan,
  onBatchDeleteKegiatan,
  onOpenPrintModal,
  selectedBulan,
  setSelectedBulan,
  selectedTahun,
  setSelectedTahun,
  selectedPegawaiId,
  setSelectedPegawaiId,
  onNavigateToRekap,
  onUpdatePegawai,
  onUpdatePengaturan,
  initialPeriodeMode = 'bulanan',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Disetujui' | 'Menunggu' | 'Ditolak'>('all');
  const [isEditProfilModalOpen, setIsEditProfilModalOpen] = useState(false);
  
  // Period Mode: Harian | Mingguan | Bulanan
  const [periodeMode, setPeriodeMode] = useState<'harian' | 'mingguan' | 'bulanan'>(initialPeriodeMode);
  const [selectedTanggalHarian, setSelectedTanggalHarian] = useState<string>(() => {
    const d = new Date();
    return `${selectedTahun}-${selectedBulan.toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  });
  const [selectedMingguKe, setSelectedMingguKe] = useState<number>(1);

  // Sync mode whenever initialPeriodeMode prop changes (e.g., from top Navbar tabs)
  React.useEffect(() => {
    if (initialPeriodeMode) {
      setPeriodeMode(initialPeriodeMode);
    }
  }, [initialPeriodeMode]);

  // Delete confirmation modal states
  const [kegiatanToDelete, setKegiatanToDelete] = useState<KegiatanJurnal | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Active target employee being viewed
  const targetPegawai = useMemo(() => {
    return allPegawai.find(p => p.id === selectedPegawaiId) || currentPegawai;
  }, [allPegawai, selectedPegawaiId, currentPegawai]);

  const bulanNama = BULAN_INDONESIA[selectedBulan - 1] || 'Januari';

  const rentangMingguanText = selectedMingguKe === 1 ? `01 s/d 07 ${bulanNama}`
    : selectedMingguKe === 2 ? `08 s/d 14 ${bulanNama}`
    : selectedMingguKe === 3 ? `15 s/d 21 ${bulanNama}`
    : selectedMingguKe === 4 ? `22 s/d 28 ${bulanNama}`
    : `29 s/d Akhir ${bulanNama}`;

  const currentJudulDokumen = periodeMode === 'harian'
    ? 'JURNAL HARIAN KINERJA PEGAWAI'
    : periodeMode === 'mingguan'
      ? 'JURNAL MINGGUAN KINERJA PEGAWAI'
      : (pengaturan.judulDokumen || 'JURNAL BULANAN KINERJA PEGAWAI');

  const currentSubJudulDokumen = periodeMode === 'harian'
    ? `HARIAN - TANGGAL ${formatTanggalIndonesia(selectedTanggalHarian).toUpperCase()}`
    : periodeMode === 'mingguan'
      ? `MINGGU KE-${selectedMingguKe} (${rentangMingguanText.toUpperCase()}) BULAN ${bulanNama.toUpperCase()} ${selectedTahun}`
      : `BULAN ${bulanNama.toUpperCase()} ${selectedTahun}`;

  // Filter activities for this employee, selected period, month, and year
  const filteredKegiatan = useMemo(() => {
    return kegiatanList
      .filter((keg) => keg.pegawaiId === targetPegawai.id)
      .filter((keg) => {
        if (!keg.tanggal) return false;
        const [yStr, mStr, dStr] = keg.tanggal.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        const d = parseInt(dStr, 10);

        if (periodeMode === 'harian') {
          return keg.tanggal === selectedTanggalHarian;
        }

        if (periodeMode === 'mingguan') {
          if (y !== selectedTahun || m !== selectedBulan) return false;
          if (selectedMingguKe === 1) return d >= 1 && d <= 7;
          if (selectedMingguKe === 2) return d >= 8 && d <= 14;
          if (selectedMingguKe === 3) return d >= 15 && d <= 21;
          if (selectedMingguKe === 4) return d >= 22 && d <= 28;
          if (selectedMingguKe === 5) return d >= 29;
          return true;
        }

        // Bulanan
        if (y !== selectedTahun) return false;
        if (m !== selectedBulan) return false;
        return true;
      })
      .filter((keg) => {
        if (statusFilter === 'all') return true;
        return keg.statusValidasi === statusFilter;
      })
      .filter((keg) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          keg.kegiatan.toLowerCase().includes(term) ||
          keg.outputHasil.toLowerCase().includes(term) ||
          keg.hari.toLowerCase().includes(term) ||
          keg.nomorKegiatan.includes(term)
        );
      })
      .sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
        return a.waktuMulai.localeCompare(b.waktuMulai);
      });
  }, [kegiatanList, targetPegawai.id, selectedBulan, selectedTahun, statusFilter, searchTerm, periodeMode, selectedTanggalHarian, selectedMingguKe]);

  // Monthly recapitulation stats for target employee
  const monthlyRecapStats = useMemo(() => {
    const monthKegiatan = kegiatanList.filter((k) => {
      if (k.pegawaiId !== targetPegawai.id) return false;
      if (!k.tanggal) return false;
      const [y, m] = k.tanggal.split('-');
      return parseInt(y, 10) === selectedTahun && parseInt(m, 10) === selectedBulan;
    });

    const total = monthKegiatan.length;
    const approved = monthKegiatan.filter(k => k.statusValidasi === 'Disetujui').length;
    const pending = monthKegiatan.filter(k => k.statusValidasi === 'Menunggu').length;
    const rejected = monthKegiatan.filter(k => k.statusValidasi === 'Ditolak').length;

    let totalMenit = 0;
    monthKegiatan.forEach(k => {
      if (k.waktuMulai && k.waktuSelesai) {
        const [sh, sm] = k.waktuMulai.split(':').map(Number);
        const [eh, em] = k.waktuSelesai.split(':').map(Number);
        const duration = (eh * 60 + em) - (sh * 60 + sm);
        if (duration > 0) totalMenit += duration;
      }
    });

    const totalJam = (totalMenit / 60).toFixed(1);
    const persenApproved = total > 0 ? Math.round((approved / total) * 100) : 100;

    return {
      total,
      approved,
      pending,
      rejected,
      totalJam,
      persenApproved,
    };
  }, [kegiatanList, targetPegawai.id, selectedBulan, selectedTahun]);

  const handleExportExcel = () => {
    const cleanName = targetPegawai.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = periodeMode === 'harian'
      ? `Jurnal_Harian_${cleanName}_${selectedTanggalHarian}.xlsx`
      : periodeMode === 'mingguan'
        ? `Jurnal_Mingguan_${cleanName}_Minggu_${selectedMingguKe}_${bulanNama}_${selectedTahun}.xlsx`
        : `Jurnal_Bulanan_${cleanName}_${bulanNama}_${selectedTahun}.xlsx`;

    exportJurnalToExcel(
      targetPegawai,
      pengaturan,
      filteredKegiatan,
      selectedBulan,
      selectedTahun,
      currentSubJudulDokumen,
      currentJudulDokumen,
      fileName
    );
  };

  const handleExportWord = () => {
    const cleanName = targetPegawai.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = periodeMode === 'harian'
      ? `Jurnal_Harian_${cleanName}_${selectedTanggalHarian}.doc`
      : periodeMode === 'mingguan'
        ? `Jurnal_Mingguan_${cleanName}_Minggu_${selectedMingguKe}_${bulanNama}_${selectedTahun}.doc`
        : `Jurnal_Bulanan_${cleanName}_${bulanNama}_${selectedTahun}.doc`;

    exportJurnalToWord(
      targetPegawai,
      pengaturan,
      filteredKegiatan,
      selectedBulan,
      selectedTahun,
      currentSubJudulDokumen,
      currentJudulDokumen,
      fileName
    );
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const cleanName = targetPegawai.nama.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = periodeMode === 'harian'
        ? `Jurnal_Harian_${cleanName}_${selectedTanggalHarian}.pdf`
        : periodeMode === 'mingguan'
          ? `Jurnal_Mingguan_${cleanName}_Minggu_${selectedMingguKe}_${bulanNama}_${selectedTahun}.pdf`
          : `Jurnal_Bulanan_${cleanName}_${bulanNama}_${selectedTahun}.pdf`;

      await exportJurnalHtmlToPdf(
        targetPegawai,
        pengaturan,
        filteredKegiatan,
        selectedBulan,
        selectedTahun,
        fileName,
        'landscape',
        currentSubJudulDokumen,
        currentJudulDokumen
      );

      confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
      setDeleteToast('Berkas PDF resmi berhasil diunduh ke perangkat Anda!');
      setTimeout(() => setDeleteToast(null), 3500);
    } catch (err) {
      console.error('Gagal membuat PDF langsung:', err);
      // Fallback: open print modal where user can print or save as PDF
      onOpenPrintModal(periodeMode, selectedTanggalHarian);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Edit and delete are always active so user has full control
  const canEdit = true;

  // Single delete execution
  const handleConfirmSingleDelete = () => {
    if (!kegiatanToDelete) return;
    const kegName = kegiatanToDelete.kegiatan;
    const kegNo = kegiatanToDelete.nomorKegiatan;
    onDeleteKegiatan(kegiatanToDelete.id);
    
    // Remove from selection if selected
    setSelectedIds(prev => prev.filter(id => id !== kegiatanToDelete.id));
    
    setKegiatanToDelete(null);
    setDeleteToast(`Kegiatan #${kegNo} ("${kegName.slice(0, 30)}...") berhasil dihapus!`);
    setTimeout(() => setDeleteToast(null), 3500);
  };

  // Batch delete execution
  const handleConfirmBatchDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (onBatchDeleteKegiatan) {
      onBatchDeleteKegiatan(selectedIds);
    } else {
      selectedIds.forEach(id => onDeleteKegiatan(id));
    }
    setSelectedIds([]);
    setIsBatchDeleteModalOpen(false);
    setDeleteToast(`${count} kegiatan jurnal berhasil dihapus!`);
    setTimeout(() => setDeleteToast(null), 3500);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredKegiatan.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredKegiatan.map(k => k.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">

      {/* Delete Feedback Toast */}
      {deleteToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteToast}</span>
          </div>
          <button 
            onClick={() => setDeleteToast(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Batch Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-red-600 text-white font-bold text-xs rounded-lg">
              {selectedIds.length} Dipilih
            </span>
            <span className="text-xs text-red-900 font-semibold">
              kegiatan siap dihapus secara bersamaan
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              Batal Pilih
            </button>
            <button
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus {selectedIds.length} Terpilih</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Top Filter & Control Card with Period Mode Selector */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              Pilihan Jurnal Kinerja
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <span>{currentJudulDokumen}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentSubJudulDokumen}
            </p>
          </div>

          {/* Period Mode Switcher Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPeriodeMode('harian')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                periodeMode === 'harian'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jurnal Harian</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodeMode('mingguan')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                periodeMode === 'mingguan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Jurnal Mingguan</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodeMode('bulanan')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                periodeMode === 'bulanan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Jurnal Bulanan</span>
            </button>
          </div>
        </div>

        {/* Filters row: Employee + Period Selector + Status */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Employee Selector (if Admin, Atasan, or Super Admin) */}
            {(currentPegawai.role === 'admin' || currentPegawai.role === 'atasan' || currentPegawai.role === 'superadmin') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Pilih Pegawai
                </label>
                <select
                  value={selectedPegawaiId}
                  onChange={(e) => setSelectedPegawaiId(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {allPegawai.map((peg) => (
                    <option key={peg.id} value={peg.id}>
                      {peg.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Harian Date Picker with quick today shortcut */}
            {periodeMode === 'harian' && (
              <div>
                <label className="block text-[11px] font-bold text-blue-600 uppercase mb-1 flex items-center justify-between">
                  <span>Pilih Tanggal</span>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setSelectedTanggalHarian(
                        `${selectedTahun}-${selectedBulan.toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
                      );
                    }}
                    className="text-[10px] text-blue-700 hover:underline font-bold ml-2 cursor-pointer"
                  >
                    Hari Ini
                  </button>
                </label>
                <input
                  type="date"
                  value={selectedTanggalHarian}
                  onChange={(e) => setSelectedTanggalHarian(e.target.value)}
                  className="text-xs font-bold text-slate-800 px-3 py-2 bg-blue-50/60 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* Mingguan Selector */}
            {periodeMode === 'mingguan' && (
              <div>
                <label className="block text-[11px] font-bold text-blue-600 uppercase mb-1">
                  Pilih Minggu
                </label>
                <select
                  value={selectedMingguKe}
                  onChange={(e) => setSelectedMingguKe(Number(e.target.value))}
                  className="text-xs font-bold text-slate-800 px-3 py-2 bg-blue-50/60 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value={1}>Minggu I (01 - 07 {bulanNama})</option>
                  <option value={2}>Minggu II (08 - 14 {bulanNama})</option>
                  <option value={3}>Minggu III (15 - 21 {bulanNama})</option>
                  <option value={4}>Minggu IV (22 - 28 {bulanNama})</option>
                  <option value={5}>Minggu V (29 - Akhir {bulanNama})</option>
                </select>
              </div>
            )}

            {/* Bulan Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Bulan
              </label>
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(parseInt(e.target.value, 10))}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tahun
              </label>
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(parseInt(e.target.value, 10))}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {[2023, 2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Status Validasi
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="Disetujui">Disetujui / Paraf</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Ditolak">Ditolak / Revisi</option>
              </select>
            </div>
          </div>

          {/* Action Buttons: Add, Excel, Word, PDF Langsung, Cetak / Pratinjau */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            <button
              onClick={onAddKegiatan}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kegiatan</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title={`Unduh ${periodeMode === 'harian' ? 'Harian' : periodeMode === 'mingguan' ? 'Mingguan' : 'Bulanan'} Format Excel (.xlsx)`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleExportWord}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title={`Unduh ${periodeMode === 'harian' ? 'Harian' : periodeMode === 'mingguan' ? 'Mingguan' : 'Bulanan'} Format Word (.doc)`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Word</span>
            </button>

            {/* Tombol PDF Langsung Aktif */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className={`px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer ${
                isExportingPdf ? 'opacity-80 cursor-wait' : ''
              }`}
              title={`Unduh Langsung File PDF (.pdf) untuk Jurnal ${periodeMode === 'harian' ? 'Harian' : periodeMode === 'mingguan' ? 'Mingguan' : 'Bulanan'}`}
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'Memproses PDF...' : 'PDF'}</span>
            </button>

            <button
              onClick={() => onOpenPrintModal(periodeMode, selectedTanggalHarian)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer ring-1 ring-slate-700"
              title={`Buka Pratinjau Dokumen Cetak Jurnal ${periodeMode === 'harian' ? 'Harian' : periodeMode === 'mingguan' ? 'Mingguan' : 'Bulanan'}`}
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>
                {periodeMode === 'harian'
                  ? 'Cetak Jurnal Harian'
                  : periodeMode === 'mingguan'
                    ? 'Cetak Jurnal Mingguan'
                    : 'Cetak Jurnal Bulanan'}
              </span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari uraian tugas, hasil output, atau hari..."
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{filteredKegiatan.length}</span> aktivitas kerja
          </div>
        </div>

      </div>

      {/* Monthly Recapitulation Quick Overview Card per User */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Rekapitulasi Bulanan Pegawai
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                  {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}
                </span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                {targetPegawai.nama} <span className="text-xs font-mono font-normal text-blue-200">(NIP. {targetPegawai.nip})</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-blue-200">Total Tugas</div>
              <div className="text-base font-black font-mono text-white">{monthlyRecapStats.total}</div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Disetujui</div>
              <div className="text-base font-black font-mono text-emerald-300">{monthlyRecapStats.approved}</div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-amber-200">Menunggu</div>
              <div className="text-base font-black font-mono text-amber-300">{monthlyRecapStats.pending}</div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-center min-w-[70px]">
              <div className="text-[10px] uppercase font-bold text-indigo-200">Jam Efektif</div>
              <div className="text-base font-black font-mono text-white">{monthlyRecapStats.totalJam} Jam</div>
            </div>

            {onNavigateToRekap && (
              <button
                onClick={onNavigateToRekap}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs shrink-0"
              >
                <span>Buka Rekap Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Document Sheet Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Document Header with Official Kop, Logo & Profile Editor Button */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
          
          {/* Official Kop Surat Instansi dengan Logo */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-5 mb-5 border-b-2 border-slate-900 gap-4">
            
            {/* Logo Instansi & Identitas Kop */}
            <div className="flex items-center space-x-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl border-2 border-slate-200 p-1.5 flex items-center justify-center shadow-xs overflow-hidden">
                  <img
                    src={pengaturan.logoUrl || PRESET_LOGO_PEMDA}
                    alt="Logo Instansi"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfilModalOpen(true)}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition cursor-pointer"
                  title="Klik untuk ganti logo instansi"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>

              <div className="text-center sm:text-left">
                <div className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 uppercase">
                  {pengaturan.namaInstansi}
                </div>
                <div className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-tight">
                  {pengaturan.badanDinas}
                </div>
                <div className="text-xs font-bold text-slate-700 uppercase">
                  {pengaturan.bidangBagian || targetPegawai.unitKerja}
                </div>
                {pengaturan.alamat && (
                  <div className="text-[11px] text-slate-500 italic mt-0.5 max-w-xl">
                    {pengaturan.alamat}
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Aksi: Edit Profil & Logo di Menu Utama Jurnal */}
            <div className="shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => setIsEditProfilModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer hover:scale-102"
                title="Buka Form Edit Profil Pegawai, Kop Surat, dan Logo Instansi"
              >
                <Edit3 className="w-4 h-4 text-amber-300" />
                <span>Edit Profil & Logo Jurnal</span>
              </button>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-wide uppercase font-serif">
              {pengaturan.judulDokumen}
            </h2>
            <p className="text-sm font-bold text-slate-600 mt-1 uppercase">
              BULAN {BULAN_INDONESIA[selectedBulan - 1]?.toUpperCase()} {selectedTahun}
            </p>
          </div>

          {/* Identity Grid matching screenshot format with inline edit button */}
          <div className="max-w-xl mx-auto bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold space-y-2 relative">
            <div className="grid grid-cols-12 gap-1 items-center">
              <span className="col-span-3 text-slate-500 font-bold">NAMA</span>
              <span className="col-span-1 text-slate-400 text-center">:</span>
              <span className="col-span-8 text-slate-900 font-black uppercase">{targetPegawai.nama}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-center">
              <span className="col-span-3 text-slate-500 font-bold">NIP</span>
              <span className="col-span-1 text-slate-400 text-center">:</span>
              <span className="col-span-8 text-slate-800 font-mono font-bold">{targetPegawai.nip}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-center">
              <span className="col-span-3 text-slate-500 font-bold">JABATAN</span>
              <span className="col-span-1 text-slate-400 text-center">:</span>
              <span className="col-span-8 text-slate-800 uppercase">{targetPegawai.jabatan}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-center">
              <span className="col-span-3 text-slate-500 font-bold">UNIT KERJA</span>
              <span className="col-span-1 text-slate-400 text-center">:</span>
              <span className="col-span-8 text-slate-800 uppercase">{targetPegawai.unitKerja}</span>
            </div>
            {targetPegawai.pangkatGolongan && (
              <div className="grid grid-cols-12 gap-1 items-center">
                <span className="col-span-3 text-slate-500 font-bold">PANGKAT/GOL.</span>
                <span className="col-span-1 text-slate-400 text-center">:</span>
                <span className="col-span-8 text-slate-800">{targetPegawai.pangkatGolongan}</span>
              </div>
            )}

            <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Pejabat Penilai: <strong className="text-slate-600">{pengaturan.namaAtasan || '-'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsEditProfilModalOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah Profil & Logo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table View (Formatted exactly as the government journal standard) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 border-b border-t border-slate-300 font-bold divide-x divide-slate-300">
                <th className="py-3 px-2 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredKegiatan.length > 0 && selectedIds.length === filteredKegiatan.length}
                    onChange={toggleSelectAll}
                    title="Pilih Semua untuk Hapus Massal"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 text-center w-12">No.</th>
                <th className="py-3 px-3 text-center w-20">Hari</th>
                <th className="py-3 px-3 text-center w-24">Tanggal</th>
                <th className="py-3 px-3 text-center w-20">Nomor Kegiatan</th>
                <th className="py-3 px-3 text-center w-28">Waktu</th>
                <th className="py-3 px-4 min-w-[260px]">Kegiatan / Pekerjaan</th>
                <th className="py-3 px-4 min-w-[260px]">Keluaran / Hasil (Output / Outcome)</th>
                <th className="py-3 px-3 text-center min-w-[150px]">Validasi Atasan Langsung (paraf)</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredKegiatan.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 bg-white">
                    <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Belum ada aktivitas kerja tercatat untuk bulan ini.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Klik tombol &ldquo;Tambah Kegiatan&rdquo; di atas untuk mencatat pekerjaan harian Anda.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredKegiatan.map((keg, index) => {
                  const isApproved = keg.statusValidasi === 'Disetujui';
                  const isRejected = keg.statusValidasi === 'Ditolak';
                  const isSelected = selectedIds.includes(keg.id);

                  return (
                    <tr 
                      key={keg.id}
                      className={`hover:bg-blue-50/40 transition divide-x divide-slate-200 ${
                        isSelected ? 'bg-red-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(keg.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* No. */}
                      <td className="py-3 px-2 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>

                      {/* Hari */}
                      <td className="py-3 px-3 text-center font-medium text-slate-800">
                        {keg.hari}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {formatTanggalIndonesia(keg.tanggal)}
                      </td>

                      {/* Nomor Kegiatan */}
                      <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                        {keg.nomorKegiatan || (index + 1).toString().padStart(2, '0')}
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {keg.waktuMulai} - {keg.waktuSelesai}
                      </td>

                      {/* Kegiatan / Pekerjaan with ► */}
                      <td className="py-3 px-4 text-slate-800 leading-relaxed">
                        <div className="flex items-start space-x-1.5">
                          <span className="text-blue-600 font-black text-xs select-none">►</span>
                          <div className="space-y-1.5 w-full">
                            <span className="font-semibold text-slate-900">{keg.kegiatan}</span>

                            {/* Sub-Aktivitas List (One-to-Many) */}
                            {Array.isArray(keg.subAktivitasList) && keg.subAktivitasList.length > 0 && (
                              <div className="mt-1 pl-2 border-l-2 border-slate-200 space-y-0.5">
                                {keg.subAktivitasList.map((sub, sIdx) => (
                                  <div key={sub.id || sIdx} className="text-[11px] flex items-center space-x-1.5 text-slate-600">
                                    <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'Selesai' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                    <span className={sub.status === 'Selesai' ? 'text-slate-700' : 'text-slate-500'}>{sub.uraian}</span>
                                    {sub.status === 'Selesai' && <span className="text-[9px] text-emerald-600 font-bold">(✓)</span>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Lampiran List (One-to-Many) */}
                            {Array.isArray(keg.lampiranList) && keg.lampiranList.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {keg.lampiranList.map((lamp, lIdx) => (
                                  <a
                                    key={lamp.id || lIdx}
                                    href={lamp.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                                    title={lamp.url}
                                  >
                                    <span>📎</span>
                                    <span className="truncate max-w-[120px]">{lamp.judul}</span>
                                    <span>↗</span>
                                  </a>
                                ))}
                              </div>
                            ) : keg.tautanBukti ? (
                              <div className="mt-1">
                                <a 
                                  href={keg.tautanBukti} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] text-blue-600 underline font-medium hover:text-blue-800 inline-block"
                                >
                                  Evidence / Bukti Dukung ↗
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Keluaran / Hasil (Output / Outcome) */}
                      <td className="py-3 px-4 text-slate-700 leading-relaxed font-normal">
                        {keg.outputHasil}
                      </td>

                      {/* Validasi Atasan Langsung (paraf) */}
                      <td className="py-3 px-3 text-center align-middle">
                        {isApproved ? (
                          <div className="inline-flex flex-col items-center bg-emerald-50 border border-emerald-300 rounded-lg p-1.5 text-center shadow-2xs">
                            <div className="flex items-center space-x-1 text-emerald-700 font-bold text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>PARAF ELEKTRONIK</span>
                            </div>
                            <span className="text-[9px] text-emerald-600 font-mono mt-0.5">
                              {keg.tanggalValidasi?.split(' ')[0] || 'Valid'}
                            </span>
                            <span className="text-[8px] text-slate-400 truncate max-w-[120px]">
                              {keg.namaValidator || pengaturan.namaAtasan}
                            </span>
                          </div>
                        ) : isRejected ? (
                          <div className="inline-flex flex-col items-center bg-red-50 border border-red-200 rounded-lg p-1.5 text-center">
                            <span className="text-red-700 font-bold text-[10px] flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3 text-red-600" />
                              <span>PERLU REVISI</span>
                            </span>
                            {keg.catatanAtasan && (
                              <span className="text-[9px] text-red-600 italic mt-0.5 max-w-[120px] truncate" title={keg.catatanAtasan}>
                                &ldquo;{keg.catatanAtasan}&rdquo;
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                            <span>Menunggu</span>
                          </span>
                        )}
                      </td>

                      {/* Actions: Edit & Hapus (Aktif & Jelas) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onEditKegiatan(keg)}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50/80 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition shadow-2xs flex items-center space-x-1"
                            title="Edit Kegiatan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline text-[10px] font-bold">Edit</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setKegiatanToDelete(keg)}
                            className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                            title="Hapus Kegiatan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline text-[10px] font-bold">Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Total Aktivitas Banner (matching screenshot) */}
        <div className="bg-slate-100 border-t border-b border-slate-300 px-6 py-2.5 flex items-center justify-between text-xs font-bold text-slate-900">
          <span>TOTAL AKTIVITAS KERJA :</span>
          <span className="text-sm font-mono bg-white px-3 py-0.5 rounded border border-slate-300">
            {filteredKegiatan.length.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Signatures Block with Aligned Baseline for Both Names */}
        <div className="p-6 sm:p-8 bg-white border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-xs font-medium border-none border-collapse max-w-4xl">
            <tbody>
              {/* Row 1: Jabatan & Header */}
              <tr>
                <td className="w-1/2 align-top pb-2 pr-4">
                  <p className="text-slate-600">Mengetahui :</p>
                  <p className="font-bold text-slate-900 mt-0.5 text-xs">{pengaturan.jabatanAtasan}</p>
                  <p className="text-slate-500 text-[11px] leading-tight">{pengaturan.badanDinas}</p>
                </td>
                <td className="w-1/2 align-top pb-2 pl-4 sm:pl-8">
                  <p className="text-slate-600">
                    {pengaturan.kotaPenetapan}, {new Date().getDate()} {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5 text-xs">Yang Membuat,</p>
                  <p className="invisible select-none text-[11px] leading-tight">&nbsp;</p>
                </td>
              </tr>

              {/* Row 2: Ruang Tanda Tangan / Paraf Digital (Tinggi Sama Persis) */}
              <tr>
                <td className="h-16 align-middle py-1 pr-4">
                  <div className="px-3 py-1 bg-emerald-50 border border-dashed border-emerald-300 rounded-lg text-emerald-700 text-[10px] font-mono font-semibold inline-flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TERVERIFIKASI SISTEM ELEKTRONIK</span>
                  </div>
                </td>
                <td className="h-16 align-middle py-1 pl-4 sm:pl-8">
                  <span className="text-[11px] text-slate-400 italic">
                    Ditandatangani secara digital
                  </span>
                </td>
              </tr>

              {/* Row 3: Nama Pejabat & Pegawai (Tepat Sejajar / Lurus Horizontal di Baris yang Sama) */}
              <tr>
                <td className="align-top pt-2 pr-4">
                  <p className="font-bold text-slate-900 underline text-sm tracking-wide leading-normal">{pengaturan.namaAtasan}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{pengaturan.pangkatAtasan}</p>
                  <p className="text-slate-500 font-mono text-xs mt-0.5">NIP. {pengaturan.nipAtasan}</p>
                </td>
                <td className="align-top pt-2 pl-4 sm:pl-8">
                  <p className="font-bold text-slate-900 underline text-sm tracking-wide leading-normal">{targetPegawai.nama}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{targetPegawai.pangkatGolongan}</p>
                  <p className="text-slate-500 font-mono text-xs mt-0.5">NIP. {targetPegawai.nip}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Konfirmasi Hapus Kegiatan Satuan */}
      {kegiatanToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Kegiatan Jurnal?
                </h3>
                <p className="text-xs text-slate-500">
                  Kegiatan nomor #{kegiatanToDelete.nomorKegiatan}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{kegiatanToDelete.hari}, {formatTanggalIndonesia(kegiatanToDelete.tanggal)} ({kegiatanToDelete.waktuMulai} - {kegiatanToDelete.waktuSelesai})</span>
              </div>
              <p className="font-bold text-slate-900 pt-1">
                {kegiatanToDelete.kegiatan}
              </p>
              <p className="text-slate-600 text-[11px]">
                Output: {kegiatanToDelete.outputHasil}
              </p>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus baris kegiatan ini? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="mt-6 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setKegiatanToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Kegiatan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Massal (Batch) */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus {selectedIds.length} Kegiatan Terpilih?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan penghapusan massal
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600">
              Anda telah memilih <strong className="text-red-700">{selectedIds.length} baris kegiatan jurnal</strong>. Semua baris kegiatan yang dipilih akan dihapus secara permanen.
            </p>

            <div className="mt-6 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Terpilih</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Profil & Logo Jurnal Langsung di Menu Utama */}
      <EditProfilJurnalModal
        isOpen={isEditProfilModalOpen}
        onClose={() => setIsEditProfilModalOpen(false)}
        pegawai={targetPegawai}
        pengaturan={pengaturan}
        onSave={(updatedPeg, updatedPeng) => {
          if (onUpdatePegawai) {
            onUpdatePegawai(targetPegawai.id, updatedPeg);
          }
          if (onUpdatePengaturan) {
            onUpdatePengaturan(targetPegawai.id, updatedPeng);
          }
        }}
      />

    </div>
  );
};
