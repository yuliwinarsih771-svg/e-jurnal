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

import { Pegawai, PengaturanInstansi, KegiatanJurnal, PresensiRecord } from './types';
import { INITIAL_PENGATURAN } from './data/initialData';
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
  loadCurrentUserId,
  saveCurrentUserId,
  loadAuthUser,
  saveAuthUser,
  resetAllData,
  deletePegawaiPermanentlyFromStorage,
  purgeAllDemoAccountsFromStorage,
} from './utils/storage';
import {
  seedInitialDataIfFirestoreEmpty,
  subscribePegawaiFirestore,
  subscribeJurnalFirestore,
  subscribePresensiFirestore,
  subscribePengaturanFirestore,
  saveKegiatanToFirestore,
  deleteKegiatanFromFirestore,
  savePresensiToFirestore,
  savePengaturanToFirestore,
  syncAllPengaturanMapToFirestore,
  deletePegawaiFromFirestore,
  syncAllPegawaiToFirestore,
  savePegawaiToFirestore,
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
        if (res.seeded) {
          if (res.pegawai && res.pegawai.length > 0) setPegawaiList(res.pegawai);
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
    const unsubPegawai = subscribePegawaiFirestore((livePegawai) => {
      if (livePegawai.length > 0) setPegawaiList(livePegawai);
    });
    const unsubJurnal = subscribeJurnalFirestore((liveJurnal) => {
      setKegiatanList(liveJurnal);
    });
    const unsubPresensi = subscribePresensiFirestore((livePresensi) => {
      setPresensiList(livePresensi);
    });
    const unsubPengaturan = subscribePengaturanFirestore((liveMap) => {
      if (Object.keys(liveMap).length > 0) setPengaturanMap(liveMap);
    });

    return () => {
      isMounted = false;
      unsubPegawai();
      unsubJurnal();
      unsubPresensi();
      unsubPengaturan();
    };
  }, []);

  // Sync settings map with local storage as backup cache
  useEffect(() => {
    saveAllPengaturanMap(pengaturanMap);
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
    saveCurrentUserId(currentUserId);
  }, [currentUserId]);

  // Current active user
  const currentPegawai = useMemo(() => {
    return pegawaiList.find((p) => p.id === currentUserId) || pegawaiList[0];
  }, [pegawaiList, currentUserId]);

  // Pending count for superior verification badge
  const pendingVerifikasiCount = useMemo(() => {
    return kegiatanList.filter((k) => k.statusValidasi === 'Menunggu').length;
  }, [kegiatanList]);

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
    } else {
      if (activeTab === 'verifikasi' || activeTab === 'monitoring') {
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
    if (selectedPegawaiId === pegId) {
      setSelectedPegawaiId(updated[0]?.id || '');
    }
    if (authUser && authUser.id === pegId) {
      handleLogout();
    }
  };

  const handlePurgeDemoAccounts = () => {
    const updated = purgeAllDemoAccountsFromStorage();
    setPegawaiList(updated);
    syncAllPegawaiToFirestore(updated).catch((err) => {
      console.warn('Firestore purge sync notice:', err);
    });
    const retainedIds = new Set(updated.map((p) => p.id));
    setKegiatanList((prev) => prev.filter((k) => retainedIds.has(k.pegawaiId)));
    setSelectedPegawaiId(updated[0]?.id || '');
    if (authUser && !retainedIds.has(authUser.id)) {
      handleLogout();
    }
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

  return (
    <div className="min-h-screen bg-[#f0f0f1] font-sans antialiased">
      
      {/* WordPress Admin Top Bar */}
      <WpAdminBar
        currentPegawai={currentPegawai}
        allPegawai={pegawaiList}
        pengaturan={currentPengaturan}
        pendingVerifikasiCount={pendingVerifikasiCount}
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
          {activeTab === 'dashboard' && (
            <WpDashboardView
              currentPegawai={currentPegawai}
              allPegawai={pegawaiList}
              kegiatanList={kegiatanList}
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

        {activeTab === 'tambah-user' && currentPegawai.role === 'superadmin' && (
          <TambahUserView
            allPegawai={pegawaiList}
            onAddPegawai={handleAddPegawai}
            onNavigateToAccounts={() => setActiveTab('profil')}
          />
        )}

        {activeTab === 'profil' && (
          <ProfilPenggunaView
            currentPegawai={currentPegawai}
            pengaturan={currentPengaturan}
            onUpdateProfile={handleUpdateProfile}
            allPegawai={pegawaiList}
            kegiatanList={kegiatanList}
            onSwitchAccount={handleSelectPegawai}
            onNavigateToTab={(tab) => setActiveTab(tab as NavTab)}
          />
        )}

        </main>

        {/* WordPress Admin Footer */}
        <footer className="py-2.5 px-3 sm:px-6 text-xs text-[#50575e] border-t border-[#dcdcde] bg-[#f0f0f1] flex flex-col sm:flex-row items-center justify-between gap-1.5 print:hidden">
          <p>
            Terima kasih telah menggunakan <span className="text-[#2271b1] font-semibold">WordPress</span> &amp; <span className="font-semibold text-slate-700">{currentPengaturan.namaInstansi || 'E-Jurnal Kinerja'}</span>.
          </p>
          <div className="flex items-center space-x-3 text-[11px] text-[#8c8f94]">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600 font-medium">Firestore Realtime Aktif</span>
            </span>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setIsLaravelDocsOpen(true)}
              className="text-[#2271b1] hover:underline"
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
        }}
        onSave={handleSaveKegiatan}
        onDelete={handleDeleteKegiatan}
        editingKegiatan={editingKegiatan}
        currentPegawai={targetPegawai}
        selectedBulan={selectedBulan}
        selectedTahun={selectedTahun}
        nextNomorKegiatan={nextNomorKegiatan}
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
