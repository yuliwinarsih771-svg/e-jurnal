import React, { useState, useEffect } from 'react';
import {
  Copyright,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Eye,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PengaturanInstansi } from '../types';

interface PengaturanCopyrightViewProps {
  defaultPengaturan: PengaturanInstansi;
  onSaveGlobalCopyright: (patch: {
    teksCopyright: string;
    tampilkanCopyrightDiFooter: boolean;
    namaInstansi?: string;
  }) => Promise<void>;
}

export const PengaturanCopyrightView: React.FC<PengaturanCopyrightViewProps> = ({
  defaultPengaturan,
  onSaveGlobalCopyright,
}) => {
  const currentYear = new Date().getFullYear();
  const fallbackCopyright = `\u00A9 ${currentYear} ${defaultPengaturan.namaInstansi || 'E-Jurnal Kinerja'}`;

  const [teksCopyright, setTeksCopyright] = useState<string>(
    defaultPengaturan.teksCopyright?.trim() || fallbackCopyright
  );
  const [tampilkanCopyrightDiFooter, setTampilkanCopyrightDiFooter] = useState<boolean>(
    Boolean(defaultPengaturan.tampilkanCopyrightDiFooter)
  );
  const [namaInstansi, setNamaInstansi] = useState<string>(
    defaultPengaturan.namaInstansi || ''
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const computedFallback = `\u00A9 ${new Date().getFullYear()} ${defaultPengaturan.namaInstansi || 'E-Jurnal Kinerja'}`;
    setTeksCopyright(defaultPengaturan.teksCopyright?.trim() || computedFallback);
    setTampilkanCopyrightDiFooter(Boolean(defaultPengaturan.tampilkanCopyrightDiFooter));
    setNamaInstansi(defaultPengaturan.namaInstansi || '');
  }, [
    defaultPengaturan.teksCopyright,
    defaultPengaturan.tampilkanCopyrightDiFooter,
    defaultPengaturan.namaInstansi,
  ]);

  const previewCopyrightText =
    teksCopyright.trim() || `\u00A9 ${currentYear} ${namaInstansi.trim() || 'E-Jurnal Kinerja'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSaving(true);

    try {
      await onSaveGlobalCopyright({
        teksCopyright: teksCopyright.trim(),
        tampilkanCopyrightDiFooter,
        namaInstansi: namaInstansi.trim(),
      });
      confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
      setStatusMsg({
        type: 'success',
        text: 'Teks copyright berhasil disimpan ke Firestore dan langsung diperbarui pada halaman login.',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal menyimpan teks copyright ke Firestore. Silakan coba kembali.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    const resetInstansi = namaInstansi.trim() || defaultPengaturan.namaInstansi || 'E-Jurnal Kinerja';
    const resetText = `\u00A9 ${currentYear} ${resetInstansi}`;
    setTeksCopyright(resetText);
    setTampilkanCopyrightDiFooter(false);
    setStatusMsg(null);
    setIsSaving(true);

    try {
      await onSaveGlobalCopyright({
        teksCopyright: '',
        tampilkanCopyrightDiFooter: false,
        namaInstansi: resetInstansi,
      });
      setStatusMsg({
        type: 'success',
        text: `Format copyright dikembalikan ke standar otomatis: "${resetText}".`,
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal mereset pengaturan copyright ke Firestore.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#c3c4c7] shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#1d2327] via-[#2c3338] to-[#1d2327] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 border border-rose-400/30 text-rose-300 shrink-0">
              <Copyright className="w-5 h-5" />
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
                Pengaturan Teks Copyright &amp; Footer Aplikasi
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Ubah teks copyright yang tampil di bagian bawah halaman login (misalnya{' '}
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-rose-200 font-mono">
                  &copy; {currentYear} PEMERINTAH PROVINSI JAWA TIMUR
                </code>
                ).
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

      {/* Main Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-3 bg-white rounded-xl border border-[#c3c4c7] shadow-xs p-5 space-y-5"
        >
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#2271b1]" />
              <span>Ubah Teks Copyright</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Perubahan langsung tersimpan ke database global dan otomatis muncul di semua perangkat.
            </p>
          </div>

          {/* Primary Input: Teks Copyright */}
          <div className="space-y-2">
            <label
              htmlFor="input-teks-copyright"
              className="block text-xs font-bold text-slate-800"
            >
              Teks Copyright Halaman Login *
            </label>
            <input
              id="input-teks-copyright"
              type="text"
              value={teksCopyright}
              onChange={(e) => {
                setTeksCopyright(e.target.value);
                if (statusMsg) setStatusMsg(null);
              }}
              placeholder={`\u00A9 ${currentYear} PEMERINTAH PROVINSI JAWA TIMUR`}
              maxLength={180}
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 focus:outline-hidden"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-500 mr-1">Bantuan cepat:</span>
              <button
                type="button"
                onClick={() => {
                  const clean = teksCopyright.replace(/^\u00A9\s*\d{0,4}\s*/i, '').trim();
                  setTeksCopyright(`\u00A9 ${currentYear} ${clean}`.trim());
                }}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 cursor-pointer transition"
              >
                Sisipkan &copy; {currentYear}
              </button>
              <button
                type="button"
                onClick={() =>
                  setTeksCopyright(
                    `\u00A9 ${currentYear} ${namaInstansi.trim() || 'E-Jurnal Kinerja'}`
                  )
                }
                className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-[#2271b1] rounded border border-blue-200 cursor-pointer transition"
              >
                Sesuaikan Nama Instansi
              </button>
            </div>
          </div>

          {/* Toggle for App Main Footer */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <label className="flex items-start space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tampilkanCopyrightDiFooter}
                onChange={(e) => setTampilkanCopyrightDiFooter(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Tampilkan juga di footer bawah dasbor setelah login
                </span>
                <span className="text-[11px] text-slate-500">
                  Jika dicentang, teks copyright di atas juga menggantikan teks instansi pada footer bagian bawah halaman dasbor.
                </span>
              </div>
            </label>
          </div>

          {/* Secondary Field: Nama Instansi Global */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label
              htmlFor="input-nama-instansi-global"
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-800"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Nama Instansi Global (Subjudul Halaman Login &amp; Kop Default)</span>
            </label>
            <input
              id="input-nama-instansi-global"
              type="text"
              value={namaInstansi}
              onChange={(e) => {
                setNamaInstansi(e.target.value);
                if (statusMsg) setStatusMsg(null);
              }}
              placeholder="PEMERINTAH PROVINSI JAWA TIMUR"
              maxLength={160}
              className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 focus:outline-hidden"
            />
            <p className="text-[10px] text-slate-500">
              Opsional: tampil pada baris subjudul di bawah judul &ldquo;Masuk Akun&rdquo; pada halaman login.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
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
                  <span>Simpan Teks Copyright</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Login Card Bottom Preview */}
          <div className="bg-white rounded-xl border border-[#c3c4c7] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-[#f06d6f]" />
                <span>Pratinjau Halaman Login</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Realtime
              </span>
            </div>

            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="h-3 bg-gradient-to-r from-[#ff8e8e] via-[#ff7b7b] to-[#f26b6d]" />
                <div className="p-4 space-y-2.5">
                  <div>
                    <div className="text-sm font-extrabold text-slate-800">Masuk Akun</div>
                    <div className="h-[2px] w-8 bg-[#f26b6d] rounded-full mt-0.5" />
                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      E-Jurnal Harian Pegawai &middot; {namaInstansi.trim() || 'E-Jurnal Kinerja'}
                    </div>
                  </div>
                  <div className="h-6 rounded-lg bg-[#f06d6f]/90 flex items-center justify-center text-[10px] font-bold text-white">
                    Masuk
                  </div>
                </div>
                <div className="px-4 pb-3 pt-1 text-center text-[11px] font-medium text-slate-500 border-t border-slate-100 break-words">
                  {previewCopyrightText}
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Footer Preview */}
          <div className="bg-white rounded-xl border border-[#c3c4c7] shadow-xs p-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-800">Pratinjau Footer Dasbor</div>
            <div className="px-3 py-2 bg-[#f0f0f1] border border-[#dcdcde] rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#50575e]">
              <span className="font-semibold text-slate-700 break-words">
                {tampilkanCopyrightDiFooter
                  ? previewCopyrightText
                  : namaInstansi.trim() || 'E-Jurnal Kinerja'}
              </span>
              <span className="text-[10px] text-[#8c8f94]">Versi 5.1.1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
