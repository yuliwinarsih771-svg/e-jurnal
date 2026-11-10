import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  UserCheck, 
  Clock, 
  FileText, 
  Save, 
  RotateCcw, 
  CheckCircle,
  Download,
  Upload,
  AlertTriangle,
  ShieldCheck,
  User,
  Copy,
  Sparkles,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { Pegawai, PengaturanInstansi } from '../types';
import { INITIAL_PENGATURAN } from '../data/initialData';
import confetti from 'canvas-confetti';

interface PengaturanAdminViewProps {
  pengaturanMap?: Record<string, PengaturanInstansi>;
  currentPegawai?: Pegawai;
  onSaveAccountPengaturan?: (targetPegawaiId: string, newSettings: PengaturanInstansi) => void;
  onApplyToAllAccounts?: (newSettings: PengaturanInstansi) => void;
  pengaturan?: PengaturanInstansi;
  onSavePengaturan?: (newSettings: PengaturanInstansi) => void;
  pegawaiList: Pegawai[];
  onSavePegawaiList?: (list: Pegawai[]) => void;
  onResetData: () => void;
  isSuperAdmin?: boolean;
  initialSelectedAccountId?: string;
  onGoToProfile?: () => void;
}

export const PengaturanAdminView: React.FC<PengaturanAdminViewProps> = ({
  pengaturanMap = {},
  currentPegawai,
  onSaveAccountPengaturan,
  onApplyToAllAccounts,
  pengaturan,
  onSavePengaturan,
  pegawaiList,
  onResetData,
  isSuperAdmin = false,
  initialSelectedAccountId,
  onGoToProfile,
}) => {
  // Determine which account's settings are currently being configured
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (initialSelectedAccountId) return initialSelectedAccountId;
    if (currentPegawai?.id) return currentPegawai.id;
    return pegawaiList[0]?.id || 'default';
  });

  const getAccountSettings = (accId: string): PengaturanInstansi => {
    if (pengaturanMap && pengaturanMap[accId]) return { ...pengaturanMap[accId] };
    if (pengaturanMap && pengaturanMap['default']) return { ...pengaturanMap['default'] };
    if (pengaturan) return { ...pengaturan };
    return { ...INITIAL_PENGATURAN };
  };

  const [formData, setFormData] = useState<PengaturanInstansi>(() => getAccountSettings(selectedAccountId));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Switch which account is being configured
  const handleSelectAccount = (accId: string) => {
    setSelectedAccountId(accId);
    setFormData(getAccountSettings(accId));
    setSuccessMsg(null);
  };

  const selectedPegawai = pegawaiList.find((p) => p.id === selectedAccountId);
  const selectedAccountLabel = selectedAccountId === 'default' 
    ? 'Templat Baku Global Instansi' 
    : selectedPegawai?.nama || 'Akun Terpilih';

  const isCustomConfigActive = Boolean(pengaturanMap[selectedAccountId]);

  const handleInputChange = (field: keyof PengaturanInstansi, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveAccountPengaturan) {
      onSaveAccountPengaturan(selectedAccountId, formData);
    }
    if (onSavePengaturan) {
      onSavePengaturan(formData);
    }
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setSuccessMsg(
      `Pengaturan instansi & atasan berhasil disimpan khusus untuk akun "${selectedAccountLabel}"! Dokumen cetak dan data akun ini telah diperbarui.`
    );
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleResetCurrentAccountToTemplate = () => {
    if (selectedAccountId === 'default') {
      if (confirm('Kembalikan templat baku global ke pengaturan awal sistem?')) {
        setFormData({ ...INITIAL_PENGATURAN });
        if (onSaveAccountPengaturan) {
          onSaveAccountPengaturan('default', { ...INITIAL_PENGATURAN });
        }
        setSuccessMsg('Templat baku global berhasil dikembalikan ke standar awal.');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
      return;
    }

    if (confirm(`Kembalikan pengaturan untuk akun "${selectedAccountLabel}" ke templat standar?`)) {
      const template = pengaturanMap['default'] || pengaturan || INITIAL_PENGATURAN;
      const restored: PengaturanInstansi = {
        ...template,
        bidangBagian: selectedPegawai?.unitKerja || template.bidangBagian,
      };
      setFormData(restored);
      if (onSaveAccountPengaturan) {
        onSaveAccountPengaturan(selectedAccountId, restored);
      }
      setSuccessMsg(`Pengaturan instansi untuk akun "${selectedAccountLabel}" berhasil diselaraskan kembali ke templat standar.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleApplyToAll = () => {
    if (confirm(`Salin dan terapkan pengaturan dari "${selectedAccountLabel}" ke SEMUA akun pegawai (${pegawaiList.length} akun)?`)) {
      if (onApplyToAllAccounts) {
        onApplyToAllAccounts(formData);
      }
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
      setSuccessMsg(`Pengaturan instansi dari "${selectedAccountLabel}" berhasil disalin dan diterapkan ke seluruh akun pegawai!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      pengaturan: formData,
      pengaturanMap,
      selectedAccountId,
      pegawai: pegawaiList,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ejurnal_config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      
      {/* Alert banner */}
      {successMsg && (
        <div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-300 rounded-xl sm:rounded-2xl text-emerald-800 text-[11px] sm:text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Super Admin Notice Card */}
      {isSuperAdmin && (
        <div className="p-3 sm:p-5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shadow-xs">
          <div className="flex items-start space-x-2.5 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-rose-600 text-white rounded-lg sm:rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase bg-rose-600 text-white rounded-full">
                  Peran Super Admin Aktif
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-rose-900">Hak Akses Seluruh Jurnal & Pengaturan</span>
              </div>
              <p className="text-[11px] sm:text-xs text-rose-800 mt-0.5 sm:mt-1">
                Akun Super Admin memiliki wewenang penuh untuk mengecek jurnal semua pegawai harian, melihat semua lembar jurnal, rekapitulasi, cetak dokumen resmi, serta mengelola konfigurasi kop & master data instansi.
              </p>
            </div>
          </div>

          {onGoToProfile && (
            <button
              type="button"
              onClick={onGoToProfile}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Kelola Profil Super Admin</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                isSuperAdmin ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
              } tracking-wider uppercase`}>
                {isSuperAdmin ? 'Panel Super Administrator' : 'Panel Kontrol Administrator'}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400">|</span>
              <span className="text-[11px] sm:text-xs text-slate-500">Konfigurasi Pengaturan Per Akun</span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">
              Pengaturan Instansi & Pejabat Penilai Per Akun
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Setiap akun dapat memiliki kop instansi, bidang bagian, pejabat penilai (atasan langsung), dan toleransi jam kerja yang berbeda-beda.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={handleExportBackup}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition flex items-center space-x-1 sm:space-x-1.5"
              title="Unduh Backup Pengaturan JSON"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span>Backup JSON</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Kembalikan semua data dan pengaturan ke contoh awal (BKPSDMD Kab. Belu)?')) {
                  onResetData();
                }
              }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition flex items-center space-x-1 sm:space-x-1.5"
              title="Reset ke Template Contoh Awal"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
              <span>Reset Sistem</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Selector Card for Per-User Settings */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-md border border-blue-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase bg-blue-500/30 text-blue-200 rounded-md border border-blue-400/40">
                PILIH AKUN YANG DIATUR
              </span>
              {isCustomConfigActive ? (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/25 text-emerald-300 rounded-md border border-emerald-400/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Pengaturan Khusus Akun Aktif</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 text-slate-300 rounded-md">
                  Mengikuti Templat Standar
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Konfigurasi Khusus untuk: <span className="text-blue-300">{selectedAccountLabel}</span>
            </h3>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Pengaturan instansi, unit kerja, nama atasan, dan jam kerja yang Anda ubah di form berikut 
              <strong className="text-amber-300"> HANYA tersimpan untuk akun ini</strong> dan tidak akan menimpa akun pegawai lain.
            </p>
          </div>

          {/* Account Dropdown Switcher */}
          <div className="w-full lg:w-80 space-y-2 shrink-0">
            <label className="block text-xs font-bold text-blue-200">
              Pilihan Akun:
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => handleSelectAccount(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-white text-slate-900 rounded-xl border-2 border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-300 shadow-sm"
            >
              <optgroup label="Nama Pemilik Akun">
                {(isSuperAdmin || currentPegawai?.role === 'superadmin' ? pegawaiList : (currentPegawai ? [currentPegawai] : pegawaiList)).map((peg) => (
                  <option key={peg.id} value={peg.id}>
                    {peg.nama}
                  </option>
                ))}
              </optgroup>
              {(isSuperAdmin || currentPegawai?.role === 'superadmin') && (
                <optgroup label="Pengaturan Templat Global">
                  <option value="default">🏛️ Templat Standar Instansi (Global)</option>
                </optgroup>
              )}
            </select>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetCurrentAccountToTemplate}
                className="text-[11px] font-semibold text-blue-200 hover:text-white underline transition flex items-center space-x-1"
                title="Pulihkan pengaturan akun ini ke templat standar"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Akun Ini</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToAll}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 transition flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg"
                title="Salin dan terapkan pengaturan ini ke seluruh akun"
              >
                <Copy className="w-3 h-3 text-amber-300" />
                <span>Terapkan ke Semua Akun</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Account Profile Bar */}
        {selectedPegawai && (
          <div className="mt-4 pt-3 border-t border-blue-800/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-200">
            <div><span className="text-blue-300 font-semibold">NIP:</span> {selectedPegawai.nip}</div>
            <div>&bull;</div>
            <div><span className="text-blue-300 font-semibold">Jabatan:</span> {selectedPegawai.jabatan}</div>
            <div>&bull;</div>
            <div><span className="text-blue-300 font-semibold">Unit:</span> {selectedPegawai.unitKerja}</div>
            <div>&bull;</div>
            <div><span className="text-blue-300 font-semibold">Username:</span> <code className="bg-blue-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">{selectedPegawai.username}</code></div>
          </div>
        )}
      </div>

      {/* Form Settings */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Section 1: Instansi & Unit Kerja */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                1. Identitas Instansi & Judul Dokumen Cetak
              </h3>
              <p className="text-[11px] text-slate-500">
                Kop dokumen khusus untuk akun: <strong className="text-blue-700">{selectedAccountLabel}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pemerintah Daerah / Lembaga *
              </label>
              <input
                type="text"
                value={formData.namaInstansi}
                onChange={(e) => handleInputChange('namaInstansi', e.target.value)}
                required
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Badan / Dinas / Satker *
              </label>
              <input
                type="text"
                value={formData.badanDinas}
                onChange={(e) => handleInputChange('badanDinas', e.target.value)}
                required
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bidang / Bagian / Sub Bagian *
              </label>
              <input
                type="text"
                value={formData.bidangBagian}
                onChange={(e) => handleInputChange('bidangBagian', e.target.value)}
                required
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Dokumen Resmi *
              </label>
              <input
                type="text"
                value={formData.judulDokumen}
                onChange={(e) => handleInputChange('judulDokumen', e.target.value)}
                placeholder="JURNAL HARIAN"
                required
                className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">
                Contoh: JURNAL HARIAN atau JURNAL HARIAN KEGIATAN GURU PNS/PPPK
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kota / Kabupaten Penetapan Dokumen *
              </label>
              <input
                type="text"
                value={formData.kotaPenetapan}
                onChange={(e) => handleInputChange('kotaPenetapan', e.target.value)}
                placeholder="Atambua"
                required
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">
                Nama kota yang muncul pada tanggal tanda tangan (misal: Atambua, 31 Januari 2026)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Kantor
              </label>
              <input
                type="text"
                value={formData.alamat}
                onChange={(e) => handleInputChange('alamat', e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pejabat Penilai / Atasan Langsung */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. Data Pejabat Penilai / Atasan Langsung (Mengetahui)
              </h3>
              <p className="text-[11px] text-slate-500">
                Atasan penilai khusus untuk akun: <strong className="text-indigo-700">{selectedAccountLabel}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap & Gelar Atasan *
              </label>
              <input
                type="text"
                value={formData.namaAtasan}
                onChange={(e) => handleInputChange('namaAtasan', e.target.value)}
                placeholder="Yoseph G. Taelin, S.STP"
                required
                className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP Atasan Langsung *
              </label>
              <input
                type="text"
                value={formData.nipAtasan}
                onChange={(e) => handleInputChange('nipAtasan', e.target.value)}
                placeholder="19901126 201206 1 002"
                required
                className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jabatan Atasan Langsung *
              </label>
              <input
                type="text"
                value={formData.jabatanAtasan}
                onChange={(e) => handleInputChange('jabatanAtasan', e.target.value)}
                placeholder="Kepala Bidang Mutasi dan Promosi BKPSDMD Kab. Belu"
                required
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pangkat / Golongan Ruang Atasan *
              </label>
              <input
                type="text"
                value={formData.pangkatAtasan}
                onChange={(e) => handleInputChange('pangkatAtasan', e.target.value)}
                placeholder="Penata"
                required
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Jam Operasional Kantor */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                3. Jam Kerja & Standar Jam Operasional Kantor
              </h3>
              <p className="text-[11px] text-slate-500">
                Ketentuan jam kerja dan toleransi untuk akun: <strong className="text-emerald-700">{selectedAccountLabel}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Masuk Normal
              </label>
              <input
                type="time"
                value={formData.jamMasukNormal}
                onChange={(e) => handleInputChange('jamMasukNormal', e.target.value)}
                required
                className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Pulang Normal
              </label>
              <input
                type="time"
                value={formData.jamPulangNormal}
                onChange={(e) => handleInputChange('jamPulangNormal', e.target.value)}
                required
                className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Toleransi Keterlambatan (Menit)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.toleransiKeterlambatanMenit}
                onChange={(e) => handleInputChange('toleransiKeterlambatanMenit', parseInt(e.target.value, 10))}
                className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-600 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Perubahan disimpan khusus untuk: <strong className="text-slate-900 font-bold">{selectedAccountLabel}</strong>
            </span>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Khusus ({selectedAccountLabel})</span>
          </button>
        </div>

      </form>
    </div>
  );
};
