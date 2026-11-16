/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { NavTab } from './components/Navbar';
import { WpAdminBar } from './components/WpAdminBar';
import { WpSidebar } from './components/WpSidebar';
import { WpDashboardView } from './components/WpDashboardView';
import { JurnalHarianView } from './components/JurnalHarianView';
import { JurnalFormModal } from './components/JurnalFormModal';
import { VerifikasiAtasanView } from './components/VerifikasiAtasanView';
import { MonitoringPegawaiHarianView } from './components/MonitoringPegawaiHarianView';
import { RekapitulasiView } from './components/RekapitulasiView';
import { PengaturanAdminView } from './components/PengaturanAdminView';
import { PrintDocumentModal } from './components/PrintDocumentModal';
import { LaravelApiGuideModal } from './components/LaravelApiGuideModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { LoginView } from './components/LoginView';
import { ProfilPenggunaView } from './components/ProfilPenggunaView';
import { TambahUserView } from './components/TambahUserView';
import { DaftarPegawaiView } from './components/DaftarPegawaiView';
import { PengingatJurnalView } from './components/PengingatJurnalView';
import { PengaturanCopyrightView } from './components/PengaturanCopyrightView';
import { PengaturanWarnaView } from './components/PengaturanWarnaView';
import { BellRing } from 'lucide-react';
import {
  applyThemeCssVariables,
  DEFAULT_APP_BG,
  isDarkColor,
  normalizeHexColor,
} from './utils/themeColors';

import { Pegawai, PengaturanInstansi, KegiatanJurnal, PresensiRecord, PengingatJurnal } from './types';
import { INITIAL_PENGATURAN, INITIAL_PEGAWAI } from './data/initialData';
import confetti from 'canvas-confetti';
import {
  loadPengaturan,
  savePengaturan,
  loadPengaturanMap,
  saveAllPengaturanMap,
  getPengaturanForUser,
  loadPegawai,
  savePegawai,
  loadKegiatan,
  saveKegiatan,
  loadPresensi,
  savePresensi,
  loadPengingat,
  savePengingat,
  loadCurrentUserId,
  saveCurrentUserId,
  loadAuthUser,
  saveAuthUser,
  resetAllData,
  deletePegawaiPermanentlyFromStorage,
  deleteMultiplePegawaiPermanentlyFromStorage,
  purgeAllDemoAccountsFromStorage,
  saveDeletedPegawaiIds,
  addDeletedPegawaiIds,
  loadDeletedPegawaiIds,
} from './utils/storage';
import {
  seedInitialDataIfFirestoreEmpty,
  subscribePegawaiFirestore,
  subscribeJurnalFirestore,
  subscribePresensiFirestore,
  subscribePengaturanFirestore,
  subscribeSystemMetaFirestore,
  subscribePengingatFirestore,
  saveKegiatanToFirestore,
  deleteKegiatanFromFirestore,
  savePresensiToFirestore,
  savePengaturanToFirestore,
  syncAllPengaturanMapToFirestore,
  deletePegawaiFromFirestore,
  deleteMultiplePegawaiFromFirestore,
  markPegawaiDeletedInFirestore,
  syncAllPegawaiToFirestore,
  savePegawaiToFirestore,
  savePengingatToFirestore,
  saveMultiplePengingatToFirestore,
  deletePengingatFromFirestore,
} from './services/firebaseDb';

