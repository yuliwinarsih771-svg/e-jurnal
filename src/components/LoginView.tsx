import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound,
  Database,
  ArrowRight
} from 'lucide-react';
import { Pegawai, PengaturanInstansi } from '../types';

interface LoginViewProps {
  allPegawai: Pegawai[];
  pengaturan: PengaturanInstansi;
  onLogin: (user: Pegawai) => void;
  onDeletePegawai?: (pegawaiId: string) => void;
  onPurgeDemoAccounts?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  allPegawai,
  pengaturan,
  onLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize input string (remove spaces, dots, dashes for comparison fallback)
  const cleanStr = (val: string) => val.replace(/[\s.-]/g, '').toLowerCase();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMsg('Silakan masukkan username atau NIP Anda.');
      return;
    }

    if (!password) {
      setErrorMsg('Silakan masukkan password akun Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const inputLower = trimmedUsername.toLowerCase();
      const inputCleanNip = cleanStr(trimmedUsername);

      // Find matching employee by Username (primary) or fallback NIP/Email
      const matched = allPegawai.find((p) => {
        const pUsername = (p.username || '').trim().toLowerCase();
        const pNipClean = cleanStr(p.nip || '');
        const pEmail = (p.email || '').trim().toLowerCase();

        return (
          pUsername === inputLower ||
          pNipClean === inputCleanNip ||
          pEmail === inputLower
        );
      });

      if (!matched) {
        setIsLoading(false);
        setErrorMsg('Username atau akun tidak ditemukan dalam sistem. Pastikan data login sudah benar.');
        return;
      }

      // Check password (fallback password for existing accounts if unset)
      const validPassword = matched.password || (matched.role === 'superadmin' ? 'superadmin' : matched.role === 'admin' ? 'admin' : '123');
      if (password !== validPassword) {
        setIsLoading(false);
        setErrorMsg('Password yang Anda masukkan salah. Silakan coba kembali.');
        return;
      }

      // Successful login
      setIsLoading(false);
      onLogin(matched);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
      
      {/* Background decoration elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 ring-4 ring-white/10 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Building2 className="w-8 h-8" />
          </div>
          <span className="block text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-950/70 border border-blue-800/60 px-3 py-1 rounded-full mx-auto w-fit mb-2">
            Sistem Informasi Kinerja & Jurnal ASN
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            E-Jurnal Harian Pegawai
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            {pengaturan.bidangBagian || pengaturan.badanDinas}
          </p>
          <p className="text-[11px] text-slate-400">
            {pengaturan.namaInstansi}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-white/20 sm:rounded-3xl">
          
          <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Masuk Akun Pengguna</h3>
              <p className="text-xs text-slate-500">Gunakan Username dan Password terdaftar</p>
            </div>
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <KeyRound className="w-4 h-4" />
            </span>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Gagal Masuk</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username / NIP <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Masukkan username atau NIP Anda"
                  required
                  autoFocus
                  autoComplete="username"
                  className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Masukkan password akun..."
                  required
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>Ingat sesi masuk di perangkat ini</span>
              </label>
              <span className="text-[11px] text-blue-600 font-medium hover:underline cursor-pointer">
                Lupa password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                </>
              )}
            </button>
          </form>

          {/* System Security Info */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Autentikasi Aman</span>
            </div>
            <div className="flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Database Terintegrasi</span>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {pengaturan.namaInstansi}. Seluruh Hak Cipta Dilindungi.</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Aplikasi E-Jurnal Harian & Pelaporan Kinerja Pegawai Negeri Sipil / ASN.
          </p>
        </div>

      </div>

    </div>
  );
};
