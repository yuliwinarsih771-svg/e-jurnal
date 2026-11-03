import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Pegawai, KegiatanJurnal, PresensiRecord, PengaturanInstansi } from '../types';
import { INITIAL_PEGAWAI, INITIAL_KEGIATAN, INITIAL_PRESENSI, INITIAL_PENGATURAN } from '../data/initialData';
import { loadPengaturanMap } from '../utils/storage';

export const COLLECTIONS = {
  PEGAWAI: 'pegawai',
  JURNAL: 'jurnal_harian',
  PRESENSI: 'presensi',
  PENGATURAN: 'pengaturan',
};

// -------------------------------------------------------------
// 1. PEGAWAI (Accounts & Master Data)
// -------------------------------------------------------------

export async function fetchPegawaiFromFirestore(): Promise<Pegawai[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PEGAWAI));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as Pegawai);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PEGAWAI);
  }
}

export function subscribePegawaiFirestore(
  onData: (list: Pegawai[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.PEGAWAI);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => d.data() as Pegawai);
        onData(list);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PEGAWAI);
    }
  );
}

/**
 * Recursively strips undefined values from objects so Firestore setDoc does not throw
 * "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = (typeof value === 'object' && value !== null) ? sanitizeForFirestore(value) : value;
      }
    }
    return cleaned as T;
  }
  return data;
}

export async function savePegawaiToFirestore(pegawai: Pegawai): Promise<void> {
  const docPath = `${COLLECTIONS.PEGAWAI}/${pegawai.id}`;
  try {
    const ref = doc(db, COLLECTIONS.PEGAWAI, pegawai.id);
    await setDoc(ref, sanitizeForFirestore(pegawai), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deletePegawaiFromFirestore(id: string): Promise<void> {
  const docPath = `${COLLECTIONS.PEGAWAI}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PEGAWAI, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function syncAllPegawaiToFirestore(list: Pegawai[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    list.forEach((p) => {
      const ref = doc(db, COLLECTIONS.PEGAWAI, p.id);
      batch.set(ref, sanitizeForFirestore(p), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PEGAWAI);
  }
}

// -------------------------------------------------------------
// 2. JURNAL HARIAN (Activities)
// -------------------------------------------------------------

export async function fetchJurnalFromFirestore(): Promise<KegiatanJurnal[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.JURNAL));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as KegiatanJurnal);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.JURNAL);
  }
}

export function subscribeJurnalFirestore(
  onData: (list: KegiatanJurnal[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.JURNAL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => d.data() as KegiatanJurnal);
        onData(list);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.JURNAL);
    }
  );
}

export async function saveKegiatanToFirestore(kegiatan: KegiatanJurnal): Promise<void> {
  const docPath = `${COLLECTIONS.JURNAL}/${kegiatan.id}`;
  try {
    const ref = doc(db, COLLECTIONS.JURNAL, kegiatan.id);
    await setDoc(ref, sanitizeForFirestore(kegiatan), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteKegiatanFromFirestore(id: string): Promise<void> {
  const docPath = `${COLLECTIONS.JURNAL}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.JURNAL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function syncAllKegiatanToFirestore(list: KegiatanJurnal[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    list.forEach((k) => {
      const ref = doc(db, COLLECTIONS.JURNAL, k.id);
      batch.set(ref, sanitizeForFirestore(k), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.JURNAL);
  }
}

// -------------------------------------------------------------
// 3. PRESENSI (Attendance)
// -------------------------------------------------------------

export async function fetchPresensiFromFirestore(): Promise<PresensiRecord[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PRESENSI));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as PresensiRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PRESENSI);
  }
}

export function subscribePresensiFirestore(
  onData: (list: PresensiRecord[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.PRESENSI);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => d.data() as PresensiRecord);
        onData(list);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PRESENSI);
    }
  );
}

export async function savePresensiToFirestore(item: PresensiRecord): Promise<void> {
  const docPath = `${COLLECTIONS.PRESENSI}/${item.id}`;
  try {
    const ref = doc(db, COLLECTIONS.PRESENSI, item.id);
    await setDoc(ref, sanitizeForFirestore(item), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function syncAllPresensiToFirestore(list: PresensiRecord[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    list.forEach((p) => {
      const ref = doc(db, COLLECTIONS.PRESENSI, p.id);
      batch.set(ref, sanitizeForFirestore(p), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PRESENSI);
  }
}

// -------------------------------------------------------------
// 4. PENGATURAN (Settings & Map)
// -------------------------------------------------------------

export async function fetchPengaturanMapFromFirestore(): Promise<Record<string, PengaturanInstansi>> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PENGATURAN));
    if (snap.empty) return {};
    const map: Record<string, PengaturanInstansi> = {};
    snap.docs.forEach((d) => {
      map[d.id] = d.data() as PengaturanInstansi;
    });
    return map;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PENGATURAN);
  }
}

export function subscribePengaturanFirestore(
  onData: (map: Record<string, PengaturanInstansi>) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.PENGATURAN);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const map: Record<string, PengaturanInstansi> = {};
        snapshot.docs.forEach((d) => {
          map[d.id] = d.data() as PengaturanInstansi;
        });
        onData(map);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PENGATURAN);
    }
  );
}

export async function savePengaturanToFirestore(accId: string, data: PengaturanInstansi): Promise<void> {
  const docPath = `${COLLECTIONS.PENGATURAN}/${accId}`;
  try {
    const ref = doc(db, COLLECTIONS.PENGATURAN, accId);
    await setDoc(ref, sanitizeForFirestore(data), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function syncAllPengaturanMapToFirestore(map: Record<string, PengaturanInstansi>): Promise<void> {
  try {
    const batch = writeBatch(db);
    Object.entries(map).forEach(([key, val]) => {
      const ref = doc(db, COLLECTIONS.PENGATURAN, key);
      batch.set(ref, sanitizeForFirestore(val), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PENGATURAN);
  }
}

// -------------------------------------------------------------
// 5. AUTO-SEED TO FIRESTORE ON FIRST LOAD
// -------------------------------------------------------------

export async function seedInitialDataIfFirestoreEmpty(): Promise<{
  seeded: boolean;
  pegawai: Pegawai[];
  kegiatan: KegiatanJurnal[];
  presensi: PresensiRecord[];
  pengaturanMap: Record<string, PengaturanInstansi>;
}> {
  try {
    // Check pegawai collection
    const pegawaiSnap = await getDocs(collection(db, COLLECTIONS.PEGAWAI));
    let currentPegawai: Pegawai[] = [];

    if (pegawaiSnap.empty) {
      console.log('Firestore: Seeding initial Pegawai to Firebase Firestore...');
      await syncAllPegawaiToFirestore(INITIAL_PEGAWAI);
      currentPegawai = INITIAL_PEGAWAI;
    } else {
      currentPegawai = pegawaiSnap.docs.map((d) => d.data() as Pegawai);
    }

    // Check jurnal collection
    const jurnalSnap = await getDocs(collection(db, COLLECTIONS.JURNAL));
    let currentKegiatan: KegiatanJurnal[] = [];

    if (jurnalSnap.empty) {
      console.log('Firestore: Seeding initial Kegiatan Jurnal to Firebase Firestore...');
      await syncAllKegiatanToFirestore(INITIAL_KEGIATAN);
      currentKegiatan = INITIAL_KEGIATAN;
    } else {
      currentKegiatan = jurnalSnap.docs.map((d) => d.data() as KegiatanJurnal);
    }

    // Check presensi collection
    const presensiSnap = await getDocs(collection(db, COLLECTIONS.PRESENSI));
    let currentPresensi: PresensiRecord[] = [];

    if (presensiSnap.empty) {
      console.log('Firestore: Seeding initial Presensi to Firebase Firestore...');
      await syncAllPresensiToFirestore(INITIAL_PRESENSI);
      currentPresensi = INITIAL_PRESENSI;
    } else {
      currentPresensi = presensiSnap.docs.map((d) => d.data() as PresensiRecord);
    }

    // Check pengaturan collection
    const pengaturanSnap = await getDocs(collection(db, COLLECTIONS.PENGATURAN));
    let currentPengaturanMap: Record<string, PengaturanInstansi> = {};

    if (pengaturanSnap.empty) {
      console.log('Firestore: Seeding initial Pengaturan to Firebase Firestore...');
      const defaultMap = loadPengaturanMap();
      await syncAllPengaturanMapToFirestore(defaultMap);
      currentPengaturanMap = defaultMap;
    } else {
      pengaturanSnap.docs.forEach((d) => {
        currentPengaturanMap[d.id] = d.data() as PengaturanInstansi;
      });
    }

    return {
      seeded: true,
      pegawai: currentPegawai,
      kegiatan: currentKegiatan,
      presensi: currentPresensi,
      pengaturanMap: currentPengaturanMap,
    };
  } catch (error) {
    console.warn('Firestore seeding check encountered an issue (will use local fallback):', error);
    return {
      seeded: false,
      pegawai: INITIAL_PEGAWAI,
      kegiatan: INITIAL_KEGIATAN,
      presensi: INITIAL_PRESENSI,
      pengaturanMap: loadPengaturanMap(),
    };
  }
}
