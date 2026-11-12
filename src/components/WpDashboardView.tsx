import React, { useState } from 'react';
import { 
  Pin, 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  Info,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Pegawai, KegiatanJurnal, PengaturanInstansi } from '../types';
import { formatTanggalIndonesia, BULAN_INDONESIA } from '../utils/exportUtils';

interface WpDashboardViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  kegiatanList: KegiatanJurnal[];
  pengaturan: PengaturanInstansi;
  onNavigateToTab: (tab: string) => void;
  onAddQuickDraft: (kegiatan: string, outputHasil: string) => Promise<void>;
  onDeleteKegiatan: (id: string) => void;
  onOpenJurnalModal: () => void;
}

export const WpDashboardView: React.FC<WpDashboardViewProps> = ({
  currentPegawai,
  kegiatanList,
  pengaturan,
  onNavigateToTab,
  onAddQuickDraft,
  onDeleteKegiatan,
  onOpenJurnalModal,
}) => {
  // Screen options & Help toggles (authentic WordPress top drawers)
  const [showScreenOptions, setShowScreenOptions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Widget collapse states
  const [collapseAtGlance, setCollapseAtGlance] = useState(false);
  const [collapseQuickDraft, setCollapseQuickDraft] = useState(false);
  const [collapseActivity, setCollapseActivity] = useState(false);

  // Quick Draft Form States
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [draftSuccessMsg, setDraftSuccessMsg] = useState<string | null>(null);

  // Calculate statistics for the current user
  const userKegiatan = kegiatanList.filter((k) => k.pegawaiId === currentPegawai.id);
  const totalKegiatan = userKegiatan.length;
  const approvedKegiatan = userKegiatan.filter((k) => k.statusValidasi === 'Disetujui').length;
  const pendingKegiatan = userKegiatan.filter((k) => k.statusValidasi === 'Menunggu').length;

  // Calculate total hours
  const totalJam = userKegiatan.reduce((acc, k) => {
    if (k.waktuMulai && k.waktuSelesai) {
      const [mH, mM] = k.waktuMulai.split(':').map(Number);
      const [sH, sM] = k.waktuSelesai.split(':').map(Number);
      const diff = (sH * 60 + sM) - (mH * 60 + mM);
      if (diff > 0) return acc + diff / 60;
    }
    return acc;
  }, 0);

  // Recent 5 activities
  const recentKegiatan = [...userKegiatan].slice(0, 5);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;

    try {
      setIsSubmittingDraft(true);
      await onAddQuickDraft(draftTitle.trim(), draftContent.trim() || 'Draf pekerjaan harian tercatat.');
      setDraftTitle('');
      setDraftContent('');
      setDraftSuccessMsg('Draf kegiatan berhasil disimpan ke Jurnal Harian!');
      setTimeout(() => setDraftSuccessMsg(null), 3500);
    } catch {
      // ignore
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#3c434a]">
      
      {/* WordPress Screen Options & Help Slideout Drawers */}
      <div className="flex justify-end items-center gap-1 -mt-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setShowScreenOptions(!showScreenOptions);
            setShowHelp(false);
          }}
          className={`px-3 py-1 bg-white border border-[#c3c4c7] rounded-t text-[#2271b1] hover:text-[#135e96] font-normal flex items-center gap-1 transition ${
            showScreenOptions ? 'border-b-white bg-slate-50' : ''
          }`}
        >
          <span>Opsi Layar</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showScreenOptions ? 'rotate-180' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => {
            setShowHelp(!showHelp);
            setShowScreenOptions(false);
          }}
          className={`px-3 py-1 bg-white border border-[#c3c4c7] rounded-t text-[#2271b1] hover:text-[#135e96] font-normal flex items-center gap-1 transition ${
            showHelp ? 'border-b-white bg-slate-50' : ''
          }`}
        >
          <span>Bantuan</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showScreenOptions && (
        <div className="bg-white border border-[#c3c4c7] p-4 text-xs shadow-xs animate-in fade-in slide-in-from-top-1 -mt-3 mb-3">
          <h4 className="font-bold text-[#1d2327] mb-2">Kotak Tampilan Dasbor</h4>
          <p className="text-slate-600 mb-2">Pilih elemen yang ingin ditampilkan pada halaman ringkasan kerja ini:</p>
          <div className="flex flex-wrap gap-4 text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-[#8c8f94] text-[#2271b1]" />
              <span>Sekilas Info</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-[#8c8f94] text-[#2271b1]" />
              <span>Draf Cepat</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-[#8c8f94] text-[#2271b1]" />
              <span>Aktivitas & Riwayat Tugas</span>
            </label>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="bg-white border border-[#c3c4c7] p-4 text-xs shadow-xs animate-in fade-in slide-in-from-top-1 -mt-3 mb-3">
          <h4 className="font-bold text-[#1d2327] mb-1">Panduan Penggunaan E-Jurnal Kinerja</h4>
          <p className="text-slate-600 leading-relaxed max-w-3xl">
            Tampilan dasbor ini dirancang dengan antarmuka klasik WordPress Dashboard untuk mempermudah navigasi, pencatatan draf cepat aktivitas harian, serta monitoring paraf verifikasi atasan langsung secara real-time.
          </p>
        </div>
      )}

      {/* Main Page Title Header */}
      <div className="flex items-center justify-between pb-1">
        <h1 className="text-2xl font-normal text-[#1d2327] tracking-tight">
          Dasbor
        </h1>
        <button
          type="button"
          onClick={onOpenJurnalModal}
          className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] active:bg-[#0a4b78] text-white text-xs font-semibold rounded shadow-xs transition flex items-center space-x-1 cursor-pointer"
        >
          <span>+ Tambah Kegiatan Baru</span>
        </button>
      </div>

      {/* 2-Column Responsive WordPress Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-4">
          
          {/* Metabox 1: Sekilas Info (At a Glance) */}
          <div className="bg-white border border-[#c3c4c7] shadow-2xs">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#c3c4c7] bg-[#fafafa]">
              <h2 className="text-sm font-semibold text-[#1d2327]">
                Sekilas Info
              </h2>
              <button
                type="button"
                onClick={() => setCollapseAtGlance(!collapseAtGlance)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title={collapseAtGlance ? 'Perluas' : 'Ciutkan'}
              >
                {collapseAtGlance ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapseAtGlance && (
              <div className="p-3.5 space-y-3 text-xs text-[#3c434a]">
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 border-b border-[#f0f0f1] pb-3">
                  <button
                    onClick={() => onNavigateToTab('jurnal-harian')}
                    className="flex items-center space-x-2 text-[#2271b1] hover:text-[#135e96] text-left cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span><strong>{totalKegiatan}</strong> Kegiatan Jurnal</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTab('rekapitulasi')}
                    className="flex items-center space-x-2 text-[#2271b1] hover:text-[#135e96] text-left cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span><strong>1</strong> Rekapitulasi</span>
                  </button>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong className="text-emerald-700 font-bold">{approvedKegiatan}</strong> Disetujui Atasan</span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span><strong className="text-amber-700 font-bold">{pendingKegiatan}</strong> Menunggu Paraf</span>
                  </div>

                  <div className="col-span-2 flex items-center space-x-2 text-slate-700 pt-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Total Waktu Kerja Efektif: <strong className="font-mono text-slate-900">{totalJam.toFixed(1)} Jam</strong></span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-0.5 leading-relaxed">
                  E-Jurnal Kinerja 5.1.1 berjalan menggunakan tema resmi <span className="text-[#2271b1] font-medium">{pengaturan.badanDinas || 'Pemerintah Daerah'}</span> dengan Firebase Firestore Cloud Realtime.
                </div>
              </div>
            )}
          </div>

          {/* Metabox 2: Aktivitas & Riwayat Tugas Terbaru */}
          <div className="bg-white border border-[#c3c4c7] shadow-2xs">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#c3c4c7] bg-[#fafafa]">
              <h2 className="text-sm font-semibold text-[#1d2327]">
                Aktivitas & Riwayat Tugas Terbaru
              </h2>
              <button
                type="button"
                onClick={() => setCollapseActivity(!collapseActivity)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                {collapseActivity ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapseActivity && (
              <div className="p-3.5 space-y-2 text-xs">
                {recentKegiatan.length === 0 ? (
                  <div className="py-4 text-center text-slate-400">
                    <Info className="w-5 h-5 mx-auto text-slate-300 mb-1" />
                    <p>Belum ada catatan aktivitas di periode ini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentKegiatan.map((keg) => (
                      <div key={keg.id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                            <span className="font-bold text-slate-700">{keg.hari}, {keg.tanggal}</span>
                            <span>&bull;</span>
                            <span className="font-mono">{keg.waktuMulai} - {keg.waktuSelesai}</span>
                          </div>
                          <p className="font-semibold text-slate-900 truncate mt-0.5">
                            {keg.kegiatan}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Output: {keg.outputHasil}
                          </p>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {keg.statusValidasi === 'Disetujui' ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Disetujui
                            </span>
                          ) : keg.statusValidasi === 'Ditolak' ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Revisi
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Menunggu
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-[#f0f0f1] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('jurnal-harian')}
                    className="text-[#2271b1] hover:text-[#135e96] font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Buka Semua Jurnal Harian</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 text-[11px]">
                    Total {totalKegiatan} baris tugas
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-4">
          
          {/* Metabox 3: Draf Cepat (Quick Draft) */}
          <div className="bg-white border border-[#c3c4c7] shadow-2xs">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#c3c4c7] bg-[#fafafa]">
              <h2 className="text-sm font-semibold text-[#1d2327]">
                Draf Cepat
              </h2>
              <button
                type="button"
                onClick={() => setCollapseQuickDraft(!collapseQuickDraft)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                {collapseQuickDraft ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapseQuickDraft && (
              <div className="p-3.5 text-xs text-[#3c434a]">
                
                {draftSuccessMsg && (
                  <div className="mb-3 p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-[11px] font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{draftSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveDraft} className="space-y-2.5">
                  <div>
                    <label htmlFor="quick-draft-title" className="block text-slate-700 font-normal mb-1">
                      Judul / Uraian Tugas
                    </label>
                    <input
                      id="quick-draft-title"
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="Contoh: Mengarsipkan surat masuk dan disposisi..."
                      className="w-full px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded text-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="quick-draft-content" className="block text-slate-700 font-normal mb-1">
                      Apa yang Anda kerjakan hari ini?
                    </label>
                    <textarea
                      id="quick-draft-content"
                      rows={4}
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      placeholder="Rincian hasil / keluaran tugas yang telah diselesaikan..."
                      className="w-full px-2.5 py-1.5 bg-white border border-[#8c8f94] rounded text-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmittingDraft || !draftTitle.trim()}
                      className="px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] active:bg-[#0a4b78] text-white text-xs font-semibold rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingDraft ? 'Menyimpan...' : 'Simpan Draf'}
                    </button>
                  </div>
                </form>

                {/* Your Recent Drafts List */}
                <div className="mt-4 pt-3 border-t border-[#f0f0f1]">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Draf Terbaru Anda
                  </h4>

                  {recentKegiatan.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">Belum ada draf tersimpan.</p>
                  ) : (
                    <div className="space-y-2">
                      {recentKegiatan.slice(0, 3).map((draf) => (
                        <div key={draf.id} className="group flex items-start justify-between gap-1 text-[11px]">
                          <div>
                            <button
                              onClick={() => onNavigateToTab('jurnal-harian')}
                              className="text-[#2271b1] hover:underline font-semibold text-left block truncate max-w-[230px]"
                            >
                              {draf.kegiatan}
                            </button>
                            <span className="text-slate-400 text-[10px]">
                              {formatTanggalIndonesia(draf.tanggal)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteKegiatan(draf.id)}
                            className="text-slate-300 group-hover:text-red-600 transition p-0.5"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Quick Info Box: Identitas & Atasan */}
          <div className="bg-[#f6f7f7] border border-[#dcdcde] p-3 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">
              {currentPegawai.nama} <span className="font-mono font-normal">({currentPegawai.nip})</span>
            </div>
            <div className="text-[11px]">
              Jabatan: {currentPegawai.jabatan} &bull; Unit: {currentPegawai.unitKerja}
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Atasan Penilai: <strong>{pengaturan.namaAtasan || '-'}</strong> ({pengaturan.jabatanAtasan || '-'})
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
