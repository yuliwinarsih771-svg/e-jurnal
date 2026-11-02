import { Pegawai, PengaturanInstansi, KegiatanJurnal, PresensiRecord } from '../types';
import { INITIAL_PENGATURAN, INITIAL_PEGAWAI, INITIAL_KEGIATAN, INITIAL_PRESENSI } from '../data/initialData';
import { PRESET_LOGO_PEMDA } from './presetLogos';

const STORAGE_KEYS = {
  PENGATURAN: 'ejurnal_pengaturan_v1',
  PENGATURAN_MAP: 'ejurnal_pengaturan_map_v2',
  PEGAWAI: 'ejurnal_pegawai_v1',
  KEGIATAN: 'ejurnal_kegiatan_v1',
  PRESENSI: 'ejurnal_presensi_v1',
  CURRENT_USER_ID: 'ejurnal_current_user_v1',
  AUTH_USER: 'ejurnal_auth_user_v1',
  HIDE_LOGIN_QUICK_LIST: 'ejurnal_hide_login_quick_list_v1',
};

export const loadPengaturan = (): PengaturanInstansi => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENGATURAN);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading settings from storage', e);
  }
  return INITIAL_PENGATURAN;
};

export const savePengaturan = (data: PengaturanInstansi): void => {
  localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(data));
};

export const loadPengaturanMap = (): Record<string, PengaturanInstansi> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENGATURAN_MAP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading pengaturan map from storage', e);
  }

  // Initial seed: build distinct settings map for default and each known pegawai
  const base = loadPengaturan();
  const initialMap: Record<string, PengaturanInstansi> = {
    default: { ...base },
  };

  INITIAL_PEGAWAI.forEach((p) => {
    let namaAtasan = base.namaAtasan;
    let nipAtasan = base.nipAtasan;
    let jabatanAtasan = base.jabatanAtasan;
    let pangkatAtasan = base.pangkatAtasan;

    if (p.atasanId) {
      const atasanPeg = INITIAL_PEGAWAI.find((a) => a.id === p.atasanId);
      if (atasanPeg) {
        namaAtasan = atasanPeg.nama;
        nipAtasan = atasanPeg.nip;
        jabatanAtasan = atasanPeg.jabatan;
        pangkatAtasan = atasanPeg.pangkatGolongan;
      }
    }

    initialMap[p.id] = {
      ...base,
      bidangBagian: p.unitKerja || base.bidangBagian,
      namaAtasan,
      nipAtasan,
      jabatanAtasan,
      pangkatAtasan,
    };
  });

  try {
    localStorage.setItem(STORAGE_KEYS.PENGATURAN_MAP, JSON.stringify(initialMap));
  } catch (e) {
    console.warn('Failed saving initial pengaturan map', e);
  }

  return initialMap;
};

export const saveAllPengaturanMap = (map: Record<string, PengaturanInstansi>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PENGATURAN_MAP, JSON.stringify(map));
    if (map['default']) {
      localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(map['default']));
    }
  } catch (e) {
    console.warn('Failed saving all pengaturan map', e);
  }
};

export const getPengaturanForUser = (
  userId: string,
  map: Record<string, PengaturanInstansi>
): PengaturanInstansi => {
  let settings: PengaturanInstansi;
  if (map && map[userId]) {
    settings = { ...map[userId] };
  } else if (map && map['default']) {
    settings = { ...map['default'] };
  } else {
    settings = { ...INITIAL_PENGATURAN };
  }

  // Synchronize logoUrl: ensure it is never empty and falls back to default
  if (!settings.logoUrl) {
    settings.logoUrl = map?.['default']?.logoUrl || INITIAL_PENGATURAN.logoUrl || PRESET_LOGO_PEMDA;
  }
  return settings;
};

export const loadHideLoginQuickList = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.HIDE_LOGIN_QUICK_LIST) === 'true';
  } catch {
    return false;
  }
};

export const saveHideLoginQuickList = (hidden: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HIDE_LOGIN_QUICK_LIST, hidden ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed saving hide login quick list', e);
  }
};

export const loadPegawai = (): Pegawai[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PEGAWAI);
    if (raw !== null) {
      const stored: Pegawai[] = JSON.parse(raw);
      if (Array.isArray(stored)) {
        // Normalize stored pegawai credentials without restoring deleted ones
        let modified = false;
        const normalized = stored.map((p) => {
          let changed = false;
          let password = p.password;
          if (!password) {
            password = p.role === 'superadmin' ? 'superadmin' : p.role === 'admin' ? 'admin' : '123';
            changed = true;
          }
          let username = p.username;
          if (!username) {
            const initMatch = INITIAL_PEGAWAI.find((ip) => ip.id === p.id || ip.nip === p.nip);
            if (initMatch?.username) {
              username = initMatch.username;
            } else if (p.email) {
              username = p.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            } else {
              username = (p.nama.split(/[\s,.]+/)[0] || 'user').toLowerCase();
            }
            changed = true;
          }
          if (changed) {
            modified = true;
            return {
              ...p,
              password,
              username,
            };
          }
          return p;
        });

        if (modified) {
          localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(normalized));
        }
        return normalized;
      }
    }
  } catch (e) {
    console.warn('Failed reading pegawai from storage', e);
  }

  // Only on initial setup if key was never created
  try {
    localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(INITIAL_PEGAWAI));
  } catch (e) {
    console.warn('Failed saving initial pegawai', e);
  }
  return INITIAL_PEGAWAI;
};

