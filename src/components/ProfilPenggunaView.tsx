import React, { useState, useRef, useMemo } from 'react';
import {
  User,
  Key,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ClipboardCheck,
  Users,
  CheckCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  Building
} from 'lucide-react';
import { Pegawai, PengaturanInstansi, KegiatanJurnal } from '../types';
import confetti from 'canvas-confetti';

interface ProfilPenggunaViewProps {
  currentPegawai: Pegawai;
  pengaturan: PengaturanInstansi;
  onUpdateProfile: (updatedData: Partial<Pegawai>) => void;
  allPegawai?: Pegawai[];
  kegiatanList?: KegiatanJurnal[];
  onSwitchAccount?: (peg: Pegawai) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ProfilPenggunaView: React.FC<ProfilPenggunaViewProps> = ({
  currentPegawai,
  pengaturan,
  onUpdateProfile,
  allPegawai = [],
  kegiatanList = [],
  onSwitchAccount,
  onNavigateToTab,
}) => {
  const isAtasan = currentPegawai.role === 'atasan';

  // Form fields for personal profile
  const [nama, setNama] = useState(currentPegawai.nama || '');
  const [nip, setNip] = useState(currentPegawai.nip || '');
  const [username, setUsername] = useState(currentPegawai.username || '');
  const [jabatan, setJabatan] = useState(currentPegawai.jabatan || '');
  const [unitKerja, setUnitKerja] = useState(currentPegawai.unitKerja || '');
  const [pangkatGolongan, setPangkatGolongan] = useState(currentPegawai.pangkatGolongan || '');
  const [email, setEmail] = useState(currentPegawai.email || '');
  const [noHp, setNoHp] = useState(currentPegawai.noHp || '');
  const [foto, setFoto] = useState(currentPegawai.foto || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState(currentPegawai.password || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications & active tab
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'biodata' | 'wewenang-atasan' | 'profil-atasan' | 'keamanan'>('biodata');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subordinate staff under verification (for atasan role)
  const stafBinaan = useMemo(() => {
    return allPegawai.filter((p) => p.role === 'pegawai' || p.atasanId === currentPegawai.id);
  }, [allPegawai, currentPegawai.id]);

  // Find verification supervisor object in allPegawai (for non-atasan viewing atasan profile)
  const atasanVerifikator = useMemo(() => {
    // Cari pegawai yang cocok dengan nipAtasan atau role atasan
    const matchByNip = allPegawai.find((p) => p.nip && p.nip === pengaturan.nipAtasan);
    if (matchByNip) return matchByNip;
    const matchByAtasanId = allPegawai.find((p) => currentPegawai.atasanId && p.id === currentPegawai.atasanId);
    if (matchByAtasanId) return matchByAtasanId;
    return allPegawai.find((p) => p.role === 'atasan') || null;
  }, [allPegawai, pengaturan.nipAtasan, currentPegawai.atasanId]);

  // Verification statistics (for atasan)
  const verifikasiStats = useMemo(() => {
    const stafIds = new Set(stafBinaan.map((p) => p.id));
    const relevantKegs = kegiatanList.filter((k) => stafIds.has(k.pegawaiId));
    const pending = relevantKegs.filter((k) => k.statusValidasi === 'Menunggu').length;
    const disetujui = relevantKegs.filter((k) => k.statusValidasi === 'Disetujui').length;
    return {
      total: relevantKegs.length,
      pending,
      disetujui,
      totalStaf: stafBinaan.length,
    };
  }, [stafBinaan, kegiatanList]);

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran berkas foto maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFoto(result);
        onUpdateProfile({ foto: result });
        setSaveSuccessMsg('Foto profil Anda berhasil diperbarui!');
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile info
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !nip.trim()) {
      alert('Nama lengkap dan NIP wajib diisi.');
      return;
    }

    const updatedData: Partial<Pegawai> = {
      nama: nama.trim(),
      nip: nip.trim(),
      username: username.trim().toLowerCase() || currentPegawai.username,
      jabatan: jabatan.trim(),
      unitKerja: unitKerja.trim(),
      pangkatGolongan: pangkatGolongan.trim(),
      email: email.trim(),
      noHp: noHp.trim(),
      foto: foto.trim() || '',
    };

    onUpdateProfile(updatedData);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    setSaveSuccessMsg(
      isAtasan
        ? 'Data profil Atasan Verifikasi berhasil disimpan dan disinkronkan ke pengesahan cetak!'
        : 'Data profil Anda berhasil disimpan!'
    );
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Update password
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
    confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });
    setPasswordMsg({ type: 'success', text: 'Kata sandi akun Anda berhasil diperbarui!' });
    setTimeout(() => setPasswordMsg(null), 4500);
  };

  const getRoleBadgeLabel = (role: string) => {
    switch (role) {
      case 'atasan':
        return 'Atasan Penilai / Verifikator';
      case 'superadmin':
        return 'Super Administrator';
      case 'admin':
        return 'Admin Instansi';
      default:
        return 'Pegawai / ASN';
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto font-sans">
      
      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            
            {/* Avatar with Upload Button */}
            <div className="relative group shrink-0">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg text-white flex items-center justify-center font-bold text-2xl shadow-xs overflow-hidden border ${
                isAtasan ? 'bg-emerald-700 border-emerald-800' : 'bg-[#2271b1] border-[#135e96]'
              }`}>
                {foto ? (
                  <img src={foto} alt={currentPegawai.nama} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentPegawai.nama.charAt(0)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#1d2327] hover:bg-[#2c3338] text-white rounded-md shadow-xs transition flex items-center justify-center cursor-pointer"
                title="Ganti Foto Profil"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Profile Summary Text */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center space-x-1 ${
                  isAtasan 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isAtasan && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                  <span>{getRoleBadgeLabel(currentPegawai.role)}</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  @{currentPegawai.username || 'user'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[#1d2327] leading-tight">
                {currentPegawai.nama}
              </h1>
              <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-mono text-slate-700 font-bold">NIP. {currentPegawai.nip}</span>
                <span>&bull;</span>
                <span>{currentPegawai.jabatan}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {currentPegawai.unitKerja} &bull; {pengaturan.namaInstansi}
              </p>
            </div>

          </div>

          {/* Account Status Card */}
          <div className="w-full sm:w-auto text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Peran</span>
            {isAtasan ? (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verifikator Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Pegawai ASN</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-5 pt-3 border-t border-[#f0f0f1] flex flex-wrap gap-2 text-xs">
          {/* Tab 1: Biodata */}
          <button
            type="button"
            onClick={() => setActiveTab('biodata')}
            className={`px-3 py-1.5 rounded font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'biodata'
                ? 'bg-[#2271b1] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isAtasan ? 'Data Diri Atasan Verifikasi' : 'Data Diri & Kepegawaian'}</span>
          </button>

          {/* Tab 2: Kewenangan Verifikasi (Khusus Atasan) */}
          {isAtasan && (
            <button
              type="button"
              onClick={() => setActiveTab('wewenang-atasan')}
              className={`px-3 py-1.5 rounded font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'wewenang-atasan'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Kewenangan &amp; Staf Binaan</span>
              {verifikasiStats.pending > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                  {verifikasiStats.pending}
                </span>
              )}
            </button>
          )}

          {/* Tab 3: Profil Atasan Verifikasi (Untuk Pegawai yang ingin melihat profil atasannya) */}
          {!isAtasan && (
            <button
              type="button"
              onClick={() => setActiveTab('profil-atasan')}
              className={`px-3 py-1.5 rounded font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'profil-atasan'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Profil Atasan Verifikasi</span>
            </button>
          )}

          {/* Tab 4: Keamanan */}
          <button
            type="button"
            onClick={() => setActiveTab('keamanan')}
            className={`px-3 py-1.5 rounded font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'keamanan'
                ? 'bg-[#2271b1] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Keamanan &amp; Kata Sandi</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Form Data Diri & Kepegawaian */}
      {activeTab === 'biodata' && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-[#c3c4c7] rounded-lg p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f1]">
            <div>
              <h2 className="text-sm font-bold text-[#1d2327]">
                {isAtasan ? 'Biodata Pejabat Penilai / Atasan Verifikasi' : 'Informasi Biodata Pegawai'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAtasan
                  ? 'Data profil ini digunakan sebagai identitas resmi verifikator dan tanda tangan paraf pada lembar cetak E-Jurnal staf.'
                  : 'Perbarui identitas kepegawaian Anda untuk sinkronisasi dokumen cetak resmi.'}
              </p>
            </div>
            <button
              type="submit"
              className={`px-3.5 py-1.5 text-white text-xs font-semibold rounded shadow-xs transition flex items-center space-x-1 cursor-pointer ${
                isAtasan ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-[#2271b1] hover:bg-[#135e96]'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Profil</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Nama Lengkap */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Lengkap &amp; Gelar *
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap dan gelar"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-semibold"
              />
            </div>

            {/* NIP */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Induk Pegawai (NIP) *
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="18 digit NIP"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-mono font-bold"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Username Login
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username login"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400">
                Dapat digunakan selain NIP saat masuk sistem.
              </span>
            </div>

            {/* Jabatan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jabatan Resmi *
              </label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Jabatan"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-semibold"
              />
            </div>

            {/* Unit Kerja */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Unit Kerja / Bagian *
              </label>
              <input
                type="text"
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                placeholder="Unit Kerja"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-semibold"
              />
            </div>

            {/* Pangkat & Golongan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pangkat &amp; Golongan Ruang
              </label>
              <input
                type="text"
                value={pangkatGolongan}
                onChange={(e) => setPangkatGolongan(e.target.value)}
                placeholder="Contoh: Penata Tingkat I (III/d) atau Pembina (IV/a)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
              />
            </div>

            {/* Email Dinas */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Dinas Resmi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@instansi.go.id"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Nomor HP */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor HP / WhatsApp
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                />
              </div>
            </div>

            {/* URL Foto Alternatif */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Tautan URL Foto Profil (Opsional)
              </label>
              <input
                type="text"
                value={foto.startsWith('data:') ? '' : foto}
                onChange={(e) => setFoto(e.target.value)}
                placeholder="https://... atau klik ikon kamera di atas untuk unggah berkas foto"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#f0f0f1] flex justify-end">
            <button
              type="submit"
              className={`px-4 py-2 text-white text-xs font-semibold rounded shadow-xs transition flex items-center space-x-1 cursor-pointer ${
                isAtasan ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-[#2271b1] hover:bg-[#135e96]'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Kewenangan & Staf Binaan Verifikasi (Khusus Atasan) */}
      {isAtasan && activeTab === 'wewenang-atasan' && (
        <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#f0f0f1] gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#1d2327] flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Kewenangan Verifikasi &amp; Staf Binaan</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sebagai Pejabat Penilai / Verifikator, Anda memiliki hak memeriksa dan membubuhkan paraf pada laporan kinerja staf.
              </p>
            </div>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('verifikasi')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded shadow-xs transition flex items-center space-x-1.5 self-start cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Buka Meja Verifikasi</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Total Staf Binaan</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">{verifikasiStats.totalStaf} Pegawai</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-[11px] text-amber-700 font-medium block">Menunggu Paraf</span>
              <span className="text-lg font-bold text-amber-900 mt-0.5 block">{verifikasiStats.pending} Kegiatan</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[11px] text-emerald-700 font-medium block">Telah Disetujui</span>
              <span className="text-lg font-bold text-emerald-900 mt-0.5 block">{verifikasiStats.disetujui} Kegiatan</span>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-[11px] text-blue-700 font-medium block">Total Kegiatan Masuk</span>
              <span className="text-lg font-bold text-blue-900 mt-0.5 block">{verifikasiStats.total} Jurnal</span>
            </div>
          </div>

          {/* Subordinates List */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Daftar Pegawai yang Berada di Bawah Verifikasi Anda:</span>
            </h3>

            {stafBinaan.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded border border-slate-200">
                Belum ada pegawai bawahan yang terdaftar di bawah unit kerja ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {stafBinaan.map((peg) => {
                  const pegKegs = kegiatanList.filter((k) => k.pegawaiId === peg.id);
                  const pegPending = pegKegs.filter((k) => k.statusValidasi === 'Menunggu').length;
                  return (
                    <div key={peg.id} className="p-3 bg-white hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-[#2271b1] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {peg.foto ? (
                            <img src={peg.foto} alt={peg.nama} className="w-full h-full object-cover" />
                          ) : (
                            peg.nama.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{peg.nama}</div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                            <span className="font-mono">NIP. {peg.nip}</span>
                            <span>&bull;</span>
                            <span>{peg.jabatan}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {pegPending > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {pegPending} Menunggu Paraf
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Selesai Diverifikasi
                          </span>
                        )}

                        {onNavigateToTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('verifikasi')}
                            className="px-2 py-1 bg-slate-100 hover:bg-[#2271b1] hover:text-white rounded text-[11px] font-medium transition cursor-pointer"
                          >
                            Periksa Jurnal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Profil Atasan Verifikasi (Dilihat oleh Pegawai / ASN) */}
      {!isAtasan && activeTab === 'profil-atasan' && (
        <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-[#f0f0f1]">
            <h2 className="text-sm font-bold text-[#1d2327] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Profil Pejabat Penilai / Atasan Verifikasi Anda</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Berikut adalah identitas resmi atasan yang berwenang memverifikasi, menilai, dan menandatangani lembar kerja harian Anda.
            </p>
          </div>

          {/* Atasan Profile Card */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-xs overflow-hidden shrink-0 border border-emerald-800">
                {atasanVerifikator?.foto ? (
                  <img src={atasanVerifikator.foto} alt={pengaturan.namaAtasan} className="w-full h-full object-cover" />
                ) : (
                  <span>{(pengaturan.namaAtasan || 'A').charAt(0)}</span>
                )}
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Pejabat Penilai Resmi
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">&bull; Verifikator Aktif</span>
                </div>
                <div className="text-base font-bold text-slate-900 leading-tight">
                  {pengaturan.namaAtasan || atasanVerifikator?.nama || 'Belum Ditetapkan'}
                </div>
                <div className="text-slate-600 font-mono text-[11px]">
                  NIP. {pengaturan.nipAtasan || atasanVerifikator?.nip || '-'}
                </div>
                <div className="text-slate-700 font-medium">
                  {pengaturan.jabatanAtasan || atasanVerifikator?.jabatan || 'Kepala Bidang / Atasan Langsung'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Pangkat/Golongan: <strong>{pengaturan.pangkatAtasan || atasanVerifikator?.pangkatGolongan || 'Penata Tingkat I (III/d)'}</strong>
                </div>
              </div>
            </div>

            {/* Quick Switch to Atasan Account */}
            {onSwitchAccount && atasanVerifikator && (
              <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200">
                <button
                  type="button"
                  onClick={() => onSwitchAccount(atasanVerifikator)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  title={`Masuk ke sistem sebagai akun ${atasanVerifikator.nama}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Masuk Sebagai Atasan Verifikasi</span>
                </button>
                <span className="text-[10px] text-slate-400 block text-center sm:text-right mt-1">
                  Uji coba alur verifikasi &amp; paraf
                </span>
              </div>
            )}
          </div>

          {/* Verification Scope Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">Instansi &amp; Unit Kerja</span>
              <span className="font-bold text-slate-800 block mt-0.5">{pengaturan.badanDinas || pengaturan.namaInstansi}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">{pengaturan.bidangBagian || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">Wewenang Pengesahan Dokumen</span>
              <span className="font-bold text-slate-800 block mt-0.5">Paraf Cetak Resmi Bulanan</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Memeriksa, menyetujui, dan memberikan catatan pembinaan pada lembar kegiatan harian.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Keamanan & Kata Sandi */}
      {activeTab === 'keamanan' && (
        <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-[#f0f0f1]">
            <h2 className="text-sm font-bold text-[#1d2327]">
              Pengaturan Kata Sandi Akun
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ubah kata sandi akun Anda untuk menjaga keamanan akses ke dalam sistem.
            </p>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded text-xs font-semibold flex items-center space-x-2 ${
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

          <form onSubmit={handleUpdatePassword} className="max-w-md space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded font-mono text-slate-600 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kata Sandi Baru *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ulangi Kata Sandi Baru *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded shadow-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Perbarui Kata Sandi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Information Box at Footer */}
      {isAtasan ? (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center space-x-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Peran Resmi: <strong>Pejabat Penilai &amp; Verifikator Jurnal Kinerja Instansi</strong></span>
          </div>
          <div className="text-[11px] text-emerald-700">
            {pengaturan.namaInstansi}
          </div>
        </div>
      ) : (
        <div className="bg-[#f6f7f7] border border-[#dcdcde] rounded-lg p-3 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            Atasan Penilai Langsung: <strong className="text-slate-800">{pengaturan.namaAtasan || '-'}</strong>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            NIP. {pengaturan.nipAtasan || '-'}
          </div>
        </div>
      )}

    </div>
  );
};
