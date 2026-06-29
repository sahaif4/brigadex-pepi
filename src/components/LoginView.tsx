import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { Sprout, UserPlus, ArrowLeft, Trash2, Eye, EyeOff } from 'lucide-react';
import { mockUsers, mockBrigades } from '../data/mockData';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  localAccounts: User[];
  setLocalAccounts: React.Dispatch<React.SetStateAction<User[]>>;
}

export default function LoginView({ onLoginSuccess, localAccounts, setLocalAccounts }: LoginViewProps) {
  // Modes: 'choose' | 'register'
  const [viewMode, setViewMode] = useState<'choose' | 'register'>('choose');
  const [loginRole, setLoginRole] = useState<Role>('Super Admin');
  
  // Credentials input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Customization Branding States loaded from localStorage
  const [logoType, setLogoType] = useState(() => localStorage.getItem('alsintan_logo_type') || 'default');
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('alsintan_logo_url') || '');
  const [portalTitle, setPortalTitle] = useState(() => localStorage.getItem('alsintan_portal_title') || 'Laporan Kinerja Alsintan');
  const [portalSubtitle, setPortalSubtitle] = useState(() => localStorage.getItem('alsintan_portal_subtitle') || 'KEMENTAN BRIGADE PANGAN');
  const [loginTitle, setLoginTitle] = useState(() => localStorage.getItem('alsintan_login_title') || 'Login seperti Akun Google');
  const [loginSubtitle, setLoginSubtitle] = useState(() => localStorage.getItem('alsintan_login_subtitle') || 'Pilih profil Anda untuk mulai mengisi laporan Brigade Pangan secara praktis');

  // Load custom branding on mount (if dynamic updates needed, useEffect can be used, but state is already initialized)
  useEffect(() => {
    // Keep for potential real-time sync if needed, though initial state is set
  }, []);

  // Registration input
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('Operator');
  const [regProvince, setRegProvince] = useState('Kepulauan Bangka Belitung');
  const [regBrigadeId, setRegBrigadeId] = useState('brg-006');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    // Handle login by role, name/email, and password
    const matchedUser = localAccounts.find(
      (u) => 
        (u.name.toLowerCase().includes(email.toLowerCase()) || 
         u.id.toLowerCase() === email.toLowerCase() ||
         u.email?.toLowerCase() === email.toLowerCase()) && 
         u.role === loginRole
    );

    if (matchedUser) {
      if (matchedUser.isApproved === false) {
        setError('🔒 Akses Ditolak: Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Super Admin. Silakan hubungi Koordinator Lapangan atau Super Admin untuk mengaktifkan akun Anda.');
        return;
      }
      
      const isPasswordValid = matchedUser.password 
        ? matchedUser.password === password
        : (password === '123456' || password.length >= 4 || !password); // fallback for existing mock users

      if (isPasswordValid) {
        onLoginSuccess(matchedUser);
        if (rememberMe) {
          localStorage.setItem('alsintan_remembered_uid', matchedUser.id);
        }
      } else {
        setError('PIN / Password salah. Silakan coba lagi.');
      }
    } else {
      setError(`Akun tidak ditemukan untuk Peran "${loginRole}" dengan nama/email "${email}". Pastikan ejaan Nama/ID Anda sesuai, atau Daftar Baru.`);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (!regName || !regEmail) {
      setError('Nama Lengkap dan Email/ID wajib diisi!');
      return;
    }

    const newUid = 'usr-' + Date.now();
    const newUser: User = {
      id: newUid,
      name: regName,
      role: regRole,
      brigadeId: regBrigadeId,
      province: regProvince,
      regency: mockBrigades.find(b => b.id === regBrigadeId)?.regency,
      password: regPassword,
      isApproved: false // Requires Super Admin approval!
    };

    setLocalAccounts(prev => [newUser, ...prev]);
    setDoc(doc(db, 'users', newUser.id), newUser).catch(console.error);

    setEmail(newUser.id + '@alsintan.id');
    
    // Switch to select account screen with success notice, instead of auto login
    setViewMode('choose');
    setSuccessNotice(`✓ Pendaftaran akun "${regName}" berhasil dikirim! Status akun Anda saat ini "Menunggu Persetujuan" (Pending Approval) oleh Super Admin. Silakan hubungi Koordinator Lapangan atau Super Admin untuk mengaktifkannya.`);
    
    // Reset inputs
    setRegName('');
    setRegEmail('');
    setRegPassword('');
  };

  // Remove a locally added user card
  const handleRemoveAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = localAccounts.filter(u => u.id !== id);
    setLocalAccounts(filtered);
  };

  // Attempt automatic login if a remembered UID exists
  useEffect(() => {
    const rememberedUid = localStorage.getItem('alsintan_remembered_uid');
    if (rememberedUid) {
      const matchedUser = localAccounts.find(u => u.id === rememberedUid);
      if (matchedUser) {
        if (matchedUser.isApproved === false) {
          localStorage.removeItem('alsintan_remembered_uid');
          setError('🔒 Akses Ditolak: Akun Anda memerlukan persetujuan Super Admin.');
        } else {
          onLoginSuccess(matchedUser);
        }
      }
    }
  }, [localAccounts, onLoginSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 mb-10">
        {/* Customizable Logo Emblem */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-lg border border-slate-200 mb-6 overflow-hidden p-3 transform hover:scale-105 transition-transform duration-300">
          {logoType !== 'default' && logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo Kampus / Organisasi" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=100&auto=format&fit=crop&q=80';
              }}
            />
          ) : (
            <Sprout className="w-16 h-16 text-emerald-600" />
          )}
        </div>
        
        {/* Dynamic Portal Title and Subtitle */}
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-tight px-2">
          {portalTitle}
        </h2>
        <p className="mt-2 text-sm text-slate-600 font-medium tracking-wide">
          {portalSubtitle}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-8 shadow-2xl rounded-3xl border border-slate-100 sm:px-10 relative overflow-hidden transition-all duration-300">
          
          {/* Top Google-style progress indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600"></div>

          {successNotice && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl text-[12px] font-semibold leading-snug">
              {successNotice}
            </div>
          )}

          {/* VIEW: CHOOSE ACCOUNT WITH DROPDOWN AND PIN INPUT */}
          {viewMode === 'choose' && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="text-center">
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{loginTitle}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{loginSubtitle}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  Peran Pengguna (Role)
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as Role)}
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Super Admin">Super Admin (Pusat)</option>
                  <option value="Provinsi">Admin Kelsi Provinsi</option>
                  <option value="Kabupaten">Admin Katimker Kabupaten</option>
                  <option value="Koordinator">Manajer BP (Koordinator)</option>
                  <option value="Operator">Operator</option>
                </select>
              </div>

              <div>
                <label htmlFor="email" className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  Nama Pengguna / Email
                </label>
                <input
                  id="email"
                  type="text"
                  required
                  placeholder="Contoh: Irwan Pepi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Shared Password PIN Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    PIN Sandi Akses (minimal 4 angka)
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold"></span>
                </div>
                <div className="relative rounded-md shadow-3xs">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Masukkan PIN / Sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember_me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="remember_me" className="text-xs text-slate-600 font-semibold cursor-pointer select-none">
                  Ingat Saya di Perangkat Ini (Simpan Password)
                </label>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Masuk Ke Aplikasi
              </button>
            </form>
          )}

          {/* VIEW: REGISTER NEW ACCOUNT */}
          {viewMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setViewMode('choose')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-md font-bold text-slate-800">Pendaftaran Akun Baru</h3>
                  <p className="text-[10px] text-slate-400">Daftar sekali dan langsung isi laporan</p>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Nama Lengkap Anggota BP</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Irwan Wijaya"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase">ID Pengguna / Email</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: irwan.pepi2020@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase">PIN Sandi (min 4 angka)</label>
                <input
                  type="password"
                  required
                  placeholder="PIN angka Anda"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Peran / Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Operator">Operator Lapangan (BP)</option>
                    <option value="Koordinator">Koordinator Brigade</option>
                    <option value="Kabupaten">Admin Kabupaten (Katimker)</option>
                    <option value="Provinsi">Koordinator Provinsi</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Provinsi Tugas</label>
                  <select
                    value={regProvince}
                    onChange={(e) => setRegProvince(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Kepulauan Bangka Belitung">Kepulauan Bangka Belitung</option>
                    <option value="Sumatera Selatan">Sumatera Selatan</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Kalimantan Barat">Kalimantan Barat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Pilih Brigade &amp; Kabupaten</label>
                <select
                  value={regBrigadeId}
                  onChange={(e) => setRegBrigadeId(e.target.value)}
                  className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  {mockBrigades.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Kab. {b.regency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="remember_reg"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="remember_reg" className="text-xs text-slate-600 font-semibold cursor-pointer">
                  Simpan Password / Ingat Sandi Saya (Praktis)
                </label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Daftar &amp; Masuk ke Aplikasi
              </button>
            </form>
          )}

        </div>

        {/* Informative Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400 leading-normal bg-white/60 p-3 rounded-lg border border-slate-200/50 backdrop-blur-xs">
          💡 <strong>Tips Praktis:</strong> Gunakan opsi <strong>"Simpan Password / Ingat Saya"</strong> agar saat membuka aplikasi di HP/kantor BP, Anda langsung diarahkan ke halaman isi laporan harian tanpa perlu login ulang atau memilih Kabupaten kembali!
        </div>
      </div>
    </div>
  );
}
