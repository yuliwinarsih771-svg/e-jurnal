import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellRing,
  Send,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Trash2,
  MailOpen,
  AlertTriangle,
  PenLine,
  Users,
  Check,
  X,
  Inbox,
  History,
} from 'lucide-react';
import { Pegawai, KegiatanJurnal, PengingatJurnal } from '../types';
import { formatTanggalIndonesia } from '../utils/exportUtils';
import confetti from 'canvas-confetti';

interface PengingatJurnalViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  kegiatanList: KegiatanJurnal[];
  pengingatList: PengingatJurnal[];
  onSendPengingat: (targets: Pegawai[], tanggalTarget: string, pesan: string) => Promise<void> | void;
  onMarkAsRead: (pengingatId: string) => void;
  onMarkAllAsRead: () => void;
  onDeletePengingat: (pengingatId: string) => void;
  onOpenJurnalForDate: (tanggal: string) => void;
}

const getTodayLocalIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getYesterdayLocalIso = (): string => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const PengingatJurnalView: React.FC<PengingatJurnalViewProps> = ({
  currentPegawai,
  allPegawai,
  kegiatanList,
  pengingatList,
  onSendPengingat,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeletePengingat,
  onOpenJurnalForDate,
}) => {
  const isSenderRole =
    currentPegawai.role === 'superadmin' ||
    currentPegawai.role === 'admin' ||
    currentPegawai.role === 'atasan';

  // Reminders received by the current logged-in account
  const myInboxPengingat = useMemo(() => {
    return pengingatList
      .filter((pg) => pg.pegawaiId === currentPegawai.id)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [pengingatList, currentPegawai.id]);

  const myUnreadCount = useMemo(() => {
    return myInboxPengingat.filter((pg) => pg.status === 'unread').length;
  }, [myInboxPengingat]);

  const [activeSubTab, setActiveSubTab] = useState<'kirim' | 'riwayat' | 'masuk'>(
    isSenderRole ? 'kirim' : 'masuk'
  );
  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocalIso);
  const [statusFilter, setStatusFilter] = useState<'belum' | 'all' | 'sudah'>('belum');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customPesan, setCustomPesan] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4500);
  };

  // Monitored employee accounts (exclude superadmin & self so admins/supervisors remind staff)
  const monitoredAccounts = useMemo(() => {
    return allPegawai.filter(
      (p) => p.role !== 'superadmin' && p.id !== currentPegawai.id
    );
  }, [allPegawai, currentPegawai.id]);

  // Compute completion status for each monitored account on selectedDate
  const accountStatuses = useMemo(() => {
    return monitoredAccounts.map((peg) => {
      const entriesOnDate = kegiatanList.filter(
        (k) => k.pegawaiId === peg.id && k.tanggal === selectedDate
      );
      const hasCompleted = entriesOnDate.length > 0;
      const sentForDate = pengingatList.filter(
        (pg) => pg.pegawaiId === peg.id && pg.tanggalTarget === selectedDate
      );
      const latestReminder = sentForDate[0] || null;
      return {
        pegawai: peg,
        hasCompleted,
        countKegiatan: entriesOnDate.length,
        latestReminder,
      };
    });
  }, [monitoredAccounts, kegiatanList, pengingatList, selectedDate]);

  const belumList = useMemo(
    () => accountStatuses.filter((item) => !item.hasCompleted),
    [accountStatuses]
  );

  const sudahList = useMemo(
    () => accountStatuses.filter((item) => item.hasCompleted),
    [accountStatuses]
  );

  const sentCountForDate = useMemo(() => {
    return pengingatList.filter((pg) => pg.tanggalTarget === selectedDate).length;
  }, [pengingatList, selectedDate]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accountStatuses.filter((item) => {
      if (statusFilter === 'belum' && item.hasCompleted) return false;
      if (statusFilter === 'sudah' && !item.hasCompleted) return false;
      if (!q) return true;
      return (
        item.pegawai.nama.toLowerCase().includes(q) ||
        item.pegawai.nip.toLowerCase().includes(q) ||
        (item.pegawai.username || '').toLowerCase().includes(q) ||
        item.pegawai.jabatan.toLowerCase().includes(q) ||
        item.pegawai.unitKerja.toLowerCase().includes(q)
      );
    });
  }, [accountStatuses, statusFilter, searchQuery]);

  const selectableBelumIds = useMemo(() => {
    return filteredAccounts.filter((item) => !item.hasCompleted).map((item) => item.pegawai.id);
  }, [filteredAccounts]);

  const defaultMessageTemplate = useMemo(() => {
    const tglFormatted = formatTanggalIndonesia(selectedDate);
    return `Pengingat Pengisian Jurnal Harian: Akun Anda tercatat belum mengisi Jurnal Kinerja untuk tanggal ${tglFormatted}. Mohon segera mengerjakan dan menyimpan kegiatan harian Anda hari ini.`;
  }, [selectedDate]);

  const effectiveMessage = customPesan.trim() || defaultMessageTemplate;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllBelum = () => {
    if (
      selectableBelumIds.length > 0 &&
      selectableBelumIds.every((id) => selectedIds.includes(id))
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableBelumIds);
    }
  };

  const handleSendSingle = async (pegawai: Pegawai) => {
    setIsSending(true);
    try {
      await onSendPengingat([pegawai], selectedDate, effectiveMessage);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      showNotice(
        'success',
        `Pengingat berhasil dikirim langsung ke akun ${pegawai.nama} (@${pegawai.username || 'user'}).`
      );
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal mengirim pengingat.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBatch = async () => {
    const targets = monitoredAccounts.filter((p) => selectedIds.includes(p.id));
    if (targets.length === 0) {
      showNotice('error', 'Pilih minimal 1 akun yang belum mengerjakan jurnal.');
      return;
    }
    setIsSending(true);
    try {
      await onSendPengingat(targets, selectedDate, effectiveMessage);
      setSelectedIds([]);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      showNotice(
        'success',
        `Pengingat berhasil dikirim ke ${targets.length} akun yang belum mengerjakan jurnal!`
      );
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal mengirim pengingat massal.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToAllBelum = async () => {
    const targets = belumList.map((item) => item.pegawai);
    if (targets.length === 0) {
      showNotice('error', 'Semua akun sudah mengerjakan jurnal pada tanggal ini.');
      return;
    }
    setIsSending(true);
    try {
      await onSendPengingat(targets, selectedDate, effectiveMessage);
      setSelectedIds([]);
      confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
      showNotice(
        'success',
        `Pengingat otomatis terkirim ke seluruh ${targets.length} akun yang belum mengerjakan jurnal!`
      );
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal mengirim pengingat ke semua akun.');
    } finally {
      setIsSending(false);
    }
  };

  // Helper: format ISO createdAt cleanly
  const formatWaktuKirim = (iso: string) => {
    try {
      const dt = new Date(iso);
      return dt.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Check if current employee has completed journal for a given reminder's target date
  const hasFilledForDate = (pegId: string, tgl: string) => {
    return kegiatanList.some((k) => k.pegawaiId === pegId && k.tanggal === tgl);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Alert Notice */}
      {notice && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Header & Tab Navigation */}
      <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1d2327] flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-[#2271b1]" />
              <span>Pengingat Jurnal Pegawai</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSenderRole
                ? 'Deteksi akun pegawai yang belum mengerjakan jurnal dan kirim notifikasi pengingat langsung ke akun masing-masing secara real-time.'
                : 'Daftar pengingat pengisian jurnal harian yang dikirim langsung ke akun Anda oleh Atasan / Admin.'}
            </p>
          </div>

          {/* Sub-Tab Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {isSenderRole && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('kirim')}
                  className={`px-3 py-1.5 rounded font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                    activeSubTab === 'kirim'
                      ? 'bg-[#2271b1] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Belum Mengisi &amp; Kirim</span>
                  {belumList.length > 0 && (
                    <span
                      className={`px-1.5 py-0 rounded-full text-[10px] font-bold ${
                        activeSubTab === 'kirim'
                          ? 'bg-white text-[#2271b1]'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {belumList.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('riwayat')}
                  className={`px-3 py-1.5 rounded font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                    activeSubTab === 'riwayat'
                      ? 'bg-[#2271b1] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat Terkirim ({pengingatList.length})</span>
                </button>
              </>
            )}

            {(currentPegawai.role !== 'superadmin' || myInboxPengingat.length > 0) && (
              <button
                type="button"
                onClick={() => setActiveSubTab('masuk')}
                className={`px-3 py-1.5 rounded font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                  activeSubTab === 'masuk'
                    ? 'bg-[#2271b1] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Pengingat Masuk</span>
                {myUnreadCount > 0 && (
                  <span className="px-1.5 py-0 rounded-full text-[10px] font-bold bg-[#d63638] text-white animate-pulse">
                    {myUnreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: DETEKSI AKUN BELUM MENGERJAKAN & KIRIM PENGINGAT (ATASAN/ADMIN)
         ===================================================================== */}
      {isSenderRole && activeSubTab === 'kirim' && (
        <div className="space-y-4">
          {/* Date Picker & Stat Cards */}
          <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 text-[#2271b1] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tanggal Pengecekan Jurnal
                  </div>
                  <div className="text-sm font-bold text-[#1d2327]">
                    {formatTanggalIndonesia(selectedDate)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(getTodayLocalIso());
                    setSelectedIds([]);
                  }}
                  className={`px-2.5 py-1.5 rounded font-semibold transition cursor-pointer ${
                    selectedDate === getTodayLocalIso()
                      ? 'bg-[#2271b1] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(getYesterdayLocalIso());
                    setSelectedIds([]);
                  }}
                  className={`px-2.5 py-1.5 rounded font-semibold transition cursor-pointer ${
                    selectedDate === getYesterdayLocalIso()
                      ? 'bg-[#2271b1] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Kemarin
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setSelectedIds([]);
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold border border-[#c3c4c7] rounded bg-slate-50 focus:bg-white focus:border-[#2271b1] focus:outline-hidden"
                />
              </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#f0f0f1]">
              <div className="p-3 rounded border border-slate-200 bg-slate-50/70">
                <div className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Total Akun Dipantau</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {monitoredAccounts.length} <span className="text-xs font-normal text-slate-500">Akun</span>
                </div>
              </div>

              <div className="p-3 rounded border border-emerald-200 bg-emerald-50/50">
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sudah Mengerjakan</span>
                </div>
                <div className="text-lg font-extrabold text-emerald-800 mt-0.5">
                  {sudahList.length} <span className="text-xs font-normal text-emerald-600">Akun</span>
                </div>
              </div>

              <div className="p-3 rounded border border-rose-200 bg-rose-50/60">
                <div className="text-[11px] text-rose-700 font-semibold flex items-center space-x-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Belum Mengerjakan</span>
                </div>
                <div className="text-lg font-extrabold text-rose-800 mt-0.5">
                  {belumList.length} <span className="text-xs font-normal text-rose-600">Akun</span>
                </div>
              </div>

              <div className="p-3 rounded border border-amber-200 bg-amber-50/60">
                <div className="text-[11px] text-amber-800 font-semibold flex items-center space-x-1">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pengingat Terkirim</span>
                </div>
                <div className="text-lg font-extrabold text-amber-900 mt-0.5">
                  {sentCountForDate} <span className="text-xs font-normal text-amber-700">Pesan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Composer & Bulk Send Box */}
          <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-[#1d2327]">
                  Pesan Pengingat ke Akun Penerima
                </h2>
                <p className="text-[11px] text-slate-500">
                  Pesan ini akan muncul langsung di kotak masuk &amp; notifikasi akun pegawai yang belum mengisi jurnal.
                </p>
              </div>
              {belumList.length > 0 && (
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleSendToAllBelum}
                  className="px-3.5 py-2 bg-[#d63638] hover:bg-[#b32d2e] text-white text-xs font-bold rounded shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim ke Semua yang Belum ({belumList.length} Akun)</span>
                </button>
              )}
            </div>

            <textarea
              rows={2}
              value={customPesan}
              onChange={(e) => setCustomPesan(e.target.value)}
              placeholder={defaultMessageTemplate}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#c3c4c7] rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('belum')}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition ${
                    statusFilter === 'belum'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Belum Mengerjakan ({belumList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition ${
                    statusFilter === 'all'
                      ? 'bg-[#2271b1] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Semua Akun ({accountStatuses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('sudah')}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition ${
                    statusFilter === 'sudah'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Sudah Mengerjakan ({sudahList.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={handleSendBatch}
                    className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold rounded shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Terpilih ({selectedIds.length})</span>
                  </button>
                )}

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama / NIP..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-[#c3c4c7] rounded focus:bg-white focus:border-[#2271b1] focus:outline-hidden"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account List Table (Desktop) & Cards (Mobile) */}
          <div className="bg-white border border-[#c3c4c7] rounded-lg shadow-2xs overflow-hidden">
            {filteredAccounts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">
                  {statusFilter === 'belum' && belumList.length === 0
                    ? `Hebat! Semua akun sudah mengisi jurnal pada ${formatTanggalIndonesia(selectedDate)}.`
                    : 'Tidak ada akun yang cocok dengan pencarian.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#1d2327] font-bold">
                        <th className="py-2.5 px-3 w-8">
                          {selectableBelumIds.length > 0 && (
                            <button
                              type="button"
                              onClick={toggleSelectAllBelum}
                              className="text-slate-500 hover:text-[#2271b1] flex items-center cursor-pointer"
                              title="Pilih semua akun yang belum mengerjakan"
                            >
                              {selectableBelumIds.every((id) => selectedIds.includes(id)) ? (
                                <CheckSquare className="w-4 h-4 text-[#2271b1]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </th>
                        <th className="py-2.5 px-3">Nama &amp; Akun Pegawai</th>
                        <th className="py-2.5 px-3">Jabatan &amp; Unit Kerja</th>
                        <th className="py-2.5 px-3">Status Jurnal</th>
                        <th className="py-2.5 px-3">Status Pengingat</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {filteredAccounts.map(({ pegawai, hasCompleted, countKegiatan, latestReminder }) => {
                        const isChecked = selectedIds.includes(pegawai.id);
                        return (
                          <tr key={pegawai.id} className="hover:bg-[#f6f7f7]/70 transition">
                            <td className="py-2.5 px-3">
                              {!hasCompleted ? (
                                <button
                                  type="button"
                                  onClick={() => toggleSelect(pegawai.id)}
                                  className="text-slate-400 hover:text-[#2271b1] flex items-center cursor-pointer"
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-[#2271b1]" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-emerald-500">&check;</span>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="flex items-center space-x-2.5">
                                <div
                                  className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                                    hasCompleted
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  {pegawai.nama.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[#1d2327] truncate">{pegawai.nama}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    NIP. {pegawai.nip} &bull; @{pegawai.username || 'user'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-800">{pegawai.jabatan}</div>
                              <div className="text-[11px] text-slate-500">{pegawai.unitKerja}</div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {hasCompleted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Sudah Mengisi ({countKegiatan})</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center space-x-1">
                                  <XCircle className="w-3 h-3" />
                                  <span>Belum Mengerjakan</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {latestReminder ? (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center space-x-1 ${
                                    latestReminder.status === 'resolved' || hasCompleted
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : latestReminder.status === 'read'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  <Bell className="w-3 h-3" />
                                  <span>
                                    {latestReminder.status === 'resolved' || hasCompleted
                                      ? 'Sudah Dikerjakan'
                                      : latestReminder.status === 'read'
                                        ? 'Sudah Dibaca'
                                        : 'Terkirim (Belum Dibaca)'}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Belum dikirim</span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {!hasCompleted ? (
                                <button
                                  type="button"
                                  disabled={isSending}
                                  onClick={() => handleSendSingle(pegawai)}
                                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold transition inline-flex items-center space-x-1 shadow-2xs cursor-pointer disabled:opacity-50"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>{latestReminder ? 'Kirim Ulang' : 'Kirim Pengingat'}</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-semibold">Aman</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-[#f0f0f1]">
                  {filteredAccounts.map(({ pegawai, hasCompleted, countKegiatan, latestReminder }) => {
                    const isChecked = selectedIds.includes(pegawai.id);
                    return (
                      <div key={pegawai.id} className="p-3.5 space-y-2.5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2.5 min-w-0">
                            {!hasCompleted && (
                              <button
                                type="button"
                                onClick={() => toggleSelect(pegawai.id)}
                                className="mt-1 text-slate-400 hover:text-[#2271b1] shrink-0 cursor-pointer"
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-[#2271b1]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-[#1d2327] truncate">{pegawai.nama}</div>
                              <div className="text-[11px] font-mono text-slate-500">
                                NIP. {pegawai.nip} &bull; @{pegawai.username || 'user'}
                              </div>
                              <div className="text-[11px] text-slate-600 truncate">{pegawai.jabatan}</div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {hasCompleted ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Sudah ({countKegiatan})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Belum Isi
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                          <div className="text-[10px]">
                            {latestReminder ? (
                              <span className="text-amber-700 font-semibold">
                                Status:{' '}
                                {latestReminder.status === 'resolved' || hasCompleted
                                  ? 'Sudah Dikerjakan'
                                  : latestReminder.status === 'read'
                                    ? 'Sudah Dibaca'
                                    : 'Terkirim (Menunggu)'}
                              </span>
                            ) : (
                              <span className="text-slate-400">Belum ada pengingat</span>
                            )}
                          </div>

                          {!hasCompleted && (
                            <button
                              type="button"
                              disabled={isSending}
                              onClick={() => handleSendSingle(pegawai)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>{latestReminder ? 'Kirim Ulang' : 'Kirim Pengingat'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: RIWAYAT PENGINGAT TERKIRIM (ATASAN/ADMIN)
         ===================================================================== */}
      {isSenderRole && activeSubTab === 'riwayat' && (
        <div className="bg-white border border-[#c3c4c7] rounded-lg shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f6f7f7] flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-[#1d2327]">
              Riwayat Pengingat Terkirim ({pengingatList.length})
            </h2>
          </div>

          {pengingatList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Belum ada pengingat yang dikirim.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gunakan tab &ldquo;Belum Mengisi &amp; Kirim&rdquo; untuk mengirim pengingat ke akun pegawai.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f0f1]">
              {pengingatList.map((pg) => {
                const isDone = pg.status === 'resolved' || hasFilledForDate(pg.pegawaiId, pg.tanggalTarget);
                return (
                  <div
                    key={pg.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f6f7f7]/60 transition text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#1d2327]">{pg.pegawaiNama}</span>
                        <span className="font-mono text-[11px] text-slate-500">NIP. {pg.pegawaiNip}</span>
                        <span className="px-2 py-0.2 rounded bg-blue-50 text-[#2271b1] border border-blue-200 text-[10px] font-bold">
                          Target: {formatTanggalIndonesia(pg.tanggalTarget)}
                        </span>
                        {isDone ? (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            &check; Jurnal Sudah Diisi
                          </span>
                        ) : pg.status === 'read' ? (
                          <span className="px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            Sudah Dibaca Akun
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            Belum Dibaca
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700 leading-relaxed">{pg.pesan}</p>

                      <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>Dikirim oleh {pg.pengirimNama} &bull; {formatWaktuKirim(pg.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeletePengingat(pg.id)}
                      className="self-end sm:self-center px-2.5 py-1.5 bg-rose-50 hover:bg-[#d63638] hover:text-white text-rose-700 border border-rose-200 rounded text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer shrink-0"
                      title="Hapus Riwayat Pengingat"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: KOTAK MASUK PENGINGAT AKUN YANG BERSANGKUTAN (PENERIMA)
         ===================================================================== */}
      {(!isSenderRole || activeSubTab === 'masuk') && (
        <div className="bg-white border border-[#c3c4c7] rounded-lg shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f6f7f7] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1d2327] flex items-center space-x-1.5">
                <Inbox className="w-4 h-4 text-[#2271b1]" />
                <span>Pengingat Jurnal untuk Akun Anda ({myInboxPengingat.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Setiap pengingat yang dikirim oleh Atasan atau Admin akan tampil langsung di sini.
              </p>
            </div>

            {myUnreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#c3c4c7] rounded text-xs font-semibold flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
              >
                <MailOpen className="w-3.5 h-3.5 text-[#2271b1]" />
                <span>Tandai Semua Dibaca ({myUnreadCount})</span>
              </button>
            )}
          </div>

          {myInboxPengingat.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">Tidak ada pengingat jurnal saat ini.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tetap isi Jurnal Harian Anda tepat waktu setiap hari kerja.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f0f1]">
              {myInboxPengingat.map((pg) => {
                const isFilled =
                  pg.status === 'resolved' || hasFilledForDate(currentPegawai.id, pg.tanggalTarget);
                const isUnread = pg.status === 'unread' && !isFilled;

                return (
                  <div
                    key={pg.id}
                    className={`p-4 space-y-2.5 text-xs transition ${
                      isUnread ? 'bg-amber-50/60 border-l-4 border-l-amber-500' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isFilled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Jurnal Sudah Dikerjakan</span>
                          </span>
                        ) : isUnread ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d63638] text-white animate-pulse">
                            Pengingat Baru
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Sudah Dibaca
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2271b1] border border-blue-200 text-[10px] font-bold">
                          Tanggal Target: {formatTanggalIndonesia(pg.tanggalTarget)}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatWaktuKirim(pg.createdAt)}</span>
                      </div>
                    </div>

                    <p className="text-slate-800 font-medium leading-relaxed bg-white/80 p-3 rounded border border-slate-200">
                      {pg.pesan}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-slate-500">
                        Pengirim: <strong className="text-slate-700">{pg.pengirimNama}</strong>
                        {pg.pengirimJabatan ? ` (${pg.pengirimJabatan})` : ''}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(pg.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-[#2271b1]" />
                            <span>Tandai Dibaca</span>
                          </button>
                        )}

                        {!isFilled && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isUnread) onMarkAsRead(pg.id);
                              onOpenJurnalForDate(pg.tanggalTarget);
                            }}
                            className="px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-[11px] font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            <span>Kerjakan Jurnal Sekarang</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
