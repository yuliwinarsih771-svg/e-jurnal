import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  Trash2,
  Paperclip,
  Plus,
  Link as LinkIcon,
  CheckSquare,
  Square,
  Image as ImageIcon
} from 'lucide-react';
import { KegiatanJurnal, Pegawai, LampiranBukti, SubAktivitas } from '../types';

interface JurnalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kegiatan: Omit<KegiatanJurnal, 'id' | 'statusValidasi'>, editId?: string) => void;
  onDelete?: (id: string) => void;
  editingKegiatan?: KegiatanJurnal | null;
  currentPegawai: Pegawai;
  selectedBulan?: number;
  selectedTahun?: number;
  nextNomorKegiatan: string;
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

const TEMPLATE_KEGIATAN = [
  {
    waktuMulai: '07:30',
    waktuSelesai: '08:00',
    kegiatan: 'Apel Awal Minggu / Apel Pagi',
    output: 'Mendapatkan informasi dan arahan dari pimpinan daerah',
  },
  {
    waktuMulai: '08:00',
    waktuSelesai: '10:00',
    kegiatan: 'Rapat Staf bersama Pimpinan dan Kepala Bidang',
    output: 'Mendapatkan informasi terkait kegiatan prioritas yang segera diselesaikan',
  },
  {
    waktuMulai: '10:00',
    waktuSelesai: '12:00',
    kegiatan: 'Melakukan verifikasi berkas usulan kenaikan pangkat / mutasi',
    output: 'Menghasilkan daftar berkas yang memenuhi syarat sesuai database BKN',
  },
  {
    waktuMulai: '13:00',
    waktuSelesai: '15:00',
    kegiatan: 'Melakukan pembaruan data pejabat pimpinan dan struktural di sistem kepegawaian',
    output: 'Memperoleh data kepegawaian yang up to date sesuai kebutuhan formasi',
  },
  {
    waktuMulai: '15:00',
    waktuSelesai: '16:30',
    kegiatan: 'Melayani urusan administrasi dan absen elektronik dari OPD',
    output: 'Mengatasi permasalahan teknis yang dialami unit kerja OPD',
  },
];

