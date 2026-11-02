import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  Check, 
  Info,
  CalendarCheck2,
  FileText
} from 'lucide-react';
import { Pegawai, PengaturanInstansi, PresensiRecord, StatusPresensi } from '../types';
import { BULAN_INDONESIA, formatTanggalIndonesia } from '../utils/exportUtils';
import confetti from 'canvas-confetti';

interface PresensiViewProps {
  currentPegawai: Pegawai;
  pengaturan: PengaturanInstansi;
  presensiList: PresensiRecord[];
  onSavePresensi: (presensi: PresensiRecord) => void;
  selectedBulan: number;
  selectedTahun: number;
}

const HARI_MAP: Record<number, string> = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

export const PresensiView: React.FC<PresensiViewProps> = ({
  currentPegawai,
  pengaturan,
  presensiList,
  onSavePresensi,
  selectedBulan,
  selectedTahun,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [statusDipilih, setStatusDipilih] = useState<StatusPresensi>('Hadir');
  const [keterangan, setKeterangan] = useState<string>('');
  const [lokasiGps, setLokasiGps] = useState<string>('Kantor BKPSDMD (Radius Valid - 15m)');
  const [notification, setNotification] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's record for this employee
  const todayRecord = presensiList.find(
    (p) => p.pegawaiId === currentPegawai.id && p.tanggal === todayStr
  );

  const handleCheckIn = () => {
    const now = new Date();
    const jamMasuk = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const hari = HARI_MAP[now.getDay()] || 'Senin';

    // Calculate late minutes
    const [normH, normM] = pengaturan.jamMasukNormal.split(':').map(Number);
    const targetMin = normH * 60 + normM + (pengaturan.toleransiKeterlambatanMenit || 0);
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const late = Math.max(0, currentMin - targetMin);

    const newPresensi: PresensiRecord = {
      id: todayRecord ? todayRecord.id : `pres-${Date.now()}`,
      pegawaiId: currentPegawai.id,
      tanggal: todayStr,
      hari,
      jamMasuk,
      jamPulang: todayRecord?.jamPulang,
      status: statusDipilih,
      keterangan: keterangan || (late > 0 ? `Terlambat ${late} menit` : 'Tepat Waktu'),
      lokasi: lokasiGps,
      terlambatMenit: late,
    };

    onSavePresensi(newPresensi);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setNotification('Presensi Masuk Berhasil Dicatat!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCheckOut = () => {
    if (!todayRecord) {
      alert('Harap lakukan presensi Masuk terlebih dahulu.');
      return;
    }
    const now = new Date();
    const jamPulang = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const updated: PresensiRecord = {
      ...todayRecord,
      jamPulang,
      keterangan: keterangan || todayRecord.keterangan || 'Selesai Jam Kerja',
    };

    onSavePresensi(updated);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setNotification('Presensi Pulang Berhasil Dicatat! Selamat Beristirahat.');
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter history for current month
  const riwayatBulanan = presensiList
    .filter((p) => p.pegawaiId === currentPegawai.id)
    .filter((p) => {
      const [y, m] = p.tanggal.split('-');
      return parseInt(y, 10) === selectedTahun && parseInt(m, 10) === selectedBulan;
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  // Summary counts
  const totalHadir = riwayatBulanan.filter(p => p.status === 'Hadir').length;
  const totalDL = riwayatBulanan.filter(p => p.status === 'Dinas Luar').length;
  const totalWFH = riwayatBulanan.filter(p => p.status === 'WFH').length;
  const totalIzinSakit = riwayatBulanan.filter(p => p.status === 'Izin' || p.status === 'Sakit' || p.status === 'Cuti').length;

  return (
    <div className="space-y-6">
      
      {/* Alert Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Grid: Live Check-in Console + Monthly Stat Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Live Attendance Action Box */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Presensi Elektronik Hari Ini
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {currentDateStr}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                {currentTime}
              </span>
            </div>
          </div>

          {/* Today Status Pill */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 font-medium">Status Kehadiran Anda Hari Ini:</div>
              <div className="flex items-center space-x-2 mt-1">
                {todayRecord ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sudah Masuk ({todayRecord.status})</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Belum Melakukan Presensi</span>
                  </span>
                )}
                {todayRecord?.jamPulang && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs">
                    Sudah Pulang ({todayRecord.jamPulang})
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
              <div>Jam Masuk Kantor: <strong className="text-slate-800">{pengaturan.jamMasukNormal} WITA</strong></div>
              <div>Jam Pulang Kantor: <strong className="text-slate-800">{pengaturan.jamPulangNormal} WITA</strong></div>
            </div>
          </div>

          {/* Status Selection Buttons */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Jenis Kehadiran:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['Hadir', 'WFH', 'Dinas Luar', 'Izin', 'Sakit', 'Cuti'] as StatusPresensi[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusDipilih(st)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition ${
                    statusDipilih === st
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Notes */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Titik Geotagging GPS</span>
              </label>
              <input
                type="text"
                value={lokasiGps}
                onChange={(e) => setLokasiGps(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keterangan / Alasan (Opsional)
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Mengikuti apel, rapat OPD, atau no. SPT..."
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Check-In / Check-Out Actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCheckIn}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{todayRecord ? 'Perbarui Presensi Masuk' : 'Presensi Masuk Sekarang'}</span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!todayRecord}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2 ${
                todayRecord
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>{todayRecord?.jamPulang ? 'Perbarui Jam Pulang' : 'Presensi Pulang'}</span>
            </button>
          </div>

        </div>

        {/* Monthly Summary Statistics */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <CalendarCheck2 className="w-4 h-4 text-blue-600" />
                <span>Rekap Kehadiran Bulan Ini</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-[11px] font-semibold text-emerald-700">Hadir Fisik</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{totalHadir} <span className="text-xs font-normal text-emerald-600">Hari</span></p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-[11px] font-semibold text-blue-700">Dinas Luar (DL)</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{totalDL} <span className="text-xs font-normal text-blue-600">Hari</span></p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <p className="text-[11px] font-semibold text-purple-700">WFH</p>
                <p className="text-2xl font-black text-purple-900 mt-1">{totalWFH} <span className="text-xs font-normal text-purple-600">Hari</span></p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[11px] font-semibold text-amber-700">Izin / Sakit / Cuti</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{totalIzinSakit} <span className="text-xs font-normal text-amber-600">Hari</span></p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center justify-between mb-1.5 font-semibold text-slate-700">
                <span>Persentase Kehadiran Efektif:</span>
                <span className="text-emerald-700 font-bold">
                  {riwayatBulanan.length > 0 ? Math.round(((totalHadir + totalDL + totalWFH) / riwayatBulanan.length) * 100) : 100}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ 
                    width: `${riwayatBulanan.length > 0 ? Math.round(((totalHadir + totalDL + totalWFH) / riwayatBulanan.length) * 100) : 100}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pegawai: <strong className="text-slate-800">{currentPegawai.nama.split(',')[0]}</strong></span>
            <span className="font-mono">NIP. {currentPegawai.nip}</span>
          </div>

        </div>

      </div>

      {/* Monthly Attendance Log Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Riwayat Log Presensi Bulan {BULAN_INDONESIA[selectedBulan - 1]} {selectedTahun}</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Total {riwayatBulanan.length} catatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-2.5 px-3 text-center w-12">No</th>
                <th className="py-2.5 px-3">Hari, Tanggal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Jam Masuk</th>
                <th className="py-2.5 px-3 text-center">Jam Pulang</th>
                <th className="py-2.5 px-3">Lokasi / GPS</th>
                <th className="py-2.5 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {riwayatBulanan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data presensi pada bulan ini.
                  </td>
                </tr>
              ) : (
                riwayatBulanan.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {rec.hari}, {formatTanggalIndonesia(rec.tanggal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        rec.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                        rec.status === 'Dinas Luar' ? 'bg-blue-100 text-blue-800' :
                        rec.status === 'WFH' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {rec.jamMasuk}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {rec.jamPulang || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[200px]" title={rec.lokasi}>
                      {rec.lokasi || 'Kantor Pusat'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      {rec.keterangan || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
