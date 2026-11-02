import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  UserCheck, 
  Clock, 
  FileText, 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
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
import { Pegawai, PengaturanInstansi, UserRole } from '../types';
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
  onSavePegawaiList: (list: Pegawai[]) => void;
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
  onSavePegawaiList,
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

  // Employee modal management
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Pegawai | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Pegawai | null>(null);
  const [empNama, setEmpNama] = useState('');
  const [empNip, setEmpNip] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empJabatan, setEmpJabatan] = useState('');
  const [empUnitKerja, setEmpUnitKerja] = useState('');
  const [empPangkat, setEmpPangkat] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('pegawai');
  const [empPassword, setEmpPassword] = useState('');

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

  // Employee CRUD
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmpNama('');
    setEmpNip('');
    setEmpUsername('');
    setEmpJabatan('');
    setEmpUnitKerja(formData.bidangBagian || formData.badanDinas);
    setEmpPangkat('Penata Muda (III/a)');
    setEmpEmail('');
    setEmpRole('pegawai');
    setEmpPassword('123');
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (peg: Pegawai) => {
    setEditingEmployee(peg);
    setEmpNama(peg.nama);
    setEmpNip(peg.nip);
    setEmpUsername(peg.username || '');
    setEmpJabatan(peg.jabatan);
    setEmpUnitKerja(peg.unitKerja);
    setEmpPangkat(peg.pangkatGolongan);
    setEmpEmail(peg.email);
    setEmpRole(peg.role);
    setEmpPassword(peg.password || (peg.role === 'superadmin' ? 'superadmin' : peg.role === 'admin' ? 'admin' : '123'));
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empNama.trim() || !empNip.trim()) return;

    const finalPassword = empPassword.trim() || (empRole === 'superadmin' ? 'superadmin' : empRole === 'admin' ? 'admin' : '123');
    const finalUsername =
      empUsername.trim().toLowerCase() ||
      empNama
        .trim()
        .split(/[\s,.]+/)[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase() ||
      empNip.trim().replace(/\s+/g, '');

    if (editingEmployee) {
      const updatedList = pegawaiList.map((p) =>
        p.id === editingEmployee.id
          ? {
              ...p,
              nama: empNama.trim(),
              nip: empNip.trim(),
              username: finalUsername,
              jabatan: empJabatan.trim(),
              unitKerja: empUnitKerja.trim(),
              pangkatGolongan: empPangkat.trim(),
              email: empEmail.trim(),
              role: empRole,
              password: finalPassword,
            }
          : p
      );
      onSavePegawaiList(updatedList);
    } else {
      const newPegawai: Pegawai = {
        id: `peg-${Date.now()}`,
        nama: empNama.trim(),
        nip: empNip.trim(),
        username: finalUsername,
        jabatan: empJabatan.trim(),
        unitKerja: empUnitKerja.trim(),
        pangkatGolongan: empPangkat.trim(),
        email: empEmail.trim(),
        role: empRole,
        password: finalPassword,
      };
      onSavePegawaiList([...pegawaiList, newPegawai]);
    }

    setIsEmployeeModalOpen(false);
  };

  const handleDeleteEmployee = (id: string) => {
    if (pegawaiList.length <= 1) {
      setSuccessMsg('Peringatan: Minimal harus ada 1 pegawai dalam sistem data master.');
      setTimeout(() => setSuccessMsg(null), 3500);
      return;
    }
    const target = pegawaiList.find((p) => p.id === id);
    onSavePegawaiList(pegawaiList.filter((p) => p.id !== id));
    setEmployeeToDelete(null);
    setIsEmployeeModalOpen(false);
    setSuccessMsg(`Data pegawai "${target?.nama || 'terpilih'}" berhasil dihapus dari master data.`);
    setTimeout(() => setSuccessMsg(null), 3500);
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
    <div className="space-y-6">
      
      {/* Alert banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Super Admin Notice Card */}
      {isSuperAdmin && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-rose-600 text-white rounded-full">
                  Peran Super Admin Aktif
                </span>
                <span className="text-xs font-bold text-rose-900">Hak Akses Seluruh Jurnal & Pengaturan</span>
              </div>
              <p className="text-xs text-rose-800 mt-1">
                Akun Super Admin memiliki wewenang penuh untuk mengecek jurnal semua pegawai harian, melihat semua lembar jurnal, rekapitulasi, cetak dokumen resmi, serta mengelola konfigurasi kop & master data instansi.
              </p>
            </div>
          </div>

          {onGoToProfile && (
            <button
              type="button"
              onClick={onGoToProfile}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <User className="w-4 h-4" />
              <span>Kelola Profil Super Admin</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isSuperAdmin ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
              } tracking-wider uppercase`}>
                {isSuperAdmin ? 'Panel Super Administrator' : 'Panel Kontrol Administrator'}
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-500">Konfigurasi Pengaturan Per Akun</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
              Pengaturan Instansi & Pejabat Penilai Per Akun
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap akun dapat memiliki kop instansi, bidang bagian, pejabat penilai (atasan langsung), dan toleransi jam kerja yang berbeda-beda.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportBackup}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5"
              title="Unduh Backup Pengaturan JSON"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Backup JSON</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Kembalikan semua data dan pengaturan ke contoh awal (BKPSDMD Kab. Belu)?')) {
                  onResetData();
                }
              }}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5"
              title="Reset ke Template Contoh Awal"
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
              <span>Reset Sistem</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Selector Card for Per-User Settings */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-800">
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
              Pilih Akun Pegawai / Templat:
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => handleSelectAccount(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-white text-slate-900 rounded-xl border-2 border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-300 shadow-sm"
            >
              <optgroup label="Akun Pegawai Tersedia">
                {pegawaiList.map((peg) => (
                  <option key={peg.id} value={peg.id}>
                    {peg.nama} ({peg.username || peg.nip}) - [{peg.role.toUpperCase()}]
                  </option>
                ))}
              </optgroup>
              <optgroup label="Pengaturan Templat Global">
                <option value="default">🏛️ Templat Standar Instansi (Global)</option>
              </optgroup>
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

      {/* Section 4: Master Data Pegawai */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                4. Master Data Pegawai & Akun Pengguna
              </h3>
              <p className="text-xs text-slate-500">
                Kelola daftar pegawai ASN/PPPK/Non ASN yang berhak mengisi jurnal dan presensi.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddEmployee}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pegawai Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-2.5 px-3">Nama Lengkap & NIP</th>
                <th className="py-2.5 px-3">Jabatan & Pangkat</th>
                <th className="py-2.5 px-3">Unit Kerja</th>
                <th className="py-2.5 px-3 text-center">Peran</th>
                <th className="py-2.5 px-3 text-center">Username & Sandi</th>
                <th className="py-2.5 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pegawaiList.map((peg) => (
                <tr key={peg.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{peg.nama}</div>
                    <div className="text-[11px] font-mono text-slate-500">NIP. {peg.nip}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">{peg.jabatan}</div>
                    <div className="text-[10px] text-slate-500">{peg.pangkatGolongan}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {peg.unitKerja}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      peg.role === 'superadmin' ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold' :
                      peg.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      peg.role === 'atasan' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {peg.role === 'superadmin' ? 'Super Admin' : peg.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex flex-col items-center space-y-1">
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 font-bold">
                        @{peg.username || (peg.nip.replace(/\s+/g, ''))}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600 font-medium">
                        pwd: {peg.password || (peg.role === 'superadmin' ? 'superadmin' : peg.role === 'admin' ? 'admin' : '123')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditEmployee(peg)}
                        className="p-1.5 text-blue-600 bg-blue-50/80 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                        title="Edit Data Pegawai"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] font-bold">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmployeeToDelete(peg)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                        title="Hapus Pegawai dari Master Data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] font-bold">Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              {editingEmployee ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan identitas kepegawaian sesuai SK pengangkatan.
            </p>

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  value={empNama}
                  onChange={(e) => setEmpNama(e.target.value)}
                  placeholder="WELLY PRIYATNA, S.Kom"
                  required
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIP Pegawai *</label>
                  <input
                    type="text"
                    value={empNip}
                    onChange={(e) => setEmpNip(e.target.value)}
                    placeholder="19800513 200803 1 001"
                    required
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={empPangkat}
                    onChange={(e) => setEmpPangkat(e.target.value)}
                    placeholder="Penata (III/c)"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan *</label>
                <input
                  type="text"
                  value={empJabatan}
                  onChange={(e) => setEmpJabatan(e.target.value)}
                  placeholder="ANALIS JABATAN AHLI MUDA"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja *</label>
                <input
                  type="text"
                  value={empUnitKerja}
                  onChange={(e) => setEmpUnitKerja(e.target.value)}
                  placeholder="BIDANG MUTASI & PROMOSI BKPSDMD KAB. BELU"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Peran Aplikasi</label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value as UserRole)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="pegawai">Pegawai / Staf</option>
                    <option value="atasan">Atasan Langsung</option>
                    <option value="admin">Administrator</option>
                    <option value="superadmin">Super Administrator (Khusus Pengaturan Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Dinas</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="email@belukab.go.id"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Username Login *</label>
                  </div>
                  <input
                    type="text"
                    value={empUsername}
                    onChange={(e) => setEmpUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Contoh: trisnurini"
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Huruf kecil, tanpa spasi</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password Login *</label>
                  </div>
                  <input
                    type="text"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    placeholder="Contoh: 123"
                    required
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Sandi masuk sistem</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {editingEmployee && (
                    <button
                      type="button"
                      onClick={() => setEmployeeToDelete(editingEmployee)}
                      className="px-3 py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Pegawai Ini</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEmployeeModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                  >
                    Simpan Pegawai
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Data Pegawai */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Data Pegawai?
                </h3>
                <p className="text-xs text-slate-500">
                  Konfirmasi penghapusan master pegawai
                </p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <p className="font-bold text-slate-900 text-sm">{employeeToDelete.nama}</p>
              <p className="font-mono text-slate-500 text-[11px]">NIP. {employeeToDelete.nip}</p>
              <p className="text-slate-700">{employeeToDelete.jabatan}</p>
              <p className="text-slate-500 text-[11px]">{employeeToDelete.unitKerja}</p>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus data pegawai ini dari sistem?
            </p>

            <div className="mt-6 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEmployee(employeeToDelete.id)}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Pegawai</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
