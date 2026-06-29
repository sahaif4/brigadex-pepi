import React, { useState } from 'react';
import { Role, AuditTrail, User } from '../types';
import { Shield, Key, Eye, ToggleLeft, ToggleRight, List, Terminal, Activity, Database, CheckCircle, Lock, Sliders, Check, UserCheck, UserX, Trash2, AlertTriangle, Search, UserPlus } from 'lucide-react';
import { mockBrigades } from '../data/mockData';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface SecuritySettingsViewProps {
  currentUser: User;
  auditLogs: AuditTrail[];
  localAccounts: User[];
  setLocalAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  logoType: string;
  setLogoType: React.Dispatch<React.SetStateAction<string>>;
  logoUrl: string;
  setLogoUrl: React.Dispatch<React.SetStateAction<string>>;
  portalTitle: string;
  setPortalTitle: React.Dispatch<React.SetStateAction<string>>;
  portalSubtitle: string;
  setPortalSubtitle: React.Dispatch<React.SetStateAction<string>>;
  loginTitle: string;
  setLoginTitle: React.Dispatch<React.SetStateAction<string>>;
  loginSubtitle: string;
  setLoginSubtitle: React.Dispatch<React.SetStateAction<string>>;
}

export default function SecuritySettingsView({ 
  currentUser, 
  auditLogs, 
  localAccounts, 
  setLocalAccounts,
  logoType,
  setLogoType,
  logoUrl,
  setLogoUrl,
  portalTitle,
  setPortalTitle,
  portalSubtitle,
  setPortalSubtitle,
  loginTitle,
  setLoginTitle,
  loginSubtitle,
  setLoginSubtitle
}: SecuritySettingsViewProps) {
  const userRole = currentUser.role;
  const [activeSubTab, setActiveSubTab] = useState<'rbac' | 'audit' | 'database' | 'branding' | 'approval'>('rbac');
  const [searchAudit, setSearchAudit] = useState('');

  // Local account creation states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('Operator');
  const [newBrigadeId, setNewBrigadeId] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Helper to check if admin can manage target user
  const canManageUser = (admin: User, target: User) => {
    if (admin.role === 'Super Admin') return true;
    if (admin.role === 'Provinsi' && target.province === admin.province) return true;
    if (admin.role === 'Kabupaten' && target.regency === admin.regency && target.province === admin.province) return true;
    return false;
  };

  const handleApproveUser = (userId: string) => {
    const target = localAccounts.find(u => u.id === userId);
    if (!target) return;
    if (!canManageUser(currentUser, target)) {
      alert('Akses Ditolak: Anda tidak memiliki wewenang untuk mengelola akun ini!');
      return;
    }
    setLocalAccounts(prev => prev.map(u => u.id === userId ? { ...u, isApproved: true } : u));
    updateDoc(doc(db, 'users', userId), { isApproved: true }).catch(console.error);
  };

  const handleDisapproveUser = (userId: string) => {
    const target = localAccounts.find(u => u.id === userId);
    if (!target) return;
    if (!canManageUser(currentUser, target)) {
      alert('Akses Ditolak: Anda tidak memiliki wewenang untuk menonaktifkan akun ini!');
      return;
    }
    setLocalAccounts(prev => prev.map(u => u.id === userId ? { ...u, isApproved: false } : u));
    updateDoc(doc(db, 'users', userId), { isApproved: false }).catch(console.error);
  };

  const handleDeleteUser = (userId: string) => {
    const target = localAccounts.find(u => u.id === userId);
    if (!target) return;
    if (!canManageUser(currentUser, target)) {
      alert('Akses Ditolak: Anda tidak memiliki wewenang untuk menghapus akun ini!');
      return;
    }
    if (window.confirm('Apakah Anda yakin ingin menghapus permanen akun pengguna ini dari perangkat ini?')) {
      setLocalAccounts(prev => prev.filter(u => u.id !== userId));
      deleteDoc(doc(db, 'users', userId)).catch(console.error);
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newName || !newEmail || !newPassword) {
      setFormError('Semua field wajib diisi!');
      return;
    }

    // Check if username/email already exists
    const exists = localAccounts.some(u => u.email?.toLowerCase() === newEmail.toLowerCase() || u.id.toLowerCase() === newEmail.toLowerCase());
    if (exists) {
      setFormError('Nama pengguna / email sudah terdaftar!');
      return;
    }

    // Determine target brigade and regency
    let targetBrigadeId = newBrigadeId;
    let targetRegency = currentUser.role === 'Kabupaten' ? currentUser.regency : undefined;

    if (newRole === 'Kabupaten' || newRole === 'Provinsi' || newRole === 'Super Admin') {
      targetBrigadeId = 'all';
    } else {
      const selectedBrigade = mockBrigades.find(b => b.id === newBrigadeId);
      if (selectedBrigade) {
        targetRegency = selectedBrigade.regency;
      }
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: newName,
      role: newRole,
      brigadeId: targetBrigadeId,
      province: currentUser.role === 'Kabupaten' || currentUser.role === 'Provinsi' ? currentUser.province : 'Kepulauan Bangka Belitung',
      regency: targetRegency,
      email: newEmail,
      phone: '081234567890',
      password: newPassword,
      isApproved: true // Direct creation by admins is pre-approved!
    };

    setLocalAccounts(prev => [newUser, ...prev]);
    setDoc(doc(db, 'users', newUser.id), newUser).catch(console.error);
    
    setFormSuccess(`✓ Akun "${newName}" (${newRole}) berhasil ditambahkan dan langsung aktif!`);
    
    // Reset inputs
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    // Auto collapse after 2s
    setTimeout(() => {
      setShowAddForm(false);
      setFormSuccess('');
    }, 2000);
  };

  // Branding States
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('alsintan_logo_type', logoType);
    localStorage.setItem('alsintan_logo_url', logoUrl);
    localStorage.setItem('alsintan_portal_title', portalTitle);
    localStorage.setItem('alsintan_portal_subtitle', portalSubtitle);
    localStorage.setItem('alsintan_login_title', loginTitle);
    localStorage.setItem('alsintan_login_subtitle', loginSubtitle);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetBranding = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan semua logo dan teks ke setelan default pabrik?')) {
      setLogoType('default');
      setLogoUrl('');
      setPortalTitle('Sistem Informasi Laporan Kinerja Alsintan');
      setPortalSubtitle('Sistem Informasi Pemantauan & Pelaporan Alat Mesin Pertanian');
      setLoginTitle('Login seperti Akun Google');
      setLoginSubtitle('Pilih profil Anda untuk mulai mengisi laporan Brigade Pangan secara praktis');

      localStorage.setItem('alsintan_logo_type', 'default');
      localStorage.setItem('alsintan_logo_url', '');
      localStorage.setItem('alsintan_portal_title', 'Sistem Informasi Laporan Kinerja Alsintan');
      localStorage.setItem('alsintan_portal_subtitle', 'Sistem Informasi Pemantauan & Pelaporan Alat Mesin Pertanian');
      localStorage.setItem('alsintan_login_title', 'Login seperti Akun Google');
      localStorage.setItem('alsintan_login_subtitle', 'Pilih profil Anda untuk mulai mengisi laporan Brigade Pangan secara praktis');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Simulated Roles permission matrix
  const [permissions, setPermissions] = useState([
    { module: 'Dashboard Kinerja', roles: ['Admin', 'Koordinator', 'Provinsi', 'Pusat', 'Super Admin', 'Kabupaten'] },
    { module: 'Laporan Harian Kerja', roles: ['Operator', 'Koordinator', 'Super Admin'] },
    { module: 'Input BBM / Oli', roles: ['Operator', 'Koordinator', 'Super Admin'] },
    { module: 'Data Master Alsintan/Operator', roles: ['Admin', 'Koordinator', 'Super Admin', 'Kabupaten'] },
    { module: 'Manajemen Brigade Wilayah', roles: ['Admin', 'Super Admin', 'Kabupaten'] },
    { module: 'Notifikasi Alarm Kerusakan', roles: ['Koordinator', 'Provinsi', 'Pusat', 'Super Admin', 'Kabupaten'] },
    { module: 'Log Audit Keamanan Aplikasi', roles: ['Super Admin'] },
  ]);

  const togglePermission = (moduleName: string, roleToToggle: Role) => {
    if (userRole !== 'Super Admin') {
      alert('Galat Keamanan: Hanya Super Admin yang diizinkan memodifikasi matriks hak akses RBAC!');
      return;
    }

    setPermissions(prev => prev.map(p => {
      if (p.module === moduleName) {
        const hasRole = p.roles.includes(roleToToggle);
        const newRoles = hasRole 
          ? p.roles.filter(r => r !== roleToToggle) 
          : [...p.roles, roleToToggle];
        return { ...p, roles: newRoles };
      }
      return p;
    }));
  };

  const filteredLogs = auditLogs.filter(log => 
    log.username.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.module.toLowerCase().includes(searchAudit.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'rbac', label: 'Matriks Hak Akses (RBAC)', icon: Shield },
          { id: 'branding', label: 'Kustomisasi Branding', icon: Sliders },
          { id: 'approval', label: 'Persetujuan Anggota (Approval)', icon: UserCheck },
          { id: 'audit', label: 'Audit Trail / Log Aktivitas', icon: Terminal },
          { id: 'database', label: 'Status &amp; Enkripsi Server', icon: Database },
        ].map((sub) => {
          const Icon = sub.icon;
          const isSelected = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <div dangerouslySetInnerHTML={{ __html: sub.label }}></div>
            </button>
          );
        })}
      </div>

      {activeSubTab === 'rbac' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-500 mt-1">Definisikan modul sistem yang boleh diakses dan dimutasi oleh setiap peran. Tipe izin menggunakan standar keamanan JWT.</p>
          </div>

          {userRole !== 'Super Admin' && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 font-medium">
              🔒 <strong>Mode Viewer:</strong> Anda masuk sebagai <strong className="text-slate-900">{userRole}</strong>. Hanya peran <strong className="text-slate-900">Super Admin</strong> yang dapat mengaktifkan/menonaktifkan switch matriks di bawah ini.
            </div>
          )}

          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <th className="p-3">Modul Aplikasi</th>
                  {['Operator', 'Koordinator', 'Admin', 'Provinsi', 'Pusat', 'Super Admin'].map(r => (
                    <th key={r} className="p-3 text-center font-mono text-[10px]">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((p) => (
                  <tr key={p.module} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{p.module}</td>
                    {['Operator', 'Koordinator', 'Admin', 'Provinsi', 'Pusat', 'Super Admin'].map(roleName => {
                      const isAllowed = p.roles.includes(roleName);
                      return (
                        <td key={roleName} className="p-3 text-center">
                          <button
                            onClick={() => togglePermission(p.module, roleName as Role)}
                            disabled={userRole !== 'Super Admin'}
                            className={`inline-flex items-center justify-center p-1 rounded-full cursor-pointer focus:outline-none transition-colors ${
                              isAllowed 
                                ? 'text-emerald-600 hover:bg-emerald-50' 
                                : 'text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {isAllowed ? (
                              <ToggleRight className="w-7 h-7" />
                            ) : (
                              <ToggleLeft className="w-7 h-7" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-600" /> Audit Trail (Append-Only Log)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Rekaman aktivitas penting untuk keperluan kepatuhan, pemantauan fraud, dan forensik keamanan digital.</p>
            </div>
            <div>
              <input
                type="text"
                placeholder="Cari logs (User/Aksi/Modul)..."
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 w-full max-w-xs"
              />
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto border border-slate-800 font-mono text-[11px] text-slate-300 h-96 overflow-y-auto space-y-2.5">
            <p className="text-slate-500 border-b border-slate-800 pb-2 flex justify-between">
              <span>-- INITIATING AUDIT MONITOR (SATELLITE SYNC: OK) --</span>
              <span className="text-emerald-400">STATUS: LIVE STREAMING</span>
            </p>

            {filteredLogs.map((log) => (
              <div key={log.id} className="hover:bg-slate-900 p-1.5 rounded transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="space-x-1.5">
                  <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="text-amber-400 font-bold">{log.username}</span>
                  <span className="text-sky-400 font-semibold text-[10px]">({log.role})</span>
                  <span className="text-slate-100">{log.action}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex gap-2">
                  <span>Modul: <strong className="text-teal-400">{log.module}</strong></span>
                  <span>IP: <strong className="text-slate-400">{log.ipAddress}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'database' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col justify-between">
            <div>
              <Database className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Database MySQL / MariaDB</h4>
              <p className="text-xs text-slate-500 mt-1">Penyimpanan Transaksi Utama (Relasional 3NF)</p>
            </div>
            <div className="mt-4 bg-emerald-50 text-emerald-800 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Terhubung (Latency 2ms)
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col justify-between">
            <div>
              <Activity className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Redis Cache &amp; Supervisor</h4>
              <p className="text-xs text-slate-500 mt-1">Caching Data Geografis &amp; Pemantauan Antrean Laporan</p>
            </div>
            <div className="mt-4 bg-emerald-50 text-emerald-800 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Aktif (Caching Terpasang)
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col justify-between">
            <div>
              <Shield className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sertifikat SSL / TLS 1.3</h4>
              <p className="text-xs text-slate-500 mt-1">Enkripsi End-to-End Pengiriman Formulir Lapangan</p>
            </div>
            <div className="mt-4 bg-emerald-50 text-emerald-800 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Enkripsi HTTPS Aktif
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'branding' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              🎨 Kustomisasi Portal &amp; Branding Login
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sebagai <strong>Super Admin</strong>, Anda memiliki kendali penuh untuk menyesuaikan logo, nama aplikasi, sub-judul, serta teks pada halaman utama login agar sesuai dengan identitas resmi kampus / organisasi Anda.
            </p>
          </div>

          {userRole !== 'Super Admin' && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-800 font-bold flex items-center gap-2">
              🔒 <strong>Mode Akses Terbatas:</strong> Anda masuk sebagai <span className="text-slate-900 underline">{userRole}</span>. Hanya peran <span className="text-slate-900 underline">Super Admin</span> yang memiliki hak akses penuh untuk menyimpan perubahan konfigurasi branding ini.
            </div>
          )}

          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold animate-pulse">
              ✓ Setelan kustomisasi berhasil disimpan dan diterapkan pada seluruh halaman portal!
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Inputs */}
            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">1. Konfigurasi Logo Aplikasi</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Tipe Logo Utama</label>
                  <select
                    value={logoType}
                    onChange={(e) => {
                      setLogoType(e.target.value);
                      if (e.target.value !== 'custom') setLogoUrl('');
                    }}
                    disabled={userRole !== 'Super Admin'}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white cursor-pointer"
                  >
                    <option value="default">Default Tunas Hijau (Sprout Emblem)</option>
                    <option value="custom">Logo Gambar Kustom (via URL)</option>
                    <option value="file_upload">Logo Gambar Kustom (Upload File)</option>
                  </select>
                </div>

                {logoType === 'custom' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Tautan URL Logo Kustom</label>
                    <input
                      type="url"
                      required
                      placeholder="Contoh: https://pepi.ac.id/wp-content/uploads/2021/04/Logo-PEPI-1.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      disabled={userRole !== 'Super Admin'}
                      className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white font-mono"
                    />
                  </div>
                )}
                
                {logoType === 'file_upload' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Upload File Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={userRole !== 'Super Admin'}
                      className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">2. Judul &amp; Informasi Aplikasi</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Judul Utama Sistem (Title)</label>
                  <input
                    type="text"
                    required
                    value={portalTitle}
                    onChange={(e) => setPortalTitle(e.target.value)}
                    disabled={userRole !== 'Super Admin'}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Sub-Judul Informasi (Subtitle)</label>
                  <textarea
                    required
                    rows={2}
                    value={portalSubtitle}
                    onChange={(e) => setPortalSubtitle(e.target.value)}
                    disabled={userRole !== 'Super Admin'}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">3. Informasi Form Login</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Judul Box Login</label>
                  <input
                    type="text"
                    required
                    value={loginTitle}
                    onChange={(e) => setLoginTitle(e.target.value)}
                    disabled={userRole !== 'Super Admin'}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Sub-Judul Box Login</label>
                  <input
                    type="text"
                    required
                    value={loginSubtitle}
                    onChange={(e) => setLoginSubtitle(e.target.value)}
                    disabled={userRole !== 'Super Admin'}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {userRole === 'Super Admin' && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                  >
                    Simpan Konfigurasi Branding
                  </button>
                  <button
                    type="button"
                    onClick={handleResetBranding}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-200"
                  >
                    Reset Ke Default
                  </button>
                </div>
              )}
            </form>

            {/* Live Preview Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                👁️ Live Preview (Pratinjau Langsung Halaman Login)
              </h4>
              
              <div className="border border-slate-300 rounded-2xl p-6 bg-slate-100 flex flex-col justify-center items-center shadow-inner relative overflow-hidden min-h-[400px]">
                {/* Simulated Google bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-yellow-400 to-blue-500"></div>
                
                {/* Live Head */}
                <div className="text-center w-full max-w-sm">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md border border-slate-200/60 mb-3 overflow-hidden p-1">
                    {logoType !== 'default' && logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo Kustom" 
                        className="w-full h-full object-contain rounded-full"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=100&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <Shield className="w-10 h-10 text-emerald-600" />
                    )}
                  </div>
                  
                  <h3 className="text-xs font-black text-slate-900 tracking-tight leading-tight">
                    {portalTitle}
                  </h3>
                  <p className="text-[9px] text-slate-500 font-medium mt-1">
                    {portalSubtitle}
                  </p>
                  <div className="mt-2 text-[8px] text-emerald-800 bg-emerald-100/60 inline-block px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    BrigadeX Pangan Politeknik Enjiniring Pertanian Indonesia
                  </div>
                </div>

                {/* Simulated Login Card */}
                <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full max-w-xs space-y-3">
                  <div className="text-center">
                    <h5 className="text-[10px] font-bold text-slate-800">{loginTitle}</h5>
                    <p className="text-[8px] text-slate-400 mt-0.5 leading-snug">{loginSubtitle}</p>
                  </div>

                  {/* Dropdown Select Mock */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-1">Pilih Profil Anda</label>
                    <div className="border border-slate-200 rounded-lg px-2 py-1.5 text-[9px] font-semibold text-slate-700 bg-slate-50 flex justify-between items-center cursor-not-allowed">
                      <span>Budi Santoso (Operator • BP Rias Makmur)</span>
                      <span className="text-slate-400 text-[8px]">▼</span>
                    </div>
                  </div>

                  {/* Password Input Mock */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-1">PIN Sandi Akses</label>
                    <div className="border border-slate-200 rounded-lg px-2 py-1.5 text-[9px] text-slate-300 bg-slate-50 cursor-not-allowed">
                      ••••••
                    </div>
                  </div>

                  <div className="h-6.5 bg-orange-600 text-white font-extrabold text-[8px] uppercase tracking-wider rounded-lg flex items-center justify-center cursor-not-allowed shadow-3xs">
                    Masuk Ke Aplikasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'approval' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                📋 Persetujuan & Manajemen Akun Anggota
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {currentUser.role === 'Super Admin' && 'Sebagai Super Admin, Anda memiliki hak penuh untuk memverifikasi, menyetujui, dan menambahkan akun di seluruh wilayah.'}
                {currentUser.role === 'Provinsi' && `Sebagai Admin Provinsi, Anda memiliki hak untuk mengelola dan mendaftarkan akun di wilayah ${currentUser.province}.`}
                {currentUser.role === 'Kabupaten' && `Sebagai Admin Katimker Kabupaten, Anda memiliki hak untuk mengelola dan mendaftarkan akun di wilayah Kabupaten ${currentUser.regency}.`}
              </p>
            </div>
            {(currentUser.role === 'Super Admin' || currentUser.role === 'Provinsi' || currentUser.role === 'Kabupaten') && (
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  // Set default brigade for the form
                  const filteredBg = mockBrigades.filter(b => {
                    if (currentUser.role === 'Kabupaten') return b.regency === currentUser.regency;
                    if (currentUser.role === 'Provinsi') return b.province === currentUser.province;
                    return true;
                  });
                  if (filteredBg.length > 0) {
                    setNewBrigadeId(filteredBg[0].id);
                  }
                  // Set default role based on admin role
                  if (currentUser.role === 'Kabupaten') {
                    setNewRole('Operator');
                  } else {
                    setNewRole('Operator');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {showAddForm ? 'Tutup Form' : 'Tambah Akun Baru'}
              </button>
            )}
          </div>

          {/* ADD USER DIRECTLY FORM */}
          {showAddForm && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Formulir Pembuatan Akun Baru (Langsung Aktif)
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Akun yang dibuat langsung oleh admin akan berstatus langsung aktif (Pre-Approved) tanpa membutuhkan persetujuan lagi.
                </p>
              </div>

              {formError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg font-semibold">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg font-semibold">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleAddUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Nama Lengkap Anggota
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Gunawan"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Email / Nama Pengguna (Login ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: budi.gunawan@alsintan.id atau budi.gunawan"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    PIN Sandi Akses (minimal 4 angka)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sandi demo, contoh: 123456"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Peran / Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as Role)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:ring-1 focus:ring-emerald-500"
                    >
                      {currentUser.role === 'Super Admin' && (
                        <>
                          <option value="Operator">Operator</option>
                          <option value="Koordinator">Manajer BP (Koordinator)</option>
                          <option value="Kabupaten">Admin Kabupaten</option>
                          <option value="Provinsi">Admin Provinsi</option>
                          <option value="Super Admin">Super Admin</option>
                        </>
                      )}
                      {currentUser.role === 'Provinsi' && (
                        <>
                          <option value="Operator">Operator</option>
                          <option value="Koordinator">Manajer BP (Koordinator)</option>
                          <option value="Kabupaten">Admin Kabupaten</option>
                        </>
                      )}
                      {currentUser.role === 'Kabupaten' && (
                        <>
                          <option value="Operator">Operator</option>
                          <option value="Koordinator">Manajer BP (Koordinator)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Wilayah / Brigade Pangan
                    </label>
                    {newRole === 'Kabupaten' || newRole === 'Provinsi' || newRole === 'Super Admin' ? (
                      <div className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-slate-500">
                        Akses Wilayah Semua
                      </div>
                    ) : (
                      <select
                        value={newBrigadeId}
                        onChange={(e) => setNewBrigadeId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:ring-1 focus:ring-emerald-500"
                      >
                        {mockBrigades
                          .filter(b => {
                            if (currentUser.role === 'Kabupaten') return b.regency === currentUser.regency;
                            if (currentUser.role === 'Provinsi') return b.province === currentUser.province;
                            return true;
                          })
                          .map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.regency})
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Simpan Akun
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pending Approvals Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              ⏳ Permohonan Menunggu Persetujuan ({localAccounts.filter(u => !u.isApproved && canManageUser(currentUser, u)).length})
            </h4>

            {localAccounts.filter(u => !u.isApproved && canManageUser(currentUser, u)).length === 0 ? (
              <div className="bg-emerald-50/55 border border-emerald-100 p-5 rounded-xl text-center text-xs text-emerald-800 font-medium">
                ✨ Tidak ada permohonan pendaftaran baru yang menunggu persetujuan di wilayah tugas Anda.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/40">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">ID Pengguna / Email</th>
                      <th className="p-3">Peran (Role)</th>
                      <th className="p-3">Wilayah Tugas &amp; Brigade</th>
                      <th className="p-3 text-center">Tindakan Persetujuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {localAccounts.filter(u => !u.isApproved && canManageUser(currentUser, u)).map((user) => {
                      const userBrigade = mockBrigades.find(b => b.id === user.brigadeId);
                      return (
                        <tr key={user.id} className="hover:bg-slate-50 animate-pulse">
                          <td className="p-3 font-extrabold text-slate-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] uppercase">
                              {user.name.charAt(0)}
                            </div>
                            {user.name}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">{user.email || user.id + '@alsintan.id'}</td>
                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-700">{user.province}</div>
                            <div className="text-[10px] text-slate-400">
                              {userBrigade ? `${userBrigade.name} (Kab. ${userBrigade.regency})` : 'Semua Brigade'}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Setujui
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-lg text-[10px] uppercase tracking-wider border border-rose-200 transition-colors cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Users Directory Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                👥 Direktori Akun Aktif / Terdaftar ({localAccounts.filter(u => u.isApproved !== false && canManageUser(currentUser, u)).length})
              </h4>
              <div className="text-[10px] text-slate-400 font-semibold italic">
                {currentUser.role === 'Super Admin' ? '*Menampilkan semua akun terdaftar.' : `*Menampilkan akun di bawah yurisdiksi Anda.`}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/40">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">Nama Anggota</th>
                    <th className="p-3">ID / Email</th>
                    <th className="p-3">Peran (Role)</th>
                    <th className="p-3">Wilayah &amp; Brigade</th>
                    <th className="p-3 text-center">Status Akses</th>
                    <th className="p-3 text-center">Aksi Manajerial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {localAccounts.filter(u => u.isApproved !== false && canManageUser(currentUser, u)).map((user) => {
                    const userBrigade = mockBrigades.find(b => b.id === user.brigadeId);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="p-3 font-extrabold text-slate-800 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] uppercase">
                            {user.name.charAt(0)}
                          </div>
                          {user.name}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">{user.email || user.id + '@alsintan.id'}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border border-slate-200/50">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-700">{user.province}</div>
                          <div className="text-[10px] text-slate-400">
                            {user.role === 'Kabupaten' && user.regency ? `Kab. ${user.regency}` : (userBrigade ? `${userBrigade.name} (Kab. ${userBrigade.regency})` : 'Semua Wilayah')}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            <Check className="w-2.5 h-2.5" /> Disetujui
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleDisapproveUser(user.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-[10px] uppercase tracking-wider border border-slate-300 transition-colors cursor-pointer"
                              title="Tangguhkan sementara akun ini"
                            >
                              <Lock className="w-3 h-3" /> Tangguhkan
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-lg text-[10px] uppercase tracking-wider border border-rose-200 transition-colors cursor-pointer"
                              title="Hapus permanen akun"
                            >
                              <Trash2 className="w-3 h-3" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
