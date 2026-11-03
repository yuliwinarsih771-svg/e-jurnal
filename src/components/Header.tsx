import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UserCheck, 
  Clock, 
  Calendar, 
  Settings, 
  FileText, 
  ChevronDown,
  ShieldCheck,
  User,
  HelpCircle,
  Database,
  LogOut
} from 'lucide-react';
import { Pegawai, PengaturanInstansi, UserRole } from '../types';

interface HeaderProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  pengaturan: PengaturanInstansi;
  onSelectPegawai: (pegawai: Pegawai) => void;
  onOpenGuide: () => void;
  onOpenLaravelDocs: () => void;
  onLogout?: () => void;
  onNavigateToProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPegawai,
  allPegawai,
  pengaturan,
  onSelectPegawai,
  onOpenGuide,
  onOpenLaravelDocs,
  onLogout,
  onNavigateToProfile,
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-300">Super Admin</span>;
      case 'admin':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-purple-100 text-purple-800 rounded-full border border-purple-200">Admin</span>;
      case 'atasan':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">Atasan (Verifikasi)</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">Pegawai</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Agency Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  E-JURNAL HARIAN PEGAWAI
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400">|</span>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                  {pengaturan.namaInstansi}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight truncate max-w-[200px] sm:max-w-md lg:max-w-xl">
                {pengaturan.bidangBagian || pengaturan.badanDinas}
              </h1>
            </div>
          </div>

          {/* Right Section: Time & Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Realtime clock display (Desktop) */}
            <div className="hidden lg:flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-900 font-semibold font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>{time}</span>
              </div>
            </div>

            {/* Firebase Cloud DB Badge */}
            <div 
              className="hidden xl:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              title="Database cloud aktif: Firebase Firestore"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firebase Firestore</span>
            </div>

            {/* Guide & DB Docs Button */}
            <div className="flex items-center space-x-1">
              <button
                onClick={onOpenLaravelDocs}
                className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition border border-slate-200"
                title="Panduan Skema Database MySQL & Laravel API"
              >
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>Skema MySQL/Laravel</span>
              </button>
              
              <button
                onClick={onOpenGuide}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Petunjuk Penggunaan & Format Jurnal"
              >
                <HelpCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Profile / Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-left"
              >
                <div className={`w-8 h-8 rounded-lg ${
                  currentPegawai.role === 'superadmin' ? 'bg-rose-600' : 'bg-blue-600'
                } text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden`}>
                  {currentPegawai.foto ? (
                    <img src={currentPegawai.foto} alt={currentPegawai.nama} className="w-full h-full object-cover" />
                  ) : (
                    currentPegawai.nama.charAt(0)
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                    {currentPegawai.nama.split(',')[0]}
                  </div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {getRoleBadge(currentPegawai.role)}
                    <span className="text-[10px] text-slate-400 font-mono">
                      @{currentPegawai.username || 'user'}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Akun & Peran Pengguna:
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pemilik akun resmi yang sedang aktif masuk sistem.
                    </p>
                  </div>
                  <div className="p-3">
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-start space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-2xs ${
                        currentPegawai.role === 'superadmin' ? 'bg-rose-600' : currentPegawai.role === 'admin' ? 'bg-purple-600' : currentPegawai.role === 'atasan' ? 'bg-amber-600' : 'bg-blue-600'
                      }`}>
                        {currentPegawai.foto ? (
                          <img src={currentPegawai.foto} alt={currentPegawai.nama} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          currentPegawai.nama.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {currentPegawai.nama}
                          </span>
                        </div>
                        <div className="mt-1">
                          {getRoleBadge(currentPegawai.role)}
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-1 font-medium">
                          {currentPegawai.jabatan}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          NIP. {currentPegawai.nip}
                        </p>
                        <div className="mt-1.5 flex items-center space-x-1.5">
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-700 font-mono font-bold">
                            @{currentPegawai.username || 'user'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Khusus Super Admin: Munculkan daftar nama-nama akun */}
                  {currentPegawai.role === 'superadmin' && allPegawai && allPegawai.length > 0 && (
                    <div className="border-t border-slate-100 py-1.5 bg-slate-50/40">
                      <div className="px-3 py-1 flex items-center justify-between">
                        <p className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-rose-600" />
                          <span>Nama-Nama Akun (Khusus Super Admin):</span>
                        </p>
                        <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full">
                          {allPegawai.length} Akun
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 px-1">
                        {allPegawai.map((peg) => {
                          const isSelected = peg.id === currentPegawai.id;
                          return (
                            <button
                              key={peg.id}
                              type="button"
                              onClick={() => {
                                setDropdownOpen(false);
                                onSelectPegawai(peg);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 transition cursor-pointer hover:bg-slate-100 ${
                                isSelected ? 'bg-rose-50/80 font-bold border-l-2 border-rose-600' : ''
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                                peg.role === 'superadmin' ? 'bg-rose-600' : peg.role === 'admin' ? 'bg-purple-600' : peg.role === 'atasan' ? 'bg-amber-600' : 'bg-blue-600'
                              }`}>
                                {peg.nama.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs text-slate-800 truncate font-semibold">
                                    {peg.nama}
                                  </span>
                                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                                    peg.role === 'superadmin' ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {peg.role}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Database: Firebase Firestore</span>
                    <span className="font-semibold text-emerald-600 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Realtime Online</span>
                    </span>
                  </div>

                  <div className="p-1 border-t border-slate-100 space-y-0.5">
                    {onNavigateToProfile && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onNavigateToProfile();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition cursor-pointer"
                      >
                        <User className="w-4 h-4 text-rose-600" />
                        <span>Buka Profil {currentPegawai.role === 'superadmin' ? 'Super Admin' : 'Saya'}</span>
                      </button>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Keluar / Logout Akun</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition cursor-pointer"
                title="Keluar dari akun Anda saat ini"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
                <span>Keluar</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
