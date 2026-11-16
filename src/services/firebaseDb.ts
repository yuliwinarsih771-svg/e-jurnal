import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Pegawai, KegiatanJurnal, PresensiRecord, PengaturanInstansi, PengingatJurnal } from '../types';
import { INITIAL_PEGAWAI, INITIAL_KEGIATAN, INITIAL_PRESENSI } from '../data/initialData';
import {
  loadPengaturanMap,
  loadDeletedPegawaiIds,
  saveDeletedPegawaiIds,
  setLocalSeedInitialized,
} from '../utils/storage';

export const COLLECTIONS = {
  PEGAWAI: 'pegawai',
  JURNAL: 'jurnal_harian',
  PRESENSI: 'presensi',
  PENGATURAN: 'pengaturan',
  PENGINGAT: 'pengingat_jurnal',
};

export const SYSTEM_META_DOC_ID = '_system_meta';

interface SystemMetaDoc {
  initialized: boolean;
  deletedPegawaiIds: string[];
  updatedAt: string;
}

// -------------------------------------------------------------
// 0. SYSTEM METADATA & PERMANENT DELETION TOMBSTONES
// -------------------------------------------------------------

export async function fetchSystemMetaFromFirestore(): Promise<SystemMetaDoc | null> {
  const docPath = `${COLLECTIONS.PENGATURAN}/${SYSTEM_META_DOC_ID}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.PENGATURAN, SYSTEM_META_DOC_ID));
    if (!snap.exists()) return null;
    const data = snap.data() as Partial<SystemMetaDoc>;
    return {
      initialized: Boolean(data.initialized),
      deletedPegawaiIds: Array.isArray(data.deletedPegawaiIds)
        ? data.deletedPegawaiIds.filter((x) => typeof x === 'string')
        : [],
      updatedAt: data.updatedAt || '',
    };
  } catch (error) {
    console.warn('Firestore system meta fetch notice:', error);
    return null;
  }
}

export async function markPegawaiDeletedInFirestore(pegIds: string[]): Promise<void> {
  if (pegIds.length === 0) return;
  const docPath = `${COLLECTIONS.PENGATURAN}/${SYSTEM_META_DOC_ID}`;
  try {
    const ref = doc(db, COLLECTIONS.PENGATURAN, SYSTEM_META_DOC_ID);
    await setDoc(
      ref,
      {
        initialized: true,
        deletedPegawaiIds: arrayUnion(...pegIds),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export function subscribeSystemMetaFirestore(
  onDeletedIdsUpdate: (deletedIds: string[]) => void
): () => void {
  const ref = doc(db, COLLECTIONS.PENGATURAN, SYSTEM_META_DOC_ID);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<SystemMetaDoc>;
        const ids = Array.isArray(data.deletedPegawaiIds)
          ? data.deletedPegawaiIds.filter((x) => typeof x === 'string')
          : [];
        onDeletedIdsUpdate(ids);
      }
    },
    (error) => {
      console.warn('Firestore system meta listener notice:', error);
    }
  );
}

// -------------------------------------------------------------
// 1. PEGAWAI (Accounts & Master Data)
// -------------------------------------------------------------

export async function fetchPegawaiFromFirestore(): Promise<Pegawai[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PEGAWAI));
    if (snap.empty) return [];
    const deletedSet = new Set(loadDeletedPegawaiIds());
    return snap.docs
      .map((d) => d.data() as Pegawai)
      .filter((p) => p && p.id && !deletedSet.has(p.id));
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
      const deletedSet = new Set(loadDeletedPegawaiIds());
      const list = snapshot.docs
        .map((d) => d.data() as Pegawai)
        .filter((p) => p && p.id && !deletedSet.has(p.id));
      onData(list);
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
    // 1. Record permanent deletion tombstone first so this account never returns on app update
    await markPegawaiDeletedInFirestore([id]);

    // 2. Delete main pegawai document
    await deleteDoc(doc(db, COLLECTIONS.PEGAWAI, id));

    // 3. Delete per-account pengaturan document
    await deleteDoc(doc(db, COLLECTIONS.PENGATURAN, id));

    // 4. Delete all jurnal_harian records belonging to this pegawai
    const jurnalQuery = query(collection(db, COLLECTIONS.JURNAL), where('pegawaiId', '==', id));
    const jurnalSnap = await getDocs(jurnalQuery);
    if (!jurnalSnap.empty) {
      const batch = writeBatch(db);
      jurnalSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 5. Delete all presensi records belonging to this pegawai (root & nested subcollection)
    const presensiQuery = query(collection(db, COLLECTIONS.PRESENSI), where('pegawaiId', '==', id));
    const presensiSnap = await getDocs(presensiQuery);
    if (!presensiSnap.empty) {
      const batch = writeBatch(db);
      presensiSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    const subPresensiSnap = await getDocs(collection(db, COLLECTIONS.PEGAWAI, id, COLLECTIONS.PRESENSI));
    if (!subPresensiSnap.empty) {
      const batch = writeBatch(db);
      subPresensiSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 6. Delete all pengingat_jurnal records belonging to this pegawai
    const pengingatQuery = query(collection(db, COLLECTIONS.PENGINGAT), where('pegawaiId', '==', id));
    const pengingatSnap = await getDocs(pengingatQuery);
    if (!pengingatSnap.empty) {
      const batch = writeBatch(db);
      pengingatSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function deleteMultiplePegawaiFromFirestore(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await markPegawaiDeletedInFirestore(ids);
    for (const id of ids) {
      await deletePegawaiFromFirestore(id);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.PEGAWAI);
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
      const list = snapshot.docs.map((d) => d.data() as KegiatanJurnal);
      onData(list);
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
    const cleanData = sanitizeForFirestore(kegiatan);
    const ref = doc(db, COLLECTIONS.JURNAL, kegiatan.id);
    await setDoc(ref, cleanData, { merge: true });
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
      const clean = sanitizeForFirestore(k);
      const ref = doc(db, COLLECTIONS.JURNAL, k.id);
      batch.set(ref, clean, { merge: true });
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
      const list = snapshot.docs.map((d) => d.data() as PresensiRecord);
      onData(list);
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
    const cleanData = sanitizeForFirestore(item);
    // 1. Root collection /presensi/{presensiId}
    const ref = doc(db, COLLECTIONS.PRESENSI, item.id);
    await setDoc(ref, cleanData, { merge: true });

    // 2. One-to-Many nested subcollection: /pegawai/{pegawaiId}/presensi/{presensiId}
    if (item.pegawaiId) {
      const subRef = doc(db, COLLECTIONS.PEGAWAI, item.pegawaiId, COLLECTIONS.PRESENSI, item.id);
      await setDoc(subRef, cleanData, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function syncAllPresensiToFirestore(list: PresensiRecord[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    list.forEach((p) => {
      const clean = sanitizeForFirestore(p);
      const ref = doc(db, COLLECTIONS.PRESENSI, p.id);
      batch.set(ref, clean, { merge: true });
      if (p.pegawaiId) {
        const subRef = doc(db, COLLECTIONS.PEGAWAI, p.pegawaiId, COLLECTIONS.PRESENSI, p.id);
        batch.set(subRef, clean, { merge: true });
      }
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
      if (d.id !== SYSTEM_META_DOC_ID) {
        map[d.id] = d.data() as PengaturanInstansi;
      }
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
      const map: Record<string, PengaturanInstansi> = {};
      snapshot.docs.forEach((d) => {
        if (d.id !== SYSTEM_META_DOC_ID) {
          map[d.id] = d.data() as PengaturanInstansi;
        }
      });
      if (Object.keys(map).length > 0) {
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
      if (key !== SYSTEM_META_DOC_ID) {
        const ref = doc(db, COLLECTIONS.PENGATURAN, key);
        batch.set(ref, sanitizeForFirestore(val), { merge: true });
      }
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PENGATURAN);
  }
}

// -------------------------------------------------------------
// 4B. PENGINGAT JURNAL (Reminders sent to accounts)
// -------------------------------------------------------------

export function subscribePengingatFirestore(
  onData: (list: PengingatJurnal[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.PENGINGAT);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const deletedSet = new Set(loadDeletedPegawaiIds());
      const list = snapshot.docs
        .map((d) => d.data() as PengingatJurnal)
        .filter((pg) => pg && pg.id && !deletedSet.has(pg.pegawaiId))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PENGINGAT);
    }
  );
}

export async function savePengingatToFirestore(item: PengingatJurnal): Promise<void> {
  const docPath = `${COLLECTIONS.PENGINGAT}/${item.id}`;
  try {
    const ref = doc(db, COLLECTIONS.PENGINGAT, item.id);
    await setDoc(ref, sanitizeForFirestore(item), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function saveMultiplePengingatToFirestore(items: PengingatJurnal[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const ref = doc(db, COLLECTIONS.PENGINGAT, item.id);
      batch.set(ref, sanitizeForFirestore(item), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PENGINGAT);
  }
}

export async function deletePengingatFromFirestore(id: string): Promise<void> {
  const docPath = `${COLLECTIONS.PENGINGAT}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PENGINGAT, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// -------------------------------------------------------------
// 5. AUTO-SEED TO FIRESTORE ON FIRST LOAD ONLY (RESPECTS DELETIONS)
// -------------------------------------------------------------

export async function seedInitialDataIfFirestoreEmpty(): Promise<{
  seeded: boolean;
  pegawai: Pegawai[];
  kegiatan: KegiatanJurnal[];
  presensi: PresensiRecord[];
  pengaturanMap: Record<string, PengaturanInstansi>;
  deletedPegawaiIds: string[];
}> {
  try {
    // 1. Read system meta tombstone doc & local deleted IDs
    const remoteMeta = await fetchSystemMetaFromFirestore();
    const localDeleted = loadDeletedPegawaiIds();
    const mergedDeleted = Array.from(
      new Set([...localDeleted, ...(remoteMeta?.deletedPegawaiIds || [])])
    );
    const deletedSet = new Set(mergedDeleted);
    saveDeletedPegawaiIds(mergedDeleted);

    // 2. Check pegawai collection
    const pegawaiSnap = await getDocs(collection(db, COLLECTIONS.PEGAWAI));
    const alreadyInitialized = Boolean(remoteMeta?.initialized) || !pegawaiSnap.empty;

    let currentPegawai: Pegawai[] = [];

    if (!alreadyInitialized) {
      // Brand new database: seed initial pegawai excluding any locally deleted IDs
      const initialToSeed = INITIAL_PEGAWAI.filter((p) => !deletedSet.has(p.id));
      if (initialToSeed.length > 0) {
        console.log('Firestore: First-time seeding initial Pegawai...');
        await syncAllPegawaiToFirestore(initialToSeed);
      }
      currentPegawai = initialToSeed;
    } else {
      // Already initialized: NEVER re-seed INITIAL_PEGAWAI!
      // Filter out any deleted IDs and clean up stray docs if they exist
      const docs = pegawaiSnap.docs.map((d) => d.data() as Pegawai);
      currentPegawai = docs.filter((p) => p && p.id && !deletedSet.has(p.id));

      const strayDeletedDocs = pegawaiSnap.docs.filter((d) => deletedSet.has(d.id));
      if (strayDeletedDocs.length > 0) {
        const batch = writeBatch(db);
        strayDeletedDocs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // Ensure _system_meta is saved & synced in Firestore
    setLocalSeedInitialized(true);
    if (!remoteMeta || !remoteMeta.initialized || mergedDeleted.length !== (remoteMeta.deletedPegawaiIds?.length || 0)) {
      await setDoc(
        doc(db, COLLECTIONS.PENGATURAN, SYSTEM_META_DOC_ID),
        {
          initialized: true,
          deletedPegawaiIds: mergedDeleted,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    // 3. Check jurnal collection (only seed if brand new database)
    const jurnalSnap = await getDocs(collection(db, COLLECTIONS.JURNAL));
    let currentKegiatan: KegiatanJurnal[] = [];

    if (!alreadyInitialized && jurnalSnap.empty) {
      const initialKegToSeed = INITIAL_KEGIATAN.filter((k) => !deletedSet.has(k.pegawaiId));
      if (initialKegToSeed.length > 0) {
        await syncAllKegiatanToFirestore(initialKegToSeed);
      }
      currentKegiatan = initialKegToSeed;
    } else {
      currentKegiatan = jurnalSnap.docs
        .map((d) => d.data() as KegiatanJurnal)
        .filter((k) => !deletedSet.has(k.pegawaiId));
    }

    // 4. Check presensi collection (only seed if brand new database)
    const presensiSnap = await getDocs(collection(db, COLLECTIONS.PRESENSI));
    let currentPresensi: PresensiRecord[] = [];

    if (!alreadyInitialized && presensiSnap.empty) {
      const initialPresToSeed = INITIAL_PRESENSI.filter((pr) => !deletedSet.has(pr.pegawaiId));
      if (initialPresToSeed.length > 0) {
        await syncAllPresensiToFirestore(initialPresToSeed);
      }
      currentPresensi = initialPresToSeed;
    } else {
      currentPresensi = presensiSnap.docs
        .map((d) => d.data() as PresensiRecord)
        .filter((pr) => !deletedSet.has(pr.pegawaiId));
    }

    // 5. Check pengaturan collection
    const pengaturanSnap = await getDocs(collection(db, COLLECTIONS.PENGATURAN));
    let currentPengaturanMap: Record<string, PengaturanInstansi> = {};
    const pengaturanDocs = pengaturanSnap.docs.filter((d) => d.id !== SYSTEM_META_DOC_ID);

    if (pengaturanDocs.length === 0) {
      const defaultMap = loadPengaturanMap();
      const filteredMap: Record<string, PengaturanInstansi> = {};
      Object.entries(defaultMap).forEach(([k, v]) => {
        if (!deletedSet.has(k)) {
          filteredMap[k] = v;
        }
      });
      await syncAllPengaturanMapToFirestore(filteredMap);
      currentPengaturanMap = filteredMap;
    } else {
      pengaturanDocs.forEach((d) => {
        if (!deletedSet.has(d.id)) {
          currentPengaturanMap[d.id] = d.data() as PengaturanInstansi;
        }
      });
    }

    return {
      seeded: true,
      pegawai: currentPegawai,
      kegiatan: currentKegiatan,
      presensi: currentPresensi,
      pengaturanMap: currentPengaturanMap,
      deletedPegawaiIds: mergedDeleted,
    };
  } catch (error) {
    console.warn('Firestore seeding check encountered an issue (will use local fallback):', error);
    const localDeleted = loadDeletedPegawaiIds();
    const deletedSet = new Set(localDeleted);
    return {
      seeded: false,
      pegawai: INITIAL_PEGAWAI.filter((p) => !deletedSet.has(p.id)),
      kegiatan: INITIAL_KEGIATAN.filter((k) => !deletedSet.has(k.pegawaiId)),
      presensi: INITIAL_PRESENSI.filter((pr) => !deletedSet.has(pr.pegawaiId)),
      pengaturanMap: loadPengaturanMap(),
      deletedPegawaiIds: localDeleted,
    };
  }
}
