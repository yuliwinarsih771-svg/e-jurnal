import React, { useState } from 'react';
import { X, Database, Code2, Server, CheckCircle2, Copy, FileText } from 'lucide-react';

interface LaravelApiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaravelApiGuideModal: React.FC<LaravelApiGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'migration' | 'model' | 'controller' | 'routes'>('migration');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippets = {
    migration: `<?php
// database/migrations/2026_01_01_000000_create_ejurnal_tables.php
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void {
        // 1. Tabel Pegawai
        Schema::create('pegawai', function (Blueprint $table) {
            $table->id();
            $table->string('nip', 30)->unique();
            $table->string('nama', 150);
            $table->string('jabatan', 150);
            $table->string('unit_kerja', 200);
            $table->string('pangkat_golongan', 50)->nullable();
            $table->string('email', 100)->unique();
            $table->enum('role', ['pegawai', 'atasan', 'admin'])->default('pegawai');
            $table->foreignId('atasan_id')->nullable()->constrained('pegawai')->nullOnDelete();
            $table->timestamps();
        });

        // 2. Tabel Kegiatan Jurnal
        Schema::create('kegiatan_jurnal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('pegawai')->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('hari', 20);
            $table->string('nomor_kegiatan', 10);
            $table->time('waktu_mulai');
            $table->time('waktu_selesai');
            $table->text('kegiatan');
            $table->text('output_hasil');
            $table->enum('status_validasi', ['Menunggu', 'Disetujui', 'Ditolak'])->default('Menunggu');
            $table->text('catatan_atasan')->nullable();
            $table->timestamp('tanggal_validasi')->nullable();
            $table->foreignId('validator_id')->nullable()->constrained('pegawai')->nullOnDelete();
            $table->string('tautan_bukti', 255)->nullable();
            $table->timestamps();

            $table->index(['pegawai_id', 'tanggal']);
        });

        // 3. Tabel Presensi / Absensi
        Schema::create('presensi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('pegawai')->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('hari', 20);
            $table->time('jam_masuk');
            $table->time('jam_pulang')->nullable();
            $table->enum('status', ['Hadir', 'WFH', 'Dinas Luar', 'Izin', 'Sakit', 'Cuti'])->default('Hadir');
            $table->string('lokasi', 255)->nullable();
            $table->integer('terlambat_menit')->default(0);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->unique(['pegawai_id', 'tanggal']);
        });

        // 4. Tabel Pengaturan Instansi
        Schema::create('pengaturan_instansi', function (Blueprint $table) {
            $table->id();
            $table->string('nama_instansi');
            $table->string('badan_dinas');
            $table->string('bidang_bagian');
            $table->string('kota_penetapan');
            $table->string('judul_dokumen')->default('JURNAL HARIAN');
            $table->string('nama_atasan');
            $table->string('nip_atasan');
            $table->string('jabatan_atasan');
            $table->string('pangkat_atasan');
            $table->time('jam_masuk_normal')->default('07:30:00');
            $table->time('jam_pulang_normal')->default('16:00:00');
            $table->integer('toleransi_keterlambatan_menit')->default(15);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('pengaturan_instansi');
        Schema::dropIfExists('presensi');
        Schema::dropIfExists('kegiatan_jurnal');
        Schema::dropIfExists('pegawai');
    }
};`,
    model: `<?php
// app/Models/KegiatanJurnal.php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class KegiatanJurnal extends Model {
    protected $table = 'kegiatan_jurnal';

    protected $fillable = [
        'pegawai_id',
        'tanggal',
        'hari',
        'nomor_kegiatan',
        'waktu_mulai',
        'waktu_selesai',
        'kegiatan',
        'output_hasil',
        'status_validasi',
        'catatan_atasan',
        'tanggal_validasi',
        'validator_id',
        'tautan_bukti',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'tanggal_validasi' => 'datetime',
    ];

    public function pegawai(): BelongsTo {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function validator(): BelongsTo {
        return $this->belongsTo(Pegawai::class, 'validator_id');
    }
}`,
    controller: `<?php
// app/Http/Controllers/Api/JurnalController.php
namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\KegiatanJurnal;
use Illuminate\\Http\\Request;

class JurnalController extends Controller {
    // GET /api/jurnal?bulan=1&tahun=2026&pegawai_id=1
    public function index(Request $request) {
        $query = KegiatanJurnal::with('pegawai')
            ->whereMonth('tanggal', $request->query('bulan', now()->month))
            ->whereYear('tanggal', $request->query('tahun', now()->year));

        if ($request->has('pegawai_id')) {
            $query->where('pegawai_id', $request->query('pegawai_id'));
        }

        return response()->json($query->orderBy('tanggal')->get());
    }

    // POST /api/jurnal
    public function store(Request $request) {
        $validated = $request->validate([
            'pegawai_id' => 'required|exists:pegawai,id',
            'tanggal' => 'required|date',
            'hari' => 'required|string',
            'nomor_kegiatan' => 'required|string',
            'waktu_mulai' => 'required',
            'waktu_selesai' => 'required',
            'kegiatan' => 'required|string',
            'output_hasil' => 'required|string',
            'tautan_bukti' => 'nullable|url',
        ]);

        $kegiatan = KegiatanJurnal::create($validated);
        return response()->json($kegiatan, 201);
    }

    // PUT /api/jurnal/{id}/verifikasi
    public function verify(Request $request, $id) {
        $kegiatan = KegiatanJurnal::findOrFail($id);
        $kegiatan->update([
            'status_validasi' => $request->status, // 'Disetujui' | 'Ditolak'
            'catatan_atasan' => $request->catatan,
            'tanggal_validasi' => now(),
            'validator_id' => auth()->id() ?? $request->validator_id,
        ]);

        return response()->json(['message' => 'Laporan berhasil divalidasi', 'data' => $kegiatan]);
    }
}`,
    routes: `<?php
// routes/api.php
use App\\Http\\Controllers\\Api\\JurnalController;
use App\\Http\\Controllers\\Api\\PresensiController;
use App\\Http\\Controllers\\Api\\PengaturanController;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('v1')->group(function () {
    // Jurnal Kegiatan Harian
    Route::get('/jurnal', [JurnalController::class, 'index']);
    Route::post('/jurnal', [JurnalController::class, 'store']);
    Route::put('/jurnal/{id}', [JurnalController::class, 'update']);
    Route::delete('/jurnal/{id}', [JurnalController::class, 'destroy']);
    Route::put('/jurnal/{id}/verifikasi', [JurnalController::class, 'verify']);
    Route::post('/jurnal/batch-verify', [JurnalController::class, 'batchVerify']);

    // Absensi / Presensi
    Route::get('/presensi', [PresensiController::class, 'index']);
    Route::post('/presensi/checkin', [PresensiController::class, 'checkIn']);
    Route::post('/presensi/checkout', [PresensiController::class, 'checkOut']);

    // Rekapitulasi & Pengaturan
    Route::get('/rekapitulasi/bulanan', [JurnalController::class, 'monthlyReport']);
    Route::get('/pengaturan', [PengaturanController::class, 'get']);
    Route::post('/pengaturan', [PengaturanController::class, 'save']);
});`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90dvh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Panduan Integrasi Backend: Laravel & Basis Data MySQL
              </h2>
              <p className="text-xs text-slate-400">
                Arsitektur DDL tabel MySQL, Migration, Eloquent Model, Controller API RESTful
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-between px-6 pt-3 bg-slate-800/40 border-b border-slate-700">
          <div className="flex space-x-2">
            {(['migration', 'model', 'controller', 'routes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 capitalize ${
                  activeTab === tab
                    ? 'border-red-500 text-red-400 bg-slate-800 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'migration' ? '1. MySQL Migrations' : tab === 'model' ? '2. Eloquent Model' : tab === 'controller' ? '3. REST Controller' : '4. API Routes'}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="mb-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
          </button>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed bg-[#0d1117] text-slate-200">
          <pre>{codeSnippets[activeTab]}</pre>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between">
          <span>Struktur data ini sepenuhnya kompatibel 1:1 dengan antarmuka web yang sedang berjalan.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
