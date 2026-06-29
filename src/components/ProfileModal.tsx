import React, { useState } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, Mail, Phone, Globe, Image as ImageIcon, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updatedUser: User) => void;
}

const AVATAR_PRESETS = [
  { name: 'Male Operator (Budi)', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { name: 'Female Operator (Siti)', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Male Coordinator (Samsul)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Female Director (Rani)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { name: 'Junior Officer (Ahmad)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Senior Engineer (Heri)', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
];

export default function ProfileModal({ isOpen, onClose, currentUser, onSave }: ProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '.')}@alsintan.id`);
  const [phone, setPhone] = useState(currentUser.phone || '081234567890');
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl || AVATAR_PRESETS[0].url);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState(false);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama pengguna tidak boleh kosong!');
      return;
    }
    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      photoUrl: photoUrl.trim(),
      ...(password ? { password: password } : {})
    };
    onSave(updatedUser);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-x-4 top-[10%] md:max-w-md md:mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="bg-primary-green text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-accent-yellow" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">Edit Profil Saya</h3>
                  <p className="text-[10px] text-emerald-300 font-bold">Identitas Resmi Petugas Kementan</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-emerald-800 rounded-full text-emerald-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Profile Photo Selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Foto Profil &amp; Avatar
                </label>
                
                {/* Current Photo Preview */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-md referrerPolicy='no-referrer'"
                    onError={(e) => {
                      e.currentTarget.src = AVATAR_PRESETS[0].url;
                    }}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Tinjauan Foto Aktif</span>
                    <button
                      type="button"
                      onClick={() => setCustomPhotoInput(!customPhotoInput)}
                      className="text-[10px] font-extrabold text-emerald-700 hover:underline block text-left"
                    >
                      {customPhotoInput ? 'Pilih dari Pilihan Avatar' : 'Atau Masukkan Tautan Kustom ➔'}
                    </button>
                  </div>
                </div>

                {customPhotoInput ? (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="block flex-1">
                        <span className="w-full text-center block bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black px-3 py-2 rounded-lg border border-emerald-200 transition-all cursor-pointer">
                          📁 Pilih dari Galeri HP / File
                        </span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      value={photoUrl.startsWith('data:') ? '' : photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="Atau masukkan tautan URL foto kustom..."
                      className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    {photoUrl.startsWith('data:') && (
                      <span className="text-[9px] text-emerald-600 block font-bold">✓ Foto dari galeri HP berhasil dimuat (Base64)</span>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((preset, index) => {
                      const isSelected = photoUrl === preset.url;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPhotoUrl(preset.url)}
                          className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                            isSelected ? 'border-emerald-600 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-300'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <span className="absolute inset-0 bg-emerald-600/25 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white drop-shadow-sm" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600" /> Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Nama Lengkap"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" /> Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="email@alsintan.id"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  placeholder="0812..."
                />
              </div>

              {/* Password Change */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Ubah Password / PIN (Opsional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    placeholder="Kosongkan jika tidak ingin diubah"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Province - Locked to Babel */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" /> Wilayah Provinsi Kerja
                </label>
                <input
                  type="text"
                  readOnly
                  value="Kepulauan Bangka Belitung"
                  className="w-full text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold cursor-not-allowed"
                />
                <span className="text-[9px] text-slate-400 block font-medium">Berdasarkan kebijakan Brigade Pangan Nasional, akun dinas Anda terkunci pada Provinsi Kerja ini.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-500 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-colors uppercase tracking-wide"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
