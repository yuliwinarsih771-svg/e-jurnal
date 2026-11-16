import React, { useState, useEffect } from 'react';
import {
  Palette,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Monitor,
  LogIn,
  Eye,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PengaturanInstansi } from '../types';
import {
  DEFAULT_APP_BG,
  DEFAULT_LOGIN_BG,
  DEFAULT_LOGIN_ACCENT,
  normalizeHexColor,
  isDarkColor,
  applyThemeCssVariables,
} from '../utils/themeColors';

interface PengaturanWarnaViewProps {
  defaultPengaturan: PengaturanInstansi;
  onSaveThemeColors: (patch: {
    warnaBgAplikasi: string;
    warnaBgLogin: string;
    warnaAksenLogin: string;
  }) => Promise<void>;
}

const APP_BG_PRESETS = [
  { label: 'Abu Klasik', hex: '#f0f0f1', swatchClass: 'bg-[#f0f0f1]' },
  { label: 'Putih Bersih', hex: '#ffffff', swatchClass: 'bg-[#ffffff]' },
  { label: 'Biru Langit', hex: '#e0f2fe', swatchClass: 'bg-[#e0f2fe]' },
  { label: 'Hijau Mint', hex: '#ecfdf5', swatchClass: 'bg-[#ecfdf5]' },
  { label: 'Krem Hangat', hex: '#fef9c3', swatchClass: 'bg-[#fef9c3]' },
  { label: 'Ungu Pastel', hex: '#f3e8ff', swatchClass: 'bg-[#f3e8ff]' },
  { label: 'Mawar Lembut', hex: '#ffe4e6', swatchClass: 'bg-[#ffe4e6]' },
  { label: 'Navy Gelap', hex: '#0f172a', swatchClass: 'bg-[#0f172a]' },
] as const;

const LOGIN_BG_PRESETS = [
  { label: 'Slate Lembut', hex: '#f1f5f9', swatchClass: 'bg-[#f1f5f9]' },
  { label: 'Koral Pastel', hex: '#fff1f2', swatchClass: 'bg-[#fff1f2]' },
  { label: 'Biru Samudra', hex: '#dbeafe', swatchClass: 'bg-[#dbeafe]' },
  { label: 'Emerald Muda', hex: '#d1fae5', swatchClass: 'bg-[#d1fae5]' },
  { label: 'Krem Emas', hex: '#fef3c7', swatchClass: 'bg-[#fef3c7]' },
  { label: 'Lavender', hex: '#ede9fe', swatchClass: 'bg-[#ede9fe]' },
  { label: 'Indigo Gelap', hex: '#1e1b4b', swatchClass: 'bg-[#1e1b4b]' },
  { label: 'Cyber Navy', hex: '#030b1a', swatchClass: 'bg-[#030b1a]' },
] as const;

const LOGIN_ACCENT_PRESETS = [
  { label: 'Koral Bawaan', hex: '#f26b6d', swatchClass: 'bg-[#f26b6d]' },
  { label: 'Biru Instansi', hex: '#2563eb', swatchClass: 'bg-[#2563eb]' },
  { label: 'Emerald', hex: '#059669', swatchClass: 'bg-[#059669]' },
  { label: 'Indigo', hex: '#4f46e5', swatchClass: 'bg-[#4f46e5]' },
  { label: 'Merah Resmi', hex: '#dc2626', swatchClass: 'bg-[#dc2626]' },
  { label: 'Emas Amber', hex: '#d97706', swatchClass: 'bg-[#d97706]' },
] as const;

