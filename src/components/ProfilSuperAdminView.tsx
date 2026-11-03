import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  User,
  Key,
  Mail,
  Phone,
  Building2,
  Award,
  Lock,
  Eye,
  EyeOff,
  Save,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Settings,
  Sparkles,
  QrCode,
  Calendar,
  Check,
  Database,
  Users,
  Clock,
  Printer
} from 'lucide-react';
import { Pegawai, PengaturanInstansi, KegiatanJurnal } from '../types';
import confetti from 'canvas-confetti';

interface ProfilSuperAdminViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  pengaturan: PengaturanInstansi;
  kegiatanList: KegiatanJurnal[];
  onUpdateProfile: (updatedData: Partial<Pegawai>) => void;
  onNavigateToTab?: (tab: 'monitoring' | 'jurnal' | 'rekapitulasi' | 'cetak') => void;
}

export const ProfilSuperAdminView: React.FC<ProfilSuperAdminViewProps> = ({
  currentPegawai,
  allPegawai,
  pengaturan,
  kegiatanList,
  onUpdateProfile,
  onNavigateToTab,
}) => {
  // Form state
  const [nama, setNama] = useState(currentPegawai.nama || '');
  const [nip, setNip] = useState(currentPegawai.nip || '');
  const [username, setUsername] = useState(currentPegawai.username || '');
  const [jabatan, setJabatan] = useState(currentPegawai.jabatan || '');
  const [unitKerja, setUnitKerja] = useState(currentPegawai.unitKerja || '');
  const [pangkatGolongan, setPangkatGolongan] = useState(currentPegawai.pangkatGolongan || '');
  const [email, setEmail] = useState(currentPegawai.email || '');
  const [noHp, setNoHp] = useState(currentPegawai.noHp || '');
  const [foto, setFoto] = useState(currentPegawai.foto || '');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState(currentPegawai.password || 'superadmin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Success message notification
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'profil' | 'keamanan' | 'akun' | 'wewenang'>('profil');
  const [searchQuery, setSearchQuery] = useState('');

  // Hidden file input for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats calculation
  const totalPegawaiCount = allPegawai.length;
  const filteredPegawai = allPegawai.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.nip.toLowerCase().includes(q) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      p.jabatan.toLowerCase().includes(q) ||
      p.unitKerja.toLowerCase().includes(q)
    );
  });
  const totalKegiatanCount = kegiatanList.length;
  const pendingCount = kegiatanList.filter((k) => k.statusValidasi === 'Menunggu').length;
  const approvedCount = kegiatanList.filter((k) => k.statusValidasi === 'Disetujui').length;

  // Handle Photo Upload via base64 data URL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFoto(result);
        onUpdateProfile({ foto: result });
        setSaveSuccessMsg('Foto profil Super Admin berhasil diperbarui!');
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !nip.trim()) {
      alert('Nama lengkap dan NIP wajib diisi.');
      return;
    }

    const updatedData: Partial<Pegawai> = {
      nama: nama.trim(),
      nip: nip.trim(),
      username: username.trim().toLowerCase() || 'superadmin',
      jabatan: jabatan.trim(),
      unitKerja: unitKerja.trim(),
      pangkatGolongan: pangkatGolongan.trim(),
      email: email.trim(),
      noHp: noHp.trim(),
      foto: foto.trim() || undefined,
    };

    onUpdateProfile(updatedData);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setSaveSuccessMsg('Data profil Super Admin berhasil disimpan dan langsung diperbarui!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Handle Password Update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword.trim()) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi baru tidak boleh kosong.' });
      return;
    }

    if (newPassword.length < 3) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi minimal 3 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    onUpdateProfile({ password: newPassword.trim() });
    setCurrentPassword(newPassword.trim());
    setNewPassword('');
    setConfirmPassword('');
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setPasswordMsg({ type: 'success', text: 'Kata sandi akun Super Admin berhasil diperbarui!' });
    setTimeout(() => setPasswordMsg(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Top Banner Card: Super Admin Digital Identity */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-900/50 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar & Photo Upload Trigger */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center font-extrabold text-3xl shadow-xl ring-4 ring-rose-400/30 overflow-hidden">
                {foto ? (
                  <img src={foto} alt={currentPegawai.nama} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentPegawai.nama.charAt(0)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-md border border-slate-600 transition flex items-center justify-center cursor-pointer group-hover:scale-105"
                title="Unggah Foto Profil"
              >
                <Camera className="w-4 h-4 text-rose-300" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Profile Identitas Text */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-xs flex items-center space-x-1.5 tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SUPER ADMINISTRATOR</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Akun Sistem Aktif</span>
                </span>
                <span className="text-xs text-rose-300/80 font-mono">
                  @{currentPegawai.username || 'superadmin'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentPegawai.nama}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-rose-100/90 font-medium">
                <div className="flex items-center space-x-1">
                  <span className="text-rose-300 font-mono">NIP.</span>
                  <span>{currentPegawai.nip}</span>
                </div>
                <span>&bull;</span>
                <div>{currentPegawai.jabatan}</div>
                <span>&bull;</span>
                <div>{currentPegawai.pangkatGolongan}</div>
              </div>

              <p className="text-xs text-rose-200/70 pt-0.5">
                {currentPegawai.unitKerja} &bull; {pengaturan.namaInstansi}
              </p>
            </div>
          </div>

          {/* Quick Stats Badges for Super Admin */}
          <div className="flex sm:flex-col justify-between sm:items-end gap-3 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase font-bold text-rose-300">Wewenang Sistem</div>
              <div className="text-xs font-bold text-white mt-0.5">Hak Akses Semua Jurnal</div>
            </div>
            <div className="h-px bg-white/10 hidden sm:block w-full" />
            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Pegawai</div>
              <div className="text-sm font-black text-rose-200">{totalPegawaiCount} Akun Instansi</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation inside Profile */}
        <div className="mt-8 pt-4 border-t border-rose-900/40 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('profil')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'profil'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white/10 text-rose-200 hover:bg-white/15'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Data Diri & Kepegawaian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('keamanan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'keamanan'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white/10 text-rose-200 hover:bg-white/15'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Keamanan & Sandi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('akun')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'akun'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white/10 text-rose-200 hover:bg-white/15'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Nama-Nama Akun ({totalPegawaiCount})</span>
            <span className="text-[10px] bg-rose-900/60 text-rose-200 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
              Khusus Super Admin
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('wewenang')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'wewenang'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white/10 text-rose-200 hover:bg-white/15'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Hak Akses & Privilese</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Form Profil Data Diri */}
      {activeSubTab === 'profil' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-rose-600" />
                  <span>Informasi Profil Super Administrator</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbarui identitas kepegawaian resmi dan kontak akun Super Admin.
                </p>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Super Administrator / Dr. Ahmad, M.Si"
                  required
                  className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* NIP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Pegawai (NIP) *
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="19750101 200001 1 001"
                  required
                  className="w-full text-xs font-mono font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Login *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="superadmin"
                    required
                    className="w-full text-xs font-mono font-bold pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Digunakan untuk masuk sistem pada halaman login.
                </span>
              </div>

              {/* Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan Resmi *
                </label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Super Administrator Sistem & Kepegawaian"
                  required
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Unit Kerja */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unit Kerja / Satuan Organisasi *
                </label>
                <input
                  type="text"
                  value={unitKerja}
                  onChange={(e) => setUnitKerja(e.target.value)}
                  placeholder="BKPSDMD KAB. BELU"
                  required
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Pangkat / Golongan Ruang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pangkat & Golongan Ruang *
                </label>
                <input
                  type="text"
                  value={pangkatGolongan}
                  onChange={(e) => setPangkatGolongan(e.target.value)}
                  placeholder="Pembina Utama Muda (IV/c)"
                  required
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Email Dinas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Dinas Resmi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="superadmin@belukab.go.id"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Nomor HP / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* URL Foto Profil Alternatif */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tautan URL Foto Profil (Opsional)
                </label>
                <input
                  type="text"
                  value={foto.startsWith('data:') ? '' : foto}
                  onChange={(e) => setFoto(e.target.value)}
                  placeholder="https://... atau klik tombol kamera di atas untuk upload berkas foto"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400">
                  Anda juga dapat langsung mengunggah foto profil dari komputer/HP menggunakan ikon kamera pada kartu foto di atas.
                </span>
              </div>
            </div>

            {/* Bottom Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil Super Admin</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: Keamanan & Ganti Sandi */}
      {activeSubTab === 'keamanan' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Key className="w-5 h-5 text-rose-600" />
                <span>Pengaturan Keamanan & Kata Sandi Akun</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola kata sandi akun Super Administrator untuk menjaga keamanan akses sistem kepegawaian.
              </p>
            </div>

            {passwordMsg && (
              <div
                className={`mt-4 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="mt-6 max-w-xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    readOnly
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">
                  Sandi aktif yang saat ini digunakan untuk login.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  required
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  required
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>Perbarui Kata Sandi Super Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB: Nama-Nama Akun (Khusus Super Admin) */}
      {activeSubTab === 'akun' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-rose-600" />
                    <span>Hanya Tampil di Super Admin</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-rose-600" />
                  <span>Daftar Nama-Nama Akun Pengguna</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seluruh akun ASN, PPPK, dan staf instansi di database Firebase. Sesuai hak akses, daftar ini hanya dimunculkan untuk Super Admin.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama akun atau NIP..."
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>
            </div>

            {/* Table Nama-Nama Akun */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3">Nama Akun & NIP</th>
                    <th className="py-2.5 px-3">Jabatan & Pangkat</th>
                    <th className="py-2.5 px-3">Unit Kerja</th>
                    <th className="py-2.5 px-3 text-center">Peran</th>
                    <th className="py-2.5 px-3 text-center">Username Login</th>
                    <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPegawai.map((peg) => (
                    <tr key={peg.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                            peg.role === 'superadmin' ? 'bg-rose-600' : peg.role === 'admin' ? 'bg-purple-600' : peg.role === 'atasan' ? 'bg-amber-600' : 'bg-blue-600'
                          }`}>
                            {peg.nama.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{peg.nama}</div>
                            <div className="text-[11px] font-mono text-slate-500">NIP. {peg.nip}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{peg.jabatan}</div>
                        <div className="text-[10px] text-slate-500">{peg.pangkatGolongan}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {peg.unitKerja}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          peg.role === 'superadmin' ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold' :
                          peg.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          peg.role === 'atasan' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {peg.role === 'superadmin' ? 'Super Admin' : peg.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-[11px] px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 font-bold">
                          @{peg.username || (peg.nip.replace(/\s+/g, ''))}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {onNavigateToTab && (
                            <button
                              type="button"
                              onClick={() => onNavigateToTab('jurnal')}
                              className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition cursor-pointer"
                            >
                              Jurnal
                            </button>
                          )}
                          {onNavigateToTab && (
                            <button
                              type="button"
                              onClick={() => onNavigateToTab('cetak')}
                              className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
                            >
                              Cetak
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPegawai.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada akun pegawai yang sesuai dengan pencarian "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Hak Akses & Privilese Super Admin */}
      {activeSubTab === 'wewenang' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  <span>Matriks Hak Akses & Wewenang Super Admin</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuai ketentuan, Super Admin memiliki otoritas tertinggi untuk seluruh jurnal dan konfigurasi instansi.
                </p>
              </div>

              <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full border border-rose-200 self-start sm:self-auto">
                LEVEL OTORITAS TERTINGGI (SUPERUSER)
              </span>
            </div>

            {/* Privilege Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                  <UserCheck className="w-4 h-4 text-rose-600" />
                  <span>Pengecekan Jurnal Semua Pegawai (Monitoring)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Memantau kepatuhan seluruh pegawai ASN/PPPK/Non ASN setiap hari, matriks kehadiran bulanan, rincian aktivitas tanggal tertentu, dan status verifikasi.
                </p>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('monitoring')}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Buka Monitoring Jurnal &rarr;</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Hak Akses Ke Semua Jurnal Harian</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dapat memilih dan membuka lembar kerja jurnal pegawai manapun di instansi, memeriksa uraian pekerjaan harian, jam masuk-selesai, dan bukti tautan output.
                </p>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('jurnal')}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Buka Jurnal Harian Pegawai &rarr;</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                  <Printer className="w-4 h-4 text-rose-600" />
                  <span>Cetak Dokumen Resmi & Ekspor Laporan</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mencetak format dinas resmi per pegawai (PDF A4 Landscape/Portrait, Word .doc, Excel .xlsx) dengan kop dan tanda tangan pejabat penilai masing-masing.
                </p>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('cetak')}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Buka Pratinjau Cetak / PDF &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats Footer Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Statistik Ringkas Instansi (Super Administrator)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500">Total Akun Pegawai</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">{totalPegawaiCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">ASN & Staf Terdaftar</div>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
            <div className="text-[11px] font-bold text-blue-700">Total Kegiatan Terdata</div>
            <div className="text-xl font-extrabold text-blue-900 mt-1">{totalKegiatanCount}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Seluruh Jurnal Pegawai</div>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
            <div className="text-[11px] font-bold text-amber-700">Menunggu Verifikasi</div>
            <div className="text-xl font-extrabold text-amber-900 mt-1">{pendingCount}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Perlu Tindakan Atasan</div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-700">Jurnal Disetujui</div>
            <div className="text-xl font-extrabold text-emerald-900 mt-1">{approvedCount}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Tervalidasi Resmi</div>
          </div>
        </div>
      </div>
    </div>
  );
};
