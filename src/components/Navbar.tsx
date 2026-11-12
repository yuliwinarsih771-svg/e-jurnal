import React from 'react';
import { 
  BookOpen, 
  UserCheck, 
  ClipboardCheck, 
  BarChart3, 
  Printer, 
  Settings,
  AlertCircle,
  ShieldCheck,
  User,
  UserPlus,
  Calendar,
  CalendarDays,
  CalendarRange
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

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingVerifikasiCount: number;
  userRole: UserRole;
}

interface NavItem {
  id: NavTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | number | null;
  highlight?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  pendingVerifikasiCount,
  userRole,
}) => {
  const navItems: NavItem[] = userRole === 'superadmin'
    ? [
        {
          id: 'monitoring' as NavTab,
          label: 'Pengecekan Jurnal Semua Pegawai',
          shortLabel: 'Monitoring Jurnal',
          icon: UserCheck,
          badge: null,
        },
        {
          id: 'jurnal-harian' as NavTab,
          label: 'Jurnal Harian',
          shortLabel: 'Harian',
          icon: Calendar,
          badge: null,
        },
        {
          id: 'jurnal-mingguan' as NavTab,
          label: 'Jurnal Mingguan',
          shortLabel: 'Mingguan',
          icon: CalendarRange,
          badge: null,
        },
        {
          id: 'jurnal-bulanan' as NavTab,
          label: 'Jurnal Bulanan',
          shortLabel: 'Bulanan',
          icon: CalendarDays,
          badge: null,
        },
        {
          id: 'tambah-user' as NavTab,
          label: 'Tambah User Akun',
          shortLabel: 'Tambah Akun',
          icon: UserPlus,
          badge: 'Super Admin',
          highlight: true,
        },
        {
          id: 'rekapitulasi' as NavTab,
          label: 'Rekapitulasi Bulanan Pegawai',
          shortLabel: 'Rekap',
          icon: BarChart3,
          badge: null,
        },
        {
          id: 'cetak' as NavTab,
          label: 'Cetak & Ekspor',
          shortLabel: 'Cetak',
          icon: Printer,
          badge: null,
        },
        {
          id: 'profil' as NavTab,
          label: 'Profil Super Admin',
          shortLabel: 'Profil',
          icon: ShieldCheck,
          badge: 'Super Admin',
        },
      ]
    : userRole === 'atasan'
      ? [
          {
            id: 'verifikasi' as NavTab,
            label: 'Verifikasi Jurnal',
            shortLabel: 'Verifikasi',
            icon: ClipboardCheck,
            badge: pendingVerifikasiCount > 0 ? pendingVerifikasiCount : null,
            highlight: pendingVerifikasiCount > 0,
          },
          {
            id: 'monitoring' as NavTab,
            label: 'Pengecekan Jurnal Harian Pegawai',
            shortLabel: 'Cek Jurnal Pegawai',
            icon: UserCheck,
            badge: null,
            highlight: false,
          },
          {
            id: 'jurnal-harian' as NavTab,
            label: 'Jurnal Harian',
            shortLabel: 'Harian',
            icon: Calendar,
            badge: null,
          },
          {
            id: 'jurnal-mingguan' as NavTab,
            label: 'Jurnal Mingguan',
            shortLabel: 'Mingguan',
            icon: CalendarRange,
            badge: null,
          },
          {
            id: 'jurnal-bulanan' as NavTab,
            label: 'Jurnal Bulanan',
            shortLabel: 'Bulanan',
            icon: CalendarDays,
            badge: null,
          },
          {
            id: 'cetak' as NavTab,
            label: 'Cetak & Ekspor',
            shortLabel: 'Cetak',
            icon: Printer,
            badge: null,
          },
        ]
      : [
          {
            id: 'jurnal-harian' as NavTab,
            label: 'Jurnal Harian',
            shortLabel: 'Harian',
            icon: Calendar,
            badge: null,
          },
          {
            id: 'jurnal-mingguan' as NavTab,
            label: 'Jurnal Mingguan',
            shortLabel: 'Mingguan',
            icon: CalendarRange,
            badge: null,
          },
          {
            id: 'jurnal-bulanan' as NavTab,
            label: 'Jurnal Bulanan',
            shortLabel: 'Bulanan',
            icon: CalendarDays,
            badge: null,
          },
          {
            id: 'rekapitulasi' as NavTab,
            label: 'Rekapitulasi Bulanan',
            shortLabel: 'Rekap',
            icon: BarChart3,
            badge: null,
          },
          {
            id: 'cetak' as NavTab,
            label: 'Cetak & Ekspor',
            shortLabel: 'Cetak',
            icon: Printer,
            badge: null,
          },
          {
            id: 'pengaturan' as NavTab,
            label: userRole === 'admin' ? 'Pengaturan Admin' : 'Pengaturan Instansi',
            shortLabel: 'Pengaturan',
            icon: Settings,
            badge: userRole === 'admin' ? 'Admin' : null,
          },
        ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-1.5 sm:px-6 lg:px-8 pl-[max(0.375rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))]">
        
        {/* Desktop / Tablet Scrollable Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1 sm:py-2.5 no-scrollbar touch-pan-x">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (activeTab === 'jurnal' && item.id === 'jurnal-harian');
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-xl text-[10px] sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`ml-0.5 sm:ml-1 px-1 py-0.2 sm:px-1.5 sm:py-0.5 text-[8px] sm:text-[10px] rounded-full font-bold leading-none ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : item.highlight
                          ? 'bg-amber-500 text-white animate-pulse'
                          : item.badge === 'Super Admin'
                            ? 'bg-rose-100 text-rose-700 font-extrabold'
                            : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {userRole === 'superadmin' && (
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 ml-auto bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Akses Super Admin: Hak Akses Seluruh Jurnal & Pengaturan</span>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};