export const PengaturanWarnaView: React.FC<PengaturanWarnaViewProps> = ({
  defaultPengaturan,
  onSaveThemeColors,
}) => {
  const savedAppBg = normalizeHexColor(defaultPengaturan.warnaBgAplikasi, DEFAULT_APP_BG);
  const savedLoginBg = normalizeHexColor(defaultPengaturan.warnaBgLogin, DEFAULT_LOGIN_BG);
  const savedLoginAccent = normalizeHexColor(defaultPengaturan.warnaAksenLogin, DEFAULT_LOGIN_ACCENT);

  const [appBgInput, setAppBgInput] = useState<string>(savedAppBg);
  const [loginBgInput, setLoginBgInput] = useState<string>(savedLoginBg);
  const [loginAccentInput, setLoginAccentInput] = useState<string>(savedLoginAccent);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setAppBgInput(normalizeHexColor(defaultPengaturan.warnaBgAplikasi, DEFAULT_APP_BG));
    setLoginBgInput(normalizeHexColor(defaultPengaturan.warnaBgLogin, DEFAULT_LOGIN_BG));
    setLoginAccentInput(normalizeHexColor(defaultPengaturan.warnaAksenLogin, DEFAULT_LOGIN_ACCENT));
  }, [
    defaultPengaturan.warnaBgAplikasi,
    defaultPengaturan.warnaBgLogin,
    defaultPengaturan.warnaAksenLogin,
  ]);

  const validAppBg = normalizeHexColor(appBgInput, DEFAULT_APP_BG);
  const validLoginBg = normalizeHexColor(loginBgInput, DEFAULT_LOGIN_BG);
  const validLoginAccent = normalizeHexColor(loginAccentInput, DEFAULT_LOGIN_ACCENT);

  // Live preview on the running app background & CSS variables while Super Admin picks colors
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--preview-app-bg', validAppBg);
    root.style.setProperty('--preview-login-bg', validLoginBg);
    root.style.setProperty('--preview-login-accent', validLoginAccent);

    applyThemeCssVariables({
      warnaBgAplikasi: validAppBg,
      warnaBgLogin: validLoginBg,
      warnaAksenLogin: validLoginAccent,
    });

    return () => {
      // Restore committed settings when leaving without saving
      applyThemeCssVariables({
        warnaBgAplikasi: savedAppBg,
        warnaBgLogin: savedLoginBg,
        warnaAksenLogin: savedLoginAccent,
      });
    };
  }, [validAppBg, validLoginBg, validLoginAccent, savedAppBg, savedLoginBg, savedLoginAccent]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSaving(true);

    try {
      await onSaveThemeColors({
        warnaBgAplikasi: validAppBg,
        warnaBgLogin: validLoginBg,
        warnaAksenLogin: validLoginAccent,
      });
      confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
      setStatusMsg({
        type: 'success',
        text: 'Warna background aplikasi dan halaman login berhasil disimpan ke Firestore serta diterapkan secara global.',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal menyimpan pengaturan warna ke Firestore. Silakan coba kembali.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setAppBgInput(DEFAULT_APP_BG);
    setLoginBgInput(DEFAULT_LOGIN_BG);
    setLoginAccentInput(DEFAULT_LOGIN_ACCENT);
    setStatusMsg(null);
    setIsSaving(true);

    try {
      await onSaveThemeColors({
        warnaBgAplikasi: DEFAULT_APP_BG,
        warnaBgLogin: DEFAULT_LOGIN_BG,
        warnaAksenLogin: DEFAULT_LOGIN_ACCENT,
      });
      setStatusMsg({
        type: 'success',
        text: 'Warna background aplikasi dan halaman login dikembalikan ke warna bawaan sistem.',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal mereset warna background ke Firestore.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const appBgIsDark = isDarkColor(validAppBg);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-[#c3c4c7] shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#1d2327] via-[#2c3338] to-[#1d2327] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white">
                  Khusus Super Admin
                </span>
                <span className="text-[11px] text-slate-300 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sinkron Realtime Firestore</span>
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white mt-1">
                Pengaturan Warna Background Aplikasi &amp; Login
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Sesuaikan warna latar belakang ruang kerja aplikasi dan tampilan halaman masuk akun secara global untuk semua pengguna.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Form Controls */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white rounded-xl border border-[#c3c4c7] shadow-xs p-5 space-y-6"
        >
          {/* Section 1: Warna Background Aplikasi */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-[#2271b1]" />
                  <span>1. Warna Background Aplikasi</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mengubah warna latar belakang area utama aplikasi &amp; footer setelah login.
                </p>
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                {validAppBg}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 transition">
                <input
                  type="color"
                  value={validAppBg}
                  onChange={(e) => {
                    setAppBgInput(e.target.value);
                    if (statusMsg) setStatusMsg(null);
                  }}
                  aria-label="Pilih warna background aplikasi"
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-semibold text-slate-700">Pilih Warna</span>
              </label>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-500">Hex:</span>
                <input
                  type="text"
                  value={appBgInput}
                  onChange={(e) => {
                    setAppBgInput(e.target.value);
                    if (statusMsg) setStatusMsg(null);
                  }}
                  placeholder="#f0f0f1"
                  maxLength={7}
                  className="w-28 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-[#2271b1] focus:outline-hidden uppercase"
                />
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Pilihan Cepat Background Aplikasi
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {APP_BG_PRESETS.map((preset) => {
                  const isSelected = validAppBg === preset.hex;
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => {
                        setAppBgInput(preset.hex);
                        if (statusMsg) setStatusMsg(null);
                      }}
                      title={`${preset.label} (${preset.hex})`}
                      className={`group flex flex-col items-center p-1.5 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? 'border-[#2271b1] ring-2 ring-[#2271b1]/30 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-md border border-slate-300 shadow-2xs ${preset.swatchClass}`}
                      />
                      <span className="text-[9px] font-semibold text-slate-600 mt-1 truncate w-full text-center">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Warna Background Halaman Login */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <LogIn className="w-4 h-4 text-[#f06d6f]" />
                  <span>2. Warna Background Halaman Login</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mengubah warna latar belakang di sekeliling kartu masuk akun.
                </p>
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                {validLoginBg}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 transition">
                <input
                  type="color"
                  value={validLoginBg}
                  onChange={(e) => {
                    setLoginBgInput(e.target.value);
                    if (statusMsg) setStatusMsg(null);
                  }}
                  aria-label="Pilih warna background halaman login"
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-semibold text-slate-700">Pilih Warna</span>
              </label>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-500">Hex:</span>
                <input
                  type="text"
                  value={loginBgInput}
                  onChange={(e) => {
                    setLoginBgInput(e.target.value);
                    if (statusMsg) setStatusMsg(null);
                  }}
                  placeholder="#f1f5f9"
                  maxLength={7}
                  className="w-28 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-[#2271b1] focus:outline-hidden uppercase"
                />
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Pilihan Cepat Background Login
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {LOGIN_BG_PRESETS.map((preset) => {
                  const isSelected = validLoginBg === preset.hex;
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => {
                        setLoginBgInput(preset.hex);
                        if (statusMsg) setStatusMsg(null);
                      }}
                      title={`${preset.label} (${preset.hex})`}
                      className={`group flex flex-col items-center p-1.5 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? 'border-[#2271b1] ring-2 ring-[#2271b1]/30 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-md border border-slate-300 shadow-2xs ${preset.swatchClass}`}
                      />
                      <span className="text-[9px] font-semibold text-slate-600 mt-1 truncate w-full text-center">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Opsional Warna Aksen Gelombang & Tombol Login */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>3. Warna Aksen Header &amp; Tombol Login (Opsional)</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Selaraskan warna gelombang atas kartu dan tombol Masuk agar serasi dengan background login.
                </p>
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                {validLoginAccent}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 transition">
                <input
                  type="color"
                  value={validLoginAccent}
                  onChange={(e) => {
                    setLoginAccentInput(e.target.value);
                    if (statusMsg) setStatusMsg(null);
                  }}
                  aria-label="Pilih warna aksen halaman login"
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-semibold text-slate-700">Pilih Aksen</span>
              </label>

              <div className="flex flex-wrap items-center gap-1.5">
                {LOGIN_ACCENT_PRESETS.map((preset) => {
                  const isSelected = validLoginAccent === preset.hex;
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => {
                        setLoginAccentInput(preset.hex);
                        if (statusMsg) setStatusMsg(null);
                      }}
                      title={`${preset.label} (${preset.hex})`}
                      className={`px-2 py-1 rounded-md border text-[10px] font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'border-slate-800 bg-slate-100 text-slate-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${preset.swatchClass}`} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit & Reset */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Warna Bawaan</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] shadow-xs transition flex items-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Warna Background</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Previews Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Preview 1: App Background */}
          <div className="bg-white rounded-xl border border-[#c3c4c7] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-[#2271b1]" />
                <span>Pratinjau Background Aplikasi</span>
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                {validAppBg}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-inner">
              {/* Mini Admin Bar */}
              <div className="h-5 bg-[#1d2327] px-2.5 flex items-center justify-between text-[9px] text-[#c3c4c7]">
                <span className="font-semibold text-white">E-Jurnal</span>
                <span>Halo, superadmin</span>
              </div>
              <div className="flex min-h-[120px]">
                {/* Mini Sidebar */}
                <div className="w-16 bg-[#23282d] p-1.5 space-y-1 text-[8px] text-[#c3c4c7] shrink-0">
                  <div className="px-1.5 py-1 rounded bg-[#2271b1] text-white font-bold">Dasbor</div>
                  <div className="px-1.5 py-0.5 text-[#8c8f94]">Jurnal</div>
                  <div className="px-1.5 py-0.5 text-[#8c8f94]">Warna</div>
                </div>
                {/* Mini App Canvas */}
                <div className="flex-1 bg-[var(--preview-app-bg)] p-3 flex flex-col justify-between transition-colors">
                  <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="text-[10px] font-bold text-slate-800">Area Kerja Utama</div>
                    <div className="h-2 w-3/4 bg-slate-200 rounded" />
                    <div className="h-2 w-1/2 bg-slate-100 rounded" />
                  </div>
                  <div
                    className={`mt-2 pt-1.5 border-t text-[9px] font-semibold ${
                      appBgIsDark
                        ? 'border-white/15 text-slate-200'
                        : 'border-slate-300/60 text-slate-700'
                    }`}
                  >
                    {defaultPengaturan.namaInstansi || 'E-Jurnal Kinerja'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview 2: Login Background */}
          <div className="bg-white rounded-xl border border-[#c3c4c7] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-[#f06d6f]" />
                <span>Pratinjau Background Login</span>
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                {validLoginBg}
              </span>
            </div>

            <div className="bg-[var(--preview-login-bg)] p-5 rounded-xl border border-slate-200 flex items-center justify-center transition-colors">
              <div className="w-48 bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">
                {/* Mini Wave Header */}
                <div className="h-10 bg-[var(--preview-login-accent)] relative overflow-hidden">
                  <div className="absolute -bottom-3 -left-2 right-0 h-5 bg-white rounded-t-[100%]" />
                </div>
                <div className="px-3.5 pb-3.5 pt-1 space-y-2">
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">Masuk Akun</div>
                    <div className="h-[2px] w-7 bg-[var(--preview-login-accent)] rounded-full mt-0.5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 border-b border-slate-200 text-[8px] text-slate-400">
                      Username / NIP
                    </div>
                    <div className="h-3 border-b border-slate-200 text-[8px] text-slate-400">
                      Kata Sandi
                    </div>
                  </div>
                  <div className="h-6 rounded-lg bg-[var(--preview-login-accent)] flex items-center justify-center text-[9px] font-bold text-white">
                    Masuk
                  </div>
                  <div className="text-center text-[8px] text-slate-400 truncate">
                    {defaultPengaturan.teksCopyright?.trim() ||
                      `\u00A9 ${new Date().getFullYear()} ${defaultPengaturan.namaInstansi || 'E-Jurnal Kinerja'}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
