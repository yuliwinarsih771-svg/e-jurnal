import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  Sparkles,
  Link as LinkIcon,
  Building2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PengaturanInstansi } from '../types';
import { PRESET_LOGOS } from '../utils/presetLogos';

interface PengaturanLogoLoginViewProps {
  defaultPengaturan: PengaturanInstansi;
  onSaveLoginLogo: (patch: {
    logoLoginUrl: string;
    tampilkanLogoLogin: boolean;
    ukuranLogoLogin: 'sm' | 'md' | 'lg';
    bentukLogoLogin: 'circle' | 'rounded' | 'plain';
  }) => Promise<void>;
}

export const PengaturanLogoLoginView: React.FC<PengaturanLogoLoginViewProps> = ({
  defaultPengaturan,
  onSaveLoginLogo,
}) => {
  const [logoLoginUrl, setLogoLoginUrl] = useState<string>(defaultPengaturan.logoLoginUrl || '');
  const [tampilkanLogoLogin, setTampilkanLogoLogin] = useState<boolean>(
    defaultPengaturan.tampilkanLogoLogin ?? Boolean(defaultPengaturan.logoLoginUrl)
  );
  const [ukuranLogoLogin, setUkuranLogoLogin] = useState<'sm' | 'md' | 'lg'>(
    defaultPengaturan.ukuranLogoLogin || 'md'
  );
  const [bentukLogoLogin, setBentukLogoLogin] = useState<'circle' | 'rounded' | 'plain'>(
    defaultPengaturan.bentukLogoLogin || 'rounded'
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogoLoginUrl(defaultPengaturan.logoLoginUrl || '');
    setTampilkanLogoLogin(
      defaultPengaturan.tampilkanLogoLogin ?? Boolean(defaultPengaturan.logoLoginUrl)
    );
    setUkuranLogoLogin(defaultPengaturan.ukuranLogoLogin || 'md');
    setBentukLogoLogin(defaultPengaturan.bentukLogoLogin || 'rounded');
  }, [
    defaultPengaturan.logoLoginUrl,
    defaultPengaturan.tampilkanLogoLogin,
    defaultPengaturan.ukuranLogoLogin,
    defaultPengaturan.bentukLogoLogin,
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({
        type: 'error',
        text: 'Ukuran berkas logo terlalu besar. Maksimal 5MB.',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      if (file.type === 'image/svg+xml' && rawDataUrl.length < 400000) {
        setLogoLoginUrl(rawDataUrl);
        setTampilkanLogoLogin(true);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 512;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setLogoLoginUrl(rawDataUrl);
          setTampilkanLogoLogin(true);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let compressed = canvas.toDataURL('image/png');
        if (compressed.length > 550000) {
          compressed = canvas.toDataURL('image/jpeg', 0.88);
        }
        setLogoLoginUrl(compressed);
        setTampilkanLogoLogin(true);
      };
      img.onerror = () => {
        setStatusMsg({
          type: 'error',
          text: 'File gambar tidak dapat dibaca. Gunakan format PNG, JPG, WebP, atau SVG yang valid.',
        });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (tampilkanLogoLogin && !logoLoginUrl.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Silakan unggah logo atau pilih salah satu preset logo terlebih dahulu sebelum mengaktifkan tampilan logo.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSaveLoginLogo({
        logoLoginUrl: logoLoginUrl.trim(),
        tampilkanLogoLogin,
        ukuranLogoLogin,
        bentukLogoLogin,
      });
      confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
      setStatusMsg({
        type: 'success',
        text: tampilkanLogoLogin
          ? 'Logo login berhasil disimpan ke Firestore dan langsung muncul di halaman login semua akun!'
          : 'Pengaturan logo login berhasil disimpan (logo disembunyikan dari halaman login).',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal menyimpan logo login ke Firestore. Pastikan ukuran logo tidak terlalu besar dan coba lagi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLogo = async () => {
    setStatusMsg(null);
    setIsSaving(true);
    try {
      setLogoLoginUrl('');
      setTampilkanLogoLogin(false);
      await onSaveLoginLogo({
        logoLoginUrl: '',
        tampilkanLogoLogin: false,
        ukuranLogoLogin,
        bentukLogoLogin,
      });
      setStatusMsg({
        type: 'success',
        text: 'Logo login telah dihapus dari halaman login semua akun.',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal menghapus logo login dari Firestore.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewSizeClass =
    ukuranLogoLogin === 'sm'
      ? 'w-12 h-12'
      : ukuranLogoLogin === 'lg'
        ? 'w-20 h-20'
        : 'w-16 h-16';

  const previewFrameClass =
    bentukLogoLogin === 'circle'
      ? 'rounded-full bg-white/95 p-1.5 shadow-md ring-2 ring-white/40'
      : bentukLogoLogin === 'plain'
        ? 'bg-transparent p-0 drop-shadow-md'
        : 'rounded-2xl bg-white/95 p-1.5 shadow-md ring-2 ring-white/40';

  const currentCopyright =
    defaultPengaturan.teksCopyright?.trim() ||
    `\u00A9 ${new Date().getFullYear()} ${defaultPengaturan.namaInstansi || 'E-Jurnal Kinerja'}`;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#c3c4c7] shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#1d2327] via-[#2c3338] to-[#1d2327] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white">
                  Khusus Super Admin
                </span>
                <span className="text-[11px] text-slate-300 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Muncul di Login Semua Akun</span>
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white mt-1">
                Pengaturan Logo Halaman Login
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Unggah atau pilih logo resmi instansi/sekolah agar otomatis tampil pada halaman login untuk seluruh akun pegawai, atasan, admin, dan super admin.
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
        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white rounded-xl border border-[#c3c4c7] shadow-xs p-5 space-y-5"
        >
          {/* Toggle Visibility */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <label className="flex items-start space-x-2.5 cursor-pointer select-none flex-1">
              <input
                type="checkbox"
                checked={tampilkanLogoLogin}
                onChange={(e) => setTampilkanLogoLogin(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Tampilkan Logo pada Halaman Login Semua Akun
                </span>
                <span className="text-[11px] text-slate-500">
                  Aktifkan agar logo tampil di bagian atas kartu login sebelum pengguna masuk.
                </span>
              </div>
            </label>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                tampilkanLogoLogin && logoLoginUrl
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tampilkanLogoLogin && logoLoginUrl ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>

          {/* Upload File Area */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-[#2271b1]" />
              <span>1. Unggah Berkas Logo (PNG / JPG / SVG / WebP)</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                {logoLoginUrl ? (
                  <img
                    src={logoLoginUrl}
                    alt="Preview Logo Login"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-7 h-7 text-slate-300" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <p className="text-xs text-slate-700 font-semibold">
                  Pilih gambar logo resmi instansi, dinas, atau sekolah Anda.
                </p>
                <p className="text-[10px] text-slate-500">
                  Gambar otomatis dioptimalkan agar tersimpan cepat di Firebase Firestore.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File Logo</span>
                  </button>
                  {defaultPengaturan.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoLoginUrl(defaultPengaturan.logoUrl || '');
                        setTampilkanLogoLogin(true);
                        setStatusMsg(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pakai Logo Kop Instansi</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* URL Alternatif */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-logo-login-url"
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-800"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Atau Masukkan URL Gambar Logo (Opsional)</span>
            </label>
            <input
              id="input-logo-login-url"
              type="text"
              value={logoLoginUrl.startsWith('data:') ? '' : logoLoginUrl}
              onChange={(e) => {
                setLogoLoginUrl(e.target.value);
                if (e.target.value.trim()) setTampilkanLogoLogin(true);
                if (statusMsg) setStatusMsg(null);
              }}
              placeholder={
                logoLoginUrl.startsWith('data:')
                  ? 'Menggunakan berkas gambar tersimpan (unggah ulang atau tempel URL baru untuk mengganti)'
                  : 'https://contoh.go.id/logo.png'
              }
              className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-[#2271b1] focus:outline-hidden"
            />
          </div>

          {/* Preset Logos */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Pilihan Cepat Lambang Resmi Bawaan</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_LOGOS.map((preset) => {
                const isSelected = logoLoginUrl === preset.dataUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setLogoLoginUrl(preset.dataUrl);
                      setTampilkanLogoLogin(true);
                      setStatusMsg(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center space-y-1.5 ${
                      isSelected
                        ? 'border-[#2271b1] bg-blue-50/70 ring-2 ring-[#2271b1]/25'
                        : 'border-slate-200 hover:border-slate-400 bg-white'
                    }`}
                  >
                    <img
                      src={preset.dataUrl}
                      alt={preset.name}
                      className="w-10 h-10 object-contain"
                    />
                    <span className="text-[10px] font-bold text-slate-700 leading-tight line-clamp-2">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size & Shape Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="block text-xs font-bold text-slate-800 mb-1.5">
                Ukuran Logo di Header Login
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'sm', label: 'Kecil' },
                    { id: 'md', label: 'Sedang' },
                    { id: 'lg', label: 'Besar' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setUkuranLogoLogin(opt.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      ukuranLogoLogin === opt.id
                        ? 'bg-[#2271b1] text-white border-[#2271b1]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-800 mb-1.5">
                Bingkai Logo
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'rounded', label: 'Kotak' },
                    { id: 'circle', label: 'Bulat' },
                    { id: 'plain', label: 'Polos' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBentukLogoLogin(opt.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      bentukLogoLogin === opt.id
                        ? 'bg-[#2271b1] text-white border-[#2271b1]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleClearLogo}
              disabled={isSaving || !logoLoginUrl}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Logo</span>
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
                  <span>Simpan &amp; Terapkan Logo Login</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Card Preview */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-[#c3c4c7] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-[#f06d6f]" />
                <span>Pratinjau Halaman Login Semua Akun</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#2271b1] border border-blue-200">
                Realtime
              </span>
            </div>

            <div className="bg-[var(--login-bg,#f1f5f9)] p-5 rounded-xl border border-slate-200 flex items-center justify-center">
              <div className="w-full max-w-[265px] bg-white rounded-3xl shadow-lg border border-slate-200/80 overflow-hidden">
                {/* Wave Header with Centered Logo */}
                <div className="relative w-full h-28 bg-white overflow-hidden">
                  <svg
                    viewBox="0 0 400 200"
                    preserveAspectRatio="none"
                    className="w-full h-full block"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="previewLogoWaveGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--login-accent-light, #ff8e8e)" />
                        <stop offset="55%" stopColor="var(--login-accent, #ff7b7b)" />
                        <stop offset="100%" stopColor="var(--login-accent-dark, #f26b6d)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,0 L400,0 L400,152 C335,186 250,185 190,130 C130,76 55,80 0,118 Z"
                      fill="url(#previewLogoWaveGrad)"
                    />
                  </svg>

                  {tampilkanLogoLogin && logoLoginUrl && (
                    <div className="absolute inset-x-0 top-3 flex items-center justify-center pointer-events-none">
                      <div
                        className={`${previewSizeClass} ${previewFrameClass} flex items-center justify-center overflow-hidden transition-all`}
                      >
                        <img
                          src={logoLoginUrl}
                          alt="Logo Login"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-4 pt-0.5 space-y-3">
                  <div>
                    <div className="text-lg font-extrabold text-slate-800 leading-tight">
                      Masuk Akun
                    </div>
                    <div className="h-[2.5px] w-11 bg-[var(--login-accent,#f26b6d)] rounded-full mt-0.5" />
                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      E-Jurnal Harian Pegawai &middot;{' '}
                      {defaultPengaturan.namaInstansi || 'E-Jurnal Kinerja'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="border-b border-slate-200 pb-1 text-[10px] text-slate-400">
                      Username / NIP
                    </div>
                    <div className="border-b border-slate-200 pb-1 text-[10px] text-slate-400">
                      Kata Sandi
                    </div>
                  </div>

                  <div className="h-7 rounded-lg bg-[var(--login-accent,#f06d6f)] flex items-center justify-center text-[11px] font-bold text-white shadow-xs">
                    Masuk
                  </div>

                  <div className="text-center text-[9px] text-slate-400 pt-0.5 truncate">
                    {currentCopyright}
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
