import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Check,
  X,
} from 'lucide-react';
import { Pegawai, PengaturanInstansi } from '../types';

interface LoginViewProps {
  allPegawai: Pegawai[];
  pengaturan: PengaturanInstansi;
  onLogin: (user: Pegawai) => void;
  onDeletePegawai?: (pegawaiId: string) => void;
  onPurgeDemoAccounts?: () => void;
  onResetPassword?: (pegawaiId: string, newPassword: string) => Promise<void> | void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  allPegawai,
  pengaturan,
  onLogin,
  onResetPassword,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

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
      setErrorMsg('Silakan masukkan kata sandi akun Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const inputLower = trimmedUsername.toLowerCase();
      const inputCleanNip = cleanStr(trimmedUsername);

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
        setErrorMsg(
          'Username atau NIP tidak ditemukan dalam sistem. Pastikan data login sudah benar.'
        );
        return;
      }

      const validPassword =
        matched.password ||
        (matched.role === 'superadmin'
          ? 'superadmin'
          : matched.role === 'admin'
            ? 'admin'
            : '123');
      if (password !== validPassword) {
        setIsLoading(false);
        setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan coba kembali.');
        return;
      }

      setIsLoading(false);
      onLogin(matched);
    }, 300);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const targetIdentifier = forgotIdentifier.trim();
    if (!targetIdentifier) {
      setForgotError('Silakan masukkan Username atau NIP Anda.');
      return;
    }

    if (!forgotNewPassword) {
      setForgotError('Silakan masukkan kata sandi baru Anda.');
      return;
    }

    if (forgotNewPassword.length < 3) {
      setForgotError('Kata sandi minimal 3 karakter.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsResetting(true);

    try {
      const inputLower = targetIdentifier.toLowerCase();
      const inputCleanNip = cleanStr(targetIdentifier);

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
        setForgotError('Akun dengan Username atau NIP tersebut tidak ditemukan.');
        setIsResetting(false);
        return;
      }

      if (onResetPassword) {
        await onResetPassword(matched.id, forgotNewPassword);
      } else {
        matched.password = forgotNewPassword;
      }

      setForgotSuccess(
        `Kata sandi akun ${matched.nama} berhasil diatur ulang. Silakan masuk dengan kata sandi baru.`
      );
      setPassword(forgotNewPassword);
      setUsername(matched.username || matched.nip);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotSuccess(null);
        setForgotIdentifier('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      }, 1600);
    } catch {
      setForgotError('Gagal mengatur ulang kata sandi. Silakan coba kembali.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100 flex items-center justify-center sm:p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Centered White Card matching the coral-wave login design */}
      <div className="w-full min-h-[100dvh] sm:min-h-0 sm:max-w-[400px] bg-white sm:rounded-3xl sm:shadow-xl sm:border sm:border-slate-200/80 overflow-hidden flex flex-col justify-between">
        <div>
          {/* Top Coral Topographic Wave Header */}
          <div className="relative w-full h-44 sm:h-48 select-none overflow-hidden bg-white">
            <svg
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
              className="w-full h-full block"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="coralHeaderGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff8e8e" />
                  <stop offset="55%" stopColor="#ff7b7b" />
                  <stop offset="100%" stopColor="#f26b6d" />
                </linearGradient>
                <clipPath id="coralWaveClip">
                  <path d="M0,0 L400,0 L400,152 C335,186 250,185 190,130 C130,76 55,80 0,118 Z" />
                </clipPath>
              </defs>

              <g clipPath="url(#coralWaveClip)">
                <rect width="400" height="200" fill="url(#coralHeaderGrad)" />
                {/* Subtle Topographic Contour Lines */}
                <g
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.22"
                  strokeWidth="1.2"
                >
                  <ellipse cx="220" cy="45" rx="95" ry="52" />
                  <ellipse cx="220" cy="45" rx="70" ry="36" />
                  <ellipse cx="220" cy="45" rx="44" ry="22" />
                  <ellipse cx="220" cy="45" rx="20" ry="10" />
                  <path d="M-20,55 Q50,15 110,65 T240,125 T420,90" />
                  <path d="M-20,75 Q60,35 125,85 T255,145 T420,110" />
                  <path d="M15,-10 Q90,35 45,95 T105,175" />
                  <path d="M295,-15 Q340,40 315,90 T385,155" />
                  <ellipse cx="345" cy="95" rx="48" ry="28" transform="rotate(-18 345 95)" />
                  <ellipse cx="345" cy="95" rx="26" ry="14" transform="rotate(-18 345 95)" />
                </g>
              </g>
            </svg>
          </div>

          {/* Form Content Area */}
          <div className="px-7 sm:px-8 pt-1 pb-6">
            {/* Page Heading with signature coral underline */}
            <div className="mb-7">
              <div className="inline-block">
                <h1 className="text-[28px] font-extrabold text-slate-800 tracking-tight leading-tight">
                  Masuk Akun
                </h1>
                <div className="h-[3px] w-16 bg-[#f26b6d] rounded-full mt-1" />
              </div>
              <p className="text-xs text-slate-500 mt-2 truncate">
                E-Jurnal Harian Pegawai &middot; {pengaturan.namaInstansi}
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold block">Gagal Masuk</span>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Field 1: Username / NIP */}
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Username / NIP
                </label>
                <div className="flex items-center border-b border-slate-300 focus-within:border-[#f26b6d] transition-colors pb-2">
                  <span className="text-slate-400 pr-2.5 border-r border-slate-200 flex items-center">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Masukkan username atau NIP"
                    required
                    autoFocus
                    autoComplete="username"
                    className="w-full pl-3 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="flex items-center border-b border-slate-300 focus-within:border-[#f26b6d] transition-colors pb-2">
                  <span className="text-slate-400 pr-2.5 border-r border-slate-200 flex items-center">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Masukkan kata sandi"
                    required
                    autoComplete="current-password"
                    className="w-full pl-3 pr-2 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer select-none">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                      rememberMe
                        ? 'bg-[#f26b6d] border-[#f26b6d] text-white'
                        : 'bg-white border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                  <span>Ingat sesi</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(username.trim());
                    setForgotError(null);
                    setForgotSuccess(null);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[#e85a5e] hover:text-[#d4464b] font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Primary Coral Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-5 rounded-xl bg-[#f06d6f] hover:bg-[#e55a5d] active:scale-[0.99] text-white text-sm font-bold shadow-md shadow-rose-300/40 transition flex items-center justify-center space-x-2 disabled:opacity-65 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Masuk</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Clean Unboxed Footer */}
        <div className="px-7 pb-5 pt-2 text-center text-[11px] text-slate-400">
          <span>
            &copy; {new Date().getFullYear()} {pengaturan.namaInstansi || 'E-Jurnal Kinerja'}
          </span>
        </div>
      </div>

      {/* Lupa Kata Sandi Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="h-1.5 bg-gradient-to-r from-[#ff8e8e] via-[#f26b6d] to-[#e55a5d]" />

            <div className="p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-[#e85a5e] border border-rose-200">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Atur Ulang Kata Sandi
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Perbarui kata sandi akun pegawai Anda
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forgotError && (
                <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-snug">{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="leading-snug">{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username atau NIP
                  </label>
                  <div className="flex items-center border-b border-slate-300 focus-within:border-[#f26b6d] pb-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => {
                        setForgotIdentifier(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="Masukkan Username atau NIP terdaftar"
                      required
                      className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi Baru
                  </label>
                  <div className="flex items-center border-b border-slate-300 focus-within:border-[#f26b6d] pb-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type={forgotShowPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="Minimal 3 karakter"
                      required
                      className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setForgotShowPassword(!forgotShowPassword)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                    >
                      {forgotShowPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="flex items-center border-b border-slate-300 focus-within:border-[#f26b6d] pb-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type={forgotShowPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => {
                        setForgotConfirmPassword(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="Ulangi kata sandi baru"
                      required
                      className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#f06d6f] hover:bg-[#e55a5d] shadow-xs transition flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    {isResetting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Kata Sandi</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
