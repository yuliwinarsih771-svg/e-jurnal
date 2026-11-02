import React from 'react';
import { X, BookOpen, CheckCircle, ShieldCheck, Printer, Settings, Calendar } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-6 h-6 text-blue-200" />
            <div>
              <h2 className="text-base font-bold">Panduan Penggunaan E-Jurnal Harian Pegawai</h2>
              <p className="text-xs text-blue-100">Sistem Pelaporan Kinerja, Presensi & Validasi Berstandar Resmi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-100 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
            <h4 className="font-bold text-blue-900 flex items-center space-x-1.5">
              <span>1. Format Standar Resmi Jurnal Harian</span>
            </h4>
            <p className="text-slate-600">
              Format tabel telah disesuaikan 100% dengan standar lembar kerja kepegawaian (sesuai contoh lampiran):
              <strong> No., Hari, Tanggal, Nomor Kegiatan, Waktu, Kegiatan / Pekerjaan (►), Keluaran/Hasil (Output/Outcome), dan Validasi Atasan Langsung (paraf)</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
            <h4 className="font-bold text-emerald-900 flex items-center space-x-1.5">
              <span>2. Pelaporan Tugas & Bukti Kegiatan Harian</span>
            </h4>
            <p className="text-slate-600">
              Pegawai dapat mencatat uraian pekerjaan harian secara terstruktur lengkap dengan alokasi waktu kerja, hasil/keluaran (output) nyata yang dicapai, dan tautan bukti dukung (*evidence*) kegiatan.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
            <h4 className="font-bold text-amber-900 flex items-center space-x-1.5">
              <span>3. Verifikasi Atasan Langsung & Paraf Elektronik</span>
            </h4>
            <p className="text-slate-600">
              Gunakan switcher akun di kanan atas untuk berpindah ke <strong>Atasan Langsung (Yoseph G. Taelin)</strong>. Atasan dapat meninjau uraian tugas staf, memberikan catatan arahan, menolak/minta revisi, serta membubuhkan paraf digital satu per satu atau secara massal (Batch Approve).
            </p>
          </div>

          <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 space-y-1">
            <h4 className="font-bold text-indigo-900 flex items-center space-x-1.5">
              <span>4. Ekspor Otomatis ke Excel, Word, & Cetak PDF</span>
            </h4>
            <p className="text-slate-600">
              - <strong>Excel (.xlsx)</strong>: File spreadsheet terstruktur siap diolah lebih lanjut.<br/>
              - <strong>Word (.doc)</strong>: Format dokumen resmi bertabel rapi yang langsung bisa diedit di Microsoft Word.<br/>
              - <strong>Cetak / PDF</strong>: Tampilan print preview kertas dinas dengan batas margin cetak resmi dan tanda tangan basah / barcode elektronik.
            </p>
          </div>

          <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
            <h4 className="font-bold text-purple-900 flex items-center space-x-1.5">
              <span>5. Dashboard Pengaturan Admin</span>
            </h4>
            <p className="text-slate-600">
              Admin dapat mengubah secara langsung nama instansi daerah, dinas/badan, nama & NIP pejabat penilai atasan langsung, jam operasional kantor, judul format dokumen, serta menambah/mengedit data pegawai.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
          >
            Mengerti
          </button>
        </div>

      </div>
    </div>
  );
};
