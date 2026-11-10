import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCheck, 
  User, 
  UserCheck,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { KegiatanJurnal, Pegawai, PengaturanInstansi } from '../types';
import { BULAN_INDONESIA, formatTanggalIndonesia } from '../utils/exportUtils';
import confetti from 'canvas-confetti';

interface VerifikasiAtasanViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  pengaturan: PengaturanInstansi;
  kegiatanList: KegiatanJurnal[];
  onApproveKegiatan: (id: string, catatan?: string) => void;
  onRejectKegiatan: (id: string, catatan: string) => void;
  onBatchApprove: (ids: string[]) => void;
  selectedBulan: number;
  selectedTahun: number;
  onSwitchToAtasan?: () => void;
  onGoToJurnal?: () => void;
  onGoToMonitoring?: () => void;
}

export const VerifikasiAtasanView: React.FC<VerifikasiAtasanViewProps> = ({
  currentPegawai,
  allPegawai,
  pengaturan,
  kegiatanList,
  onApproveKegiatan,
  onRejectKegiatan,
  onBatchApprove,
  selectedBulan,
  selectedTahun,
  onSwitchToAtasan,
  onGoToJurnal,
  onGoToMonitoring,
}) => {
  const [selectedSubordinateId, setSelectedSubordinateId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'Menunggu' | 'Disetujui' | 'Ditolak' | 'all'>('Menunggu');
  const [rejectModalItem, setRejectModalItem] = useState<KegiatanJurnal | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [quickApproveNote, setQuickApproveNote] = useState<string>('');
  const [approveModalItem, setApproveModalItem] = useState<KegiatanJurnal | null>(null);

  // Subordinates list (pegawai who have role 'pegawai')
  const subordinates = useMemo(() => {
    return allPegawai.filter(p => p.role === 'pegawai');
  }, [allPegawai]);

  // Filtered items
  const filteredList = useMemo(() => {
    return kegiatanList
      .filter((keg) => {
        if (selectedSubordinateId === 'all') return true;
        return keg.pegawaiId === selectedSubordinateId;
      })
      .filter((keg) => {
        const [y, m] = keg.tanggal.split('-');
        if (parseInt(y, 10) !== selectedTahun) return false;
        if (parseInt(m, 10) !== selectedBulan) return false;
        return true;
      })
      .filter((keg) => {
        if (statusFilter === 'all') return true;
        return keg.statusValidasi === statusFilter;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [kegiatanList, selectedSubordinateId, selectedBulan, selectedTahun, statusFilter]);

  const pendingIds = useMemo(() => {
    return filteredList.filter(k => k.statusValidasi === 'Menunggu').map(k => k.id);
  }, [filteredList]);

  const handleBatchApproveAll = () => {
    if (pendingIds.length === 0) return;
    if (confirm(`Setujui sekaligus ${pendingIds.length} laporan kegiatan bawahan dan bubuhkan paraf elektronik?`)) {
      onBatchApprove(pendingIds);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleConfirmReject = () => {
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      alert('Mohon cantumkan catatan arahan / alasan revisi.');
      return;
    }
    onRejectKegiatan(rejectModalItem.id, rejectReason.trim());
    setRejectModalItem(null);
    setRejectReason('');
  };

  const handleConfirmApprove = () => {
    if (!approveModalItem) return;
    onApproveKegiatan(approveModalItem.id, quickApproveNote.trim() || undefined);
    setApproveModalItem(null);
    setQuickApproveNote('');
    confetti({ particleCount: 40, spread: 60 });
  };

  const getPegawaiInfo = (pegawaiId: string) => {
    return allPegawai.find(p => p.id === pegawaiId) || {
      nama: 'Pegawai',
      nip: '-',
      jabatan: '-'
    };
  };

  // Access Control: If logged in as non-Atasan (Pegawai, Admin, etc.), show restriction screen
  if (currentPegawai.role !== 'atasan') {
    const atasanUser = allPegawai.find(p => p.role === 'atasan');
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-amber-50">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
          Akses Khusus Akun Atasan Langsung
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">
          Verifikasi Hanya Dapat Dilakukan oleh Atasan
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
          Anda saat ini terhubung sebagai <strong>{currentPegawai.nama}</strong> (Peran: {currentPegawai.role}). Sesuai ketentuan, menu verifikasi dan pembubuhan paraf digital hanya dapat dibuka oleh akun Atasan Langsung (Pejabat Penilai Kinerja).
        </p>

        {atasanUser && (
          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left max-w-md mx-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Akun Atasan yang Berwenang:
            </span>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                {atasanUser.nama.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{atasanUser.nama}</p>
                <p className="text-[11px] text-slate-500 truncate">{atasanUser.jabatan}</p>
                <p className="text-[10px] text-slate-400 font-mono">NIP. {atasanUser.nip}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onSwitchToAtasan && atasanUser && (
            <button
              onClick={onSwitchToAtasan}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              Masuk ke Akun Atasan ({atasanUser.nama.split(',')[0]})
            </button>
          )}
          {onGoToJurnal && (
            <button
              onClick={onGoToJurnal}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Kembali ke Jurnal Harian
            </button>
          )}
        </div>
      </div>
    );
  }

  const atasanNama = currentPegawai.role === 'atasan' ? currentPegawai.nama : (pengaturan.namaAtasan || currentPegawai.nama);
  const atasanNip = currentPegawai.role === 'atasan' ? currentPegawai.nip : (pengaturan.nipAtasan || currentPegawai.nip);
  const atasanJabatan = currentPegawai.role === 'atasan' ? currentPegawai.jabatan : (pengaturan.jabatanAtasan || currentPegawai.jabatan);

  return (
    <div className="space-y-3 sm:space-y-6">
      
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-r from-amber-800 via-indigo-950 to-slate-900 text-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-4">
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-400 text-slate-900 tracking-wider uppercase">
                Akun Atasan
              </span>
              <span className="text-[11px] sm:text-xs text-amber-200">
                Pejabat Penilai Kinerja
              </span>
            </div>
            <h2 className="text-base sm:text-2xl font-bold mt-0.5 sm:mt-1">
              Verifikasi & Paraf Laporan Kinerja Staf
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 sm:mt-1 max-w-2xl">
              Pejabat Penilai: <strong className="text-white">{atasanNama}</strong> (NIP. {atasanNip}) &bull; {atasanJabatan}.
            </p>
          </div>

          {/* Quick Batch Button & Monitoring Jump */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
            {onGoToMonitoring && (
              <button
                onClick={onGoToMonitoring}
                className="px-2.5 py-1.5 sm:px-4 sm:py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] sm:text-sm rounded-lg sm:rounded-xl transition flex items-center space-x-1.5 border border-white/20 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                <span>Cek Jurnal Harian</span>
              </button>
            )}
            {pendingIds.length > 0 && (
              <button
                onClick={handleBatchApproveAll}
                className="px-2.5 py-1.5 sm:px-4 sm:py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-[11px] sm:text-sm rounded-lg sm:rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
                <span>Beri Paraf Semua ({pendingIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Subordinate Selector */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-0.5 sm:mb-1">
                Pilih Staf / Pegawai
              </label>
              <select
                value={selectedSubordinateId}
                onChange={(e) => setSelectedSubordinateId(e.target.value)}
                className="text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="all">Semua Staf Bawahan</option>
                {subordinates.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nama} ({sub.jabatan.split(' ')[0]}...)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Tabs */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-0.5 sm:mb-1">
                Status Verifikasi
              </label>
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
                {(['Menunggu', 'Disetujui', 'Ditolak', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg transition ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'Semua' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
            Periode: <strong className="text-slate-800">{BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}</strong>
          </div>

        </div>
      </div>

      {/* Activities Verification List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Tidak Ada Laporan yang Perlu Ditinjau
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Semua laporan tugas bawahan untuk filter ini telah diproses atau belum ada aktivitas yang diajukan.
            </p>
          </div>
        ) : (
          filteredList.map((keg) => {
            const peg = getPegawaiInfo(keg.pegawaiId);
            const isPending = keg.statusValidasi === 'Menunggu';
            const isApproved = keg.statusValidasi === 'Disetujui';
            const isRejected = keg.statusValidasi === 'Ditolak';

            return (
              <div
                key={keg.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 transition hover:border-blue-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  
                  {/* Left Column: Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                        {peg.nama}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {keg.hari}, {formatTanggalIndonesia(keg.tanggal)}
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Kegiatan #{keg.nomorKegiatan}
                      </span>
                      <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {keg.waktuMulai} - {keg.waktuSelesai}
                      </span>
                    </div>

                    <div className="pt-1">
                      <div className="text-sm font-bold text-slate-900 flex items-start space-x-1.5">
                        <span className="text-blue-600 font-bold">►</span>
                        <span>{keg.kegiatan}</span>
                      </div>
                      
                      <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-600 block mb-0.5">Keluaran / Hasil (Output):</span>
                        <p>{keg.outputHasil}</p>
                      </div>

                      {keg.tautanBukti && (
                        <div className="mt-1.5 text-xs">
                          <a
                            href={keg.tautanBukti}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            Tautan Evidence Dukung ↗
                          </a>
                        </div>
                      )}

                      {keg.catatanAtasan && (
                        <div className="mt-2 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                          <strong>Catatan Atasan:</strong> {keg.catatanAtasan}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status & Action Buttons */}
                  <div className="lg:w-64 flex flex-col justify-between items-start lg:items-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div>
                      {isApproved && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tervalidasi / Paraf Digital</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Perlu Revisi</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Menunggu Validasi</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 w-full lg:w-auto">
                      <button
                        onClick={() => setApproveModalItem(keg)}
                        className="flex-1 lg:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-2xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isApproved ? 'Ubah Catatan' : 'Beri Paraf'}</span>
                      </button>

                      <button
                        onClick={() => setRejectModalItem(keg)}
                        className="flex-1 lg:flex-none px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Tolak / Revisi</span>
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Approve with optional note */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Validasi & Bubuhkan Paraf Digital</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kegiatan #{approveModalItem.nomorKegiatan} &ldquo;{approveModalItem.kegiatan}&rdquo;
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Apresiasi untuk Pegawai (Opsional):
              </label>
              <textarea
                rows={3}
                value={quickApproveNote}
                onChange={(e) => setQuickApproveNote(e.target.value)}
                placeholder="Contoh: Sangat baik, selesaikan tindak lanjut tepat waktu."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2.5">
              <button
                onClick={() => setApproveModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Setujui & Paraf</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject / Revision */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-red-700 flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Kembalikan Laporan untuk Revisi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kegiatan #{rejectModalItem.nomorKegiatan} &ldquo;{rejectModalItem.kegiatan}&rdquo;
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan / Arahan Perbaikan *:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Mohon lengkapi keluaran hasil dengan jumlah berkas yang selesai atau tautkan bukti fisik SK."
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2.5">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Kirim Catatan Revisi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
