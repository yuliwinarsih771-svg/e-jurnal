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
    <div className="space-y-1 sm:space-y-6">

      {/* Delete Feedback Toast */}
      {deleteToast && (
        <div className="p-1.5 sm:p-4 bg-emerald-50 border border-emerald-300 rounded-lg sm:rounded-2xl text-emerald-800 text-[9.5px] sm:text-xs font-bold flex items-center justify-between shadow-2xs sm:shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>{deleteToast}</span>
          </div>
          <button 
            onClick={() => setDeleteToast(null)}
            className="text-emerald-700 hover:text-emerald-950 p-0.5 sm:p-1"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {/* Batch Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-1.5 sm:p-3.5 bg-red-50 border border-red-200 rounded-lg sm:rounded-2xl flex items-center justify-between shadow-2xs sm:shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="px-1.5 py-0.2 sm:px-2.5 sm:py-1 bg-red-600 text-white font-bold text-[9px] sm:text-xs rounded sm:rounded-lg">
              {selectedIds.length} Dipilih
            </span>
            <span className="text-[9.5px] sm:text-xs text-red-900 font-semibold truncate max-w-[120px] sm:max-w-none">
              siap dihapus
            </span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 sm:px-3 py-0.5 sm:py-1.5 text-[9px] sm:text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded sm:rounded-xl transition"
            >
              Batal
            </button>
            <button
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="px-2 sm:px-3.5 py-0.5 sm:py-1.5 text-[9px] sm:text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded sm:rounded-xl shadow-xs transition flex items-center space-x-1 sm:space-x-1.5"
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Hapus ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile View: Ultra-compact Toolbar (< 640px) */}
      <div className="sm:hidden bg-white rounded-lg p-1.5 shadow-2xs border border-slate-200 space-y-1">
        {/* Row 1: Mode Switcher + Add Button + Print Button */}
        <div className="flex items-center justify-between gap-1">
          <div className="inline-flex rounded-md bg-slate-100 p-0.5 border border-slate-200 text-[8.5px]">
            <button
              type="button"
              onClick={() => setPeriodeMode('harian')}
              className={`px-1.5 py-0.5 rounded font-bold transition ${periodeMode === 'harian' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'}`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setPeriodeMode('mingguan')}
              className={`px-1.5 py-0.5 rounded font-bold transition ${periodeMode === 'mingguan' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'}`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setPeriodeMode('bulanan')}
              className={`px-1.5 py-0.5 rounded font-bold transition ${periodeMode === 'bulanan' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'}`}
            >
              Bulanan
            </button>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {periodeMode === 'harian' && (
              <button
                onClick={onAddKegiatan}
                className="px-2 py-1 bg-blue-600 active:bg-blue-700 text-white text-[9px] font-bold rounded shadow-2xs flex items-center space-x-0.5 cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>+ Kegiatan</span>
              </button>
            )}
            <button
              onClick={() => onOpenPrintModal(periodeMode, selectedTanggalHarian)}
              className="px-2 py-1 bg-slate-900 active:bg-black text-white text-[9px] font-bold rounded shadow-2xs flex items-center space-x-0.5 cursor-pointer ring-1 ring-slate-700"
              title="Cetak Dokumen Jurnal"
            >
              <Printer className="w-2.5 h-2.5 text-amber-400" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Row 2: Date / Period Filter + Month/Year + Export Icons */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[8.5px]">
          <div className="flex items-center space-x-1 flex-1 min-w-0">
            {periodeMode === 'harian' ? (
              <div className="flex items-center space-x-0.5 shrink-0">
                <input
                  type="date"
                  value={selectedTanggalHarian}
                  onChange={(e) => setSelectedTanggalHarian(e.target.value)}
                  className="text-[9px] font-bold text-slate-800 px-1 py-0.5 bg-blue-50/60 border border-blue-200 rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setSelectedTanggalHarian(
                      `${selectedTahun}-${selectedBulan.toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
                    );
                  }}
                  className="text-[8px] text-blue-700 font-bold px-1 py-0.5 bg-blue-50 rounded"
                  title="Pilih Hari Ini"
                >
                  Hari Ini
                </button>
              </div>
            ) : periodeMode === 'mingguan' ? (
              <select
                value={selectedMingguKe}
                onChange={(e) => setSelectedMingguKe(Number(e.target.value))}
                className="text-[9px] font-bold text-slate-800 px-1 py-0.5 bg-blue-50/60 border border-blue-200 rounded shrink-0 max-w-[95px]"
              >
                <option value={1}>Mg I (01-07)</option>
                <option value={2}>Mg II (08-14)</option>
                <option value={3}>Mg III (15-21)</option>
                <option value={4}>Mg IV (22-28)</option>
                <option value={5}>Mg V (29-Akhir)</option>
              </select>
            ) : null}

            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(parseInt(e.target.value, 10))}
              className="text-[9px] font-semibold px-1 py-0.5 bg-slate-50 border border-slate-200 rounded shrink-0"
            >
              {BULAN_INDONESIA.map((nama, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {nama.slice(0, 3)}
                </option>
              ))}
            </select>

            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(parseInt(e.target.value, 10))}
              className="text-[9px] font-semibold px-1 py-0.5 bg-slate-50 border border-slate-200 rounded shrink-0"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            {/* Quick search input */}
            <div className="relative flex-1 min-w-[70px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari..."
                className="w-full text-[9px] pl-4 pr-1 py-0.5 bg-slate-50 border border-slate-200 rounded"
              />
              <Search className="w-2.5 h-2.5 absolute left-1 top-1 text-slate-400" />
            </div>
          </div>

          {/* Tiny export buttons */}
          <div className="flex items-center space-x-0.5 shrink-0">
            <button
              onClick={handleExportExcel}
              className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded"
              title="Unduh Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3 h-3" />
            </button>
            <button
              onClick={handleExportWord}
              className="p-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded"
              title="Unduh Word (.doc)"
            >
              <FileText className="w-3 h-3" />
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="p-1 bg-rose-50 text-rose-700 border border-rose-200 rounded"
              title="Unduh PDF (.pdf)"
            >
              <FileDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop View: Full Top Filter & Control Card (>= 640px) */}
      <div className="hidden sm:block bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
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
          <div className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPeriodeMode('harian')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                periodeMode === 'harian'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Harian</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodeMode('mingguan')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                periodeMode === 'mingguan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mingguan</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodeMode('bulanan')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                periodeMode === 'bulanan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Bulanan</span>
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
                    className="text-[10px] text-blue-700 hover:underline font-bold ml-1.5 cursor-pointer"
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

          {/* Action Buttons: Add (Harian only), Excel, Word, PDF Langsung, Cetak / Pratinjau */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5 lg:pt-0">
            {periodeMode === 'harian' && (
              <button
                onClick={onAddKegiatan}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kegiatan</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title={`Unduh ${periodeMode === 'harian' ? 'Harian' : periodeMode === 'mingguan' ? 'Mingguan' : 'Bulanan'} Format Excel (.xlsx)`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleExportWord}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title={`Unduh ${periodeMode === 'harian' ? 'Harian' : periodeMode === 'mingguan' ? 'Mingguan' : 'Bulanan'} Format Word (.doc)`}
            >
              <FileText className="w-4 h-4" />
              <span>Word</span>
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
              <span>{isExportingPdf ? 'PDF...' : 'PDF'}</span>
            </button>

            <button
              onClick={() => onOpenPrintModal(periodeMode, selectedTanggalHarian)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer ring-1 ring-slate-700"
              title={`Buka Pratinjau Dokumen Cetak Jurnal ${periodeMode === 'harian' ? 'Harian' : periodeMode === 'mingguan' ? 'Mingguan' : 'Bulanan'}`}
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari uraian tugas, output, hari..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{filteredKegiatan.length}</span> aktivitas
          </div>
        </div>

      </div>

      {/* Rollup Explanation Banner for Weekly and Monthly Views */}
      {periodeMode !== 'harian' && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/90 rounded-lg sm:rounded-2xl p-1.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-4 shadow-2xs sm:shadow-xs animate-in fade-in">
          <div className="flex items-start space-x-2 sm:space-x-3.5">
            <div className="p-1 sm:p-2.5 bg-blue-600 text-white rounded-md sm:rounded-xl shadow-xs shrink-0 mt-0.5">
              <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <h3 className="text-[10.5px] sm:text-sm font-bold text-slate-900">
                  {periodeMode === 'mingguan' ? 'Rekapitulasi Jurnal Mingguan' : 'Rekapitulasi Jurnal Bulanan'}
                </h3>
                <span className="text-[7.5px] sm:text-[10px] font-extrabold uppercase px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded-full bg-blue-100 text-blue-700 tracking-wider">
                  Hasil Otomatis
                </span>
              </div>
              <p className="text-[9px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 leading-tight sm:leading-relaxed max-w-2xl">
                {periodeMode === 'mingguan'
                  ? `Diringkas otomatis dari Jurnal Harian Minggu Ke-${selectedMingguKe} (${rentangMingguanText}).`
                  : `Diringkas otomatis dari Jurnal Harian Bulan ${bulanNama} ${selectedTahun}.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPeriodeMode('harian')}
            className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] sm:text-xs font-bold rounded-md sm:rounded-xl shadow-xs transition flex items-center space-x-1 sm:space-x-1.5 shrink-0 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Isi di Jurnal Harian</span>
          </button>
        </div>
      )}

      {/* Monthly Recapitulation Quick Overview Card per User */}
      {/* Mobile Ultra-Compact Strip (< sm) */}
      <div className="sm:hidden bg-slate-900 text-white rounded-lg px-2 py-1 flex items-center justify-between text-[8.5px] shadow-2xs">
        <div className="flex items-center space-x-1 font-bold truncate">
          <span className="text-blue-300 font-mono shrink-0">{BULAN_INDONESIA[selectedBulan - 1]?.slice(0, 3)} {selectedTahun}</span>
          <span className="text-slate-500">|</span>
          <span className="text-white truncate max-w-[110px]">{targetPegawai.nama.split(',')[0]}</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0 font-mono font-bold">
          <span className="text-slate-300">T: <span className="text-white">{monthlyRecapStats.total}</span></span>
          <span className="text-emerald-300">✓ {monthlyRecapStats.approved}</span>
          <span className="text-amber-300">⏳ {monthlyRecapStats.pending}</span>
          <span className="text-indigo-300">{monthlyRecapStats.totalJam}j</span>
          {onNavigateToRekap && (
            <button
              onClick={onNavigateToRekap}
              className="text-[8px] bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded font-sans font-bold flex items-center space-x-0.5"
            >
              <span>Rekap</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Monthly Recapitulation Card (>= sm) */}
      <div className="hidden sm:block bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Rekapitulasi Bulanan
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/10 text-white font-medium">
                  {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}
                </span>
              </div>
              <div className="text-base font-bold text-white mt-0.5">
                {targetPegawai.nama} <span className="text-xs font-mono font-normal text-blue-200">(NIP. {targetPegawai.nip})</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
                className="justify-center px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <span>Buka Rekap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Document Sheet Container */}
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-xs sm:shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Document Header with Official Kop, Logo & Profile Editor Button */}
        <div className="p-2 sm:p-8 border-b border-slate-200 bg-slate-50/50">
          
          {/* Official Kop Surat Instansi dengan Logo */}
          <div className="flex items-center justify-between pb-2 sm:pb-5 mb-2 sm:mb-5 border-b-2 border-slate-900 gap-2 sm:gap-4">
            
            {/* Logo Instansi & Identitas Kop */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="relative group shrink-0">
                <div className="w-8 h-8 sm:w-20 sm:h-20 bg-white rounded-lg sm:rounded-2xl border border-slate-200 sm:border-2 p-0.5 sm:p-1.5 flex items-center justify-center shadow-2xs sm:shadow-xs overflow-hidden">
                  <img
                    src={pengaturan.logoUrl || PRESET_LOGO_PEMDA}
                    alt="Logo Instansi"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfilModalOpen(true)}
                  className="absolute -bottom-1 -right-1 p-0.5 sm:p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md sm:rounded-lg shadow-sm transition cursor-pointer"
                  title="Klik untuk ganti logo instansi"
                >
                  <Edit3 className="w-2 h-2 sm:w-3 sm:h-3" />
                </button>
              </div>

              <div className="min-w-0">
                <div className="text-[8.5px] sm:text-sm font-bold tracking-wide sm:tracking-wider text-slate-800 uppercase truncate sm:whitespace-normal">
                  {pengaturan.namaInstansi}
                </div>
                <div className="text-[10px] sm:text-base font-black text-slate-950 uppercase tracking-tight truncate sm:whitespace-normal">
                  {pengaturan.badanDinas}
                </div>
                <div className="text-[8px] sm:text-xs font-bold text-slate-700 uppercase truncate sm:whitespace-normal">
                  {pengaturan.bidangBagian || targetPegawai.unitKerja}
                </div>
                {pengaturan.alamat && (
                  <div className="text-[7.5px] sm:text-[11px] text-slate-500 italic mt-0.5 max-w-xl truncate sm:whitespace-normal">
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
                className="px-2 py-1 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[8.5px] sm:text-xs font-bold rounded-md sm:rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer"
                title="Buka Form Edit Profil Pegawai, Kop Surat, dan Logo Instansi"
              >
                <Edit3 className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-amber-300" />
                <span className="hidden xs:inline">Edit Profil</span>
                <span className="xs:hidden">Profil</span>
              </button>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center mb-1.5 sm:mb-6">
            <h2 className="text-[11px] sm:text-2xl font-black text-slate-900 tracking-wide uppercase font-serif">
              {pengaturan.judulDokumen}
            </h2>
            <p className="text-[8.5px] sm:text-sm font-bold text-slate-600 mt-0.5 uppercase">
              BULAN {BULAN_INDONESIA[selectedBulan - 1]?.toUpperCase()} {selectedTahun}
            </p>
          </div>

          {/* Identity Grid matching screenshot format with inline edit button */}
          {/* Mobile Ultra-Compact Identity Strip (< sm) */}
          <div className="sm:hidden bg-white p-1.5 rounded-lg border border-slate-200 text-[8.5px] leading-snug space-y-0.5 shadow-2xs">
            <div className="grid grid-cols-2 gap-x-2">
              <div className="truncate">
                <span className="text-slate-400 font-bold">Nama:</span> <span className="font-bold text-slate-900">{targetPegawai.nama}</span>
              </div>
              <div className="truncate text-right">
                <span className="text-slate-400 font-bold">NIP:</span> <span className="font-mono font-bold text-slate-800">{targetPegawai.nip}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-2">
              <div className="truncate">
                <span className="text-slate-400 font-bold">Jab:</span> <span className="text-slate-800">{targetPegawai.jabatan}</span>
              </div>
              <div className="truncate text-right">
                <span className="text-slate-400 font-bold">Unit:</span> <span className="text-slate-800">{targetPegawai.unitKerja}</span>
              </div>
            </div>
            <div className="pt-1 mt-0.5 border-t border-slate-100 flex items-center justify-between text-[7.5px] text-slate-500">
              <span className="truncate max-w-[200px]">
                Atasan: <strong className="text-slate-700">{pengaturan.namaAtasan || '-'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsEditProfilModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline inline-flex items-center space-x-0.5 cursor-pointer shrink-0"
              >
                <Edit3 className="w-2 h-2" />
                <span>Ubah</span>
              </button>
            </div>
          </div>

          {/* Desktop Identity Grid (>= sm) */}
          <div className="hidden sm:block max-w-xl mx-auto bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold space-y-2 relative">
            <div className="grid grid-cols-12 gap-1 items-center">
              <span className="col-span-3 text-slate-500 font-bold">NAMA</span>
              <span className="col-span-1 text-slate-400 text-center">:</span>
              <span className="col-span-8 text-slate-900 font-black uppercase truncate">{targetPegawai.nama}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-center">
              <span className="col-span-3 text-slate-500 font-bold">NIP</span>
              <span className="col-span-1 text-slate-400 text-center">:</span>
              <span className="col-span-8 text-slate-800 font-mono font-bold truncate">{targetPegawai.nip}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-center">
              <span className="col-span-3 text-slate-500 font-bold">JABATAN</span>
              <span className="col-span-1 text-slate-400 text-center">:</span>
              <span className="col-span-8 text-slate-800 uppercase truncate">{targetPegawai.jabatan}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-center">
              <span className="col-span-3 text-slate-500 font-bold">UNIT KERJA</span>
              <span className="col-span-1 text-slate-400 text-center">:</span>
              <span className="col-span-8 text-slate-800 uppercase truncate">{targetPegawai.unitKerja}</span>
            </div>
            {targetPegawai.pangkatGolongan && (
              <div className="grid grid-cols-12 gap-1 items-center">
                <span className="col-span-3 text-slate-500 font-bold">PANGKAT/GOL.</span>
                <span className="col-span-1 text-slate-400 text-center">:</span>
                <span className="col-span-8 text-slate-800">{targetPegawai.pangkatGolongan}</span>
              </div>
            )}

            <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 truncate max-w-[200px]">
                Pejabat: <strong className="text-slate-600">{pengaturan.namaAtasan || '-'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsEditProfilModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer shrink-0"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Card View (< 768px) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredKegiatan.length === 0 ? (
            <div className="py-4 px-2 text-center text-slate-400 bg-white">
              <Info className="w-5 h-5 mx-auto text-slate-300 mb-1" />
              <p className="font-semibold text-[10px] text-slate-600">Belum ada aktivitas kerja tercatat untuk periode ini.</p>
              <p className="text-[8.5px] text-slate-400 mt-0.5">
                Klik tombol &ldquo;+ Kegiatan&rdquo; di atas untuk mencatat pekerjaan harian Anda.
              </p>
            </div>
          ) : (
            filteredKegiatan.map((keg, index) => {
              const isApproved = keg.statusValidasi === 'Disetujui';
              const isRejected = keg.statusValidasi === 'Ditolak';
              const isSelected = selectedIds.includes(keg.id);

              return (
                <div
                  key={`mobile-${keg.id}`}
                  className={`p-1.5 space-y-1 transition ${isSelected ? 'bg-red-50/50' : 'bg-white'}`}
                >
                  {/* Top Row: Checkbox + Date/Time + Validation Badge */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(keg.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3 h-3 shrink-0"
                      />
                      <span className="text-[8.5px] font-bold text-slate-400 shrink-0">#{index + 1}</span>
                      <span className="text-[9.5px] font-bold text-slate-800 truncate">
                        {keg.hari}, {formatTanggalIndonesia(keg.tanggal)}
                      </span>
                    </div>

                    {isApproved ? (
                      <span className="inline-flex items-center space-x-0.5 px-1 py-0.2 rounded text-[7.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0">
                        <CheckCircle2 className="w-2 h-2 text-emerald-600" />
                        <span>Disetujui</span>
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center space-x-0.5 px-1 py-0.2 rounded text-[7.5px] font-bold bg-red-50 text-red-700 border border-red-200 shrink-0">
                        <AlertCircle className="w-2 h-2 text-red-600" />
                        <span>Revisi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-0.5 px-1 py-0.2 rounded text-[7.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        <Clock className="w-2 h-2 text-amber-500" />
                        <span>Menunggu</span>
                      </span>
                    )}
                  </div>

                  {/* Time & Activity Number */}
                  <div className="flex items-center space-x-1 text-[8.5px] font-mono text-slate-500 pl-4">
                    <span className="bg-slate-100 px-1 py-0.2 rounded font-bold text-slate-700">
                      No. {keg.nomorKegiatan || (index + 1).toString().padStart(2, '0')}
                    </span>
                    <span>&bull;</span>
                    <span>{keg.waktuMulai} - {keg.waktuSelesai}</span>
                  </div>

                  {/* Kegiatan & Output */}
                  <div className="pl-4 space-y-0.5">
                    <div className="text-[9.5px] font-semibold text-slate-900 leading-snug">
                      <span className="text-blue-600 font-black mr-0.5">►</span>
                      {keg.kegiatan}
                    </div>
                    <div className="text-[8.5px] text-slate-600 bg-slate-50 px-1.5 py-1 rounded border border-slate-200/80 leading-snug">
                      <span className="text-[7.5px] font-bold uppercase text-slate-400 mr-1">
                        Hasil:
                      </span>
                      {keg.outputHasil}
                    </div>
                    {keg.tautanBukti && (
                      <a
                        href={keg.tautanBukti}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[8px] text-blue-600 underline font-semibold inline-block"
                      >
                        Evidence ↗
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-1 pt-0.5 pl-4">
                    <button
                      type="button"
                      onClick={() => onEditKegiatan(keg)}
                      className="px-2 py-0.5 rounded text-[8.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center space-x-0.5 cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setKegiatanToDelete(keg)}
                      className="px-2 py-0.5 rounded text-[8.5px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center space-x-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (Formatted exactly as the government journal standard) */}
        <div className="hidden md:block overflow-x-auto">
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

                            {keg.tautanBukti && (
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
                            )}
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
        <div className="bg-slate-100 border-t border-b border-slate-300 px-2 sm:px-6 py-1.5 sm:py-2.5 flex items-center justify-between text-[9px] sm:text-xs font-bold text-slate-900">
          <span>TOTAL AKTIVITAS KERJA :</span>
          <span className="text-[10px] sm:text-sm font-mono bg-white px-2 py-0.5 rounded border border-slate-300">
            {filteredKegiatan.length.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Signatures Block with Aligned Baseline for Both Names */}
        <div className="p-2 sm:p-8 bg-white border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-[8.5px] sm:text-xs font-medium border-none border-collapse max-w-4xl">
            <tbody>
              {/* Row 1: Jabatan & Header */}
              <tr>
                <td className="w-1/2 align-top pb-1 sm:pb-2 pr-2 sm:pr-4">
                  <p className="text-slate-600">Mengetahui :</p>
                  <p className="font-bold text-slate-900 mt-0.5 text-[9px] sm:text-xs">{pengaturan.jabatanAtasan}</p>
                  <p className="text-slate-500 text-[8px] sm:text-[11px] leading-tight truncate sm:whitespace-normal">{pengaturan.badanDinas}</p>
                </td>
                <td className="w-1/2 align-top pb-1 sm:pb-2 pl-2 sm:pl-8">
                  <p className="text-slate-600">
                    {pengaturan.kotaPenetapan}, {new Date().getDate()} {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5 text-[9px] sm:text-xs">Yang Membuat,</p>
                  <p className="invisible select-none text-[8px] sm:text-[11px] leading-tight">&nbsp;</p>
                </td>
              </tr>

              {/* Row 2: Ruang Tanda Tangan / Paraf Digital (Tinggi Sama Persis) */}
              <tr>
                <td className="h-8 sm:h-16 align-middle py-0.5 sm:py-1 pr-2 sm:pr-4">
                  <div className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-50 border border-dashed border-emerald-300 rounded text-emerald-700 text-[7.5px] sm:text-[10px] font-mono font-semibold inline-flex items-center space-x-1 print:hidden">
                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                    <span>VERIFIKASI ELEKTRONIK</span>
                  </div>
                </td>
                <td className="h-8 sm:h-16 align-middle py-0.5 sm:py-1 pl-2 sm:pl-8">
                  <span className="text-[8px] sm:text-[11px] text-slate-400 italic">
                    Ditandatangani secara digital
                  </span>
                </td>
              </tr>

              {/* Row 3: Nama Pejabat & Pegawai (Tepat Sejajar / Lurus Horizontal di Baris yang Sama) */}
              <tr>
                <td className="align-top pt-1 sm:pt-2 pr-2 sm:pr-4">
                  <p className="font-bold text-slate-900 underline text-[10px] sm:text-sm tracking-wide leading-normal truncate sm:whitespace-normal">{pengaturan.namaAtasan}</p>
                  <p className="text-slate-600 text-[8.5px] sm:text-xs mt-0.5 truncate sm:whitespace-normal">{pengaturan.pangkatAtasan}</p>
                  <p className="text-slate-500 font-mono text-[8px] sm:text-xs mt-0.5 truncate sm:whitespace-normal">NIP. {pengaturan.nipAtasan}</p>
                </td>
                <td className="align-top pt-1 sm:pt-2 pl-2 sm:pl-8">
                  <p className="font-bold text-slate-900 underline text-[10px] sm:text-sm tracking-wide leading-normal truncate sm:whitespace-normal">{targetPegawai.nama}</p>
                  <p className="text-slate-600 text-[8.5px] sm:text-xs mt-0.5 truncate sm:whitespace-normal">{targetPegawai.pangkatGolongan}</p>
                  <p className="text-slate-500 font-mono text-[8px] sm:text-xs mt-0.5 truncate sm:whitespace-normal">NIP. {targetPegawai.nip}</p>
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
