import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Building2,
  User,
  ShieldCheck,
  Check,
  Sparkles,
  Save,
  Trash2,
  HelpCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { Pegawai, PengaturanInstansi } from '../types';
import { PRESET_LOGOS, PRESET_LOGO_PEMDA } from '../utils/presetLogos';
import confetti from 'canvas-confetti';

interface EditProfilJurnalModalProps {
  isOpen: boolean;
  onClose: () => void;
  pegawai: Pegawai;
  pengaturan: PengaturanInstansi;
  onSave: (updatedPegawai: Partial<Pegawai>, updatedPengaturan: Partial<PengaturanInstansi>) => void;
}

export const EditProfilJurnalModal: React.FC<EditProfilJurnalModalProps> = ({
  isOpen,
  onClose,
  pegawai,
  pengaturan,
  onSave,
}) => {
  // Logo state
  const [logoUrl, setLogoUrl] = useState<string>(pengaturan.logoUrl || PRESET_LOGO_PEMDA);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pegawai profile state
  const [nama, setNama] = useState(pegawai.nama || '');
  const [nip, setNip] = useState(pegawai.nip || '');
  const [jabatan, setJabatan] = useState(pegawai.jabatan || '');
  const [unitKerja, setUnitKerja] = useState(pegawai.unitKerja || '');
  const [pangkatGolongan, setPangkatGolongan] = useState(pegawai.pangkatGolongan || '');

  // Kop & Instansi state
  const [judulDokumen, setJudulDokumen] = useState(pengaturan.judulDokumen || 'JURNAL HARIAN');
  const [namaInstansi, setNamaInstansi] = useState(pengaturan.namaInstansi || 'PEMERINTAH KABUPATEN BELU');
  const [badanDinas, setBadanDinas] = useState(pengaturan.badanDinas || 'BADAN KEPEGAWAIAN DAN PENGEMBANGAN SDM DAERAH');
  const [bidangBagian, setBidangBagian] = useState(pengaturan.bidangBagian || '');
  const [alamat, setAlamat] = useState(pengaturan.alamat || '');
  const [kotaPenetapan, setKotaPenetapan] = useState(pengaturan.kotaPenetapan || 'Atambua');

  // Pejabat Penilai (Atasan Langsung)
  const [namaAtasan, setNamaAtasan] = useState(pengaturan.namaAtasan || '');
  const [nipAtasan, setNipAtasan] = useState(pengaturan.nipAtasan || '');
  const [jabatanAtasan, setJabatanAtasan] = useState(pengaturan.jabatanAtasan || '');

  // Active section tab
  const [activeTab, setActiveTab] = useState<'logo' | 'pegawai' | 'instansi' | 'atasan'>('logo');

  if (!isOpen) return null;

  // Handle local logo file upload
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file logo maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !nip.trim()) {
      alert('Nama dan NIP wajib diisi.');
      return;
    }

    const updatedPegawaiData: Partial<Pegawai> = {
      nama: nama.trim(),
      nip: nip.trim(),
      jabatan: jabatan.trim(),
      unitKerja: unitKerja.trim(),
      pangkatGolongan: pangkatGolongan.trim(),
    };

    const updatedPengaturanData: Partial<PengaturanInstansi> = {
      logoUrl: logoUrl.trim(),
      judulDokumen: judulDokumen.trim() || 'JURNAL HARIAN',
      namaInstansi: namaInstansi.trim(),
      badanDinas: badanDinas.trim(),
      bidangBagian: bidangBagian.trim() || unitKerja.trim(),
      alamat: alamat.trim(),
      kotaPenetapan: kotaPenetapan.trim(),
      namaAtasan: namaAtasan.trim(),
      nipAtasan: nipAtasan.trim(),
      jabatanAtasan: jabatanAtasan.trim(),
    };

    onSave(updatedPegawaiData, updatedPengaturanData);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-blue-500/30 text-blue-300 rounded border border-blue-400/30">
                  Menu Utama Jurnal
                </span>
                <span className="text-xs text-slate-400">Pengaturan Kop & Identitas</span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                Edit Profil Jurnal & Logo Instansi
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'logo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Logo Instansi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pegawai')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'pegawai'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil Pegawai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instansi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'instansi'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Kop & Instansi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('atasan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'atasan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Atasan Penilai</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: LOGO INSTANSI */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Logo Kop Surat / Dokumen Jurnal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logo ini akan ditampilkan pada kop lembar jurnal menu utama, pratinjau cetak dinas, serta ekspor PDF resmi.
                </p>
              </div>

              {/* Logo Preview Card */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl border-2 border-dashed border-slate-300 p-2 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Instansi" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                      <span className="text-[10px]">Tanpa Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Pratinjau Logo Aktif
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Mendukung format PNG, JPG, JPEG, SVG, atau WebP (transparan direkomendasikan).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Unggah Logo Baru</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 border border-red-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Logo</span>
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Preset Logos Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Atau Pilih Logo Resmi Siap Pakai:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_LOGOS.map((item) => {
                    const isSelected = logoUrl === item.dataUrl;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLogoUrl(item.dataUrl)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                          <img src={item.dataUrl} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.category}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* URL input alternative */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atau Masukkan Tautan URL Gambar Logo
                </label>
                <input
                  type="text"
                  value={logoUrl.startsWith('data:') ? '' : logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://contoh.go.id/logo.png"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFIL PEGAWAI */}
          {activeTab === 'pegawai' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Data Identitas Pegawai Jurnal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informasi pegawai yang tercantum pada kotak identitas dokumen jurnal harian.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="WELLY PRIYATNA, S.Kom"
                    required
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Induk Pegawai (NIP) *
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="19800513 200803 1 001"
                    required
                    className="w-full text-xs font-mono font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan *
                  </label>
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="ANALIS JABATAN AHLI MUDA"
                    required
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit Kerja *
                  </label>
                  <input
                    type="text"
                    value={unitKerja}
                    onChange={(e) => setUnitKerja(e.target.value)}
                    placeholder="BIDANG MUTASI & PROMOSI BKPSDMD KAB. BELU"
                    required
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pangkat & Golongan Ruang
                  </label>
                  <input
                    type="text"
                    value={pangkatGolongan}
                    onChange={(e) => setPangkatGolongan(e.target.value)}
                    placeholder="Penata (III/c)"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KOP & INSTANSI */}
          {activeTab === 'instansi' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pengaturan Kop Surat & Judul Dokumen
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teks kop instansi dan judul yang tercantum pada lembar resmi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Dokumen *
                  </label>
                  <input
                    type="text"
                    value={judulDokumen}
                    onChange={(e) => setJudulDokumen(e.target.value)}
                    placeholder="JURNAL HARIAN"
                    required
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">
                    Contoh: JURNAL HARIAN atau JURNAL HARIAN KEGIATAN GURU
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pemerintah / Instansi Utama *
                  </label>
                  <input
                    type="text"
                    value={namaInstansi}
                    onChange={(e) => setNamaInstansi(e.target.value)}
                    placeholder="PEMERINTAH KABUPATEN BELU"
                    required
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Badan / Dinas / Satuan Pendidikan *
                  </label>
                  <input
                    type="text"
                    value={badanDinas}
                    onChange={(e) => setBadanDinas(e.target.value)}
                    placeholder="BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA DAERAH"
                    required
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bidang / Bagian / Sekolah
                  </label>
                  <input
                    type="text"
                    value={bidangBagian}
                    onChange={(e) => setBidangBagian(e.target.value)}
                    placeholder="BIDANG MUTASI & PROMOSI"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kota / Kabupaten Penetapan Dokumen
                  </label>
                  <input
                    type="text"
                    value={kotaPenetapan}
                    onChange={(e) => setKotaPenetapan(e.target.value)}
                    placeholder="Atambua"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Kantor / Instansi
                  </label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Jl. Ahmad Yani No. 12, Atambua"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATASAN PENILAI */}
          {activeTab === 'atasan' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Data Pejabat Penilai / Atasan Langsung (Mengetahui)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nama dan NIP atasan yang menandatangani / mengetahui jurnal pegawai ini.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Atasan
                  </label>
                  <input
                    type="text"
                    value={namaAtasan}
                    onChange={(e) => setNamaAtasan(e.target.value)}
                    placeholder="Yoseph G. Taelin, S.STP"
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP Atasan Langsung
                  </label>
                  <input
                    type="text"
                    value={nipAtasan}
                    onChange={(e) => setNipAtasan(e.target.value)}
                    placeholder="19901126 201206 1 002"
                    className="w-full text-xs font-mono font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan Atasan Langsung
                  </label>
                  <input
                    type="text"
                    value={jabatanAtasan}
                    onChange={(e) => setJabatanAtasan(e.target.value)}
                    placeholder="Kepala Bidang Mutasi dan Promosi"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil & Logo Jurnal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
