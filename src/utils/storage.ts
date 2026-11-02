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

export const loadPegawai = (): Pegawai[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PEGAWAI);
    if (raw) {
      const stored: Pegawai[] = JSON.parse(raw);
      // Ensure all stored pegawai have password and username properties
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

      const existingIds = new Set(normalized.map((p) => p.id));
      const missing = INITIAL_PEGAWAI.filter((p) => !existingIds.has(p.id));
      if (missing.length > 0 || modified) {
        const merged = [...normalized, ...missing];
        localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(merged));
        return merged;
      }
      return normalized;
    }
  } catch (e) {
    console.warn('Failed reading pegawai from storage', e);
  }
  return INITIAL_PEGAWAI;
};

export const savePegawai = (data: Pegawai[]): void => {
  localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(data));
};

export const loadKegiatan = (): KegiatanJurnal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KEGIATAN);
    if (raw) {
      const stored: KegiatanJurnal[] = JSON.parse(raw);
      const existingIds = new Set(stored.map(k => k.id));
      const missing = INITIAL_KEGIATAN.filter(k => !existingIds.has(k.id));
      if (missing.length > 0) {
        const merged = [...stored, ...missing];
        localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(merged));
        return merged;
      }
      return stored;
    }
  } catch (e) {
    console.warn('Failed reading kegiatan from storage', e);
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
};
