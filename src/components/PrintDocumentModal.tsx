import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Loader2,
  FileDown,
  Layout,
  Check
} from 'lucide-react';
import { Pegawai, PengaturanInstansi, KegiatanJurnal } from '../types';
import { 
  BULAN_INDONESIA, 
  formatTanggalIndonesia, 
  exportJurnalToExcel, 
  exportJurnalToWord,
  exportElementToPdf,
  exportJurnalHtmlToPdf,
  generateFullPrintHtml,
  printDocumentHtmlViaIframe
} from '../utils/exportUtils';
import { PRESET_LOGO_PEMDA } from '../utils/presetLogos';
import confetti from 'canvas-confetti';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pegawai: Pegawai;
  pengaturan: PengaturanInstansi;
  kegiatanList: KegiatanJurnal[];
  bulan: number;
  tahun: number;
  allPegawai?: Pegawai[];
  onSelectPegawaiId?: (id: string) => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  pegawai,
  pengaturan,
  kegiatanList,
  bulan,
  tahun,
  allPegawai,
  onSelectPegawaiId,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const bulanNama = BULAN_INDONESIA[bulan - 1] || 'Januari';
  const filtered = kegiatanList
    .filter(k => k.pegawaiId === pegawai.id)
    .filter(k => {
      const [y, m] = k.tanggal.split('-');
      return parseInt(y, 10) === tahun && parseInt(m, 10) === bulan;
    })
    .sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
      return a.waktuMulai.localeCompare(b.waktuMulai);
    });

  // Action: Print via isolated clean iframe or fallback to browser print
  const handlePrint = () => {
    try {
      setStatusMessage('Membuka dialog cetak printer/PDF...');
      const fullHtml = generateFullPrintHtml(pegawai, pengaturan, filtered, bulan, tahun);
      printDocumentHtmlViaIframe(fullHtml);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.warn('Fallback to standard window.print():', err);
      window.print();
    }
  };

  // Action: Direct high-resolution PDF download without oklch parsing errors
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setStatusMessage('Sedang menyusun dan mengunduh berkas PDF A4...');
      const cleanName = pegawai.nama.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Jurnal_Harian_${cleanName}_${bulanNama}_${tahun}.pdf`;
      
      // Use clean iframe sandbox export which is completely free of Tailwind oklch styles
      await exportJurnalHtmlToPdf(
        pegawai,
        pengaturan,
        filtered,
        bulan,
        tahun,
        fileName,
        orientation
      );
      
      confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
      setStatusMessage('Berkas PDF berhasil diunduh ke perangkat Anda!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Gagal membuat PDF langsung, beralih ke print dialog:', err);
      setStatusMessage('Membuka dialog cetak browser...');
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExcel = () => {
    exportJurnalToExcel(pegawai, pengaturan, filtered, bulan, tahun);
    setStatusMessage('Format Excel (.xlsx) berhasil diunduh!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleWord = () => {
    exportJurnalToWord(pegawai, pengaturan, filtered, bulan, tahun);
    setStatusMessage('Format Word (.doc) berhasil diunduh!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const today = new Date();
  const tanggalTtd = `${pengaturan.kotaPenetapan}, ${today.getDate()} ${bulanNama} ${tahun}`;

  return (
    <div 
      data-print-hide="false"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static"
    >
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div 
          data-print-hide="true"
          className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 print:hidden border-b border-slate-800"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Pratinjau Dokumen Resmi
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {bulanNama.toUpperCase()} {tahun}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                {pengaturan.judulDokumen} &bull; {pegawai.nama}
              </h2>
            </div>
            {allPegawai && allPegawai.length > 1 && onSelectPegawaiId && (
              <div className="sm:ml-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                  Pilih Pegawai
                </label>
                <select
                  value={pegawai.id}
                  onChange={(e) => onSelectPegawaiId(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {allPegawai.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.nama} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons: Orientation, Excel, Word, Download PDF, Print */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Orientation Toggle */}
            <div className="inline-flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
                  orientation === 'landscape'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Format Mendatar (Standar Format Dinas)"
              >
                <span>Landscape</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
                  orientation === 'portrait'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Format Tegak"
              >
                <span>Portrait</span>
              </button>
            </div>

            {/* Excel Button */}
            <button
              onClick={handleExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Unduh Format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            {/* Word Button */}
            <button
              onClick={handleWord}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Unduh Format Word (.doc)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>

            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer ${
                isGeneratingPdf ? 'opacity-75 cursor-wait' : ''
              }`}
              title="Unduh Dokumen Langsung Menjadi File PDF (.pdf)"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
            </button>

            {/* Print Dialog Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              title="Buka Dialog Cetak / Simpan PDF Browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition ml-1 cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Banner (if any) */}
        {statusMessage && (
          <div 
            data-print-hide="true"
            className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 text-xs text-blue-900 font-semibold flex items-center justify-between print:hidden"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-blue-500 hover:text-blue-800 text-[11px]"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Informational Guidance Banner */}
        <div 
          data-print-hide="true"
          className="bg-amber-50/70 border-b border-amber-200/80 px-6 py-2 text-[11px] text-amber-900 flex items-center justify-between print:hidden"
        >
          <div className="flex items-center space-x-1.5">
            <span className="font-bold">✓ Tombol Cetak & PDF Aktif:</span>
            <span>
              Klik <strong>Unduh PDF</strong> untuk menyimpan berkas file .pdf asli beresolusi tinggi, atau klik <strong>Cetak / Print</strong> untuk mencetak langsung ke kertas A4.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] text-amber-700 font-semibold">
            {filtered.length} Kegiatan Terdaftar
          </span>
        </div>

        {/* Paper Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printAreaRef}
            id="printable-document-content"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: "'Times New Roman', Times, serif",
              borderColor: '#cbd5e1',
            }}
            className={`text-xs leading-tight shadow-md border p-8 sm:p-12 print-clean-document transition-all ${
              orientation === 'landscape' ? 'w-full max-w-[1020px]' : 'w-full max-w-[760px]'
            }`}
          >
            {/* Kop Surat Instansi dengan Logo Resmi */}
            <div 
              style={{
                borderBottom: '3px double #000000',
                paddingBottom: '10px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ width: '80px', height: '75px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={pengaturan.logoUrl || PRESET_LOGO_PEMDA}
                  alt="Logo Instansi"
                  style={{ maxWidth: '75px', maxHeight: '75px', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div style={{ textAlign: 'center', flex: 1, paddingLeft: '12px', paddingRight: '12px' }}>
                <div style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {pengaturan.namaInstansi}
                </div>
                <div style={{ fontSize: '13pt', fontWeight: '900', textTransform: 'uppercase' }}>
                  {pengaturan.badanDinas}
                </div>
                {(pengaturan.bidangBagian || pegawai.unitKerja) && (
                  <div style={{ fontSize: '10.5pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {pengaturan.bidangBagian || pegawai.unitKerja}
                  </div>
                )}
                {pengaturan.alamat && (
                  <div style={{ fontSize: '8.5pt', fontStyle: 'italic', marginTop: '2px' }}>
                    {pengaturan.alamat}
                  </div>
                )}
              </div>
              <div style={{ width: '80px', flexShrink: 0 }} />
            </div>

            {/* Document Header */}
            <div className="text-center mb-6">
              <h1 className="text-base sm:text-lg font-bold tracking-wider uppercase">
                {pengaturan.judulDokumen}
              </h1>
              <p className="text-xs font-bold uppercase mt-0.5">
                BULAN {bulanNama.toUpperCase()} {tahun}
              </p>
            </div>

            {/* Pegawai Bio Block */}
            <div className="mb-4 text-xs font-bold leading-relaxed max-w-2xl">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-3">NAMA</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8 uppercase">{pegawai.nama}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-3">NIP</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8">{pegawai.nip}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-3">JABATAN</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8 uppercase">{pegawai.jabatan}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-3">UNIT KERJA</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8 uppercase">{pegawai.unitKerja}</span>
              </div>
              {pegawai.pangkatGolongan && (
                <div className="grid grid-cols-12 gap-1">
                  <span className="col-span-3">PANGKAT / GOL.</span>
                  <span className="col-span-1 text-center">:</span>
                  <span className="col-span-8">{pegawai.pangkatGolongan}</span>
                </div>
              )}
            </div>

            {/* Table (Official Government Format) */}
            <table className="w-full border-collapse border border-black text-[11px] leading-snug">
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }} className="border-b border-black text-center font-bold">
                  <th className="border border-black p-2 w-8">No.</th>
                  <th className="border border-black p-2 w-14">Hari</th>
                  <th className="border border-black p-2 w-20">Tanggal</th>
                  <th className="border border-black p-2 w-16">Nomor Kegiatan</th>
                  <th className="border border-black p-2 w-24">Waktu</th>
                  <th className="border border-black p-2 text-left">Kegiatan / Pekerjaan</th>
                  <th className="border border-black p-2 text-left">Keluaran/Hasil (Output/Outcome)</th>
                  <th className="border border-black p-2 w-28">Validasi Atasan Langsung (paraf)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ color: '#64748b' }} className="border border-black p-6 text-center italic">
                      Tidak ada kegiatan kerja tercatat pada periode bulan ini.
                    </td>
                  </tr>
                ) : (
                  filtered.map((keg, idx) => {
                    const isApproved = keg.statusValidasi === 'Disetujui';
                    return (
                      <tr key={keg.id} className="border-b border-black">
                        <td className="border border-black p-2 text-center align-top font-medium">
                          {idx + 1}.
                        </td>
                        <td className="border border-black p-2 text-center align-top">
                          {keg.hari}
                        </td>
                        <td className="border border-black p-2 text-center align-top whitespace-nowrap">
                          {formatTanggalIndonesia(keg.tanggal)}
                        </td>
                        <td className="border border-black p-2 text-center align-top font-bold">
                          {keg.nomorKegiatan || (idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="border border-black p-2 text-center align-top whitespace-nowrap">
                          {keg.waktuMulai} - {keg.waktuSelesai}
                        </td>
                        <td className="border border-black p-2 align-top text-left">
                          <span className="font-bold mr-1">►</span>
                          {keg.kegiatan}
                        </td>
                        <td className="border border-black p-2 align-top text-left">
                          {keg.outputHasil}
                        </td>
                        <td className="border border-black p-2 text-center align-middle">
                          {isApproved ? (
                            <div style={{ color: '#047857' }} className="text-[10px] font-bold leading-tight">
                              <span className="text-xs">&#10004;</span> Disetujui
                              <div style={{ color: '#475569' }} className="text-[8px] font-normal">
                                Paraf Elektronik
                              </div>
                            </div>
                          ) : keg.statusValidasi === 'Ditolak' ? (
                            <span style={{ color: '#b91c1c' }} className="text-[10px] font-bold">Ditolak</span>
                          ) : (
                            <span style={{ color: '#d97706' }} className="text-[10px] italic">Menunggu</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Total Aktivitas Banner */}
            <div style={{ backgroundColor: '#f8fafc' }} className="border border-black border-t-0 p-2 text-right font-bold text-xs flex items-center justify-between">
              <span>&nbsp;</span>
              <div className="flex items-center space-x-2">
                <span>TOTAL AKTIVITAS KERJA :</span>
                <span style={{ backgroundColor: '#ffffff' }} className="border border-black px-2 py-0.5 font-mono">
                  {filtered.length.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Official Signatures */}
            <table className="w-full mt-8 text-xs leading-normal border-none border-collapse">
              <tbody>
                {/* Row 1: Header / Jabatan */}
                <tr>
                  <td className="w-1/2 align-top pb-1 pr-4">
                    <p>Mengetahui :</p>
                    <p className="font-bold">{pengaturan.jabatanAtasan}</p>
                    <p style={{ color: '#1e293b' }}>{pengaturan.badanDinas}</p>
                  </td>
                  <td className="w-1/2 align-top pb-1 pl-8">
                    <p>{tanggalTtd}</p>
                    <p className="font-bold">Yang Membuat,</p>
                    <p className="invisible select-none text-[11px]">&nbsp;</p>
                  </td>
                </tr>

                {/* Row 2: Signature / Paraf Space */}
                <tr>
                  <td className="h-16 align-middle py-1 pr-4">
                    <div style={{ border: '1px dashed #94a3b8', color: '#475569' }} className="px-3 py-1 text-[9px] font-mono inline-block">
                      [ TERPARAF ELEKTRONIK ]
                    </div>
                  </td>
                  <td className="h-16 align-middle py-1 pl-8">
                    <span style={{ color: '#64748b' }} className="text-[10px] italic">
                      [ Tanda Tangan Pegawai ]
                    </span>
                  </td>
                </tr>

                {/* Row 3: Nama Lengkap */}
                <tr>
                  <td className="align-top pt-1 pr-4">
                    <p className="font-bold underline text-sm tracking-wide">{pengaturan.namaAtasan}</p>
                    <p className="mt-0.5">{pengaturan.pangkatAtasan}</p>
                    <p className="font-mono mt-0.5">NIP. {pengaturan.nipAtasan}</p>
                  </td>
                  <td className="align-top pt-1 pl-8">
                    <p className="font-bold underline text-sm tracking-wide">{pegawai.nama}</p>
                    <p className="mt-0.5">{pegawai.pangkatGolongan}</p>
                    <p className="font-mono mt-0.5">NIP. {pegawai.nip}</p>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>

      </div>
    </div>
  );
};
