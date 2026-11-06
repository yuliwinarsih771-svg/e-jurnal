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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col justify-center py-4 px-3 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
      
      {/* Background decoration elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto w-full max-w-[290px] relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-2.5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-white/15 mb-1.5">
            <Building2 className="w-4 h-4" />
          </div>
          <h2 className="text-base font-extrabold text-white tracking-tight leading-tight">
            E-Jurnal Harian Pegawai
          </h2>
          <p className="text-[10px] text-blue-200/85 font-medium truncate">
            {pengaturan.bidangBagian || pengaturan.badanDinas}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-xl border border-white/25 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500" />
          
          <div className="p-3.5">
            <div className="mb-2.5 pb-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Masuk Akun Pengguna</h3>
                <p className="text-[10px] text-slate-500">Username &amp; Password</p>
              </div>
              <span className="p-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                <KeyRound className="w-3 h-3" />
              </span>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-2.5 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[10px] flex items-start space-x-1.5 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1 leading-snug">
                  <span className="font-bold block">Gagal Masuk</span>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-2">
              
              {/* Username Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Username / NIP <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-3 w-3" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Username atau NIP"
                    required
                    autoFocus
                    autoComplete="username"
                    className="block w-full pl-7 pr-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-3 w-3" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Password akun..."
                    required
                    autoComplete="current-password"
                    className="block w-full pl-7 pr-7 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center space-x-1.5 text-[10px] text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                  />
                  <span>Ingat sesi</span>
                </label>
                <span className="text-[10px] text-blue-600 font-medium hover:underline cursor-pointer">
                  Lupa password?
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 py-1.5 px-3 border border-transparent rounded-lg shadow-md shadow-blue-600/20 text-[11px] font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 flex items-center justify-center space-x-1.5 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3 h-3" />
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-3 h-3 opacity-75" />
                  </>
                )}
              </button>
            </form>

            {/* System Security Info */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
              <div className="flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Autentikasi Aman</span>
              </div>
              <div className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-blue-500" />
                <span>Cloud Terintegrasi</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center mt-3 text-[9px] text-slate-400/80">
          <p>&copy; {new Date().getFullYear()} {pengaturan.namaInstansi}</p>
        </div>

      </div>

    </div>
  );
};
