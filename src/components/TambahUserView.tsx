import React, { useState } from 'react';
import { 
  UserPlus, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Building2, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { Pegawai, UserRole } from '../types';
import confetti from 'canvas-confetti';

interface TambahUserViewProps {
  allPegawai: Pegawai[];
  onAddPegawai: (newPegawai: Pegawai) => Promise<void> | void;
  onNavigateToAccounts?: () => void;
}

export const TambahUserView: React.FC<TambahUserViewProps> = ({
  allPegawai,
  onAddPegawai,
  onNavigateToAccounts,
}) => {
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [jabatan, setJabatan] = useState('');
  const [unitKerja, setUnitKerja] = useState('BKPSDMD KABUPATEN BELU');
  const [pangkatGolongan, setPangkatGolongan] = useState('Penata Muda (III/a)');
  const [role, setRole] = useState<UserRole>('pegawai');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate username from name or NIP
  const handleNamaChange = (val: string) => {
    setNama(val);
    if (!username || username === nama.split(' ')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const generated = val.split(/[\s,.]+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (generated) setUsername(generated);
    }
  };

  const handleResetForm = () => {
    setNama('');
    setNip('');
    setUsername('');
    setPassword('123');
    setJabatan('');
    setUnitKerja('BKPSDMD KABUPATEN BELU');
    setPangkatGolongan('Penata Muda (III/a)');
    setRole('pegawai');
    setEmail('');
    setNoHp('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nama.trim()) {
      setErrorMsg('Nama lengkap pegawai wajib diisi.');
      return;
    }

    if (!nip.trim()) {
      setErrorMsg('NIP pegawai wajib diisi.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      setErrorMsg('Username login wajib diisi (tanpa spasi).');
      return;
    }

    // Check if username already exists
    const duplicateUsername = allPegawai.find(
      (p) => (p.username || '').toLowerCase() === cleanUsername
    );
    if (duplicateUsername) {
      setErrorMsg(`Username "@${cleanUsername}" sudah digunakan oleh pegawai "${duplicateUsername.nama}". Silakan gunakan username lain.`);
      return;
    }

    // Check if NIP already exists
    const duplicateNip = allPegawai.find(
      (p) => p.nip.replace(/\s+/g, '') === nip.replace(/\s+/g, '')
    );
    if (duplicateNip) {
      setErrorMsg(`NIP "${nip}" sudah terdaftar atas nama "${duplicateNip.nama}".`);
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Password masuk akun wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPegawai: Pegawai = {
        id: `peg-${Date.now()}`,
        nama: nama.trim(),
        nip: nip.trim(),
        username: cleanUsername,
        password: password.trim(),
        jabatan: jabatan.trim() || 'Staf Pelaksana',
        unitKerja: unitKerja.trim() || 'BKPSDMD KABUPATEN BELU',
        pangkatGolongan: pangkatGolongan.trim() || 'Penata Muda (III/a)',
        role,
        email: email.trim() || `${cleanUsername}@belukab.go.id`,
        noHp: noHp.trim() || '',
      };

      await onAddPegawai(newPegawai);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setSuccessMsg(`User akun baru "${newPegawai.nama}" (@${newPegawai.username}) berhasil ditambahkan dan disimpan ke database cloud Firebase!`);
      handleResetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Terjadi kendala saat menyimpan akun ke database: ' + (err?.message || 'Silakan coba lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {onNavigateToAccounts && (
            <button
              type="button"
              onClick={onNavigateToAccounts}
              className="ml-3 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
            >
              Lihat Daftar Akun &rarr;
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-red-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-600 text-white shadow-xs flex items-center space-x-1.5 tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Wewenang Eksklusif Super Admin</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                &bull; Total Saat Ini: {allPegawai.length} Akun
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
              <UserPlus className="w-6 h-6 text-rose-600" />
              <span>Tambah User Akun Pegawai Baru</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Daftarkan akun pegawai baru ASN/PPPK/Staf ke dalam sistem. Data akun langsung terhubung ke database cloud Firebase Firestore.
            </p>
          </div>

          {onNavigateToAccounts && (
            <button
              type="button"
              onClick={onNavigateToAccounts}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span>Lihat Semua Akun ({allPegawai.length})</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Identitas Kepegawaian */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-4 h-4" />
              <span>1. Identitas Lengkap Pegawai</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => handleNamaChange(e.target.value)}
                  placeholder="Contoh: MARIA IMMACULATA, S.Sos, M.Si"
                  required
                  className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Nama resmi beserta gelar dinas</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP Pegawai <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 19850720 201001 2 005"
                  required
                  className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Nomor Induk Pegawai 18 digit</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jabatan Dinas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Contoh: ANALIS SDM APARATUR AHLI PERTAMA"
                  required
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pangkat / Golongan Ruang
                </label>
                <input
                  type="text"
                  value={pangkatGolongan}
                  onChange={(e) => setPangkatGolongan(e.target.value)}
                  placeholder="Contoh: Penata Muda (III/a) atau Pengatur (II/c)"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Unit Kerja / Bidang Dinas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                placeholder="Contoh: BIDANG MUTASI & PROMOSI BKPSDMD KAB. BELU"
                required
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Section 2: Kredensial Masuk Sistem */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Lock className="w-4 h-4" />
              <span>2. Kredensial Akun & Hak Akses (Login)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username Login <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="maria"
                    required
                    className="w-full text-xs font-mono font-bold pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Huruf kecil, tanpa spasi</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password Masuk <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 3 karakter"
                    required
                    className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Sandi default: 123</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Peran / Hak Akses Sistem <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  <option value="pegawai">Pegawai / Staf (Mengisi Jurnal & Presensi)</option>
                  <option value="atasan">Atasan Langsung (Verifikasi & Pembubuhan Paraf)</option>
                  <option value="admin">Administrator Instansi</option>
                  <option value="superadmin">Super Administrator (Otoritas Penuh)</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">Menentukan wewenang tab menu</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Dinas (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@belukab.go.id"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor HP / WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan Form</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Mendaftarkan Akun...' : 'Simpan & Daftarkan Akun Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