export const savePegawai = (data: Pegawai[]): void => {
  localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(data));
};

export const deletePegawaiPermanentlyFromStorage = (pegawaiId: string): Pegawai[] => {
  try {
    const currentList = loadPegawai();
    const updatedList = currentList.filter((p) => p.id !== pegawaiId);
    localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(updatedList));

    // Also clean up activities belonging to this employee
    const currentKegiatan = loadKegiatan();
    const updatedKegiatan = currentKegiatan.filter((k) => k.pegawaiId !== pegawaiId);
    localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(updatedKegiatan));

    // Clean up from pengaturan map if exists
    const mapRaw = localStorage.getItem(STORAGE_KEYS.PENGATURAN_MAP);
    if (mapRaw) {
      const map = JSON.parse(mapRaw);
      if (map && map[pegawaiId]) {
        delete map[pegawaiId];
        localStorage.setItem(STORAGE_KEYS.PENGATURAN_MAP, JSON.stringify(map));
      }
    }

    return updatedList;
  } catch (e) {
    console.warn('Failed deleting pegawai permanently', e);
    return [];
  }
};

export const purgeAllDemoAccountsFromStorage = (): Pegawai[] => {
  try {
    const currentList = loadPegawai();
    // Keep only superadmin or any user with role superadmin
    let retained = currentList.filter((p) => p.role === 'superadmin');
    
    // If no superadmin exists, ensure default superadmin is present
    if (retained.length === 0) {
      const superAdminDefault = INITIAL_PEGAWAI.find((p) => p.role === 'superadmin') || {
        id: 'peg-superadmin',
        nama: 'Super Administrator',
        nip: '19750101 200001 1 001',
        username: 'superadmin',
        jabatan: 'Super Administrator Sistem',
        unitKerja: 'BKPSDMD KAB. BELU',
        pangkatGolongan: 'Pembina Utama Muda (IV/c)',
        email: 'superadmin@belukab.go.id',
        password: 'superadmin',
        role: 'superadmin' as const,
      };
      retained = [superAdminDefault];
    }

    localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(retained));

    // Remove activities of non-retained accounts
    const currentKegiatan = loadKegiatan();
    const retainedIds = new Set(retained.map((p) => p.id));
    const updatedKegiatan = currentKegiatan.filter((k) => retainedIds.has(k.pegawaiId));
    localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(updatedKegiatan));

    return retained;
  } catch (e) {
    console.warn('Failed purging demo accounts', e);
    return [];
  }
};

export const loadKegiatan = (): KegiatanJurnal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KEGIATAN);
    if (raw !== null) {
      const stored: KegiatanJurnal[] = JSON.parse(raw);
      if (Array.isArray(stored)) {
        return stored;
      }
    }
  } catch (e) {
    console.warn('Failed reading kegiatan from storage', e);
  }

  // Only on initial setup if key was never created
  try {
    localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(INITIAL_KEGIATAN));
  } catch (e) {
    console.warn('Failed saving initial kegiatan', e);
  }
  return INITIAL_KEGIATAN;
};

export const saveKegiatan = (data: KegiatanJurnal[]): void => {
  localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(data));
};

export const loadPresensi = (): PresensiRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESENSI);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading presensi from storage', e);
  }
  return INITIAL_PRESENSI;
};

export const savePresensi = (data: PresensiRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.PRESENSI, JSON.stringify(data));
};

export const loadCurrentUserId = (): string => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'peg-01';
};

export const saveCurrentUserId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
};

export const loadAuthUser = (): Pegawai | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading auth user from storage', e);
  }
  return null;
};

export const saveAuthUser = (user: Pegawai | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }
};

export const resetAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PENGATURAN);
  localStorage.removeItem(STORAGE_KEYS.PENGATURAN_MAP);
  localStorage.removeItem(STORAGE_KEYS.PEGAWAI);
  localStorage.removeItem(STORAGE_KEYS.KEGIATAN);
  localStorage.removeItem(STORAGE_KEYS.PRESENSI);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(STORAGE_KEYS.HIDE_LOGIN_QUICK_LIST);
};
