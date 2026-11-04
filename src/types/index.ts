export type UserRole = 'pegawai' | 'atasan' | 'admin' | 'superadmin';

export type StatusPresensi = 'Hadir' | 'WFH' | 'Dinas Luar' | 'Izin' | 'Sakit' | 'Cuti';

export type StatusValidasi = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  username?: string;
  jabatan: string;
  unitKerja: string;
  pangkatGolongan: string;
  email: string;
  role: UserRole;
  password?: string;
  foto?: string;
  atasanId?: string;
  noHp?: string;
}

export interface KegiatanJurnal {
  id: string;
  pegawaiId: string;
  tanggal: string; // YYYY-MM-DD
  hari: string; // Senin, Selasa, dst.
  nomorKegiatan: string; // '01', '02', dst.
  waktuMulai: string; // '07:30'
  waktuSelesai: string; // '08:00'
  kegiatan: string;
  outputHasil: string;
  statusValidasi: StatusValidasi;
  catatanAtasan?: string;
  tanggalValidasi?: string;
  namaValidator?: string;
  nipValidator?: string;
  tautanBukti?: string;
}

export interface PresensiRecord {
  id: string;
  pegawaiId: string;
  tanggal: string; // YYYY-MM-DD
  hari: string;
  jamMasuk: string; // '07:25'
  jamPulang?: string; // '16:35'
  status: StatusPresensi;
  keterangan?: string;
  lokasi?: string;
  terlambatMenit: number;
  fotoBukti?: string;
}

export interface PengaturanInstansi {
  namaInstansi: string; // misal: PEMERINTAH KABUPATEN BELU
  badanDinas: string; // BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA DAERAH (BKPSDMD)
  bidangBagian: string; // BIDANG MUTASI & PROMOSI
  alamat: string;
  kotaPenetapan: string; // Atambua
  logoUrl?: string;
  judulDokumen: string; // JURNAL HARIAN
  subJudulDokumen?: string; // BULAN JANUARI 2023

  // Pejabat Penilai / Atasan
  namaAtasan: string; // Yoseph G. Taelin, S.STP
  nipAtasan: string; // 19901126 201206 1 002
  jabatanAtasan: string; // Kepala Bidang Mutasi dan Promosi BKPSDMD Kab. Belu
  pangkatAtasan: string; // Penata

  // Jam Operasional Kantor
  jamMasukNormal: string; // '07:30'
  jamPulangNormal: string; // '16:00'
  toleransiKeterlambatanMenit: number; // 15
}

export interface FilterKinerja {
  bulan: number; // 1-12
  tahun: number; // 2023, 2026, dst.
  pegawaiId: string;
  statusValidasi?: string;
}
