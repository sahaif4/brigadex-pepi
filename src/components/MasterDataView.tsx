import React, { useState, useMemo } from 'react';
import { Brigade, Alsintan, Operator, Role } from '../types';
import { Plus, Edit2, Trash2, Sprout, Hammer, User, Phone, MapPin, Tag, Cpu, ShieldAlert, Check, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface MasterDataViewProps {
  userRole: Role;
  brigades: Brigade[];
  setBrigades: React.Dispatch<React.SetStateAction<Brigade[]>>;
  alsintanList: Alsintan[];
  setAlsintanList: React.Dispatch<React.SetStateAction<Alsintan[]>>;
  operators: Operator[];
  setOperators: React.Dispatch<React.SetStateAction<Operator[]>>;
}

export default function MasterDataView({
  userRole,
  brigades,
  setBrigades,
  alsintanList,
  setAlsintanList,
  operators,
  setOperators,
}: MasterDataViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'brigade' | 'alsintan' | 'operator'>('alsintan');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Forms states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Field states for Alsintan
  const [alsCode, setAlsCode] = useState('');
  const [alsName, setAlsName] = useState('');
  const [alsType, setAlsType] = useState<any>('Traktor Roda 4');
  const [alsBrand, setAlsBrand] = useState('');
  const [alsModel, setAlsModel] = useState('');
  const [alsYear, setAlsYear] = useState(2025);
  const [alsStatus, setAlsStatus] = useState<any>('Aktif');
  const [alsBrigade, setAlsBrigade] = useState('brg-001');

  // Field states for Operator
  const [oprName, setOprName] = useState('');
  const [oprPhone, setOprPhone] = useState('');
  const [oprBrigade, setOprBrigade] = useState('brg-001');
  const [oprStatus, setOprStatus] = useState<any>('Tersedia');

  // Field states for Brigade
  const [brgName, setBrgName] = useState('');
  const [brgRegency, setBrgRegency] = useState('');
  const [brgDistrict, setBrgDistrict] = useState('');
  const [brgVillage, setBrgVillage] = useState('');
  const [brgLeader, setBrgLeader] = useState('');
  const [brgPhone, setBrgPhone] = useState('');
  const [brgProvince, setBrgProvince] = useState('Kepulauan Bangka Belitung');

  // Actions
  const resetForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    // Reset Alsintan fields
    setAlsCode('');
    setAlsName('');
    setAlsBrand('');
    setAlsModel('');
    setAlsYear(2025);
    // Reset Operator fields
    setOprName('');
    setOprPhone('');
    // Reset Brigade fields
    setBrgName('');
    setBrgRegency('');
    setBrgDistrict('');
    setBrgVillage('');
    setBrgLeader('');
    setBrgPhone('');
  };

  const handleEditAlsintan = (als: Alsintan) => {
    setEditingId(als.id);
    setAlsCode(als.code);
    setAlsName(als.name);
    setAlsType(als.type);
    setAlsBrand(als.brand);
    setAlsModel(als.model);
    setAlsYear(als.year);
    setAlsStatus(als.status);
    setAlsBrigade(als.brigadeId);
    setShowAddForm(true);
  };

  const handleSaveAlsintan = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // Edit mode
      const updatedAlsintan = {
        code: alsCode,
        name: alsName,
        type: alsType,
        brand: alsBrand,
        model: alsModel,
        year: Number(alsYear),
        status: alsStatus,
        brigadeId: alsBrigade
      };
      setAlsintanList(prev => prev.map(a => a.id === editingId ? { ...a, ...updatedAlsintan } : a));
      
      const alsToSave = alsintanList.find(a => a.id === editingId);
      if (alsToSave) {
         setDoc(doc(db, 'alsintan', editingId), { ...alsToSave, ...updatedAlsintan }).catch(console.error);
      }
    } else {
      // Add mode
      const newAlsintan: Alsintan = {
        id: `als-${Date.now()}`,
        code: alsCode || `AL-${alsType.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
        name: alsName,
        type: alsType,
        brand: alsBrand,
        model: alsModel,
        year: Number(alsYear),
        status: alsStatus,
        brigadeId: alsBrigade
      };
      setAlsintanList(prev => [newAlsintan, ...prev]);
      setDoc(doc(db, 'alsintan', newAlsintan.id), newAlsintan).catch(console.error);
    }
    resetForm();
  };

  const handleDeleteAlsintan = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data unit Alsintan ini?')) {
      setAlsintanList(prev => prev.filter(a => a.id !== id));
      deleteDoc(doc(db, 'alsintan', id)).catch(console.error);
    }
  };

  // Operator Actions
  const handleEditOperator = (opr: Operator) => {
    setEditingId(opr.id);
    setOprName(opr.name);
    setOprPhone(opr.phone);
    setOprBrigade(opr.brigadeId);
    setOprStatus(opr.status);
    setShowAddForm(true);
  };

  const handleSaveOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setOperators(prev => prev.map(o => o.id === editingId ? {
        ...o,
        name: oprName,
        phone: oprPhone,
        brigadeId: oprBrigade,
        status: oprStatus
      } : o));
    } else {
      const newOpr: Operator = {
        id: `opr-${Date.now()}`,
        name: oprName,
        phone: oprPhone,
        brigadeId: oprBrigade,
        status: oprStatus
      };
      setOperators(prev => [newOpr, ...prev]);
    }
    resetForm();
  };

  const handleDeleteOperator = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data operator ini?')) {
      setOperators(prev => prev.filter(o => o.id !== id));
    }
  };

  // Brigade Actions
  const handleEditBrigade = (brg: Brigade) => {
    setEditingId(brg.id);
    setBrgName(brg.name);
    setBrgRegency(brg.regency);
    setBrgDistrict(brg.district);
    setBrgVillage(brg.village);
    setBrgProvince(brg.province);
    setBrgLeader(brg.leader);
    setBrgPhone(brg.phone);
    setShowAddForm(true);
  };

  const handleSaveBrigade = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setBrigades(prev => prev.map(b => b.id === editingId ? {
        ...b,
        name: brgName,
        regency: brgRegency,
        district: brgDistrict,
        village: brgVillage,
        province: brgProvince,
        leader: brgLeader,
        phone: brgPhone
      } : b));
    } else {
      const newBrg: Brigade = {
        id: `brg-${Date.now()}`,
        name: brgName,
        regency: brgRegency,
        district: brgDistrict,
        village: brgVillage,
        province: brgProvince,
        leader: brgLeader,
        phone: brgPhone
      };
      setBrigades(prev => [newBrg, ...prev]);
    }
    resetForm();
  };

  const handleDeleteBrigade = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data brigade ini?')) {
      setBrigades(prev => prev.filter(b => b.id !== id));
    }
  };

  // Helper
  const getBrigadeName = (id: string) => {
    return brigades.find(b => b.id === id)?.name || 'Brigade Nasional';
  };

  // Check write permission based on Role
  const canManageBrigade = ['Super Admin', 'Admin', 'Pusat', 'Provinsi', 'Kabupaten'].includes(userRole);
  const canManageAlsintan = ['Super Admin', 'Admin', 'Pusat', 'Provinsi', 'Koordinator', 'Kabupaten'].includes(userRole);
  const canManageOperator = ['Super Admin', 'Admin', 'Pusat', 'Provinsi', 'Koordinator', 'Kabupaten'].includes(userRole);

  const hasWritePermission = (() => {
    if (activeSubTab === 'brigade') return canManageBrigade;
    if (activeSubTab === 'alsintan') return canManageAlsintan;
    if (activeSubTab === 'operator') return canManageOperator;
    return false;
  })();

  const paginatedAlsintan = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return alsintanList.slice(startIndex, startIndex + itemsPerPage);
  }, [alsintanList, currentPage, itemsPerPage]);

  const paginatedOperators = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return operators.slice(startIndex, startIndex + itemsPerPage);
  }, [operators, currentPage, itemsPerPage]);

  const paginatedBrigades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return brigades.slice(startIndex, startIndex + itemsPerPage);
  }, [brigades, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(
    (activeSubTab === 'alsintan' ? alsintanList.length : 
     activeSubTab === 'operator' ? operators.length : 
     brigades.length) / itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'alsintan', label: 'Daftar Alsintan (Alat Mesin)', count: alsintanList.length, icon: Hammer },
          { id: 'operator', label: 'Operator Lapangan', count: operators.length, icon: User },
          { id: 'brigade', label: 'Unit Brigade Wilayah', count: brigades.length, icon: Sprout },
        ].map((sub) => {
          const Icon = sub.icon;
          const isSelected = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => { setActiveSubTab(sub.id as any); setCurrentPage(1); resetForm(); }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {sub.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {sub.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            {activeSubTab === 'alsintan' && 'Kelola Mesin Pertanian (Alsintan)'}
            {activeSubTab === 'operator' && 'Registrasi Operator Alsintan'}
            {activeSubTab === 'brigade' && 'Daftar Brigade Pangan Indonesia'}
          </h2>
          <p className="text-xs text-slate-500">
            {activeSubTab === 'alsintan' && 'Inventarisasi unit traktor, combine harvester, pompa air, dan transplanter.'}
            {activeSubTab === 'operator' && 'Daftar personil operator mesin yang bertugas membajak, menanam, dan memanen.'}
            {activeSubTab === 'brigade' && 'Wilayah administrasi pos brigade pangan nasional di berbagai provinsi.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
              title="Tampilan Grid (Card)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('table'); setCurrentPage(1); }}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
              title="Tampilan Tabel (Baris)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {hasWritePermission && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Data Baru
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Forms */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            {editingId ? 'Edit Data Terdaftar' : 'Form Registrasi Data Baru'}
          </h3>

          {activeSubTab === 'alsintan' && (
            <form onSubmit={handleSaveAlsintan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Kode Unit (Opsional)</label>
                  <input
                    type="text"
                    value={alsCode}
                    onChange={(e) => setAlsCode(e.target.value)}
                    placeholder="Contoh: AL-TR4-009"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Nama / Spesifikasi</label>
                  <input
                    type="text"
                    required
                    value={alsName}
                    onChange={(e) => setAlsName(e.target.value)}
                    placeholder="Contoh: Kubota L5018"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Jenis Alsintan</label>
                  <select
                    value={alsType}
                    onChange={(e) => setAlsType(e.target.value as any)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Traktor Roda 2">Traktor Roda 2</option>
                    <option value="Traktor Roda 4">Traktor Roda 4</option>
                    <option value="Combine Harvester">Combine Harvester</option>
                    <option value="Pompa Air">Pompa Air</option>
                    <option value="Rice Transplanter">Rice Transplanter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Merk</label>
                  <input
                    type="text"
                    required
                    value={alsBrand}
                    onChange={(e) => setAlsBrand(e.target.value)}
                    placeholder="Contoh: Kubota"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Model / Seri</label>
                  <input
                    type="text"
                    required
                    value={alsModel}
                    onChange={(e) => setAlsModel(e.target.value)}
                    placeholder="Contoh: L5018 (50 HP)"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Tahun Perolehan</label>
                  <input
                    type="number"
                    required
                    value={alsYear}
                    onChange={(e) => setAlsYear(Number(e.target.value))}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Status Awal</label>
                  <select
                    value={alsStatus}
                    onChange={(e) => setAlsStatus(e.target.value as any)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Aktif">Aktif (Siap Kerja)</option>
                    <option value="Standby">Standby (Tersedia)</option>
                    <option value="Service">Sedang Service</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Penempatan Brigade</label>
                  <select
                    value={alsBrigade}
                    onChange={(e) => setAlsBrigade(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    {brigades.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.regency})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          )}

          {activeSubTab === 'operator' && (
            <form onSubmit={handleSaveOperator} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Nama Lengkap Operator</label>
                  <input
                    type="text"
                    required
                    value={oprName}
                    onChange={(e) => setOprName(e.target.value)}
                    placeholder="Contoh: Slamet Riyadi"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={oprPhone}
                    onChange={(e) => setOprPhone(e.target.value)}
                    placeholder="Contoh: 0812345678"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Brigade Penempatan</label>
                  <select
                    value={oprBrigade}
                    onChange={(e) => setOprBrigade(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    {brigades.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Status Operator</label>
                <select
                  value={oprStatus}
                  onChange={(e) => setOprStatus(e.target.value as any)}
                  className="mt-1 max-w-xs block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Tersedia">Tersedia (Siap Tugas)</option>
                  <option value="Bertugas">Bertugas (Di Lapangan)</option>
                  <option value="Cuti">Sedang Cuti / Libur</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Simpan Operator
                </button>
              </div>
            </form>
          )}
          {activeSubTab === 'brigade' && (
            <form onSubmit={handleSaveBrigade} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Nama Brigade</label>
                  <input
                    type="text"
                    required
                    value={brgName}
                    onChange={(e) => setBrgName(e.target.value)}
                    placeholder="Contoh: Brigade Pangan Babel 1"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Koordinator Lapangan (Manajer)</label>
                  <input
                    type="text"
                    required
                    value={brgLeader}
                    onChange={(e) => setBrgLeader(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Provinsi</label>
                  <input
                    type="text"
                    required
                    value={brgProvince}
                    onChange={(e) => setBrgProvince(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Kabupaten / Kota</label>
                  <input
                    type="text"
                    required
                    value={brgRegency}
                    onChange={(e) => setBrgRegency(e.target.value)}
                    placeholder="Contoh: Bangka"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Kecamatan</label>
                  <input
                    type="text"
                    required
                    value={brgDistrict}
                    onChange={(e) => setBrgDistrict(e.target.value)}
                    placeholder="Contoh: Sungailiat"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Desa / Kelurahan</label>
                  <input
                    type="text"
                    required
                    value={brgVillage}
                    onChange={(e) => setBrgVillage(e.target.value)}
                    placeholder="Contoh: Sungailiat"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Nomor HP Kontak</label>
                  <input
                    type="text"
                    required
                    value={brgPhone}
                    onChange={(e) => setBrgPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Simpan Brigade
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* List Layouts */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSubTab === 'alsintan' && (
            paginatedAlsintan.map((als) => (
              <div key={als.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{als.code}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      als.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' :
                      als.status === 'Standby' ? 'bg-slate-100 text-slate-700' :
                      als.status === 'Service' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {als.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{als.name}</h4>
                  <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                    <p className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-slate-400" /> {als.type}</p>
                    <p className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-slate-400" /> Model: {als.model} ({als.year})</p>
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {getBrigadeName(als.brigadeId)}</p>
                  </div>
                </div>

                {hasWritePermission && (
                  <div className="mt-4 border-t border-slate-100 pt-3 flex justify-end gap-1.5">
                    <button
                      onClick={() => handleEditAlsintan(als)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAlsintan(als.id)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-red-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {activeSubTab === 'operator' && (
            paginatedOperators.map((opr) => (
              <div key={opr.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{opr.id}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      opr.status === 'Tersedia' ? 'bg-emerald-100 text-emerald-800' :
                      opr.status === 'Bertugas' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {opr.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{opr.name}</h4>
                  <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {opr.phone}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {getBrigadeName(opr.brigadeId)}</p>
                  </div>
                </div>

                {hasWritePermission && (
                  <div className="mt-4 border-t border-slate-100 pt-3 flex justify-end gap-1.5">
                    <button
                      onClick={() => handleEditOperator(opr)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOperator(opr.id)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-red-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {activeSubTab === 'brigade' && (
            paginatedBrigades.map((b) => (
              <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-[10px] font-bold text-slate-400">{b.id}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Pos Brigade
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800">{b.name}</h4>
                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {b.village}, {b.district}, {b.regency}, {b.province}</p>
                  <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Koord: {b.leader}</p>
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Hub: {b.phone}</p>
                </div>

                {hasWritePermission && (
                  <div className="mt-4 border-t border-slate-100 pt-3 flex justify-end gap-1.5">
                    <button
                      onClick={() => handleEditBrigade(b)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBrigade(b.id)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-red-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              {activeSubTab === 'alsintan' && (
                <tr>
                  <th className="px-4 py-3">Kode Unit</th>
                  <th className="px-4 py-3">Nama Alsintan</th>
                  <th className="px-4 py-3">Jenis & Model</th>
                  <th className="px-4 py-3">Brigade</th>
                  <th className="px-4 py-3">Status</th>
                  {hasWritePermission && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              )}
              {activeSubTab === 'operator' && (
                <tr>
                  <th className="px-4 py-3">ID Operator</th>
                  <th className="px-4 py-3">Nama Operator</th>
                  <th className="px-4 py-3">No. HP</th>
                  <th className="px-4 py-3">Brigade</th>
                  <th className="px-4 py-3">Status</th>
                  {hasWritePermission && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              )}
              {activeSubTab === 'brigade' && (
                <tr>
                  <th className="px-4 py-3">ID Brigade</th>
                  <th className="px-4 py-3">Nama Brigade</th>
                  <th className="px-4 py-3">Koordinator</th>
                  <th className="px-4 py-3">No. HP</th>
                  <th className="px-4 py-3">Lokasi</th>
                  {hasWritePermission && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeSubTab === 'alsintan' && (
                paginatedAlsintan.map((als) => (
                  <tr key={als.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{als.code}</td>
                    <td className="px-4 py-3 font-bold">{als.name}</td>
                    <td className="px-4 py-3">{als.type} - {als.model} ({als.year})</td>
                    <td className="px-4 py-3">{getBrigadeName(als.brigadeId)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        als.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' :
                        als.status === 'Standby' ? 'bg-slate-100 text-slate-700' :
                        als.status === 'Service' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {als.status}
                      </span>
                    </td>
                    {hasWritePermission && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEditAlsintan(als)} className="p-1 hover:bg-slate-200 text-slate-500 hover:text-emerald-600 rounded cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteAlsintan(als.id)} className="p-1 hover:bg-slate-200 text-slate-500 hover:text-red-600 rounded cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
              {activeSubTab === 'operator' && (
                paginatedOperators.map((opr) => (
                  <tr key={opr.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{opr.id}</td>
                    <td className="px-4 py-3 font-bold">{opr.name}</td>
                    <td className="px-4 py-3">{opr.phone}</td>
                    <td className="px-4 py-3">{getBrigadeName(opr.brigadeId)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        opr.status === 'Tersedia' ? 'bg-emerald-100 text-emerald-800' :
                        opr.status === 'Bertugas' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {opr.status}
                      </span>
                    </td>
                    {hasWritePermission && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEditOperator(opr)} className="p-1 hover:bg-slate-200 text-slate-500 hover:text-emerald-600 rounded cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteOperator(opr.id)} className="p-1 hover:bg-slate-200 text-slate-500 hover:text-red-600 rounded cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
              {activeSubTab === 'brigade' && (
                paginatedBrigades.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{b.id}</td>
                    <td className="px-4 py-3 font-bold">{b.name}</td>
                    <td className="px-4 py-3">{b.leader}</td>
                    <td className="px-4 py-3">{b.phone}</td>
                    <td className="px-4 py-3">{b.village}, {b.district}, {b.regency}, {b.province}</td>
                    {hasWritePermission && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEditBrigade(b)} className="p-1 hover:bg-slate-200 text-slate-500 hover:text-emerald-600 rounded cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteBrigade(b.id)} className="p-1 hover:bg-slate-200 text-slate-500 hover:text-red-600 rounded cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
          <p className="text-xs text-slate-500">
            Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
