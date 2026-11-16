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
  MessageCircle,
  Phone,
  Edit3,
  Save,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Pegawai, KegiatanJurnal, PengingatJurnal } from '../types';
import { formatTanggalIndonesia } from '../utils/exportUtils';
import confetti from 'canvas-confetti';

interface PengingatJurnalViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  kegiatanList: KegiatanJurnal[];
  pengingatList: PengingatJurnal[];
  onSendPengingat: (
    targets: Pegawai[],
    tanggalTarget: string,
    pesan: string,
    options?: { viaWhatsApp?: boolean }
  ) => Promise<PengingatJurnal[]> | PengingatJurnal[] | Promise<void> | void;
  onMarkPengingatWaSent: (pengingatId: string, noHpTujuan?: string) => void;
  onUpdatePegawaiNoHp: (pegId: string, noHp: string) => void;
  onMarkAsRead: (pengingatId: string) => void;
  onMarkAllAsRead: () => void;
  onDeletePengingat: (pengingatId: string) => void;
  onOpenJurnalForDate: (tanggal: string) => void;
}

interface WaQueueItem {
  pengingatId: string;
  pegawaiId: string;
  pegawaiSnapshot: Pegawai;
  pesan: string;
  tanggalTarget: string;
  dispatched: boolean;
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

// Normalize Indonesian phone number for WhatsApp wa.me links (08xx -> 628xx)
export const formatWaNumber = (noHp?: string): string | null => {
  if (!noHp) return null;
  const digits = noHp.replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
};

export const PengingatJurnalView: React.FC<PengingatJurnalViewProps> = ({
  currentPegawai,
  allPegawai,
  kegiatanList,
  pengingatList,
  onSendPengingat,
  onMarkPengingatWaSent,
  onUpdatePegawaiNoHp,
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

  // Inline WhatsApp number editing state (table/card & queue modal & self-inbox)
  const [editingNoHpId, setEditingNoHpId] = useState<string | null>(null);
  const [editingNoHpVal, setEditingNoHpVal] = useState<string>('');

  const [selfEditingWa, setSelfEditingWa] = useState<boolean>(!currentPegawai.noHp);
  const [selfNoHpInput, setSelfNoHpInput] = useState<string>(currentPegawai.noHp || '');

  // Multi-account WhatsApp Queue Modal state
  const [waQueueModalOpen, setWaQueueModalOpen] = useState<boolean>(false);
  const [waQueueItems, setWaQueueItems] = useState<WaQueueItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
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

  const belumMissingWaCount = useMemo(
    () => belumList.filter((item) => !formatWaNumber(item.pegawai.noHp)).length,
    [belumList]
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
        (item.pegawai.noHp || '').toLowerCase().includes(q) ||
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

  const buildWhatsAppMessage = (
    peg: { nama: string; nip: string },
    pesan: string,
    tglTarget: string
  ): string => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const tglFormatted = formatTanggalIndonesia(tglTarget);
    return (
      `*[PENGINGAT E-JURNAL HARIAN]*\n` +
      `Yth. *${peg.nama}*\n` +
      `NIP. ${peg.nip}\n` +
      `Tanggal Target: *${tglFormatted}*\n\n` +
      `${pesan}\n\n` +
      (appUrl ? `Buka Aplikasi E-Jurnal:\n${appUrl}\n\n` : '') +
      `Pengirim: ${currentPegawai.nama}` +
      (currentPegawai.jabatan ? ` (${currentPegawai.jabatan})` : '')
    );
  };

  const buildWhatsAppUrl = (
    peg: { nama: string; nip: string; noHp?: string },
    pesan: string,
    tglTarget: string = selectedDate
  ): string => {
    const waNum = formatWaNumber(peg.noHp);
    const fullText = buildWhatsAppMessage(peg, pesan, tglTarget);
    const encoded = encodeURIComponent(fullText);
    return waNum ? `https://wa.me/${waNum}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  };

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

  const handleStartEditNoHp = (peg: Pegawai) => {
    setEditingNoHpId(peg.id);
    setEditingNoHpVal(peg.noHp || '');
  };

  const handleSaveInlineNoHp = (peg: Pegawai) => {
    const trimmed = editingNoHpVal.trim();
    if (trimmed && !formatWaNumber(trimmed)) {
      showNotice('error', 'Format nomor WhatsApp minimal 9 digit angka (contoh: 081234567890).');
      return;
    }
    onUpdatePegawaiNoHp(peg.id, trimmed);
    setEditingNoHpId(null);
    showNotice(
      'success',
      trimmed
        ? `Nomor WhatsApp ${peg.nama} (${trimmed}) berhasil disimpan ke akun.`
        : `Nomor WhatsApp ${peg.nama} dikosongkan.`
    );
  };

  const handleSaveSelfNoHp = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = selfNoHpInput.trim();
    if (!formatWaNumber(trimmed)) {
      showNotice('error', 'Masukkan nomor WhatsApp yang valid (minimal 9 digit, contoh: 081234567890).');
      return;
    }
    onUpdatePegawaiNoHp(currentPegawai.id, trimmed);
    setSelfEditingWa(false);
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
    showNotice('success', `Nomor WhatsApp akun Anda (${trimmed}) berhasil disimpan!`);
  };

  const handleSendSingleInApp = async (pegawai: Pegawai) => {
    setIsSending(true);
    try {
      await onSendPengingat([pegawai], selectedDate, effectiveMessage, { viaWhatsApp: false });
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      showNotice(
        'success',
        `Pengingat berhasil dikirim ke akun ${pegawai.nama} (@${pegawai.username || 'user'}).`
      );
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal mengirim pengingat.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBatchInApp = async () => {
    const targets = monitoredAccounts.filter((p) => selectedIds.includes(p.id));
    if (targets.length === 0) {
      showNotice('error', 'Pilih minimal 1 akun yang belum mengerjakan jurnal.');
      return;
    }
    setIsSending(true);
    try {
      await onSendPengingat(targets, selectedDate, effectiveMessage, { viaWhatsApp: false });
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

  const openWhatsAppQueueForTargets = async (targets: Pegawai[]) => {
    if (targets.length === 0) {
      showNotice('error', 'Pilih minimal 1 akun yang belum mengerjakan jurnal.');
      return;
    }
    setIsSending(true);
    try {
      const result = await onSendPengingat(targets, selectedDate, effectiveMessage, {
        viaWhatsApp: false,
      });
      const createdArr = Array.isArray(result) ? result : [];
      const queue: WaQueueItem[] = targets.map((peg, idx) => {
        const matched = createdArr.find((r) => r.pegawaiId === peg.id) || createdArr[idx];
        return {
          pengingatId: matched?.id || `rem-local-${Date.now()}-${idx}`,
          pegawaiId: peg.id,
          pegawaiSnapshot: peg,
          pesan: effectiveMessage,
          tanggalTarget: selectedDate,
          dispatched: false,
        };
      });
      setWaQueueItems(queue);
      setWaQueueModalOpen(true);
      setSelectedIds([]);
      showNotice(
        'success',
        `Pengingat dicatat untuk ${targets.length} akun. Lanjutkan klik "Kirim ke WhatsApp" per akun pada panel antrean.`
      );
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal menyiapkan pengiriman pengingat WhatsApp.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showNotice('error', 'Tidak dapat menyalin pesan otomatis.');
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

  const waQueueDispatchedCount = useMemo(
    () => waQueueItems.filter((item) => item.dispatched).length,
    [waQueueItems]
  );

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
              <span>Pengingat Jurnal &amp; WhatsApp Pegawai</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSenderRole
                ? 'Deteksi akun pegawai yang belum mengerjakan jurnal, lalu kirim pengingat langsung ke WhatsApp masing-masing akun & notifikasi aplikasi.'
                : 'Daftar pengingat pengisian jurnal harian dari Atasan/Admin serta pengaturan nomor WhatsApp akun Anda.'}
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
                  <MessageCircle className="w-3.5 h-3.5" />
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
          TAB 1: DETEKSI AKUN BELUM MENGERJAKAN & KIRIM PENGINGAT + WHATSAPP
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

          {/* Missing WhatsApp Number Helper Banner */}
          {belumMissingWaCount > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>{belumMissingWaCount} dari {belumList.length} akun</strong> yang belum mengerjakan jurnal belum memiliki Nomor WhatsApp.
                  <span className="text-amber-800 block sm:inline sm:ml-1">
                    Klik <strong>&ldquo;+ Isi No. WA&rdquo;</strong> pada tabel di bawah (atau pegawai mengisi di menu Pengingat Masuk / Profil Anda) agar pesan otomatis tertuju ke WhatsApp masing-masing akun.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Composer & Bulk Send Box */}
          <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-[#1d2327] flex items-center space-x-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Pesan Pengingat ke WhatsApp &amp; Akun Pegawai</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Nama pegawai, tanggal target, dan tautan langsung aplikasi E-Jurnal otomatis disertakan pada setiap pesan WhatsApp.
                </p>
              </div>
              {belumList.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => openWhatsAppQueueForTargets(belumList.map((i) => i.pegawai))}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim via WhatsApp Semua ({belumList.length} Akun)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={async () => {
                      const targets = belumList.map((i) => i.pegawai);
                      setIsSending(true);
                      try {
                        await onSendPengingat(targets, selectedDate, effectiveMessage, { viaWhatsApp: false });
                        setSelectedIds([]);
                        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
                        showNotice('success', `Pengingat notifikasi aplikasi terkirim ke ${targets.length} akun.`);
                      } catch (err: any) {
                        showNotice('error', err?.message || 'Gagal mengirim pengingat ke semua akun.');
                      } finally {
                        setIsSending(false);
                      }
                    }}
                    title="Kirim notifikasi ke kotak masuk akun di aplikasi tanpa membuka WhatsApp"
                    className="px-3 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Akun Saja</span>
                  </button>
                </div>
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

              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => {
                        const targets = monitoredAccounts.filter((p) => selectedIds.includes(p.id));
                        openWhatsAppQueueForTargets(targets);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Kirim WhatsApp ({selectedIds.length})</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={handleSendBatchInApp}
                      className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold rounded shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ke Akun Saja ({selectedIds.length})</span>
                    </button>
                  </>
                )}

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama / NIP / No. WA..."
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
                        <th className="py-2.5 px-3">No. WhatsApp Akun</th>
                        <th className="py-2.5 px-3">Status Jurnal</th>
                        <th className="py-2.5 px-3">Status Pengingat</th>
                        <th className="py-2.5 px-3 text-right">Aksi Kirim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {filteredAccounts.map(({ pegawai, hasCompleted, countKegiatan, latestReminder }) => {
                        const isChecked = selectedIds.includes(pegawai.id);
                        const waFormatted = formatWaNumber(pegawai.noHp);
                        const isEditingPhone = editingNoHpId === pegawai.id;

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
                                  <div className="text-[10px] text-slate-400 truncate max-w-[230px]">
                                    {pegawai.jabatan}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              {isEditingPhone ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="tel"
                                    value={editingNoHpVal}
                                    onChange={(e) => setEditingNoHpVal(e.target.value)}
                                    placeholder="081234567890"
                                    autoFocus
                                    className="w-32 px-2 py-1 text-[11px] font-mono bg-white border border-[#2271b1] rounded focus:outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineNoHp(pegawai)}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                    title="Simpan Nomor WhatsApp"
                                  >
                                    <Save className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoHpId(null)}
                                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                                    title="Batal"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : waFormatted ? (
                                <div className="flex items-center space-x-1.5">
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-semibold inline-flex items-center space-x-1">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>+{waFormatted}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditNoHp(pegawai)}
                                    className="p-1 text-slate-400 hover:text-[#2271b1] cursor-pointer"
                                    title="Ubah Nomor WhatsApp"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditNoHp(pegawai)}
                                  className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-semibold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>+ Isi No. WA</span>
                                </button>
                              )}
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
                                <div className="flex flex-col gap-1 items-start">
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
                                          : 'Terkirim ke Akun'}
                                    </span>
                                  </span>
                                  {latestReminder.viaWhatsApp && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center space-x-1">
                                      <MessageCircle className="w-2.5 h-2.5" />
                                      <span>Terkirim via WA</span>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">Belum dikirim</span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {!hasCompleted ? (
                                <div className="inline-flex items-center space-x-1.5">
                                  <a
                                    href={buildWhatsAppUrl(pegawai, effectiveMessage, selectedDate)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                      onSendPengingat([pegawai], selectedDate, effectiveMessage, {
                                        viaWhatsApp: true,
                                      });
                                      showNotice(
                                        'success',
                                        waFormatted
                                          ? `Membuka WhatsApp ke +${waFormatted} (${pegawai.nama}) & mencatat pengingat.`
                                          : `Membuka WhatsApp untuk ${pegawai.nama} (silakan pilih kontak tujuan) & mencatat pengingat.`
                                      );
                                    }}
                                    title={
                                      waFormatted
                                        ? `Kirim pengingat langsung ke WhatsApp +${waFormatted}`
                                        : 'Buka WhatsApp (No. WA belum diisi — pilih kontak langsung di WhatsApp atau isi No. WA)'
                                    }
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition inline-flex items-center space-x-1 shadow-2xs cursor-pointer"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>Kirim WhatsApp</span>
                                  </a>

                                  <button
                                    type="button"
                                    disabled={isSending}
                                    onClick={() => handleSendSingleInApp(pegawai)}
                                    title="Kirim pengingat ke notifikasi akun aplikasi saja"
                                    className="px-2 py-1 bg-slate-100 hover:bg-[#2271b1] hover:text-white text-slate-700 border border-slate-300 rounded text-[11px] font-semibold transition inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Akun</span>
                                  </button>
                                </div>
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
                    const waFormatted = formatWaNumber(pegawai.noHp);
                    const isEditingPhone = editingNoHpId === pegawai.id;

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

                        {/* Inline Phone Row on Mobile */}
                        <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                          <span className="text-[11px] text-slate-500 font-semibold">No. WhatsApp:</span>
                          {isEditingPhone ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="tel"
                                value={editingNoHpVal}
                                onChange={(e) => setEditingNoHpVal(e.target.value)}
                                placeholder="081234567890"
                                className="w-32 px-2 py-0.5 text-[11px] font-mono bg-white border border-[#2271b1] rounded"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineNoHp(pegawai)}
                                className="p-1 bg-emerald-600 text-white rounded cursor-pointer"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNoHpId(null)}
                                className="p-1 bg-slate-200 text-slate-700 rounded cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : waFormatted ? (
                            <button
                              type="button"
                              onClick={() => handleStartEditNoHp(pegawai)}
                              className="text-[11px] font-mono font-bold text-emerald-700 inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <span>+{waFormatted}</span>
                              <Edit3 className="w-3 h-3 text-slate-400" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditNoHp(pegawai)}
                              className="text-[11px] font-semibold text-amber-700 inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <Phone className="w-3 h-3" />
                              <span>+ Isi No. WA</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <div className="text-[10px]">
                            {latestReminder ? (
                              <span className="text-amber-700 font-semibold">
                                {latestReminder.viaWhatsApp
                                  ? 'Terkirim via WA'
                                  : latestReminder.status === 'resolved' || hasCompleted
                                    ? 'Sudah Dikerjakan'
                                    : latestReminder.status === 'read'
                                      ? 'Sudah Dibaca'
                                      : 'Terkirim ke Akun'}
                              </span>
                            ) : (
                              <span className="text-slate-400">Belum ada pengingat</span>
                            )}
                          </div>

                          {!hasCompleted && (
                            <div className="flex items-center space-x-1.5">
                              <a
                                href={buildWhatsAppUrl(pegawai, effectiveMessage, selectedDate)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  onSendPengingat([pegawai], selectedDate, effectiveMessage, {
                                    viaWhatsApp: true,
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Kirim WhatsApp</span>
                              </a>
                              <button
                                type="button"
                                disabled={isSending}
                                onClick={() => handleSendSingleInApp(pegawai)}
                                className="px-2.5 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Akun</span>
                              </button>
                            </div>
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
                Gunakan tab &ldquo;Belum Mengisi &amp; Kirim&rdquo; untuk mengirim pengingat ke WhatsApp &amp; akun pegawai.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f0f1]">
              {pengingatList.map((pg) => {
                const isDone = pg.status === 'resolved' || hasFilledForDate(pg.pegawaiId, pg.tanggalTarget);
                const peg = allPegawai.find((p) => p.id === pg.pegawaiId);
                const targetNoHp = peg?.noHp || pg.noHpTujuan;
                const waNum = formatWaNumber(targetNoHp);

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
                        {pg.viaWhatsApp && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center space-x-1">
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>Terkirim via WA {waNum ? `(+${waNum})` : ''}</span>
                          </span>
                        )}
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

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {!isDone && (
                        <a
                          href={buildWhatsAppUrl(
                            { nama: pg.pegawaiNama, nip: pg.pegawaiNip, noHp: targetNoHp },
                            pg.pesan,
                            pg.tanggalTarget
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onMarkPengingatWaSent(pg.id, targetNoHp || '')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{pg.viaWhatsApp ? 'Kirim Ulang WA' : 'Kirim WA'}</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeletePengingat(pg.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-[#d63638] hover:text-white text-rose-700 border border-rose-200 rounded text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                        title="Hapus Riwayat Pengingat"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
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
        <div className="space-y-4">
          {/* WhatsApp Number Setup Card for Current Account */}
          <div
            className={`border rounded-lg p-4 shadow-2xs text-xs ${
              formatWaNumber(currentPegawai.noHp)
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-amber-50 border-amber-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-2.5">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    formatWaNumber(currentPegawai.noHp)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    {formatWaNumber(currentPegawai.noHp)
                      ? `WhatsApp Akun Terhubung (+${formatWaNumber(currentPegawai.noHp)})`
                      : 'Daftarkan Nomor WhatsApp Akun Anda'}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {formatWaNumber(currentPegawai.noHp)
                      ? 'Pengingat jurnal dari Atasan atau Admin akan diarahkan langsung ke nomor WhatsApp ini.'
                      : 'Masukkan nomor WhatsApp aktif Anda agar pengingat pengisian jurnal dapat dikirim langsung ke WhatsApp Anda.'}
                  </p>
                </div>
              </div>

              {!selfEditingWa && formatWaNumber(currentPegawai.noHp) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelfNoHpInput(currentPegawai.noHp || '');
                    setSelfEditingWa(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold flex items-center space-x-1 self-start sm:self-center cursor-pointer shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah No. WA</span>
                </button>
              ) : (
                <form
                  onSubmit={handleSaveSelfNoHp}
                  className="flex flex-wrap items-center gap-2 shrink-0"
                >
                  <input
                    type="tel"
                    value={selfNoHpInput}
                    onChange={(e) => setSelfNoHpInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-44 px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs focus:border-[#2271b1] focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan No. WA</span>
                  </button>
                  {formatWaNumber(currentPegawai.noHp) && (
                    <button
                      type="button"
                      onClick={() => setSelfEditingWa(false)}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#c3c4c7] rounded-lg shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f6f7f7] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-[#1d2327] flex items-center space-x-1.5">
                  <Inbox className="w-4 h-4 text-[#2271b1]" />
                  <span>Pengingat Jurnal untuk Akun Anda ({myInboxPengingat.length})</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Setiap pengingat yang dikirim oleh Atasan atau Admin tampil langsung di sini dan dikirim ke WhatsApp Anda.
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

                          {pg.viaWhatsApp && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>Terkirim ke WhatsApp</span>
                            </span>
                          )}
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
        </div>
      )}

      {/* =====================================================================
          MODAL: ANTREAN KIRIM WHATSAPP PER AKUN (BATCH / MASSAL)
         ===================================================================== */}
      {waQueueModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-[#c3c4c7] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90dvh]">
            <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-emerald-100" />
                <div>
                  <h2 className="text-sm font-bold">
                    Kirim Pengingat ke WhatsApp Masing-Masing Akun
                  </h2>
                  <p className="text-[11px] text-emerald-100">
                    Tanggal Target: {formatTanggalIndonesia(selectedDate)} &bull; Terkirim: {waQueueDispatchedCount}/{waQueueItems.length} Akun
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaQueueModalOpen(false)}
                className="text-emerald-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900 mb-1">
                <span>Klik tombol &ldquo;Buka &amp; Kirim WA&rdquo; pada setiap akun di bawah untuk mengirim pesan ke WhatsApp masing-masing:</span>
                <span>{waQueueDispatchedCount}/{waQueueItems.length}</span>
              </div>
              <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{
                    width: `${
                      waQueueItems.length > 0
                        ? Math.round((waQueueDispatchedCount / waQueueItems.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Queue List */}
            <div className="divide-y divide-slate-200 overflow-y-auto flex-1">
              {waQueueItems.map((item) => {
                const livePeg =
                  allPegawai.find((p) => p.id === item.pegawaiId) || item.pegawaiSnapshot;
                const waNum = formatWaNumber(livePeg.noHp);
                const isEditingPhone = editingNoHpId === livePeg.id;
                const formattedMsg = buildWhatsAppMessage(livePeg, item.pesan, item.tanggalTarget);

                return (
                  <div
                    key={item.pengingatId}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      item.dispatched ? 'bg-emerald-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-900">{livePeg.nama}</span>
                        <span className="text-[11px] font-mono text-slate-500">
                          (@{livePeg.username || 'user'})
                        </span>
                        {item.dispatched && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            &check; Terkirim WA
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {isEditingPhone ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="tel"
                              value={editingNoHpVal}
                              onChange={(e) => setEditingNoHpVal(e.target.value)}
                              placeholder="081234567890"
                              autoFocus
                              className="w-36 px-2 py-0.5 font-mono bg-white border border-[#2271b1] rounded"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineNoHp(livePeg)}
                              className="px-2 py-0.5 bg-emerald-600 text-white rounded font-semibold cursor-pointer"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoHpId(null)}
                              className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : waNum ? (
                          <span className="text-emerald-700 font-mono font-semibold inline-flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>+{waNum}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditNoHp(livePeg)}
                              className="text-slate-400 hover:text-[#2271b1] ml-1 cursor-pointer"
                              title="Ubah No. WhatsApp"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditNoHp(livePeg)}
                            className="text-amber-700 font-semibold hover:underline inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Phone className="w-3 h-3" />
                            <span>+ Isi No. WhatsApp akun ini terlebih dahulu</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(item.pengingatId, formattedMsg)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                        title="Salin teks pesan pengingat"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === item.pengingatId ? 'Disalin!' : 'Salin'}</span>
                      </button>

                      <a
                        href={buildWhatsAppUrl(livePeg, item.pesan, item.tanggalTarget)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setWaQueueItems((prev) =>
                            prev.map((q) =>
                              q.pengingatId === item.pengingatId ? { ...q, dispatched: true } : q
                            )
                          );
                          onMarkPengingatWaSent(item.pengingatId, waNum ? `+${waNum}` : livePeg.noHp || '');
                        }}
                        className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center space-x-1 shadow-xs cursor-pointer transition ${
                          item.dispatched
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{item.dispatched ? 'Kirim Ulang WA' : 'Buka & Kirim WA'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-[11px] text-slate-500">
                Pengingat juga otomatis tampil di kotak masuk aplikasi akun masing-masing pegawai.
              </span>
              <button
                type="button"
                onClick={() => setWaQueueModalOpen(false)}
                className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
