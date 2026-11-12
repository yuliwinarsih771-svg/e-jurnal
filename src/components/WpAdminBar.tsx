import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  MessageSquare, 
  Plus, 
  Menu, 
  X, 
  User, 
  LogOut, 
  ShieldCheck, 
  HelpCircle, 
  Database,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Pegawai, PengaturanInstansi, UserRole } from '../types';

interface WpAdminBarProps {
  currentPegawai: Pegawai;
  allPegawai: Pegawai[];
  pengaturan: PengaturanInstansi;
  pendingVerifikasiCount: number;
  onSelectPegawai: (pegawai: Pegawai) => void;
  onOpenGuide: () => void;
  onOpenLaravelDocs: () => void;
  onLogout?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenAddKegiatan: () => void;
  onToggleSidebarMobile: () => void;
  isSidebarMobileOpen: boolean;
}

export const WpAdminBar: React.FC<WpAdminBarProps> = ({
  currentPegawai,
  allPegawai,
  pengaturan,
  pendingVerifikasiCount,
  onSelectPegawai,
  onOpenGuide,
  onOpenLaravelDocs,
  onLogout,
  onNavigateToProfile,
  onNavigateToTab,
  onOpenAddKegiatan,
  onToggleSidebarMobile,
  isSidebarMobileOpen,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const newDropdownRef = useRef<HTMLDivElement>(null);
  const siteDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (newDropdownRef.current && !newDropdownRef.current.contains(event.target as Node)) {
        setNewDropdownOpen(false);
      }
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target as Node)) {
        setSiteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-8 bg-[#1d2327] text-[#c3c4c7] z-50 flex items-center justify-between text-[13px] select-none font-sans px-1 sm:px-2 shadow-xs border-b border-[#2c3338]">
      
      {/* Left Section: Mobile Toggle + WP Logo + Site Link + Comments + New */}
      <div className="flex items-center h-full">
        
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          className="md:hidden h-full px-2 text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#131619] transition flex items-center justify-center cursor-pointer"
          title="Buka/Tutup Menu Navigasi"
        >
          {isSidebarMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* WordPress Emblem Icon */}
        <div 
          onClick={() => onNavigateToTab('dashboard')}
          className="h-full px-2.5 flex items-center justify-center hover:bg-[#131619] hover:text-[#72aee6] transition cursor-pointer text-white font-bold"
          title="E-Jurnal Dasbor"
        >
          <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-serif leading-none italic font-black">
            W
          </div>
        </div>

        {/* Site Name with Home Icon */}
        <div ref={siteDropdownRef} className="relative h-full">
          <button
            type="button"
            onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
            className="h-full px-2.5 flex items-center space-x-1.5 hover:bg-[#131619] hover:text-[#72aee6] transition cursor-pointer"
            title="Kunjungi Dasbor & Situs Jurnal"
          >
            <Home className="w-3.5 h-3.5 text-[#8c8f94]" />
            <span className="font-semibold text-white truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px]">
              {pengaturan.namaInstansi ? 'E-Jurnal' : 'E-Jurnal Kinerja'}
            </span>
          </button>

          {/* Site Dropdown */}
          {siteDropdownOpen && (
            <div className="absolute top-8 left-0 w-48 bg-[#23282d] text-[#c3c4c7] py-1 border border-[#3c434a] shadow-lg text-xs z-50">
              <button
                onClick={() => {
                  setSiteDropdownOpen(false);
                  onNavigateToTab('dashboard');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#131619] hover:text-[#72aee6] block"
              >
                Dasbor Utama
              </button>
              <button
                onClick={() => {
                  setSiteDropdownOpen(false);
                  onNavigateToTab('jurnal-harian');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#131619] hover:text-[#72aee6] block"
              >
                Jurnal Harian
              </button>
              <button
                onClick={() => {
                  setSiteDropdownOpen(false);
                  onNavigateToTab('rekapitulasi');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#131619] hover:text-[#72aee6] block"
              >
                Rekapitulasi Bulanan
              </button>
            </div>
          )}
        </div>

        {/* Comments / Pending Verification Counter */}
        <button
          type="button"
          onClick={() => onNavigateToTab('verifikasi')}
          className="h-full px-2 hidden sm:flex items-center space-x-1 hover:bg-[#131619] hover:text-[#72aee6] transition cursor-pointer"
          title={`${pendingVerifikasiCount} verifikasi menunggu paraf`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#8c8f94]" />
          <span className={`text-[11px] font-bold px-1.5 py-0 rounded-full ${
            pendingVerifikasiCount > 0 ? 'bg-[#d63638] text-white' : 'text-[#8c8f94]'
          }`}>
            {pendingVerifikasiCount}
          </span>
        </button>

        {/* + New / + Baru Dropdown Button */}
        <div ref={newDropdownRef} className="relative h-full">
          <button
            type="button"
            onClick={() => setNewDropdownOpen(!newDropdownOpen)}
            className="h-full px-2 flex items-center space-x-1 hover:bg-[#131619] hover:text-[#72aee6] transition cursor-pointer"
            title="Tambah data baru"
          >
            <Plus className="w-3.5 h-3.5 text-[#8c8f94]" />
            <span className="hidden xs:inline">Baru</span>
          </button>

          {/* New Item Dropdown */}
          {newDropdownOpen && (
            <div className="absolute top-8 left-0 w-44 bg-[#23282d] text-[#c3c4c7] py-1 border border-[#3c434a] shadow-lg text-xs z-50">
              <button
                onClick={() => {
                  setNewDropdownOpen(false);
                  onOpenAddKegiatan();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#131619] hover:text-[#72aee6] block font-semibold"
              >
                + Kegiatan Jurnal
              </button>
              <button
                onClick={() => {
                  setNewDropdownOpen(false);
                  onNavigateToTab('rekapitulasi');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#131619] hover:text-[#72aee6] block"
              >
                Rekapitulasi
              </button>
              {currentPegawai.role === 'superadmin' && (
                <button
                  onClick={() => {
                    setNewDropdownOpen(false);
                    onNavigateToTab('tambah-user');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#131619] hover:text-[#72aee6] block"
                >
                  Tambah Pengguna
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cloud Realtime Indicator (Desktop) */}
        <div className="hidden lg:flex items-center space-x-1 px-2 text-[11px] text-[#8c8f94]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Firebase Realtime</span>
        </div>

      </div>

      {/* Right Section: "Howdy, admin" + Avatar (as highlighted in red in user image) */}
      <div className="flex items-center h-full">
        
        {/* Help / Docs quick trigger */}
        <button
          type="button"
          onClick={onOpenGuide}
          className="hidden md:flex h-full px-2 items-center text-[#8c8f94] hover:text-[#72aee6] hover:bg-[#131619] transition cursor-pointer"
          title="Bantuan & Petunjuk Jurnal"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* User Greeting & Avatar Dropdown Container */}
        <div ref={userDropdownRef} className="relative h-full">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="h-full px-2.5 flex items-center space-x-1.5 hover:bg-[#131619] hover:text-[#72aee6] transition cursor-pointer"
          >
            <span className="text-[#c3c4c7] font-normal text-xs">
              <span className="hidden xs:inline">Halo, </span>
              <strong className="text-white font-semibold">
                {currentPegawai.username || currentPegawai.nama.split(',')[0]}
              </strong>
            </span>

            {/* Square Avatar Thumbnail (WordPress Admin style) */}
            <div className="w-5 h-5 bg-[#3c434a] text-white flex items-center justify-center text-[10px] font-bold rounded-xs overflow-hidden border border-[#50575e]">
              {currentPegawai.foto ? (
                <img src={currentPegawai.foto} alt={currentPegawai.nama} className="w-full h-full object-cover" />
              ) : (
                currentPegawai.nama.charAt(0)
              )}
            </div>
          </button>

          {/* WordPress User Flyout Card */}
          {userDropdownOpen && (
            <div className="absolute top-8 right-0 w-64 sm:w-72 bg-[#23282d] text-[#c3c4c7] border border-[#3c434a] shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-1">
              
              {/* Profile Card Header */}
              <div className="p-3 border-b border-[#3c434a] flex items-start space-x-3 bg-[#1d2327]">
                <div className="w-12 h-12 bg-[#3c434a] text-white flex items-center justify-center text-sm font-bold rounded-xs overflow-hidden border border-[#50575e] shrink-0">
                  {currentPegawai.foto ? (
                    <img src={currentPegawai.foto} alt={currentPegawai.nama} className="w-full h-full object-cover" />
                  ) : (
                    currentPegawai.nama.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-bold text-xs truncate">
                    {currentPegawai.nama}
                  </div>
                  <div className="text-[#8c8f94] text-[11px] truncate">
                    @{currentPegawai.username || 'admin'}
                  </div>
                  <div className="text-[#8c8f94] text-[10px] font-mono mt-0.5">
                    NIP. {currentPegawai.nip}
                  </div>
                  <div className="mt-1">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[#3c434a] text-[#72aee6] border border-[#50575e]">
                      {currentPegawai.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Super Admin Switch Account Menu */}
              {currentPegawai.role === 'superadmin' && allPegawai && allPegawai.length > 0 && (
                <div className="p-2 border-b border-[#3c434a] bg-[#1d2327]/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#72aee6] mb-1 px-1 flex items-center justify-between">
                    <span>Ganti Akun Pengguna:</span>
                    <span className="text-white">{allPegawai.length} Akun</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-0.5">
                    {allPegawai.map((peg) => (
                      <button
                        key={peg.id}
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSelectPegawai(peg);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between transition cursor-pointer hover:bg-[#3c434a] ${
                          peg.id === currentPegawai.id ? 'bg-[#2271b1] text-white font-semibold' : 'text-[#c3c4c7]'
                        }`}
                      >
                        <span className="truncate max-w-[150px]">{peg.nama}</span>
                        <span className="text-[9px] uppercase font-mono">{peg.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Links */}
              <div className="py-1">
                {onNavigateToProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigateToProfile();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#c3c4c7] hover:bg-[#131619] hover:text-[#72aee6] flex items-center space-x-2 transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#8c8f94]" />
                    <span>Edit Profil Saya</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenLaravelDocs();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#c3c4c7] hover:bg-[#131619] hover:text-[#72aee6] flex items-center space-x-2 transition cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-[#8c8f94]" />
                  <span>Skema MySQL & API</span>
                </button>
              </div>

              {/* Logout Button */}
              {onLogout && (
                <div className="p-2 border-t border-[#3c434a] bg-[#1d2327]">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full py-1.5 px-3 bg-[#d63638] hover:bg-[#b32d2e] text-white font-semibold rounded text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

    </header>
  );
};
