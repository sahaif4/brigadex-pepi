import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Brigade, Alsintan, Operator, LaporanHarian, RiwayatService, RiwayatKerusakan, AuditTrail, ServiceSchedule, SystemNotification } from './types';
import {
  mockUsers,
  mockBrigades,
  mockAlsintanList,
  mockOperators,
  mockLaporanList,
  mockRiwayatService,
  mockRiwayatKerusakan,
  mockAuditTrail,
  mockTargetRealisasi
} from './data/mockData';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import MasterDataView from './components/MasterDataView';
import OperationalForms from './components/OperationalForms';
import ValidasiLaporanView from './components/ValidasiLaporanView';
import MonitoringTrackingView from './components/MonitoringTrackingView';
import ReportsExportsView from './components/ReportsExportsView';
import SecuritySettingsView from './components/SecuritySettingsView';
import SdlcDocumentation from './components/SdlcDocumentation';
import { Toaster } from 'react-hot-toast';
import WABillingModal from './components/WABillingModal';
import ProfileModal from './components/ProfileModal';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  LayoutDashboard,
  Database,
  PenTool,
  Radio,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Menu,
  X,
  MapPin,
  Sun,
  Moon,
  Sprout,
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Authenticated User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('alsintan_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Persistent States
  const [brigades, setBrigades] = useState<Brigade[]>(() => {
    const saved = localStorage.getItem('alsintan_brigades');
    return saved ? JSON.parse(saved) : mockBrigades;
  });

  const [alsintanList, setAlsintanList] = useState<Alsintan[]>(() => {
    const saved = localStorage.getItem('alsintan_alsintan');
    return saved ? JSON.parse(saved) : mockAlsintanList;
  });

  const [operators, setOperators] = useState<Operator[]>(() => {
    const saved = localStorage.getItem('alsintan_operators');
    return saved ? JSON.parse(saved) : mockOperators;
  });

  const [laporanList, setLaporanList] = useState<LaporanHarian[]>(() => {
    const saved = localStorage.getItem('alsintan_laporan');
    return saved ? JSON.parse(saved) : mockLaporanList;
  });

  const [serviceList, setServiceList] = useState<RiwayatService[]>(() => {
    const saved = localStorage.getItem('alsintan_service');
    return saved ? JSON.parse(saved) : mockRiwayatService;
  });

  const [kerusakanList, setKerusakanList] = useState<RiwayatKerusakan[]>(() => {
    const saved = localStorage.getItem('alsintan_kerusakan');
    return saved ? JSON.parse(saved) : mockRiwayatKerusakan;
  });

  const [serviceSchedules, setServiceSchedules] = useState<ServiceSchedule[]>(() => {
    const saved = localStorage.getItem('alsintan_schedules');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'sch-001',
        alsintanId: 'als-babel-10', // Kubota L5018 Belilik
        dueDate: '2026-06-15',
        targetHM: 150,
        type: 'Rutin',
        status: 'Terlewat'
      },
      {
        id: 'sch-002',
        alsintanId: 'als-babel-02', // Quick G3000 Rias
        dueDate: '2026-06-20',
        targetHM: 100,
        type: 'Rutin',
        status: 'Terlewat'
      },
      {
        id: 'sch-003',
        alsintanId: 'als-babel-05', // Kubota L5018 Pangkon
        dueDate: '2026-07-05',
        targetHM: 200,
        type: 'Mayor',
        status: 'Pending'
      }
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AuditTrail[]>(() => {
    const saved = localStorage.getItem('alsintan_audit');
    return saved ? JSON.parse(saved) : mockAuditTrail;
  });

  // User accounts with approval states
  const [localAccounts, setLocalAccounts] = useState<User[]>(() => {
    const saved = localStorage.getItem('alsintan_registered_accounts_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge any new mock users that aren't in local storage
      const missingMockUsers = mockUsers.filter(mu => !parsed.some((pu: User) => pu.id === mu.id));
      return [...parsed, ...missingMockUsers];
    }
    return mockUsers;
  });

  // Save registered accounts
  useEffect(() => {
    localStorage.setItem('alsintan_registered_accounts_v2', JSON.stringify(localAccounts));
  }, [localAccounts]);

  // Firebase Real-time sync for Data
  useEffect(() => {
    const unsubLaporan = onSnapshot(collection(db, 'laporan'), (snapshot) => {
      if (snapshot.empty) return;
      const onlineLaporan = snapshot.docs.map(doc => doc.data() as LaporanHarian);
      setLaporanList(prev => {
        const merged = [...onlineLaporan, ...prev];
        // deduplicate by id
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        // sort by date desc
        return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    });

    const unsubKerusakan = onSnapshot(collection(db, 'kerusakan'), (snapshot) => {
      if (snapshot.empty) return;
      const onlineKerusakan = snapshot.docs.map(doc => doc.data() as RiwayatKerusakan);
      setKerusakanList(prev => {
        const merged = [...onlineKerusakan, ...prev];
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    });

    const unsubAlsintan = onSnapshot(collection(db, 'alsintan'), (snapshot) => {
      if (snapshot.empty) return;
      const onlineAlsintan = snapshot.docs.map(doc => doc.data() as Alsintan);
      setAlsintanList(prev => {
        const merged = [...onlineAlsintan, ...prev];
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        return unique; // or sort if needed
      });
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) return;
      const onlineUsers = snapshot.docs.map(doc => doc.data() as User);
      setLocalAccounts(prev => {
        const merged = [...onlineUsers, ...prev];
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        return unique;
      });
    });

    return () => {
      unsubLaporan();
      unsubKerusakan();
      unsubAlsintan();
      unsubUsers();
    };
  }, []);

  // App Nav state
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'master' | 'input' | 'service' | 'kerusakan' | 'telemetri' | 'laporan' | 'pengaturan' | 'sdlc'>('dashboard');
  const [selectedProvince, setSelectedProvince] = useState<string>('Kepulauan Bangka Belitung');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isWaBillingOpen, setIsWaBillingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('alsintan_theme') === 'dark';
  });

  // Branding States
  const [logoType, setLogoType] = useState(() => localStorage.getItem('alsintan_logo_type') || 'default');
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('alsintan_logo_url') || '');
  const [portalTitle, setPortalTitle] = useState(() => localStorage.getItem('alsintan_portal_title') || 'Laporan Kinerja Alsintan');
  const [portalSubtitle, setPortalSubtitle] = useState(() => localStorage.getItem('alsintan_portal_subtitle') || 'KEMENTAN BRIGADE PANGAN');
  const [loginTitle, setLoginTitle] = useState(() => localStorage.getItem('alsintan_login_title') || 'Login seperti Akun Google');
  const [loginSubtitle, setLoginSubtitle] = useState(() => localStorage.getItem('alsintan_login_subtitle') || 'Pilih profil Anda untuk mulai mengisi laporan Brigade Pangan secara praktis');

  // Apply dark mode class to HTML
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('alsintan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('alsintan_theme', 'light');
    }
  }, [isDarkMode]);

  const activeSchedules = useMemo<ServiceSchedule[]>(() => {
    const todayStr = '2026-06-28';
    return serviceSchedules.map(sch => {
      // Check if a service for this unit has been completed on or after the scheduled date
      const hasCompletedService = serviceList.some(
        s => s.alsintanId === sch.alsintanId && s.date >= sch.dueDate
      );
      if (hasCompletedService) {
        return { ...sch, status: 'Selesai' as const };
      }
      if (sch.status === 'Pending' && sch.dueDate < todayStr) {
        return { ...sch, status: 'Terlewat' as const };
      }
      return sch;
    });
  }, [serviceSchedules, serviceList]);

  const systemNotifications = useMemo<SystemNotification[]>(() => {
    const alerts: SystemNotification[] = [];

    // 1. Damage reports
    kerusakanList.forEach(k => {
      if (k.status === 'Dilaporkan') {
        const unit = alsintanList.find(a => a.id === k.alsintanId);
        alerts.push({
          id: `notif-krk-${k.id}`,
          type: 'kerusakan',
          title: 'Laporan Kerusakan Unit',
          message: `${unit?.name || 'Unit'} (${unit?.code || ''}): "${k.description}" dilaporkan oleh ${k.reportedBy}.`,
          date: k.date,
          severity: k.severity as any,
          unitId: k.alsintanId,
          unitName: unit?.name || 'Unit',
          unitCode: unit?.code || '',
          refId: k.id
        });
      }
    });

    // 2. Overdue service schedules
    activeSchedules.forEach(sch => {
      if (sch.status === 'Terlewat') {
        const unit = alsintanList.find(a => a.id === sch.alsintanId);
        alerts.push({
          id: `notif-sch-${sch.id}`,
          type: 'servis_terlewat',
          title: 'Jadwal Servis Terlewat',
          message: `Unit ${unit?.name || 'Unit'} (${unit?.code || ''}) telah melewati jadwal servis rutin pada tanggal ${sch.dueDate} (Target: ${sch.targetHM} HM).`,
          date: sch.dueDate,
          severity: sch.type === 'Mayor' ? 'Berat' : 'Sedang',
          unitId: sch.alsintanId,
          unitName: unit?.name || 'Unit',
          unitCode: unit?.code || '',
          refId: sch.id
        });
      }
    });

    // Sort by date descending
    return alerts.sort((a, b) => b.date.localeCompare(a.date));
  }, [kerusakanList, activeSchedules, alsintanList]);

  // Set selected province based on user profile if not Admin/Pusat/Super Admin
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== 'Super Admin' && currentUser.province) {
        setSelectedProvince(currentUser.province);
      }
    }
  }, [currentUser]);

  // Scoped datasets based on role and brigadeId
  const scopedBrigades = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Operator' || currentUser.role === 'Koordinator') {
      return brigades.filter(b => b.id === currentUser.brigadeId);
    }
    if (currentUser.role === 'Provinsi') {
      return brigades.filter(b => b.province === currentUser.province);
    }
    if (currentUser.role === 'Kabupaten') {
      return brigades.filter(b => b.regency === currentUser.regency);
    }
    return brigades;
  }, [brigades, currentUser]);

  const scopedAlsintanList = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Operator' || currentUser.role === 'Koordinator') {
      return alsintanList.filter(a => a.brigadeId === currentUser.brigadeId);
    }
    if (currentUser.role === 'Provinsi') {
      return alsintanList.filter(a => {
        const brg = brigades.find(b => b.id === a.brigadeId);
        return brg && brg.province === currentUser.province;
      });
    }
    if (currentUser.role === 'Kabupaten') {
      return alsintanList.filter(a => {
        const brg = brigades.find(b => b.id === a.brigadeId);
        return brg && brg.regency === currentUser.regency;
      });
    }
    return alsintanList;
  }, [alsintanList, brigades, currentUser]);

  const scopedOperators = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Operator' || currentUser.role === 'Koordinator') {
      return operators.filter(o => o.brigadeId === currentUser.brigadeId);
    }
    if (currentUser.role === 'Provinsi') {
      return operators.filter(o => {
        const brg = brigades.find(b => b.id === o.brigadeId);
        return brg && brg.province === currentUser.province;
      });
    }
    if (currentUser.role === 'Kabupaten') {
      return operators.filter(o => {
        const brg = brigades.find(b => b.id === o.brigadeId);
        return brg && brg.regency === currentUser.regency;
      });
    }
    return operators;
  }, [operators, brigades, currentUser]);

  const scopedLaporanList = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Operator' || currentUser.role === 'Koordinator') {
      return laporanList.filter(l => l.brigadeId === currentUser.brigadeId);
    }
    if (currentUser.role === 'Provinsi') {
      return laporanList.filter(l => {
        const brg = brigades.find(b => b.id === l.brigadeId);
        return brg && brg.province === currentUser.province;
      });
    }
    if (currentUser.role === 'Kabupaten') {
      return laporanList.filter(l => {
        const brg = brigades.find(b => b.id === l.brigadeId);
        return brg && brg.regency === currentUser.regency;
      });
    }
    return laporanList;
  }, [laporanList, brigades, currentUser]);

  const scopedServiceList = useMemo(() => {
    const machineIds = new Set(scopedAlsintanList.map(a => a.id));
    return serviceList.filter(s => machineIds.has(s.alsintanId));
  }, [serviceList, scopedAlsintanList]);

  const scopedKerusakanList = useMemo(() => {
    const machineIds = new Set(scopedAlsintanList.map(a => a.id));
    return kerusakanList.filter(k => machineIds.has(k.alsintanId));
  }, [kerusakanList, scopedAlsintanList]);

  const menuItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
      { id: 'master', label: 'Data Master (Alsintan)', icon: Database },
      { id: 'input', label: 'Pelaporan Harian', icon: PenTool },
      { id: 'validasi', label: 'Validasi Laporan', icon: CheckCircle2 },
      { id: 'service', label: 'Catatan Service & Perawatan', icon: Wrench },
      { id: 'kerusakan', label: 'Lapor Kerusakan Unit', icon: AlertTriangle },
      { id: 'telemetri', label: 'Peta Sebaran Brigade', icon: MapPin },
      { id: 'laporan', label: 'Laporan & Export Excel', icon: FileText },
      { id: 'pengaturan', label: 'Hak Akses & Logs', icon: Settings },
      { id: 'sdlc', label: 'Cetak Biru SDLC & BA', icon: BookOpen },
    ];

    if (!currentUser) return [];

    if (currentUser.role === 'Operator') {
      return allItems.filter(item => item.id === 'dashboard' || item.id === 'input' || item.id === 'service' || item.id === 'kerusakan');
    }

    if (currentUser.role === 'Koordinator') {
      // Manajer BP / Koordinator: Approve daily reports, add costs/rental values
      // Removing 'input' (Pelaporan Harian) for them
      return allItems.filter(item => item.id === 'dashboard' || item.id === 'master' || item.id === 'validasi' || item.id === 'service' || item.id === 'kerusakan' || item.id === 'laporan');
    }

    if (currentUser.role === 'Provinsi' || currentUser.role === 'Kabupaten') {
      return allItems.filter(item => item.id !== 'input' && item.id !== 'service' && item.id !== 'kerusakan' && item.id !== 'sdlc');
    }

    // Only Super Admin gets the default allItems (including sdlc)
    return allItems;
  }, [currentUser]);

  // Automated migration/reset to ensure all mock data is centered in Kepulauan Bangka Belitung (Babel)
  useEffect(() => {
    const isAlreadyMigrated = localStorage.getItem('alsintan_migrated_to_babel_v4');
    const hasOldData = brigades.some(b => b.province !== 'Kepulauan Bangka Belitung' || b.id === 'brg-001') ||
                       laporanList.some(lap => lap.provinsi && lap.provinsi !== 'Kepulauan Bangka Belitung');

    if (!isAlreadyMigrated || hasOldData) {
      console.log('Migrating local storage data to Kepulauan Bangka Belitung...');
      setBrigades(mockBrigades);
      setAlsintanList(mockAlsintanList);
      setOperators(mockOperators);
      setLaporanList(mockLaporanList);
      setServiceList(mockRiwayatService);
      setKerusakanList(mockRiwayatKerusakan);
      
      localStorage.setItem('alsintan_brigades', JSON.stringify(mockBrigades));
      localStorage.setItem('alsintan_alsintan', JSON.stringify(mockAlsintanList));
      localStorage.setItem('alsintan_operators', JSON.stringify(mockOperators));
      localStorage.setItem('alsintan_laporan', JSON.stringify(mockLaporanList));
      localStorage.setItem('alsintan_service', JSON.stringify(mockRiwayatService));
      localStorage.setItem('alsintan_kerusakan', JSON.stringify(mockRiwayatKerusakan));
      
      // Auto set logged in user profile to Bangka Belitung profile to avoid empty/incorrect state
      const defaultUser = mockUsers[2] || mockUsers[0]; // Koordinator Babel or Super Admin
      setCurrentUser(defaultUser);
      localStorage.setItem('alsintan_user', JSON.stringify(defaultUser));
      localStorage.removeItem('alsintan_remembered_uid');
      
      localStorage.setItem('alsintan_migrated_to_babel_v4', 'true');
    }
  }, [brigades, laporanList]);

  // Dynamic state syncing with localStorage
  useEffect(() => {
    localStorage.setItem('alsintan_brigades', JSON.stringify(brigades));
    localStorage.setItem('alsintan_alsintan', JSON.stringify(alsintanList));
    localStorage.setItem('alsintan_operators', JSON.stringify(operators));
    localStorage.setItem('alsintan_laporan', JSON.stringify(laporanList));
    localStorage.setItem('alsintan_service', JSON.stringify(serviceList));
    localStorage.setItem('alsintan_kerusakan', JSON.stringify(kerusakanList));
    localStorage.setItem('alsintan_audit', JSON.stringify(auditLogs));
    localStorage.setItem('alsintan_schedules', JSON.stringify(serviceSchedules));
  }, [brigades, alsintanList, operators, laporanList, serviceList, kerusakanList, auditLogs, serviceSchedules]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.newValue) {
        switch (e.key) {
          case 'alsintan_brigades': setBrigades(JSON.parse(e.newValue)); break;
          case 'alsintan_alsintan': setAlsintanList(JSON.parse(e.newValue)); break;
          case 'alsintan_operators': setOperators(JSON.parse(e.newValue)); break;
          case 'alsintan_laporan': setLaporanList(JSON.parse(e.newValue)); break;
          case 'alsintan_service': setServiceList(JSON.parse(e.newValue)); break;
          case 'alsintan_kerusakan': setKerusakanList(JSON.parse(e.newValue)); break;
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addAuditLog = useCallback((action: string, module: string, userOverride?: User) => {
    const user = userOverride || currentUser;
    const newLog: AuditTrail = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: user ? user.name : 'Guest',
      role: user ? user.role : 'Operator',
      action,
      module,
      ipAddress: '114.79.12.' + Math.floor(Math.random() * 254 + 1)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser, setAuditLogs]);

  // Offline syncing
  useEffect(() => {
    const handleOnline = () => {
      const offlineReports = JSON.parse(localStorage.getItem('alsintan_offline_reports') || '[]');
      if (offlineReports.length > 0) {
        setLaporanList(prev => [...offlineReports, ...prev]);
        localStorage.removeItem('alsintan_offline_reports');
        addAuditLog(`Menyinkronkan ${offlineReports.length} laporan offline`, 'Sistem Sinkronisasi');
        toast.success(`🌐 ${offlineReports.length} laporan offline berhasil disinkronkan!`);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [addAuditLog]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveMenu('dashboard');
    localStorage.setItem('alsintan_user', JSON.stringify(user));
    addAuditLog('Login Berhasil', 'Autentikasi', user);
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog('Logout Pengguna', 'Autentikasi', currentUser);
    }
    setCurrentUser(null);
    localStorage.removeItem('alsintan_user');
    localStorage.removeItem('alsintan_remembered_uid'); // Clear remembered login to prevent auto-login loop
  };
  const handleMenuClick = (menu: typeof activeMenu) => {
    setActiveMenu(menu);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-app-bg min-h-screen font-sans antialiased text-slate-800">
      <Toaster position="top-right" reverseOrder={false} />
      {!currentUser ? (
        <LoginView 
          onLoginSuccess={handleLogin} 
          localAccounts={localAccounts}
          setLocalAccounts={setLocalAccounts}
        />
      ) : (
        <div className="min-h-screen flex flex-col">
          {/* Desktop Header */}
          <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40 shadow-xs print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center font-bold text-white overflow-hidden">
                  {logoType !== 'default' && logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Sprout className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 leading-tight">{portalTitle}</h1>
                  <p className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">{portalSubtitle}</p>
                </div>
              </div>

              {/* Desktop Nav Actions */}
              <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-3 text-right hover:bg-slate-50 p-1.5 rounded-xl border border-transparent hover:border-slate-200/60 transition-all cursor-pointer"
                  title="Klik untuk Edit Profil & Foto"
                >
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-800 flex items-center gap-1 justify-end">
                      {currentUser?.name} <span className="text-[10px]">✏️</span>
                    </p>
                    <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider block mt-0.5">
                      Role: {currentUser?.role}
                    </span>
                  </div>
                  <img
                    src={currentUser?.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={currentUser?.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-blue-600 shadow-sm referrerPolicy='no-referrer'"
                  />
                </button>

                <div className="border-l border-slate-200 h-8"></div>

                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                >
                  {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
                </button>

                <div className="border-l border-slate-200 h-8"></div>

                {/* Internal Warning Notification System for Coordinator / Admin */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition-all cursor-pointer relative"
                    title="Notifikasi Peringatan Kerusakan & Servis"
                  >
                    <Bell className={`w-5 h-5 ${systemNotifications.length > 0 ? 'text-red-500 animate-bounce' : 'text-slate-500'}`} />
                    {systemNotifications.length > 0 && (
                      <span className="absolute top-0.5 right-0.5 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3.5 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden text-xs">
                      <div className="p-3 bg-red-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="font-extrabold text-red-900 uppercase tracking-wider text-[10px]">Peringatan Brigade ({systemNotifications.length})</span>
                        </div>
                        {systemNotifications.length > 0 && (
                          <span className="bg-red-100 text-red-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Tindakan Cepat</span>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {systemNotifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-500">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="font-bold text-slate-800">Semua Armada Prima!</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Tidak ada kerusakan terdeteksi atau jadwal servis terlewat.</p>
                          </div>
                        ) : (
                          systemNotifications.map((notif) => (
                            <div key={notif.id} className="p-3.5 hover:bg-slate-50/80 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {notif.type === 'kerusakan' ? (
                                    <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                                      <Wrench className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-black text-slate-800 text-[10.5px] leading-tight">{notif.title}</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                      notif.severity === 'Berat' || notif.severity === 'Penting'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {notif.severity}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 text-[10px] leading-relaxed font-semibold">
                                    {notif.message}
                                  </p>
                                  <div className="flex items-center justify-between pt-1.5 text-[9px] text-slate-400">
                                    <span className="flex items-center gap-1 font-bold">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {notif.date}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setActiveMenu('input');
                                        setIsNotifOpen(false);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 underline font-black cursor-pointer"
                                    >
                                      Tindak Lanjuti →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-l border-slate-200 h-8"></div>
                
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          </header>

          {/* Layout Wrapper with Side Menu */}
          <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 gap-6">
            
            {/* Desktop Left Sidebar Navigation */}
            <aside className="hidden md:block w-64 shrink-0 space-y-4">
              <div className="bg-blue-900 rounded-xl border border-blue-950/20 p-4 shadow-sm text-blue-100">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-3 px-1">Menu Operasional Aplikasi</p>
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeMenu === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-blue-100 hover:text-white hover:bg-blue-800'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 text-white' : 'text-blue-400'}`} />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main View Area */}
            <main className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMenu}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {activeMenu === 'dashboard' && (
                    <DashboardView
                      userRole={currentUser?.role || ''}
                      currentUser={currentUser!}
                      selectedProvince={selectedProvince}
                      setSelectedProvince={setSelectedProvince}
                      laporanList={scopedLaporanList}
                      alsintanList={scopedAlsintanList}
                      serviceList={scopedServiceList}
                      kerusakanList={scopedKerusakanList}
                      targets={mockTargetRealisasi}
                      brigades={scopedBrigades}
                      operators={scopedOperators}
                      setIsWaBillingOpen={setIsWaBillingOpen}
                    />
                  )}
                  {activeMenu === 'master' && (
                    <MasterDataView
                      userRole={currentUser?.role || ''}
                      brigades={scopedBrigades}
                      setBrigades={setBrigades}
                      alsintanList={scopedAlsintanList}
                      setAlsintanList={setAlsintanList}
                      operators={scopedOperators}
                      setOperators={setOperators}
                    />
                  )}
                  {activeMenu === 'validasi' && (
                    <ValidasiLaporanView
                      laporanList={scopedLaporanList}
                      setLaporanList={setLaporanList}
                      currentUser={currentUser!}
                    />
                  )}
                  {(activeMenu === 'input' || activeMenu === 'service' || activeMenu === 'kerusakan') && (
                    <OperationalForms
                      userRole={currentUser?.role || ''}
                      currentUser={currentUser}
                      alsintanList={scopedAlsintanList}
                      operators={scopedOperators}
                      laporanList={scopedLaporanList}
                      setLaporanList={setLaporanList}
                      serviceList={scopedServiceList}
                      setServiceList={setServiceList}
                      kerusakanList={scopedKerusakanList}
                      setKerusakanList={setKerusakanList}
                      onAddAuditLog={(act, mod) => addAuditLog(act, mod)}
                      brigades={scopedBrigades}
                      activeFormTab={
                        activeMenu === 'input'
                          ? 'laporan'
                          : activeMenu === 'service'
                            ? 'service'
                            : 'kerusakan'
                      }
                    />
                  )}
                  {activeMenu === 'telemetri' && (
                    <MonitoringTrackingView
                      brigades={scopedBrigades}
                      alsintanList={scopedAlsintanList}
                      operators={scopedOperators}
                      laporanList={scopedLaporanList}
                    />
                  )}
                  {activeMenu === 'laporan' && (
                    <ReportsExportsView
                      laporanList={scopedLaporanList}
                      brigades={scopedBrigades}
                      alsintanList={scopedAlsintanList}
                      operators={scopedOperators}
                      currentUser={currentUser!}
                    />
                  )}
                  {activeMenu === 'pengaturan' && (
                    <SecuritySettingsView
                      currentUser={currentUser!}
                      auditLogs={auditLogs}
                      localAccounts={localAccounts}
                      setLocalAccounts={setLocalAccounts}
                      logoType={logoType}
                      setLogoType={setLogoType}
                      logoUrl={logoUrl}
                      setLogoUrl={setLogoUrl}
                      portalTitle={portalTitle}
                      setPortalTitle={setPortalTitle}
                      portalSubtitle={portalSubtitle}
                      setPortalSubtitle={setPortalSubtitle}
                      loginTitle={loginTitle}
                      setLoginTitle={setLoginTitle}
                      loginSubtitle={loginSubtitle}
                      setLoginSubtitle={setLoginSubtitle}
                    />
                  )}
                  {activeMenu === 'sdlc' && (
                    <SdlcDocumentation />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Mobile Bottom Floating Action Bar */}
          <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center gap-4">
            <button
              onClick={() => handleMenuClick('input')}
              className={`pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full shadow-lg transition-transform active:scale-95 ${
                activeMenu === 'input' 
                  ? 'bg-blue-600 text-white shadow-blue-500/30' 
                  : 'bg-white text-blue-600 border border-blue-100 shadow-slate-200'
              }`}
            >
              <PenTool className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">Lapor Harian</span>
            </button>
            
            <button
              onClick={() => handleMenuClick('kerusakan')}
              className={`pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full shadow-lg transition-transform active:scale-95 ${
                activeMenu === 'kerusakan' 
                  ? 'bg-red-600 text-white shadow-red-500/30' 
                  : 'bg-white text-red-600 border border-red-100 shadow-slate-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">Lapor Rusak</span>
            </button>
          </div>
        </div>
      )}
      <WABillingModal
        isOpen={isWaBillingOpen}
        onClose={() => setIsWaBillingOpen(false)}
        brigades={brigades}
        laporanList={laporanList}
      />

      {currentUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onSave={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('alsintan_user', JSON.stringify(updatedUser));
            
            // Update localAccounts so the user can login with new credentials/password
            setLocalAccounts(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            
            addAuditLog(`Memperbarui profil user: ${updatedUser.name}`, 'Profil Pengguna');
            setIsProfileOpen(false);
          }}
        />
      )}
    </div>
  );
}