export const JurnalFormModal: React.FC<JurnalFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingKegiatan,
  currentPegawai,
  selectedBulan,
  selectedTahun,
  nextNomorKegiatan,
}) => {
  const [tanggal, setTanggal] = useState<string>('');
  const [hari, setHari] = useState<string>('Senin');
  const [nomorKegiatan, setNomorKegiatan] = useState<string>(nextNomorKegiatan);
  const [waktuMulai, setWaktuMulai] = useState<string>('08:00');
  const [waktuSelesai, setWaktuSelesai] = useState<string>('10:00');
  const [kegiatan, setKegiatan] = useState<string>('');
  const [outputHasil, setOutputHasil] = useState<string>('');
  const [tautanBukti, setTautanBukti] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // One-to-Many States: 1 Kegiatan has Many Lampiran & Many Sub-Aktivitas
  const [lampiranList, setLampiranList] = useState<LampiranBukti[]>([]);
  const [subAktivitasList, setSubAktivitasList] = useState<SubAktivitas[]>([]);
  const [inputLampiranJudul, setInputLampiranJudul] = useState('');
  const [inputLampiranUrl, setInputLampiranUrl] = useState('');
  const [inputLampiranTipe, setInputLampiranTipe] = useState<'link' | 'gambar' | 'dokumen'>('link');
  const [inputSubUraian, setInputSubUraian] = useState('');

  useEffect(() => {
    if (editingKegiatan) {
      setTanggal(editingKegiatan.tanggal);
      setHari(editingKegiatan.hari);
      setNomorKegiatan(editingKegiatan.nomorKegiatan);
      setWaktuMulai(editingKegiatan.waktuMulai);
      setWaktuSelesai(editingKegiatan.waktuSelesai);
      setKegiatan(editingKegiatan.kegiatan);
      setOutputHasil(editingKegiatan.outputHasil);
      setTautanBukti(editingKegiatan.tautanBukti || '');

      // Load existing One-to-Many relations or synthesize from legacy fields
      const existingLampiran = editingKegiatan.lampiranList && editingKegiatan.lampiranList.length > 0
        ? [...editingKegiatan.lampiranList]
        : editingKegiatan.tautanBukti
          ? [{
              id: `lamp-${Date.now()}`,
              kegiatanId: editingKegiatan.id,
              judul: 'Bukti Kinerja / SI-PINTER',
              url: editingKegiatan.tautanBukti,
              tipe: (editingKegiatan.tautanBukti.match(/\.(jpg|jpeg|png|webp)/i) ? 'gambar' : 'link') as 'link' | 'gambar',
              waktuDibuat: new Date().toISOString(),
            }]
          : [];
      setLampiranList(existingLampiran);
      setSubAktivitasList(editingKegiatan.subAktivitasList ? [...editingKegiatan.subAktivitasList] : []);
    } else {
      // Determine default date aligned with the selected month and year
      const m = (selectedBulan || 1).toString().padStart(2, '0');
      const y = selectedTahun || 2026;
      const initialDate = `${y}-${m}-12`;
      setTanggal(initialDate);
      updateHariFromDate(initialDate);
      setNomorKegiatan(nextNomorKegiatan || '01');
      setWaktuMulai('08:00');
      setWaktuSelesai('10:00');
      
      // Auto-prefill with standard government task so user can add immediately
      setKegiatan('Melakukan verifikasi dan pemrosesan berkas administrasi kepegawaian');
      setOutputHasil('Tersusunnya daftar berkas kepegawaian yang tervalidasi dan siap ditindaklanjuti');
      setTautanBukti('');
      setLampiranList([]);
      setSubAktivitasList([]);
    }
    setErrorMsg('');
    setInputLampiranJudul('');
    setInputLampiranUrl('');
    setInputSubUraian('');
  }, [editingKegiatan, isOpen, nextNomorKegiatan, selectedBulan, selectedTahun]);

  const updateHariFromDate = (dateVal: string) => {
    if (!dateVal) return;
    const parts = dateVal.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dayIndex = d.getDay();
      setHari(HARI_MAP[dayIndex] || 'Senin');
    }
  };

  const handleTanggalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTanggal(val);
    updateHariFromDate(val);
  };

  const handleApplyTemplate = (tmpl: typeof TEMPLATE_KEGIATAN[0]) => {
    setWaktuMulai(tmpl.waktuMulai);
    setWaktuSelesai(tmpl.waktuSelesai);
    setKegiatan(tmpl.kegiatan);
    setOutputHasil(tmpl.output);
    setErrorMsg('');
  };

  const handleAddLampiran = () => {
    if (!inputLampiranUrl.trim()) return;
    const newLamp: LampiranBukti = {
      id: `lamp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kegiatanId: editingKegiatan?.id || 'new',
      judul: inputLampiranJudul.trim() || 'Lampiran Bukti',
      url: inputLampiranUrl.trim(),
      tipe: inputLampiranTipe,
      waktuDibuat: new Date().toISOString(),
    };
    setLampiranList((prev) => [...prev, newLamp]);
    setInputLampiranJudul('');
    setInputLampiranUrl('');
  };

  const handleRemoveLampiran = (id: string) => {
    setLampiranList((prev) => prev.filter((l) => l.id !== id));
  };

  const handleAddSubAktivitas = () => {
    if (!inputSubUraian.trim()) return;
    const newSub: SubAktivitas = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kegiatanId: editingKegiatan?.id || 'new',
      uraian: inputSubUraian.trim(),
      status: 'Selesai',
    };
    setSubAktivitasList((prev) => [...prev, newSub]);
    setInputSubUraian('');
  };

  const handleRemoveSubAktivitas = (id: string) => {
    setSubAktivitasList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSubStatus = (id: string) => {
    setSubAktivitasList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'Selesai' ? 'Dalam Proses' : 'Selesai' } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalKegiatan = kegiatan.trim() || 'Melakukan tugas kedinasan harian dan pelayanan administrasi';
    const finalOutput = outputHasil.trim() || 'Terselesaikannya keluaran kerja harian sesuai penugasan';

    // Merge single tautanBukti into lampiranList if provided
    const combinedLampiran = [...lampiranList];
    if (tautanBukti.trim() && !combinedLampiran.some((l) => l.url === tautanBukti.trim())) {
      combinedLampiran.unshift({
        id: `lamp-${Date.now()}`,
        kegiatanId: editingKegiatan?.id || 'new',
        judul: 'Bukti Kinerja Utama',
        url: tautanBukti.trim(),
        tipe: 'link',
        waktuDibuat: new Date().toISOString(),
      });
    }

    onSave(
      {
        pegawaiId: currentPegawai.id,
        tanggal: tanggal || `${selectedTahun || 2026}-${(selectedBulan || 1).toString().padStart(2, '0')}-12`,
        hari: hari || 'Senin',
        nomorKegiatan: nomorKegiatan.trim() || nextNomorKegiatan || '01',
        waktuMulai: waktuMulai || '08:00',
        waktuSelesai: waktuSelesai || '10:00',
        kegiatan: finalKegiatan,
        outputHasil: finalOutput,
        tautanBukti: tautanBukti.trim() || (combinedLampiran[0]?.url) || undefined,
        lampiranList: combinedLampiran,
        subAktivitasList: subAktivitasList,
      },
      editingKegiatan?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-200 tracking-wider uppercase">
              Formulir E-Kinerja
            </span>
            <h2 className="text-lg font-bold">
              {editingKegiatan ? 'Edit Kegiatan Jurnal Harian' : 'Tambah Kegiatan Harian Baru'}
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              {currentPegawai.nama} — {currentPegawai.jabatan}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilih Cepat Contoh Kegiatan (Klik untuk Mengisi Otomatis):</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_KEGIATAN.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-lg text-slate-700 transition"
                >
                  {tmpl.waktuMulai}-{tmpl.waktuSelesai} {tmpl.kegiatan.split(' ')[0]} {tmpl.kegiatan.split(' ')[1] || ''}...
                </button>
              ))}
            </div>
          </div>

          {/* Grid: Tanggal, Hari, Nomor Kegiatan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Pelaksanaan *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={tanggal}
                  onChange={handleTanggalChange}
                  required
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hari
              </label>
              <input
                type="text"
                value={hari}
                readOnly
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Kegiatan *
              </label>
              <input
                type="text"
                value={nomorKegiatan}
                onChange={(e) => setNomorKegiatan(e.target.value)}
                placeholder="01"
                required
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Format 2 digit (contoh: 01, 02)</span>
            </div>
          </div>

          {/* Grid: Waktu Mulai & Waktu Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Waktu Mulai *
              </label>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="time"
                  value={waktuMulai}
                  onChange={(e) => setWaktuMulai(e.target.value)}
                  required
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Waktu Selesai *
              </label>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="time"
                  value={waktuSelesai}
                  onChange={(e) => setWaktuSelesai(e.target.value)}
                  required
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Kegiatan / Pekerjaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kegiatan / Pekerjaan *
            </label>
            <textarea
              rows={3}
              value={kegiatan}
              onChange={(e) => setKegiatan(e.target.value)}
              placeholder="Contoh: Melakukan perbaikan SK Penyetaraan Jabatan Fungsional atau Melakukan rapat koordinasi..."
              required
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-500">
              * Di tabel cetak otomatis akan diberi tanda panah (►) sesuai format resmi dinas.
            </span>
          </div>

          {/* Keluaran / Hasil (Output / Outcome) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keluaran / Hasil (Output / Outcome) *
            </label>
            <textarea
              rows={3}
              value={outputHasil}
              onChange={(e) => setOutputHasil(e.target.value)}
              placeholder="Contoh: Menghasilkan SK yang benar sesuai database PNS atau Memperoleh data kepegawaian yang valid..."
              required
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-500">
              Uraikan hasil nyata atau produk kerja yang didapatkan dari kegiatan di atas.
            </span>
          </div>

          {/* Tautan Bukti / Evidence */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tautan Bukti Dukung / Evidence SI-PINTER (Opsional)
            </label>
            <input
              type="text"
              value={tautanBukti}
              onChange={(e) => setTautanBukti(e.target.value)}
              placeholder="https://drive.google.com/... atau Dokumen No. SK..."
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* ONE-TO-MANY SECTION 1: Lampiran & Bukti Dukung (1 Kegiatan -> Banyak Bukti) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span>Lampiran & Bukti Dukung (Relasi One-to-Many)</span>
              </label>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {lampiranList.length} Bukti Terlampir
              </span>
            </div>

            {/* List of Lampiran */}
            {lampiranList.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {lampiranList.map((lamp, idx) => (
                  <div key={lamp.id || idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      {lamp.tipe === 'gambar' ? (
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <LinkIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                      <span className="font-bold text-slate-800 truncate">{lamp.judul}</span>
                      <a href={lamp.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline truncate max-w-[180px]">
                        {lamp.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLampiran(lamp.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Hapus Lampiran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Lampiran Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-200/80">
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={inputLampiranJudul}
                  onChange={(e) => setInputLampiranJudul(e.target.value)}
                  placeholder="Nama bukti (Foto/Laporan)"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={inputLampiranUrl}
                  onChange={(e) => setInputLampiranUrl(e.target.value)}
                  placeholder="URL link bukti (Google Drive dll)"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div className="sm:col-span-3 flex items-center gap-1.5">
                <select
                  value={inputLampiranTipe}
                  onChange={(e) => setInputLampiranTipe(e.target.value as any)}
                  className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="link">Tautan</option>
                  <option value="gambar">Gambar</option>
                  <option value="dokumen">Dokumen</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddLampiran}
                  disabled={!inputLampiranUrl.trim()}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center shrink-0 cursor-pointer"
                  title="Tambah Bukti ke Database"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ONE-TO-MANY SECTION 2: Rincian Sub-Aktivitas / Tahapan (1 Kegiatan -> Banyak Rincian) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Rincian Sub-Aktivitas / Tahapan Kerja (One-to-Many)</span>
              </label>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {subAktivitasList.filter(s => s.status === 'Selesai').length}/{subAktivitasList.length} Selesai
              </span>
            </div>

            {/* List of Sub-Aktivitas */}
            {subAktivitasList.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subAktivitasList.map((sub, idx) => (
                  <div key={sub.id || idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleSubStatus(sub.id)}
                      className="flex items-center space-x-2 text-left truncate cursor-pointer"
                    >
                      {sub.status === 'Selesai' ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={`font-semibold truncate ${sub.status === 'Selesai' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {sub.uraian}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubAktivitas(sub.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Hapus Rincian"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Sub-Aktivitas Input Row */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80">
              <input
                type="text"
                value={inputSubUraian}
                onChange={(e) => setInputSubUraian(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubAktivitas(); } }}
                placeholder="Tambah tahapan atau rincian tugas..."
                className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button
                type="button"
                onClick={handleAddSubAktivitas}
                disabled={!inputSubUraian.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer"
                title="Tambah Tahapan Sub-Aktivitas"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              {editingKegiatan && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(editingKegiatan.id);
                    onClose();
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 hover:border-red-600 rounded-xl transition flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Kegiatan</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{editingKegiatan ? 'Simpan Perubahan' : 'Tambahkan ke Jurnal'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
