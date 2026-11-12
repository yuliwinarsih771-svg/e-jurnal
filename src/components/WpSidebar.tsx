import React from 'react';
import { 
  LayoutDashboard, 
  Pin, 
  Image, 
  FileText, 
  MessageSquare, 
  Palette, 
  Printer, 
  Users, 
  Wrench, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  Calendar,
  CalendarRange,
  CalendarDays,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab = 
  | 'dashboard'
  | 'jurnal' 
  | 'jurnal-harian' 
  | 'jurnal-mingguan' 
  | 'jurnal-bulanan' 
  | 'verifikasi' 
  | 'monitoring' 
  | 'rekapitulasi' 
  | 'cetak' 
  | 'pengaturan' 
  | 'profil' 
  | 'tambah-user';

interface WpSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingVerifikasiCount: number;
  userRole: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAddKegiatan: () => void;
}

export const WpSidebar: React.FC<WpSidebarProps> = ({
  activeTab,
  onTabChange,
  pendingVerifikasiCount,
  userRole,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenAddKegiatan,
}) => {

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const isTabActive = (tab: NavTab) => {
    if (activeTab === 'jurnal' && (tab === 'jurnal-harian' || tab === 'jurnal')) return true;
    return activeTab === tab;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-2xs transition-opacity"
        />
      )}

      {/* WordPress Admin Sidebar */}
      <aside
        className={`fixed top-8 bottom-0 left-0 z-40 bg-[#23282d] text-[#c3c4c7] transition-all duration-200 select-none flex flex-col justify-between border-r border-[#191e23] ${
          isCollapsed ? 'w-11' : 'w-44'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          <ul className="space-y-0.5 text-xs font-normal">
            
            {/* 1. Dashboard / Dasbor */}
            <li>
              <button
                type="button"
                onClick={() => handleSelectTab('dashboard')}
                className={`w-full flex items-center px-3 py-2 text-left relative transition cursor-pointer group ${
                  isTabActive('dashboard')
                    ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                    : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                }`}
                title="Dasbor Utama"
              >
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${isTabActive('dashboard') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                {!isCollapsed && <span className="ml-2.5 truncate">Dasbor</span>}
              </button>
            </li>

            {/* Separator */}
            <li className="my-1 border-t border-[#3c434a]/40" />

            {/* 2. Jurnal Kinerja (Posts) */}
            <li>
              <button
                type="button"
                onClick={() => handleSelectTab('jurnal-harian')}
                className={`w-full flex items-center px-3 py-2 text-left relative transition cursor-pointer group ${
                  isTabActive('jurnal-harian') || isTabActive('jurnal') || isTabActive('jurnal-mingguan') || isTabActive('jurnal-bulanan')
                    ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                    : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                }`}
                title="Jurnal Kinerja Pegawai"
              >
                <Pin className={`w-4 h-4 shrink-0 ${isTabActive('jurnal-harian') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                {!isCollapsed && <span className="ml-2.5 truncate">Jurnal Kinerja</span>}
              </button>
            </li>

            {/* Sub-items for Jurnal when expanded and on Jurnal tab */}
            {!isCollapsed && (
              <li className="pl-6 pr-2 py-0.5 space-y-0.5 bg-[#191e23]/60 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectTab('jurnal-harian')}
                  className={`w-full text-left py-1 px-2 rounded block ${
                    activeTab === 'jurnal-harian' || activeTab === 'jurnal' ? 'text-white font-bold' : 'text-[#8c8f94] hover:text-[#72aee6]'
                  }`}
                >
                  Semua (Harian)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAddKegiatan();
                    onCloseMobile();
                  }}
                  className="w-full text-left py-1 px-2 rounded block text-[#8c8f94] hover:text-[#72aee6]"
                >
                  + Tambah Baru
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('jurnal-mingguan')}
                  className={`w-full text-left py-1 px-2 rounded block ${
                    activeTab === 'jurnal-mingguan' ? 'text-white font-bold' : 'text-[#8c8f94] hover:text-[#72aee6]'
                  }`}
                >
                  Jurnal Mingguan
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('jurnal-bulanan')}
                  className={`w-full text-left py-1 px-2 rounded block ${
                    activeTab === 'jurnal-bulanan' ? 'text-white font-bold' : 'text-[#8c8f94] hover:text-[#72aee6]'
                  }`}
                >
                  Jurnal Bulanan
                </button>
              </li>
            )}

            {/* 3. Pages / Rekapitulasi */}
            <li>
              <button
                type="button"
                onClick={() => handleSelectTab('rekapitulasi')}
                className={`w-full flex items-center px-3 py-2 text-left relative transition cursor-pointer group ${
                  isTabActive('rekapitulasi')
                    ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                    : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                }`}
                title="Rekapitulasi Bulanan"
              >
                <FileText className={`w-4 h-4 shrink-0 ${isTabActive('rekapitulasi') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                {!isCollapsed && <span className="ml-2.5 truncate">Rekapitulasi</span>}
              </button>
            </li>

            {/* 4. Comments / Verifikasi Paraf */}
            {(userRole === 'atasan' || userRole === 'superadmin' || userRole === 'admin') && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('verifikasi')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left relative transition cursor-pointer group ${
                    isTabActive('verifikasi')
                      ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                      : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                  }`}
                  title="Verifikasi & Paraf Atasan"
                >
                  <div className="flex items-center">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isTabActive('verifikasi') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                    {!isCollapsed && <span className="ml-2.5 truncate">Verifikasi</span>}
                  </div>
                  {pendingVerifikasiCount > 0 && (
                    <span className="px-1.5 py-0 rounded-full text-[9px] font-bold bg-[#d63638] text-white">
                      {pendingVerifikasiCount}
                    </span>
                  )}
                </button>
              </li>
            )}

            {/* Monitoring (Khusus Atasan & Superadmin) */}
            {(userRole === 'atasan' || userRole === 'superadmin') && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('monitoring')}
                  className={`w-full flex items-center px-3 py-2 text-left relative transition cursor-pointer group ${
                    isTabActive('monitoring')
                      ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                      : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                  }`}
                  title="Monitoring Seluruh Pegawai"
                >
                  <UserCheck className={`w-4 h-4 shrink-0 ${isTabActive('monitoring') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                  {!isCollapsed && <span className="ml-2.5 truncate">Monitoring</span>}
                </button>
              </li>
            )}

            {/* 5. Plugins / Cetak Dokumen */}
            <li>
              <button
                type="button"
                onClick={() => handleSelectTab('cetak')}
                className={`w-full flex items-center px-3 py-2 text-left relative transition cursor-pointer group ${
                  isTabActive('cetak')
                    ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                    : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                }`}
                title="Cetak Dokumen Resmi Pemda & Ekspor"
              >
                <Printer className={`w-4 h-4 shrink-0 ${isTabActive('cetak') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                {!isCollapsed && <span className="ml-2.5 truncate">Cetak & Ekspor</span>}
              </button>
            </li>

            {/* 6. Profil Anda (Hanya profil akun yang sedang login) */}
            <li>
              <button
                type="button"
                onClick={() => handleSelectTab('profil')}
                className={`w-full flex items-center px-3 py-2 text-left relative transition cursor-pointer group ${
                  isTabActive('profil')
                    ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                    : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                }`}
                title="Profil Akun Anda"
              >
                <Users className={`w-4 h-4 shrink-0 ${isTabActive('profil') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                {!isCollapsed && (
                  <span className="ml-2.5 truncate">
                    Profil Anda
                  </span>
                )}
              </button>
            </li>

            {/* Khusus Super Admin: Tambah Akun */}
            {userRole === 'superadmin' && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('tambah-user')}
                  className={`w-full flex items-center px-3 py-2 text-left relative transition cursor-pointer group ${
                    isTabActive('tambah-user')
                      ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                      : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                  }`}
                  title="Tambah Pengguna Baru"
                >
                  <Plus className={`w-4 h-4 shrink-0 ${isTabActive('tambah-user') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                  {!isCollapsed && <span className="ml-2.5 truncate">Tambah Akun</span>}
                </button>
              </li>
            )}

            {/* 7. Settings (Pengaturan) */}
            {userRole !== 'superadmin' && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('pengaturan')}
                  className={`w-full flex items-center px-3 py-2 text-left relative transition cursor-pointer group ${
                    isTabActive('pengaturan')
                      ? 'bg-[#2271b1] text-white font-semibold after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-y-transparent after:border-l-transparent after:border-r-[#f0f0f1]'
                      : 'hover:bg-[#191e23] hover:text-[#72aee6] text-[#c3c4c7]'
                  }`}
                  title="Pengaturan Instansi & Atasan"
                >
                  <Settings className={`w-4 h-4 shrink-0 ${isTabActive('pengaturan') ? 'text-white' : 'text-[#8c8f94] group-hover:text-[#72aee6]'}`} />
                  {!isCollapsed && <span className="ml-2.5 truncate">Pengaturan</span>}
                </button>
              </li>
            )}

          </ul>
        </div>

        {/* Bottom: Collapse Menu Button (Authentic WordPress feature) */}
        <div className="border-t border-[#3c434a]/40 p-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center px-3 py-2 text-left text-xs text-[#8c8f94] hover:text-[#72aee6] hover:bg-[#191e23] transition cursor-pointer"
            title={isCollapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
          >
            <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center shrink-0">
              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </div>
            {!isCollapsed && <span className="ml-2.5 truncate">Ciutkan Menu</span>}
          </button>
        </div>

      </aside>
    </>
  );
};