export default function App() {
  // Application State - Independent per-account settings map
  const [pengaturanMap, setPengaturanMap] = useState<Record<string, PengaturanInstansi>>(loadPengaturanMap);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(loadPegawai);
  const [authUser, setAuthUser] = useState<Pegawai | null>(loadAuthUser);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const existingAuth = loadAuthUser();
    return existingAuth ? existingAuth.id : loadCurrentUserId();
  });
  const [kegiatanList, setKegiatanList] = useState<KegiatanJurnal[]>(loadKegiatan);
  const [presensiList, setPresensiList] = useState<PresensiRecord[]>(loadPresensi);
  const [pengingatList, setPengingatList] = useState<PengingatJurnal[]>(loadPengingat);
  const [isFirebaseSynced, setIsFirebaseSynced] = useState<boolean>(false);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isWpSidebarCollapsed, setIsWpSidebarCollapsed] = useState<boolean>(false);
  const [isWpMobileSidebarOpen, setIsWpMobileSidebarOpen] = useState<boolean>(false);
  const [selectedBulan, setSelectedBulan] = useState<number>(1); // Default Januari
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>(currentUserId);

  // Modals
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState<boolean>(false);
  const [editingKegiatan, setEditingKegiatan] = useState<KegiatanJurnal | null>(null);
  const [jurnalInitialTanggal, setJurnalInitialTanggal] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printModalMode, setPrintModalMode] = useState<'harian' | 'mingguan' | 'bulanan'>('bulanan');
  const [printModalTanggal, setPrintModalTanggal] = useState<string>('');
  const [isLaravelDocsOpen, setIsLaravelDocsOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // 1. Initial Firestore Auto-Seed & Live Subscription
  useEffect(() => {
    let isMounted = true;

    // Seed or fetch from Firebase Firestore on startup
    seedInitialDataIfFirestoreEmpty()
      .then((res) => {
        if (!isMounted) return;
        if (res.deletedPegawaiIds && res.deletedPegawaiIds.length > 0) {
          saveDeletedPegawaiIds(res.deletedPegawaiIds);
        }
        if (res.seeded) {
          setPegawaiList(res.pegawai);
          if (res.kegiatan) setKegiatanList(res.kegiatan);
          if (res.presensi) setPresensiList(res.presensi);
          if (res.pengaturanMap && Object.keys(res.pengaturanMap).length > 0) {
            setPengaturanMap(res.pengaturanMap);
          }
          setIsFirebaseSynced(true);
        }
      })
      .catch((err) => {
        console.warn('Firebase initial seed notice:', err);
      });

    // Realtime subscriptions
    const unsubSystemMeta = subscribeSystemMetaFirestore((remoteDeletedIds) => {
      const merged = addDeletedPegawaiIds(remoteDeletedIds);
      const deletedSet = new Set(merged);
      setPegawaiList((prev) => prev.filter((p) => !deletedSet.has(p.id)));
      setKegiatanList((prev) => prev.filter((k) => !deletedSet.has(k.pegawaiId)));
      setPresensiList((prev) => prev.filter((pr) => !deletedSet.has(pr.pegawaiId)));
      setPengingatList((prev) => prev.filter((pg) => !deletedSet.has(pg.pegawaiId)));
    });
    const unsubPegawai = subscribePegawaiFirestore((livePegawai) => {
      const deletedSet = new Set(loadDeletedPegawaiIds());
      setPegawaiList(livePegawai.filter((p) => !deletedSet.has(p.id)));
    });
    const unsubJurnal = subscribeJurnalFirestore((liveJurnal) => {
      const deletedSet = new Set(loadDeletedPegawaiIds());
      setKegiatanList(liveJurnal.filter((k) => !deletedSet.has(k.pegawaiId)));
    });
    const unsubPresensi = subscribePresensiFirestore((livePresensi) => {
      const deletedSet = new Set(loadDeletedPegawaiIds());
      setPresensiList(livePresensi.filter((pr) => !deletedSet.has(pr.pegawaiId)));
    });
    const unsubPengaturan = subscribePengaturanFirestore((liveMap) => {
      if (Object.keys(liveMap).length > 0) setPengaturanMap(liveMap);
    });
    const unsubPengingat = subscribePengingatFirestore((livePengingat) => {
      const deletedSet = new Set(loadDeletedPegawaiIds());
      setPengingatList(livePengingat.filter((pg) => !deletedSet.has(pg.pegawaiId)));
    });

    return () => {
      isMounted = false;
      unsubSystemMeta();
      unsubPegawai();
      unsubJurnal();
      unsubPresensi();
      unsubPengaturan();
      unsubPengingat();
    };
  }, []);

  // Sync settings map with local storage as backup cache & apply global background colors
  useEffect(() => {
    saveAllPengaturanMap(pengaturanMap);
    const defaultCfg = pengaturanMap['default'] || INITIAL_PENGATURAN;
    applyThemeCssVariables(defaultCfg);
    document.body.style.backgroundColor = normalizeHexColor(
      defaultCfg.warnaBgAplikasi,
      DEFAULT_APP_BG
    );
  }, [pengaturanMap]);

  useEffect(() => {
    savePegawai(pegawaiList);
  }, [pegawaiList]);

  useEffect(() => {
    saveKegiatan(kegiatanList);
  }, [kegiatanList]);

  useEffect(() => {
    savePresensi(presensiList);
  }, [presensiList]);

  useEffect(() => {
    savePengingat(pengingatList);
  }, [pengingatList]);

  useEffect(() => {
    saveCurrentUserId(currentUserId);
  }, [currentUserId]);

  // Current active user
  const currentPegawai = useMemo(() => {
    return (
      pegawaiList.find((p) => p.id === currentUserId) ||
      pegawaiList[0] ||
      authUser ||
      INITIAL_PEGAWAI[INITIAL_PEGAWAI.length - 1]
    );
  }, [pegawaiList, currentUserId, authUser]);

  // Pending count for superior verification badge
  const pendingVerifikasiCount = useMemo(() => {
    return kegiatanList.filter((k) => k.statusValidasi === 'Menunggu').length;
  }, [kegiatanList]);

  // Unread reminders belonging to the currently logged-in account
  const myUnreadPengingat = useMemo(() => {
    return pengingatList.filter((pg) => {
      if (pg.pegawaiId !== currentPegawai.id || pg.status !== 'unread') return false;
      const alreadyFilled = kegiatanList.some(
        (k) => k.pegawaiId === currentPegawai.id && k.tanggal === pg.tanggalTarget
      );
      return !alreadyFilled;
    });
  }, [pengingatList, currentPegawai.id, kegiatanList]);

  const unreadPengingatCount = myUnreadPengingat.length;

  // Target pegawai being viewed
  const targetPegawai = useMemo(() => {
    return pegawaiList.find((p) => p.id === selectedPegawaiId) || currentPegawai;
  }, [pegawaiList, selectedPegawaiId, currentPegawai]);

  // Settings resolution helper per user
  const getPengaturanFor = (pegId: string): PengaturanInstansi => {
    return getPengaturanForUser(pegId, pengaturanMap);
  };

  // Specific settings for current active logged-in user
  const currentPengaturan = useMemo(() => {
    return getPengaturanFor(currentPegawai.id);
  }, [currentPegawai.id, pengaturanMap]);

  // Specific settings for target employee being viewed/printed
  const targetPengaturan = useMemo(() => {
    return getPengaturanFor(targetPegawai.id);
  }, [targetPegawai.id, pengaturanMap]);

  // Next Nomor Kegiatan
  const nextNomorKegiatan = useMemo(() => {
    const userKegs = kegiatanList.filter((k) => k.pegawaiId === targetPegawai.id);
    const count = userKegs.length + 1;
    return count.toString().padStart(2, '0');
  }, [kegiatanList, targetPegawai.id]);

  // Handlers for independent per-account settings
  const handleSaveAccountPengaturan = (targetId: string, newSettings: PengaturanInstansi) => {
    setPengaturanMap((prev) => {
      const updated = {
        ...prev,
        [targetId]: newSettings,
      };
      saveAllPengaturanMap(updated);
      savePengaturanToFirestore(targetId, newSettings).catch((err) => {
        console.warn('Firestore settings sync notice:', err);
      });
      return updated;
    });
  };

  const handleApplyPengaturanToAll = (newSettings: PengaturanInstansi) => {
    setPengaturanMap((prev) => {
      const updated: Record<string, PengaturanInstansi> = {
        ...prev,
        default: newSettings,
      };
      pegawaiList.forEach((p) => {
        updated[p.id] = { ...newSettings };
      });
      saveAllPengaturanMap(updated);
      syncAllPengaturanMapToFirestore(updated).catch((err) => {
        console.warn('Firestore settings batch sync notice:', err);
      });
      return updated;
    });
  };

  const handleSaveGlobalCopyright = async (patch: {
    teksCopyright: string;
    tampilkanCopyrightDiFooter: boolean;
    namaInstansi?: string;
  }) => {
    const baseDefault = pengaturanMap['default'] || INITIAL_PENGATURAN;
    const updatedDefault: PengaturanInstansi = {
      ...baseDefault,
      teksCopyright: patch.teksCopyright,
      tampilkanCopyrightDiFooter: patch.tampilkanCopyrightDiFooter,
      ...(patch.namaInstansi && patch.namaInstansi.trim()
        ? { namaInstansi: patch.namaInstansi.trim() }
        : {}),
    };
    setPengaturanMap((prev) => {
      const updatedMap = {
        ...prev,
        default: updatedDefault,
      };
      saveAllPengaturanMap(updatedMap);
      return updatedMap;
    });
    await savePengaturanToFirestore('default', updatedDefault);
  };

  const handleSaveThemeColors = async (patch: {
    warnaBgAplikasi: string;
    warnaBgLogin: string;
    warnaAksenLogin: string;
  }) => {
    const baseDefault = pengaturanMap['default'] || INITIAL_PENGATURAN;
    const updatedDefault: PengaturanInstansi = {
      ...baseDefault,
      warnaBgAplikasi: patch.warnaBgAplikasi,
      warnaBgLogin: patch.warnaBgLogin,
      warnaAksenLogin: patch.warnaAksenLogin,
    };
    setPengaturanMap((prev) => {
      const updatedMap = {
        ...prev,
        default: updatedDefault,
      };
      saveAllPengaturanMap(updatedMap);
      return updatedMap;
    });
    await savePengaturanToFirestore('default', updatedDefault);
  };

  // Guard:
  // - Super Admin: Mempunyai hak akses ke semua jurnal (monitoring, jurnal harian/mingguan/bulanan, rekapitulasi, cetak, profil, tambah user)
  // - Atasan: Mempunyai akses verifikasi, monitoring, serta jurnal harian/mingguan/bulanan dan cetak
  // - Non-Atasan & Non-SuperAdmin: Tidak dapat membuka 'verifikasi' dan 'monitoring'
  useEffect(() => {
    if (currentPegawai.role === 'atasan') {
      const allowedForAtasan = [
        'dashboard',
        'verifikasi',
        'monitoring',
        'pengingat',
        'jurnal',
        'jurnal-harian',
        'jurnal-mingguan',
        'jurnal-bulanan',
        'rekapitulasi',
        'cetak',
        'profil',
        'pengaturan'
      ];
      if (!allowedForAtasan.includes(activeTab)) {
        setActiveTab('verifikasi');
      }
    } else if (currentPegawai.role === 'superadmin') {
      if (activeTab === 'verifikasi' || activeTab === 'pengaturan') {
        setActiveTab('monitoring');
      }
    } else if (currentPegawai.role === 'admin') {
      if (
        activeTab === 'verifikasi' ||
        activeTab === 'monitoring' ||
        activeTab === 'tambah-user' ||
        activeTab === 'pengaturan-copyright' ||
        activeTab === 'pengaturan-warna'
      ) {
        setActiveTab('jurnal-harian');
      }
    } else {
      if (
        activeTab === 'verifikasi' ||
        activeTab === 'monitoring' ||
        activeTab === 'daftar-pegawai' ||
        activeTab === 'tambah-user' ||
        activeTab === 'pengaturan-copyright' ||
        activeTab === 'pengaturan-warna'
      ) {
        setActiveTab('jurnal-harian');
      }
    }
  }, [currentPegawai.role, activeTab]);

  // Role / User Switcher handler
  const handleSelectPegawai = (peg: Pegawai) => {
    setCurrentUserId(peg.id);
    setSelectedPegawaiId(peg.id);
    setAuthUser(peg);
    saveAuthUser(peg);
    if (peg.role === 'superadmin') {
      setActiveTab('monitoring');
    } else if (peg.role === 'atasan') {
      setActiveTab('verifikasi');
    } else if (activeTab === 'verifikasi' || activeTab === 'monitoring') {
      setActiveTab('jurnal');
    }
  };

  // Auth Handlers
  const handleLogin = (user: Pegawai) => {
    setAuthUser(user);
    saveAuthUser(user);
    setCurrentUserId(user.id);
    setSelectedPegawaiId(user.id);
    if (user.role === 'superadmin') {
      setActiveTab('monitoring');
    } else if (user.role === 'atasan') {
      setActiveTab('verifikasi');
    } else {
      setActiveTab('jurnal');
    }
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
  };

  const handleLogout = () => {
    setAuthUser(null);
    saveAuthUser(null);
  };

  const handleUpdateProfile = (updatedData: Partial<Pegawai>) => {
    setPegawaiList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === currentPegawai.id) {
          return { ...p, ...updatedData };
        }
        return p;
      });
      savePegawai(updated);
      return updated;
    });

    const updatedUser = { ...currentPegawai, ...updatedData };
    savePegawaiToFirestore(updatedUser).catch((err) => {
      console.warn('Firestore profile update notice:', err);
    });

    setAuthUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      saveAuthUser(updated);
      return updated;
    });

    // Jika akun yang diupdate adalah Atasan, sinkronkan data penilai ke pengaturan instansi
    if (currentPegawai.role === 'atasan') {
      const atasanSettingsPatch: Partial<PengaturanInstansi> = {};
      if (updatedData.nama) atasanSettingsPatch.namaAtasan = updatedData.nama;
      if (updatedData.nip) atasanSettingsPatch.nipAtasan = updatedData.nip;
      if (updatedData.jabatan) atasanSettingsPatch.jabatanAtasan = updatedData.jabatan;
      if (updatedData.pangkatGolongan) atasanSettingsPatch.pangkatAtasan = updatedData.pangkatGolongan;
      if (Object.keys(atasanSettingsPatch).length > 0) {
        handleSaveAccountPengaturan(currentPegawai.id, { ...currentPengaturan, ...atasanSettingsPatch });
      }
    }
  };

  const handleUpdatePegawaiProfile = (pegId: string, updatedData: Partial<Pegawai>) => {
    setPegawaiList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === pegId) {
          return { ...p, ...updatedData };
        }
        return p;
      });
      savePegawai(updated);
      return updated;
    });

    const target = pegawaiList.find((p) => p.id === pegId);
    if (target) {
      savePegawaiToFirestore({ ...target, ...updatedData }).catch((err) => {
        console.warn('Firestore employee profile update notice:', err);
      });
    }

    if (authUser && authUser.id === pegId) {
      const updatedAuth = { ...authUser, ...updatedData };
      setAuthUser(updatedAuth);
      saveAuthUser(updatedAuth);
    }
  };

  const handleUpdateInstansiPengaturan = (pegId: string, updatedSettings: Partial<PengaturanInstansi>) => {
    setPengaturanMap((prev) => {
      const current = prev[pegId] || prev['default'] || INITIAL_PENGATURAN;
      const merged = { ...current, ...updatedSettings };
      const mergedDefault = { ...(prev['default'] || INITIAL_PENGATURAN), ...updatedSettings };
      const updatedMap = {
        ...prev,
        [pegId]: merged,
        ['default']: mergedDefault,
      };
      saveAllPengaturanMap(updatedMap);
      savePengaturanToFirestore(pegId, merged).catch((err) => {
        console.warn('Firestore settings sync notice:', err);
      });
      if (pegId !== 'default') {
        savePengaturanToFirestore('default', mergedDefault).catch((err) => {
          console.warn('Firestore default settings sync notice:', err);
        });
      }
      return updatedMap;
    });
  };

  // CRUD Kegiatan Jurnal
  const handleSaveKegiatan = (
    data: Omit<KegiatanJurnal, 'id' | 'statusValidasi'>,
    editId?: string
  ) => {
    // Automatically switch view to the month and year of the saved item so user immediately sees it!
    if (data.tanggal) {
      const [y, m] = data.tanggal.split('-');
      if (y && m) {
        setSelectedTahun(parseInt(y, 10));
        setSelectedBulan(parseInt(m, 10));
      }
    }

    if (editId) {
      const existing = kegiatanList.find((k) => k.id === editId);
      const updated: KegiatanJurnal = {
        ...(existing || { id: editId, statusValidasi: 'Menunggu' as const, pegawaiId: targetPegawai.id }),
        ...data,
      };
      setKegiatanList((prev) =>
        prev.map((item) => (item.id === editId ? updated : item))
      );
      saveKegiatanToFirestore(updated).catch((err) => {
        console.warn('Firestore kegiatan sync notice:', err);
      });
    } else {
      const newKegiatan: KegiatanJurnal = {
        id: `keg-${Date.now()}`,
        ...data,
        statusValidasi: 'Menunggu',
      };
      setKegiatanList((prev) => [newKegiatan, ...prev]);
      saveKegiatanToFirestore(newKegiatan).catch((err) => {
        console.warn('Firestore kegiatan new sync notice:', err);
      });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }

    // Automatically mark any pending reminders for this pegawai + tanggal as resolved
    if (data.pegawaiId && data.tanggal) {
      setPengingatList((prev) =>
        prev.map((pg) => {
          if (
            pg.pegawaiId === data.pegawaiId &&
            pg.tanggalTarget === data.tanggal &&
            pg.status !== 'resolved'
          ) {
            const resolvedItem: PengingatJurnal = {
              ...pg,
              status: 'resolved',
              readAt: pg.readAt || new Date().toISOString(),
            };
            savePengingatToFirestore(resolvedItem).catch(() => {});
            return resolvedItem;
          }
          return pg;
        })
      );
    }
  };

  const handleEditKegiatan = (keg: KegiatanJurnal) => {
    setEditingKegiatan(keg);
    setIsJurnalModalOpen(true);
  };

  const handleDeleteKegiatan = (id: string) => {
    setKegiatanList((prev) => prev.filter((k) => k.id !== id));
    deleteKegiatanFromFirestore(id).catch((err) => {
      console.warn('Firestore delete notice:', err);
    });
  };

  const handleBatchDeleteKegiatan = (ids: string[]) => {
    setKegiatanList((prev) => prev.filter((k) => !ids.includes(k.id)));
    ids.forEach((id) => {
      deleteKegiatanFromFirestore(id).catch(() => {});
    });
  };

  // Presensi Handler
  const handleSavePresensi = (newRecord: PresensiRecord) => {
    setPresensiList((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === newRecord.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newRecord;
        return copy;
      }
      return [...prev, newRecord];
    });
    savePresensiToFirestore(newRecord).catch((err) => {
      console.warn('Firestore presensi sync notice:', err);
    });
  };

  // Verifikasi Atasan
  const handleApproveKegiatan = (id: string, catatan?: string) => {
    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    const targetItem = kegiatanList.find((k) => k.id === id);
    const staffPengaturan = targetItem ? getPengaturanFor(targetItem.pegawaiId) : targetPengaturan;
    const validatorNama = currentPegawai.role === 'atasan' ? currentPegawai.nama : (staffPengaturan.namaAtasan || currentPegawai.nama);
    const validatorNip = currentPegawai.role === 'atasan' ? currentPegawai.nip : (staffPengaturan.nipAtasan || currentPegawai.nip);

    if (targetItem) {
      const updated: KegiatanJurnal = {
        ...targetItem,
        statusValidasi: 'Disetujui',
        catatanAtasan: catatan || targetItem.catatanAtasan,
        tanggalValidasi: dateStr,
        namaValidator: validatorNama,
        nipValidator: validatorNip,
      };
      setKegiatanList((prev) =>
        prev.map((k) => (k.id === id ? updated : k))
      );
      saveKegiatanToFirestore(updated).catch(() => {});
    }
  };

  const handleRejectKegiatan = (id: string, catatan: string) => {
    const targetItem = kegiatanList.find((k) => k.id === id);
    if (targetItem) {
      const updated: KegiatanJurnal = {
        ...targetItem,
        statusValidasi: 'Ditolak',
        catatanAtasan: catatan,
      };
      setKegiatanList((prev) =>
        prev.map((k) => (k.id === id ? updated : k))
      );
      saveKegiatanToFirestore(updated).catch(() => {});
    }
  };

  const handleBatchApprove = (ids: string[]) => {
    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    const firstItem = kegiatanList.find((k) => ids.includes(k.id));
    const staffPengaturan = firstItem ? getPengaturanFor(firstItem.pegawaiId) : targetPengaturan;
    const validatorNama = currentPegawai.role === 'atasan' ? currentPegawai.nama : (staffPengaturan.namaAtasan || currentPegawai.nama);
    const validatorNip = currentPegawai.role === 'atasan' ? currentPegawai.nip : (staffPengaturan.nipAtasan || currentPegawai.nip);

    setKegiatanList((prev) =>
      prev.map((k) => {
        if (ids.includes(k.id)) {
          const updated: KegiatanJurnal = {
            ...k,
            statusValidasi: 'Disetujui',
            tanggalValidasi: dateStr,
            namaValidator: validatorNama,
            nipValidator: validatorNip,
          };
          saveKegiatanToFirestore(updated).catch(() => {});
          return updated;
        }
        return k;
      })
    );
  };

  // Reset to default
  const handleResetData = () => {
    resetAllData();
    window.location.reload();
  };

  // Permanent account deletion handlers
  const handleDeletePegawaiPermanently = (pegId: string) => {
    const updated = deletePegawaiPermanentlyFromStorage(pegId);
    setPegawaiList(updated);
    deletePegawaiFromFirestore(pegId).catch((err) => {
      console.warn('Firestore delete employee notice:', err);
    });
    setKegiatanList((prev) => prev.filter((k) => k.pegawaiId !== pegId));
    setPresensiList((prev) => prev.filter((pr) => pr.pegawaiId !== pegId));
    setPengingatList((prev) => prev.filter((pg) => pg.pegawaiId !== pegId));
    setPengaturanMap((prev) => {
      if (!prev[pegId]) return prev;
      const copy = { ...prev };
      delete copy[pegId];
      return copy;
    });
    if (selectedPegawaiId === pegId) {
      setSelectedPegawaiId(updated[0]?.id || currentPegawai.id);
    }
    if (authUser && authUser.id === pegId) {
      handleLogout();
    }
  };

  const handleBatchDeletePegawaiPermanently = (pegIds: string[]) => {
    const idSet = new Set(pegIds);
    const updated = deleteMultiplePegawaiPermanentlyFromStorage(pegIds);
    setPegawaiList(updated);
    deleteMultiplePegawaiFromFirestore(pegIds).catch((err) => {
      console.warn('Firestore batch delete employee notice:', err);
    });
    setKegiatanList((prev) => prev.filter((k) => !idSet.has(k.pegawaiId)));
    setPresensiList((prev) => prev.filter((pr) => !idSet.has(pr.pegawaiId)));
    setPengingatList((prev) => prev.filter((pg) => !idSet.has(pg.pegawaiId)));
    setPengaturanMap((prev) => {
      const copy = { ...prev };
      pegIds.forEach((id) => {
        if (copy[id]) delete copy[id];
      });
      return copy;
    });
    if (idSet.has(selectedPegawaiId)) {
      setSelectedPegawaiId(updated[0]?.id || currentPegawai.id);
    }
    if (authUser && idSet.has(authUser.id)) {
      handleLogout();
    }
  };

  const handlePurgeDemoAccounts = () => {
    const removedIds = pegawaiList.filter((p) => p.role !== 'superadmin').map((p) => p.id);
    const updated = purgeAllDemoAccountsFromStorage();
    setPegawaiList(updated);
    if (removedIds.length > 0) {
      markPegawaiDeletedInFirestore(removedIds).catch(() => {});
      deleteMultiplePegawaiFromFirestore(removedIds).catch((err) => {
        console.warn('Firestore purge sync notice:', err);
      });
    }
    const retainedIds = new Set(updated.map((p) => p.id));
    setKegiatanList((prev) => prev.filter((k) => retainedIds.has(k.pegawaiId)));
    setPresensiList((prev) => prev.filter((pr) => retainedIds.has(pr.pegawaiId)));
    setPengingatList((prev) => prev.filter((pg) => retainedIds.has(pg.pegawaiId)));
    setSelectedPegawaiId(updated[0]?.id || '');
    if (authUser && !retainedIds.has(authUser.id)) {
      handleLogout();
    }
  };

  // Pengingat Jurnal Handlers
  const handleSendPengingat = async (
    targets: Pegawai[],
    tanggalTarget: string,
    pesan: string,
    options?: { viaWhatsApp?: boolean }
  ): Promise<PengingatJurnal[]> => {
    const nowIso = new Date().toISOString();
    const baseTs = Date.now();
    const isWa = Boolean(options?.viaWhatsApp);
    const newItems: PengingatJurnal[] = targets.map((peg, idx) => ({
      id: `rem-${baseTs}-${idx}-${peg.id}`,
      pegawaiId: peg.id,
      pegawaiNama: peg.nama,
      pegawaiNip: peg.nip,
      tanggalTarget,
      pesan,
      pengirimId: currentPegawai.id,
      pengirimNama: currentPegawai.nama,
      pengirimJabatan: currentPegawai.jabatan,
      pengirimNoHp: currentPegawai.noHp || '',
      status: 'unread',
      viaWhatsApp: isWa,
      noHpTujuan: peg.noHp || '',
      ...(isWa ? { waSentAt: nowIso } : {}),
      createdAt: nowIso,
    }));

    setPengingatList((prev) => [...newItems, ...prev]);
    await saveMultiplePengingatToFirestore(newItems);
    return newItems;
  };

  const handleMarkPengingatWaSent = (pengingatId: string, noHpTujuan?: string) => {
    const nowIso = new Date().toISOString();
    setPengingatList((prev) =>
      prev.map((pg) => {
        if (pg.id === pengingatId) {
          const updated: PengingatJurnal = {
            ...pg,
            viaWhatsApp: true,
            waSentAt: nowIso,
            ...(noHpTujuan !== undefined ? { noHpTujuan } : {}),
          };
          savePengingatToFirestore(updated).catch(() => {});
          return updated;
        }
        return pg;
      })
    );
  };

  const handleUpdatePegawaiNoHp = (pegId: string, noHp: string) => {
    handleUpdatePegawaiProfile(pegId, { noHp: noHp.trim() });
  };

  const handleMarkPengingatRead = (pengingatId: string) => {
    const nowIso = new Date().toISOString();
    setPengingatList((prev) =>
      prev.map((pg) => {
        if (pg.id === pengingatId && pg.status === 'unread') {
          const updated: PengingatJurnal = { ...pg, status: 'read', readAt: nowIso };
          savePengingatToFirestore(updated).catch(() => {});
          return updated;
        }
        return pg;
      })
    );
  };

  const handleMarkAllPengingatRead = () => {
    const nowIso = new Date().toISOString();
    const toSync: PengingatJurnal[] = [];
    setPengingatList((prev) =>
      prev.map((pg) => {
        if (pg.pegawaiId === currentPegawai.id && pg.status === 'unread') {
          const updated: PengingatJurnal = { ...pg, status: 'read', readAt: nowIso };
          toSync.push(updated);
          return updated;
        }
        return pg;
      })
    );
    if (toSync.length > 0) {
      saveMultiplePengingatToFirestore(toSync).catch(() => {});
    }
  };

  const handleDeletePengingat = (pengingatId: string) => {
    setPengingatList((prev) => prev.filter((pg) => pg.id !== pengingatId));
    deletePengingatFromFirestore(pengingatId).catch((err) => {
      console.warn('Firestore delete pengingat notice:', err);
    });
  };

  const handleOpenJurnalForDate = (tanggalTarget: string) => {
    if (tanggalTarget) {
      const [y, m] = tanggalTarget.split('-');
      if (y && m) {
        setSelectedTahun(parseInt(y, 10));
        setSelectedBulan(parseInt(m, 10));
      }
    }
    setSelectedPegawaiId(currentPegawai.id);
    setActiveTab('jurnal-harian');
    setEditingKegiatan(null);
    setJurnalInitialTanggal(tanggalTarget);
    setIsJurnalModalOpen(true);
  };

  const handleAddPegawai = async (newPegawai: Pegawai) => {
    // 1. Add to local state & storage
    const updatedList = [...pegawaiList, newPegawai];
    setPegawaiList(updatedList);
    savePegawai(updatedList);

    // 2. Add individual pengaturan for new user
    setPengaturanMap((prev) => {
      const basePengaturan = prev['default'] || (currentPegawai ? prev[currentPegawai.id] : undefined) || INITIAL_PENGATURAN;
      const copy: Record<string, PengaturanInstansi> = {
        ...prev,
        [newPegawai.id]: {
          ...basePengaturan,
          bidangBagian: newPegawai.unitKerja || basePengaturan.bidangBagian,
        },
      };
      saveAllPengaturanMap(copy);
      syncAllPengaturanMapToFirestore(copy).catch(console.error);
      return copy;
    });

    // 3. Persist new account directly to Firebase Firestore
    try {
      await savePegawaiToFirestore(newPegawai);
    } catch (err) {
      console.error('Gagal menyimpan user akun baru ke Firestore:', err);
    }
  };

  const handleResetPassword = async (pegId: string, newPassword: string) => {
    // 1. Update state & localStorage
    setPegawaiList((prev) => {
      const updated = prev.map((p) => (p.id === pegId ? { ...p, password: newPassword } : p));
      savePegawai(updated);
      return updated;
    });

    // 2. Persist to Firestore
    const target = pegawaiList.find((p) => p.id === pegId);
    if (target) {
      try {
        await savePegawaiToFirestore({ ...target, password: newPassword });
      } catch (err) {
        console.warn('Gagal sinkron password baru ke Firestore:', err);
      }
    }
  };

  // Quick Draft saver from WordPress Dashboard widget
  const handleQuickDraft = async (kegiatan: string, outputHasil: string) => {
    const now = new Date();
    const hariArr = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hari = hariArr[now.getDay()];
    const yyyy = now.getFullYear();
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const tanggal = `${yyyy}-${mm}-${dd}`;

    setSelectedTahun(now.getFullYear());
    setSelectedBulan(now.getMonth() + 1);

    const existingToday = kegiatanList.filter(
      (k) => k.pegawaiId === currentPegawai.id && k.tanggal === tanggal
    );
    const nomorKegiatan = (existingToday.length + 1).toString().padStart(2, '0');

    const newKegiatan: KegiatanJurnal = {
      id: `keg-${Date.now()}`,
      pegawaiId: currentPegawai.id,
      tanggal,
      hari,
      nomorKegiatan,
      waktuMulai: '08:00',
      waktuSelesai: '09:00',
      kegiatan,
      outputHasil,
      statusValidasi: 'Menunggu',
    };

    setKegiatanList((prev) => [newKegiatan, ...prev]);
    saveKegiatanToFirestore(newKegiatan).catch((err) => {
      console.warn('Sync draft notice:', err);
    });
  };

  // Render Login Screen if no authenticated user session
  if (!authUser) {
    return (
      <LoginView
        allPegawai={pegawaiList}
        pengaturan={pengaturanMap['default'] || INITIAL_PENGATURAN}
        onLogin={handleLogin}
        onDeletePegawai={handleDeletePegawaiPermanently}
        onPurgeDemoAccounts={handlePurgeDemoAccounts}
        onResetPassword={handleResetPassword}
      />
    );
  }

  const appBgIsDark = isDarkColor(
    normalizeHexColor(pengaturanMap['default']?.warnaBgAplikasi, DEFAULT_APP_BG)
  );

  return (
    <div className="min-h-screen bg-[var(--app-bg,#f0f0f1)] font-sans antialiased transition-colors duration-200">
      
      {/* WordPress Admin Top Bar */}
      <WpAdminBar
        currentPegawai={currentPegawai}
        allPegawai={pegawaiList}
        pengaturan={currentPengaturan}
        pendingVerifikasiCount={pendingVerifikasiCount}
        unreadPengingatCount={unreadPengingatCount}
        onSelectPegawai={handleSelectPegawai}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenLaravelDocs={() => setIsLaravelDocsOpen(true)}
        onLogout={handleLogout}
        onNavigateToProfile={() => setActiveTab('profil')}
        onNavigateToTab={(tab) => {
          if (tab === 'cetak') {
            setIsPrintModalOpen(true);
          } else {
            setActiveTab(tab as NavTab);
          }
        }}
        onOpenAddKegiatan={() => {
          setEditingKegiatan(null);
          setIsJurnalModalOpen(true);
        }}
        onToggleSidebarMobile={() => setIsWpMobileSidebarOpen(!isWpMobileSidebarOpen)}
        isSidebarMobileOpen={isWpMobileSidebarOpen}
      />

      {/* WordPress Admin Left Sidebar */}
      <WpSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'cetak') {
            setIsPrintModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        pendingVerifikasiCount={pendingVerifikasiCount}
        unreadPengingatCount={unreadPengingatCount}
        userRole={currentPegawai.role}
        isCollapsed={isWpSidebarCollapsed}
        onToggleCollapse={() => setIsWpSidebarCollapsed(!isWpSidebarCollapsed)}
        isMobileOpen={isWpMobileSidebarOpen}
        onCloseMobile={() => setIsWpMobileSidebarOpen(false)}
        onOpenAddKegiatan={() => {
          setEditingKegiatan(null);
          setIsJurnalModalOpen(true);
        }}
      />

      {/* Main WordPress Content Area with Dynamic Sidebar Margin */}
      <div className={`transition-all duration-200 pt-8 min-h-screen flex flex-col justify-between ${
        isWpSidebarCollapsed ? 'md:pl-11' : 'md:pl-44'
      }`}>
        <main className="flex-1 w-full max-w-[1500px] p-2.5 sm:p-5 mx-auto">
          {/* Active Unread Reminder Banner for Recipient Account */}
          {unreadPengingatCount > 0 && activeTab !== 'pengingat' && (
            <div className="mb-4 bg-amber-50 border border-amber-300 border-l-4 border-l-[#d63638] rounded-lg p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-start space-x-2.5">
                <div className="p-2 bg-rose-100 text-[#d63638] rounded-lg shrink-0">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">
                    Anda memiliki {unreadPengingatCount} Pengingat Pengisian Jurnal!
                  </div>
                  <p className="text-slate-700 mt-0.5 line-clamp-2">
                    {myUnreadPengingat[0].pesan}
                  </p>
                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    <span>
                      Dari: <strong>{myUnreadPengingat[0].pengirimNama}</strong> &bull; Target Tanggal: <strong>{myUnreadPengingat[0].tanggalTarget}</strong>
                    </span>
                    {myUnreadPengingat[0].viaWhatsApp && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[10px]">
                        Dikirim via WhatsApp
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    handleMarkPengingatRead(myUnreadPengingat[0].id);
                    handleOpenJurnalForDate(myUnreadPengingat[0].tanggalTarget);
                  }}
                  className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold rounded shadow-xs cursor-pointer"
                >
                  Kerjakan Jurnal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pengingat')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-[#c3c4c7] text-xs font-semibold rounded cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <WpDashboardView
              currentPegawai={currentPegawai}
              allPegawai={pegawaiList}
              kegiatanList={kegiatanList}
              presensiList={presensiList}
              pengingatList={pengingatList}
              pengaturan={targetPengaturan}
              onNavigateToTab={(tab) => {
                if (tab === 'cetak') {
                  setIsPrintModalOpen(true);
                } else {
                  setActiveTab(tab as NavTab);
                }
              }}
              onAddQuickDraft={handleQuickDraft}
              onDeleteKegiatan={handleDeleteKegiatan}
              onOpenJurnalModal={() => {
                setEditingKegiatan(null);
                setIsJurnalModalOpen(true);
              }}
            />
          )}

          {(activeTab === 'jurnal' || activeTab === 'jurnal-harian' || activeTab === 'jurnal-mingguan' || activeTab === 'jurnal-bulanan') && (
          <JurnalHarianView
            currentPegawai={currentPegawai}
            allPegawai={pegawaiList}
            pengaturan={targetPengaturan}
            kegiatanList={kegiatanList}
            initialPeriodeMode={
              activeTab === 'jurnal-mingguan'
                ? 'mingguan'
                : activeTab === 'jurnal-bulanan'
                  ? 'bulanan'
                  : 'harian'
            }
            onAddKegiatan={() => {
              setEditingKegiatan(null);
              setIsJurnalModalOpen(true);
            }}
            onEditKegiatan={handleEditKegiatan}
            onDeleteKegiatan={handleDeleteKegiatan}
            onBatchDeleteKegiatan={handleBatchDeleteKegiatan}
            onOpenPrintModal={(mode, tgl) => {
              if (mode) setPrintModalMode(mode);
              if (tgl) setPrintModalTanggal(tgl);
              setIsPrintModalOpen(true);
            }}
            selectedBulan={selectedBulan}
            setSelectedBulan={setSelectedBulan}
            selectedTahun={selectedTahun}
            setSelectedTahun={setSelectedTahun}
            selectedPegawaiId={selectedPegawaiId}
            setSelectedPegawaiId={setSelectedPegawaiId}
            onNavigateToRekap={() => setActiveTab('rekapitulasi')}
            onUpdatePegawai={handleUpdatePegawaiProfile}
            onUpdatePengaturan={handleUpdateInstansiPengaturan}
          />
        )}

        {activeTab === 'verifikasi' && currentPegawai.role === 'atasan' && (
          <VerifikasiAtasanView
            currentPegawai={currentPegawai}
            allPegawai={pegawaiList}
            pengaturan={targetPengaturan}
            kegiatanList={kegiatanList}
            onApproveKegiatan={handleApproveKegiatan}
            onRejectKegiatan={handleRejectKegiatan}
            onBatchApprove={handleBatchApprove}
            selectedBulan={selectedBulan}
            selectedTahun={selectedTahun}
            onSwitchToAtasan={() => {
              const atasanUser = pegawaiList.find((p) => p.role === 'atasan');
              if (atasanUser) {
                handleSelectPegawai(atasanUser);
              }
            }}
            onGoToJurnal={() => setActiveTab('monitoring')}
            onGoToMonitoring={() => setActiveTab('monitoring')}
          />
        )}

        {activeTab === 'monitoring' && (currentPegawai.role === 'atasan' || currentPegawai.role === 'superadmin') && (
          <MonitoringPegawaiHarianView
            currentPegawai={currentPegawai}
            allPegawai={pegawaiList}
            kegiatanList={kegiatanList}
            presensiList={presensiList}
            pengaturan={currentPengaturan}
            onApproveKegiatan={handleApproveKegiatan}
            onRejectKegiatan={handleRejectKegiatan}
            onGoToVerifikasi={() => setActiveTab('verifikasi')}
            onOpenPrintForPegawai={(peg) => {
              setSelectedPegawaiId(peg.id);
              setIsPrintModalOpen(true);
            }}
          />
        )}

        {activeTab === 'rekapitulasi' && (
          <RekapitulasiView
            currentPegawai={currentPegawai}
            allPegawai={pegawaiList}
            pengaturan={targetPengaturan}
            kegiatanList={kegiatanList}
            presensiList={presensiList}
            selectedBulan={selectedBulan}
            setSelectedBulan={setSelectedBulan}
            selectedTahun={selectedTahun}
            setSelectedTahun={setSelectedTahun}
            selectedPegawaiId={selectedPegawaiId}
            setSelectedPegawaiId={setSelectedPegawaiId}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onNavigateToJurnal={() => setActiveTab('jurnal')}
          />
        )}

        {activeTab === 'pengaturan' && currentPegawai.role !== 'superadmin' && (
          <PengaturanAdminView
            pengaturanMap={pengaturanMap}
            currentPegawai={currentPegawai}
            onSaveAccountPengaturan={handleSaveAccountPengaturan}
            onApplyToAllAccounts={handleApplyPengaturanToAll}
            pengaturan={currentPengaturan}
            onSavePengaturan={(newSettings) => handleSaveAccountPengaturan(currentPegawai.id, newSettings)}
            pegawaiList={pegawaiList}
            onSavePegawaiList={(newList) => {
              setPegawaiList(newList);
              syncAllPegawaiToFirestore(newList).catch(() => {});
              setPengaturanMap((prev) => {
                let changed = false;
                const copy = { ...prev };
                newList.forEach((p) => {
                  if (!copy[p.id]) {
                    copy[p.id] = {
                      ...(copy['default'] || copy[currentPegawai.id] || INITIAL_PENGATURAN),
                      bidangBagian: p.unitKerja || (copy['default'] || INITIAL_PENGATURAN).bidangBagian,
                    };
                    changed = true;
                  }
                });
                if (changed) {
                  saveAllPengaturanMap(copy);
                  syncAllPengaturanMapToFirestore(copy).catch(() => {});
                  return copy;
                }
                return prev;
              });
              if (authUser) {
                const updatedSelf = newList.find((p) => p.id === authUser.id);
                if (updatedSelf) {
                  setAuthUser(updatedSelf);
                  saveAuthUser(updatedSelf);
                } else {
                  handleLogout();
                }
              }
            }}
            onResetData={handleResetData}
            isSuperAdmin={false}
            initialSelectedAccountId={currentPegawai.id}
            onGoToProfile={() => setActiveTab('profil')}
          />
        )}

        {activeTab === 'pengingat' && (
          <PengingatJurnalView
            currentPegawai={currentPegawai}
            allPegawai={pegawaiList}
            kegiatanList={kegiatanList}
            pengingatList={pengingatList}
            onSendPengingat={handleSendPengingat}
            onMarkPengingatWaSent={handleMarkPengingatWaSent}
            onUpdatePegawaiNoHp={handleUpdatePegawaiNoHp}
            onMarkAsRead={handleMarkPengingatRead}
            onMarkAllAsRead={handleMarkAllPengingatRead}
            onDeletePengingat={handleDeletePengingat}
            onOpenJurnalForDate={handleOpenJurnalForDate}
          />
        )}

        {activeTab === 'daftar-pegawai' && (currentPegawai.role === 'superadmin' || currentPegawai.role === 'admin') && (
          <DaftarPegawaiView
            currentPegawai={currentPegawai}
            allPegawai={pegawaiList}
            onUpdatePegawai={handleUpdatePegawaiProfile}
            onDeletePegawaiPermanently={handleDeletePegawaiPermanently}
            onBatchDeletePegawaiPermanently={handleBatchDeletePegawaiPermanently}
            onAddPegawai={handleAddPegawai}
          />
        )}

        {activeTab === 'tambah-user' && currentPegawai.role === 'superadmin' && (
          <TambahUserView
            allPegawai={pegawaiList}
            onAddPegawai={handleAddPegawai}
            onNavigateToAccounts={() => setActiveTab('daftar-pegawai')}
          />
        )}

        {activeTab === 'pengaturan-copyright' && currentPegawai.role === 'superadmin' && (
          <PengaturanCopyrightView
            defaultPengaturan={pengaturanMap['default'] || INITIAL_PENGATURAN}
            onSaveGlobalCopyright={handleSaveGlobalCopyright}
          />
        )}

        {activeTab === 'pengaturan-warna' && currentPegawai.role === 'superadmin' && (
          <PengaturanWarnaView
            defaultPengaturan={pengaturanMap['default'] || INITIAL_PENGATURAN}
            onSaveThemeColors={handleSaveThemeColors}
          />
        )}

        {activeTab === 'profil' && (
          <ProfilPenggunaView
            key={currentPegawai.id}
            currentPegawai={currentPegawai}
            pengaturan={currentPengaturan}
            onUpdateProfile={handleUpdateProfile}
            allPegawai={pegawaiList}
            kegiatanList={kegiatanList}
            onNavigateToTab={(tab) => setActiveTab(tab as NavTab)}
          />
        )}

        </main>

        {/* App Footer */}
        <footer
          className={`py-2.5 px-3 sm:px-6 text-xs border-t bg-[var(--app-bg,#f0f0f1)] flex flex-col sm:flex-row items-center justify-between gap-1.5 print:hidden transition-colors duration-200 ${
            appBgIsDark
              ? 'text-slate-300 border-white/15'
              : 'text-[#50575e] border-[#dcdcde]'
          }`}
        >
          <p>
            <span className={`font-semibold ${appBgIsDark ? 'text-white' : 'text-slate-700'}`}>
              {pengaturanMap['default']?.tampilkanCopyrightDiFooter &&
              pengaturanMap['default']?.teksCopyright?.trim()
                ? pengaturanMap['default'].teksCopyright.trim()
                : currentPengaturan.namaInstansi || 'E-Jurnal Kinerja'}
            </span>
          </p>
          <div className={`flex items-center space-x-3 text-[11px] ${appBgIsDark ? 'text-slate-300' : 'text-[#8c8f94]'}`}>
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`font-medium ${appBgIsDark ? 'text-slate-200' : 'text-slate-600'}`}>Firestore Realtime Aktif</span>
            </span>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setIsLaravelDocsOpen(true)}
              className={`${appBgIsDark ? 'text-sky-300' : 'text-[#2271b1]'} hover:underline`}
            >
              Dokumentasi API
            </button>
            <span>&bull;</span>
            <span>Versi 5.1.1</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <JurnalFormModal
        isOpen={isJurnalModalOpen}
        onClose={() => {
          setIsJurnalModalOpen(false);
          setEditingKegiatan(null);
          setJurnalInitialTanggal('');
        }}
        onSave={handleSaveKegiatan}
        onDelete={handleDeleteKegiatan}
        editingKegiatan={editingKegiatan}
        currentPegawai={targetPegawai}
        selectedBulan={selectedBulan}
        selectedTahun={selectedTahun}
        nextNomorKegiatan={nextNomorKegiatan}
        initialTanggal={jurnalInitialTanggal || undefined}
      />

      <PrintDocumentModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        pegawai={targetPegawai}
        pengaturan={targetPengaturan}
        kegiatanList={kegiatanList}
        bulan={selectedBulan}
        tahun={selectedTahun}
        allPegawai={pegawaiList}
        onSelectPegawaiId={setSelectedPegawaiId}
        initialPeriodeMode={printModalMode}
        initialTanggal={printModalTanggal}
      />

      <LaravelApiGuideModal
        isOpen={isLaravelDocsOpen}
        onClose={() => setIsLaravelDocsOpen(false)}
      />

      <HelpGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
}
