import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Edit3,
  Trash2,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  CheckSquare,
  Square
} from 'lucide-react';
import { Pegawai, UserRole } from '../types';
import confetti from 'canvas-confetti';

interface DaftarPegawaiViewProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  onUpdatePegawai: (pegId: string, updatedData: Partial<Pegawai>) => void;
  onDeletePegawaiPermanently: (pegId: string) => void;
  onBatchDeletePegawaiPermanently?: (pegIds: string[]) => void;
  onAddPegawai: (newPegawai: Pegawai) => Promise<void> | void;
}

export const DaftarPegawaiView: React.FC<DaftarPegawaiViewProps> = ({
  currentPegawai,
  allPegawai,
  onUpdatePegawai,
  onDeletePegawaiPermanently,
  onBatchDeletePegawaiPermanently,
  onAddPegawai,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notifMsg, setNotifMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit / Add Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);
  const [formNama, setFormNama] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formJabatan, setFormJabatan] = useState('');
  const [formUnitKerja, setFormUnitKerja] = useState('');
  const [formPangkat, setFormPangkat] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('pegawai');
  const [formEmail, setFormEmail] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<Pegawai | null>(null);
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotifMsg({ type, text });
    setTimeout(() => setNotifMsg(null), 4500);
  };

  // Filtered list
  const filteredPegawai = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPegawai.filter((p) => {
      if (roleFilter !== 'all' && p.role !== roleFilter) return false;
      if (!q) return true;
      return (
        p.nama.toLowerCase().includes(q) ||
        p.nip.toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q) ||
        p.jabatan.toLowerCase().includes(q) ||
        p.unitKerja.toLowerCase().includes(q)
      );
    });
  }, [allPegawai, searchQuery, roleFilter]);

  const deletableFiltered = useMemo(() => {
    return filteredPegawai.filter((p) => p.id !== currentPegawai.id);
  }, [filteredPegawai, currentPegawai.id]);

  // Role counts
  const counts = useMemo(() => {
    return {
      total: allPegawai.length,
      pegawai: allPegawai.filter((p) => p.role === 'pegawai').length,
      atasan: allPegawai.filter((p) => p.role === 'atasan').length,
      admin: allPegawai.filter((p) => p.role === 'admin' || p.role === 'superadmin').length,
    };
  }, [allPegawai]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Admin
          </span>
        );
      case 'atasan':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Atasan Penilai
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Pegawai / ASN
          </span>
        );
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (peg: Pegawai) => {
    setEditingPegawai(peg);
    setFormNama(peg.nama || '');
    setFormNip(peg.nip || '');
    setFormUsername(peg.username || '');
    setFormPassword('');
    setShowPassword(false);
    setFormJabatan(peg.jabatan || '');
    setFormUnitKerja(peg.unitKerja || '');
    setFormPangkat(peg.pangkatGolongan || '');
    setFormRole(peg.role);
    setFormEmail(peg.email || '');
    setFormNoHp(peg.noHp || '');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPegawai(null);
    setFormNama('');
    setFormNip('');
    setFormUsername('');
    setFormPassword('123');
    setShowPassword(false);
    setFormJabatan('');
    setFormUnitKerja('BKPSDMD KAB. BELU');
    setFormPangkat('Penata Muda (III/a)');
    setFormRole('pegawai');
    setFormEmail('');
    setFormNoHp('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Edit or Add
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNama.trim()) {
      setFormError('Nama lengkap & gelar wajib diisi.');
      return;
    }
    if (!formNip.trim()) {
      setFormError('NIP pegawai wajib diisi.');
      return;
    }

    const cleanUsername = formUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      setFormError('Username login wajib diisi (tanpa spasi).');
      return;
    }

    // Check duplicate username
    const dupUser = allPegawai.find(
      (p) =>
        p.id !== editingPegawai?.id &&
        (p.username || '').trim().toLowerCase() === cleanUsername
    );
    if (dupUser) {
      setFormError(`Username "@${cleanUsername}" sudah digunakan oleh "${dupUser.nama}".`);
      return;
    }

    // Check duplicate NIP
    const cleanNip = formNip.replace(/\s+/g, '');
    const dupNip = allPegawai.find(
      (p) =>
        p.id !== editingPegawai?.id &&
        p.nip.replace(/\s+/g, '') === cleanNip
    );
    if (dupNip) {
      setFormError(`NIP "${formNip}" sudah terdaftar atas nama "${dupNip.nama}".`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPegawai) {
        const updatedPatch: Partial<Pegawai> = {
          nama: formNama.trim(),
          nip: formNip.trim(),
          username: cleanUsername,
          jabatan: formJabatan.trim() || 'Staf Pelaksana',
          unitKerja: formUnitKerja.trim() || 'BKPSDMD KAB. BELU',
          pangkatGolongan: formPangkat.trim(),
          role: formRole,
          email: formEmail.trim(),
          noHp: formNoHp.trim(),
        };
        if (formPassword.trim()) {
          if (formPassword.trim().length < 3) {
            setFormError('Kata sandi baru minimal 3 karakter.');
            setIsSubmitting(false);
            return;
          }
          updatedPatch.password = formPassword.trim();
        }
        onUpdatePegawai(editingPegawai.id, updatedPatch);
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
        showNotice('success', `Data pegawai "${formNama.trim()}" berhasil diperbarui dan disimpan permanen.`);
      } else {
        if (!formPassword.trim() || formPassword.trim().length < 3) {
          setFormError('Kata sandi minimal 3 karakter.');
          setIsSubmitting(false);
          return;
        }
        const newPeg: Pegawai = {
          id: `peg-${Date.now()}`,
          nama: formNama.trim(),
          nip: formNip.trim(),
          username: cleanUsername,
          password: formPassword.trim(),
          jabatan: formJabatan.trim() || 'Staf Pelaksana',
          unitKerja: formUnitKerja.trim() || 'BKPSDMD KAB. BELU',
          pangkatGolongan: formPangkat.trim() || 'Penata Muda (III/a)',
          role: formRole,
          email: formEmail.trim() || `${cleanUsername}@belukab.go.id`,
          noHp: formNoHp.trim() || '',
        };
        await onAddPegawai(newPeg);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        showNotice('success', `Pegawai baru "${newPeg.nama}" berhasil ditambahkan dan disimpan ke cloud!`);
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data pegawai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle selection for bulk delete
  const toggleSelect = (id: string) => {
    if (id === currentPegawai.id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === deletableFiltered.length && deletableFiltered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(deletableFiltered.map((p) => p.id));
    }
  };

  // Confirm Single Permanent Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const deletedName = deleteTarget.nama;
    onDeletePegawaiPermanently(deleteTarget.id);
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    setDeleteTarget(null);
    showNotice(
      'success',
      `Pegawai "${deletedName}" telah dihapus secara permanen dari database & tidak akan muncul lagi saat aplikasi diperbarui.`
    );
  };

  // Confirm Batch Permanent Delete
  const handleConfirmBatchDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (onBatchDeletePegawaiPermanently) {
      onBatchDeletePegawaiPermanently(selectedIds);
    } else {
      selectedIds.forEach((id) => onDeletePegawaiPermanently(id));
    }
    setSelectedIds([]);
    setIsBatchDeleteConfirmOpen(false);
    showNotice(
      'success',
      `${count} akun pegawai berhasil dihapus permanen dan tidak akan muncul lagi saat aplikasi diperbarui.`
    );
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Notification Alert */}
      {notifMsg && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
            notifMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {notifMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notifMsg.text}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white border border-[#c3c4c7] rounded-lg p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1d2327] flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#2271b1]" />
              <span>Nama-Nama Pegawai</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola daftar pegawai, sunting biodata/peran, atau hapus akun secara permanen agar tidak muncul lagi saat aplikasi diperbarui.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBatchDeleteConfirmOpen(true)}
                className="px-3 py-1.5 bg-[#d63638] hover:bg-[#b32d2e] text-white text-xs font-semibold rounded shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Permanen ({selectedIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Pegawai</span>
            </button>
          </div>
        </div>

        {/* Summary Counters & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-[#f0f0f1]">
          {/* Filter Role Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-[#2271b1] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('pegawai')}
              className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                roleFilter === 'pegawai'
                  ? 'bg-[#2271b1] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pegawai ({counts.pegawai})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('atasan')}
              className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                roleFilter === 'atasan'
                  ? 'bg-[#2271b1] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Atasan ({counts.atasan})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                roleFilter === 'admin'
                  ? 'bg-[#2271b1] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admin ({counts.admin})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIP, username, jabatan..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-[#c3c4c7] rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pegawai Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white border border-[#c3c4c7] rounded-lg shadow-2xs overflow-hidden">
        {filteredPegawai.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada data pegawai ditemukan.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Coba ubah kata kunci pencarian atau tambahkan pegawai baru.
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
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-slate-500 hover:text-[#2271b1] flex items-center cursor-pointer"
                        title="Pilih semua yang dapat dihapus"
                      >
                        {deletableFiltered.length > 0 && selectedIds.length === deletableFiltered.length ? (
                          <CheckSquare className="w-4 h-4 text-[#2271b1]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-3">Nama Pegawai &amp; Username</th>
                    <th className="py-2.5 px-3">NIP</th>
                    <th className="py-2.5 px-3">Jabatan &amp; Unit Kerja</th>
                    <th className="py-2.5 px-3">Peran</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f1]">
                  {filteredPegawai.map((peg) => {
                    const isSelf = peg.id === currentPegawai.id;
                    const isChecked = selectedIds.includes(peg.id);
                    return (
                      <tr key={peg.id} className="hover:bg-[#f6f7f7]/70 transition">
                        <td className="py-2.5 px-3">
                          {!isSelf ? (
                            <button
                              type="button"
                              onClick={() => toggleSelect(peg.id)}
                              className="text-slate-400 hover:text-[#2271b1] flex items-center cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#2271b1]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300" title="Akun sedang login">&mdash;</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded bg-[#2271b1] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                              {peg.foto ? (
                                <img src={peg.foto} alt={peg.nama} className="w-full h-full object-cover" />
                              ) : (
                                peg.nama.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#1d2327] flex items-center space-x-1.5">
                                <span className="truncate">{peg.nama}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                @{peg.username || 'user'}
                                {peg.email ? ` • ${peg.email}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold whitespace-nowrap">
                          {peg.nip}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{peg.jabatan}</div>
                          <div className="text-[11px] text-slate-500">
                            {peg.unitKerja}
                            {peg.pangkatGolongan ? ` • ${peg.pangkatGolongan}` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getRoleBadge(peg.role)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(peg)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-[#2271b1] hover:text-white text-slate-700 rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                              title="Edit Data Pegawai"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {!isSelf ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(peg)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-[#d63638] hover:text-white text-rose-700 border border-rose-200 hover:border-[#d63638] rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                                title="Hapus Pegawai Secara Permanen"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus Permanen</span>
                              </button>
                            ) : (
                              <span className="px-2 py-1 text-[10px] text-slate-400 italic">
                                Akun Aktif
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-[#f0f0f1]">
              {filteredPegawai.map((peg) => {
                const isSelf = peg.id === currentPegawai.id;
                const isChecked = selectedIds.includes(peg.id);
                return (
                  <div key={peg.id} className="p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => toggleSelect(peg.id)}
                            className="mt-1 text-slate-400 hover:text-[#2271b1] shrink-0 cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-[#2271b1]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <div className="w-9 h-9 rounded bg-[#2271b1] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {peg.foto ? (
                            <img src={peg.foto} alt={peg.nama} className="w-full h-full object-cover" />
                          ) : (
                            peg.nama.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#1d2327] flex items-center flex-wrap gap-1">
                            <span className="truncate">{peg.nama}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 font-mono font-semibold">
                            NIP. {peg.nip}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            @{peg.username || 'user'} &bull; {peg.jabatan}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {peg.unitKerja}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getRoleBadge(peg.role)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(peg)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#2271b1] hover:text-white text-slate-700 rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(peg)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-[#d63638] hover:text-white text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Permanen</span>
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

      {/* Add / Edit Pegawai Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-[#c3c4c7] rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92dvh]">
            <div className="bg-[#1d2327] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                {editingPegawai ? <Edit3 className="w-4 h-4 text-[#72aee6]" /> : <UserPlus className="w-4 h-4 text-[#72aee6]" />}
                <h2 className="text-sm font-bold">
                  {editingPegawai ? `Edit Data Pegawai: ${editingPegawai.nama}` : 'Tambah Pegawai Baru'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap &amp; Gelar *
                  </label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: BUDI SANTOSO, S.Pd"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIP Pegawai *
                  </label>
                  <input
                    type="text"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    placeholder="18 digit NIP"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="username"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peran / Hak Akses *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-semibold"
                  >
                    <option value="pegawai">Pegawai / ASN</option>
                    <option value="atasan">Atasan Langsung (Verifikator)</option>
                    <option value="admin">Admin Instansi</option>
                    <option value="superadmin">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan Resmi *
                  </label>
                  <input
                    type="text"
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    placeholder="Jabatan"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pangkat / Golongan Ruang
                  </label>
                  <input
                    type="text"
                    value={formPangkat}
                    onChange={(e) => setFormPangkat(e.target.value)}
                    placeholder="Contoh: Penata Muda (III/a)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Unit Kerja / Bagian *
                  </label>
                  <input
                    type="text"
                    value={formUnitKerja}
                    onChange={(e) => setFormUnitKerja(e.target.value)}
                    placeholder="Unit Kerja"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Dinas
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="nama@instansi.go.id"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor HP / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={formNoHp}
                      onChange={(e) => setFormNoHp(e.target.value)}
                      placeholder="0812-3456-7890"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {editingPegawai ? 'Kata Sandi Baru (Kosongkan jika tidak ingin diubah)' : 'Kata Sandi Login *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingPegawai ? 'Isi kata sandi baru jika ingin ganti...' : 'Minimal 3 karakter'}
                      required={!editingPegawai}
                      className="w-full pl-8 pr-10 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-semibold rounded shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : editingPegawai ? 'Simpan Perubahan' : 'Simpan Pegawai Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hapus Pegawai Secara Permanen?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Anda akan menghapus akun pegawai berikut secara permanen:
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-0.5">
                <div className="font-bold text-slate-900">{deleteTarget.nama}</div>
                <div className="font-mono text-slate-600">NIP. {deleteTarget.nip} &bull; @{deleteTarget.username}</div>
                <div className="text-[11px] text-slate-500">{deleteTarget.jabatan}</div>
              </div>

              <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5 leading-relaxed">
                <strong>Perhatian:</strong> Semua riwayat jurnal harian, catatan presensi, dan pengaturan milik pegawai ini akan ikut dihapus permanen dari database Firebase Firestore dan <strong>tidak akan muncul lagi ketika aplikasi diperbarui</strong>.
              </p>

              <div className="pt-2 flex items-center justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-[#d63638] hover:bg-[#b32d2e] text-white font-semibold rounded shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Permanen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {isBatchDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hapus Permanen {selectedIds.length} Pegawai Terpilih?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Seluruh data akun, jurnal harian, dan presensi dari <strong>{selectedIds.length} pegawai</strong> yang dipilih akan dihapus permanen dari Firebase Firestore dan tidak akan muncul lagi saat aplikasi diperbarui.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsBatchDeleteConfirmOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  className="px-4 py-2 bg-[#d63638] hover:bg-[#b32d2e] text-white font-semibold rounded shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Permanen ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
