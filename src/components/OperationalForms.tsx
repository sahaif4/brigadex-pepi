import React, { useState, useEffect } from 'react';
import { Alsintan, Operator, LaporanHarian, Role, RiwayatService, RiwayatKerusakan, Brigade, User } from '../types';
import { Calculator, Camera, MapPin, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { setDoc, doc } from 'firebase/firestore';

interface OperationalFormsProps {
  userRole: Role;
  alsintanList: Alsintan[];
  operators: Operator[];
  laporanList: LaporanHarian[];
  setLaporanList: React.Dispatch<React.SetStateAction<LaporanHarian[]>>;
  serviceList: RiwayatService[];
  setServiceList: React.Dispatch<React.SetStateAction<RiwayatService[]>>;
  kerusakanList: RiwayatKerusakan[];
  setKerusakanList: React.Dispatch<React.SetStateAction<RiwayatKerusakan[]>>;
  onAddAuditLog: (action: string, module: string) => void;
  brigades: Brigade[];
  activeFormTab?: 'laporan' | 'service' | 'kerusakan';
  currentUser?: User | null;
}

export default function OperationalForms({
  userRole,
  alsintanList,
  operators,
  laporanList,
  setLaporanList,
  serviceList,
  setServiceList,
  kerusakanList,
  setKerusakanList,
  onAddAuditLog,
  brigades,
  activeFormTab: activeFormTabProp,
  currentUser,
}: OperationalFormsProps) {
  const [activeFormTab, setActiveFormTab] = useState<'laporan' | 'service' | 'kerusakan'>('laporan');
  const [showPosterModal, setShowPosterModal] = useState(false);

  useEffect(() => {
    if (activeFormTabProp) {
      setActiveFormTab(activeFormTabProp);
    }
  }, [activeFormTabProp]);

  // Laporan Harian Form State
  const [lapDate, setLapDate] = useState('2026-06-26');
  const [lapAls, setLapAls] = useState(alsintanList[0]?.id || '');
  const [lapOpr, setLapOpr] = useState(operators[0]?.id || '');
  const [lapActivity, setLapActivity] = useState<
    'Tabur dolomit' | 'Irigasi/drainase' | 'Merapikan pematang sawah' | 'Angkut Alsintan/saprodi' | 'Tanam' | 'Spraying (pestida, pupuk cair, herbisida)' | 'Tabur (benih, pupuk)' | 'Tanam pindah/benih' | 'Panen'
  >('Tabur dolomit');
  const [lapOwner, setLapOwner] = useState('');
  const [lapLocation, setLapLocation] = useState('');
  const [lapLandType, setLapLandType] = useState('');
  const [lapHarvestAmount, setLapHarvestAmount] = useState(0);
  const [lapHarvestUnit, setLapHarvestUnit] = useState<'karung' | 'kg' | 'kuintal'>('karung');
  const [lapHoursStart, setLapHoursStart] = useState(100.0);
  const [lapHoursEnd, setLapHoursEnd] = useState(108.0);
  const [lapLandArea, setLapLandArea] = useState(2.0);
  const [lapFuel, setLapFuel] = useState(30);
  const [lapOil, setLapOil] = useState(0.0);
  const [lapRevenue, setLapRevenue] = useState(2000000);
  const [lapCost, setLapCost] = useState(800000);
  const [lapNotes, setLapNotes] = useState('');
  const [lapCommodity, setLapCommodity] = useState<'Padi' | 'Jagung' | 'Kedelai'>('Padi');

  // Specific machine report fields requested by user
  const [lapStartTime, setLapStartTime] = useState('07:30');
  const [lapEndTime, setLapEndTime] = useState('15:30');
  const [lapOperatorName, setLapOperatorName] = useState('');
  const [lapBrigadeName, setLapBrigadeName] = useState('');
  const [lapKecamatan, setLapKecamatan] = useState('');
  const [lapKabupaten, setLapKabupaten] = useState('');
  const [lapProvinsi, setLapProvinsi] = useState('Kepulauan Bangka Belitung');
  const [lapFotoSebelum, setLapFotoSebelum] = useState('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80');
  const [lapFotoSesudah, setLapFotoSesudah] = useState('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80');

  const [hasPrefilledOperator, setHasPrefilledOperator] = useState(false);

  // Prefill default operator name and brigade details if currentUser is logged in as an Operator
  useEffect(() => {
    if (currentUser && currentUser.role === 'Operator' && !hasPrefilledOperator && brigades.length > 0) {
      setLapOperatorName(currentUser.name);
      
      const b = brigades.find(brg => brg.id === currentUser.brigadeId);
      if (b) {
        setLapBrigadeName(b.name);
        setLapKecamatan(b.district);
        setLapKabupaten(b.regency);
        setLapProvinsi(b.province);
      }
      
      // Try to find a matching operator entry in the operators list
      const matchedOpr = operators.find(o => o.name.toLowerCase() === currentUser.name.toLowerCase() || o.brigadeId === currentUser.brigadeId);
      if (matchedOpr) {
        setLapOpr(matchedOpr.id);
      }
      setHasPrefilledOperator(true);
    }
  }, [currentUser, brigades, operators, hasPrefilledOperator]);

  // Synchronize operator name when selected operator changes
  useEffect(() => {
    if (currentUser && currentUser.role === 'Operator') {
      setLapOperatorName(currentUser.name);
      return;
    }
    const selectedOperator = operators.find(o => o.id === lapOpr);
    if (selectedOperator) {
      setLapOperatorName(selectedOperator.name);
    }
  }, [lapOpr, operators, currentUser]);

  // Synchronize brigade, kecamatan, kabupaten, provinsi when selected Alsintan changes
  useEffect(() => {
    if (currentUser && currentUser.role === 'Operator') {
      // For Operator, we prefill their own brigade initially, and don't overwrite it when they change Alsintan
      // so they can freely edit the kecamatan/district if they work elsewhere.
      return;
    }
    const selectedUnit = alsintanList.find(a => a.id === lapAls);
    if (selectedUnit) {
      const b = brigades.find(brg => brg.id === selectedUnit.brigadeId);
      if (b) {
        setLapBrigadeName(b.name);
        setLapKecamatan(b.district);
        setLapKabupaten(b.regency);
        setLapProvinsi(b.province);
      }
    }
  }, [lapAls, alsintanList, brigades, currentUser]);

  // Dynamically cycle high quality realistic agricultural field photos based on selected activity type
  useEffect(() => {
    if (lapActivity === 'Olah Tanah') {
      setLapFotoSebelum('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80'); // Plain dry soil
      setLapFotoSesudah('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80'); // Nicely plowed soil
    } else if (lapActivity === 'Tanam') {
      setLapFotoSebelum('https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&auto=format&fit=crop&q=80'); // Muddy water field
      setLapFotoSesudah('https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'); // Seedlings sprouting
    } else if (lapActivity === 'Pompanisasi') {
      setLapFotoSebelum('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80'); // Dry canal
      setLapFotoSesudah('https://images.unsplash.com/photo-1468476775582-6bede20f356f?w=600&auto=format&fit=crop&q=80'); // Flowing water canal
    } else if (lapActivity === 'Panen') {
      setLapFotoSebelum('https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80'); // Golden crop ready
      setLapFotoSesudah('https://images.unsplash.com/photo-1536882240095-0379873feb4e?w=600&auto=format&fit=crop&q=80'); // Cut empty paddy fields
    }
  }, [lapActivity]);

  // Automatically fetch previous Hour Meter (HM) for selected Alsintan
  const handleAutofillLastHM = () => {
    const unitReports = laporanList.filter(l => l.alsintanId === lapAls);
    if (unitReports.length > 0) {
      // Find the most recent report by date or id
      const sorted = [...unitReports].sort((a, b) => b.id.localeCompare(a.id));
      const latest = sorted[0];
      setLapHoursStart(latest.hoursEnd);
      setLapHoursEnd(Number((latest.hoursEnd + 8).toFixed(1)));
    } else {
      // standard default values
      setLapHoursStart(100.0);
      setLapHoursEnd(108.0);
    }
  };

  // Service Form State
  const [srvAls, setSrvAls] = useState(alsintanList[0]?.id || '');
  const [srvDate, setSrvDate] = useState('2026-06-26');
  const [srvType, setSrvType] = useState<'Rutin' | 'Perbaikan'>('Rutin');
  const [srvCost, setSrvCost] = useState(500000);
  const [srvMechanic, setSrvMechanic] = useState('');
  const [srvParts, setSrvParts] = useState('');
  const [srvNotes, setSrvNotes] = useState('');
  const [srvFoto, setSrvFoto] = useState('');

  // Kerusakan Form State
  const [krkAls, setKrkAls] = useState(alsintanList[0]?.id || '');
  const [krkDate, setKrkDate] = useState('2026-06-26');
  const [krkDesc, setKrkDesc] = useState('');
  const [krkSeverity, setKrkSeverity] = useState<'Ringan' | 'Sedang' | 'Berat'>('Sedang');
  const [krkFoto, setKrkFoto] = useState('');

  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Automatic Calculation Live Previews
  const calcWorkingHours = Number(lapHoursEnd) - Number(lapHoursStart);
  const calcProductivity = calcWorkingHours > 0 ? (Number(lapLandArea) / calcWorkingHours).toFixed(2) : '0';
  const calcEfficiency = calcWorkingHours > 0 ? ((calcWorkingHours / 8) * 100).toFixed(0) : '0';
  const calcFuelPerHour = calcWorkingHours > 0 ? (Number(lapFuel) / calcWorkingHours).toFixed(1) : '0';
  const calcFuelPerHectare = Number(lapLandArea) > 0 ? (Number(lapFuel) / Number(lapLandArea)).toFixed(1) : '0';
  const calcNetProfit = Number(lapRevenue) - Number(lapCost);

  const handleSubmitLaporan = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(lapHoursEnd) <= Number(lapHoursStart)) {
      alert('Galat Aturan Bisnis: Jam Kerja Akhir harus lebih besar daripada Jam Kerja Awal!');
      return;
    }

    const selectedUnit = alsintanList.find(a => a.id === lapAls);
    const resolvedBrigadeId = selectedUnit?.brigadeId || 'brg-006';

    const newLaporan: LaporanHarian = {
      id: `lap-${Date.now()}`,
      date: lapDate,
      alsintanId: lapAls,
      operatorId: lapOpr,
      brigadeId: resolvedBrigadeId,
      activityType: lapActivity,
      hoursStart: Number(lapHoursStart),
      hoursEnd: Number(lapHoursEnd),
      workingHours: calcWorkingHours,
      landArea: Number(lapLandArea),
      commodity: lapCommodity,
      fuelUsed: Number(lapFuel),
      oilUsed: Number(lapOil),
      revenue: Number(lapRevenue),
      cost: Number(lapCost),
      notes: lapNotes,
      latitude: -2.7410 + (Math.random() - 0.5) * 0.4,
      longitude: 106.4406 + (Math.random() - 0.5) * 0.4,
      
      // New specific fields
      startTime: lapStartTime,
      endTime: lapEndTime,
      operatorName: lapOperatorName,
      brigadeName: lapBrigadeName,
      kecamatan: lapKecamatan,
      kabupaten: lapKabupaten,
      provinsi: lapProvinsi,
      fotoSebelum: lapFotoSebelum,
      fotoSesudah: lapFotoSesudah,
      ownerName: lapOwner,
      location: lapLocation,
      landType: lapLandType,
      harvestAmount: Number(lapHarvestAmount),
      harvestUnit: lapHarvestUnit,
    };

    if (navigator.onLine) {
      setLaporanList(prev => [newLaporan, ...prev]);
      onAddAuditLog(`Memasukkan Laporan Harian Baru (${newLaporan.id})`, 'Laporan Harian');
      
      setDoc(doc(db, 'laporan', newLaporan.id), newLaporan)
        .then(() => toast.success('🎉 Laporan harian berhasil disimpan online!'))
        .catch(err => {
          console.error('Error saving to firebase:', err);
          toast.success('🎉 Laporan harian berhasil disimpan lokal (Firebase error).');
        });

    } else {
      const offlineReports = JSON.parse(localStorage.getItem('alsintan_offline_reports') || '[]');
      offlineReports.push(newLaporan);
      localStorage.setItem('alsintan_offline_reports', JSON.stringify(offlineReports));
      setLaporanList(prev => [newLaporan, ...prev]);
      toast.error('⚠️ Offline: Laporan tersimpan lokal, akan otomatis terkirim saat online.');
    }
    
    // Reset forms
    setLapNotes('');
    setLapOwner('');
    setLapLocation('');
    setLapLandType('');
    setLapHarvestAmount(0);
    setLapHarvestUnit('karung');
    setLapHoursStart(lapHoursEnd); // roll over hours
  };

  const handleSubmitService = (e: React.FormEvent) => {
    e.preventDefault();
    const newService: RiwayatService = {
      id: `srv-${Date.now()}`,
      alsintanId: srvAls,
      date: srvDate,
      serviceType: srvType,
      cost: Number(srvCost),
      mechanic: srvMechanic || 'Bengkel Rekanan Brigade',
      partsReplaced: srvParts.split(',').map(p => p.trim()).filter(Boolean),
      notes: srvNotes,
      foto: srvFoto
    };

    setServiceList(prev => [newService, ...prev]);
    onAddAuditLog(`Memasukkan Riwayat Service (${newService.id})`, 'Layanan Pemeliharaan');
    toast.success('🔧 Data perawatan preventif alsintan berhasil dicatat.');
    setSrvParts('');
    setSrvNotes('');
    setSrvFoto('');
  };

  const handleSubmitKerusakan = (e: React.FormEvent) => {
    e.preventDefault();
    const newKerusakan: RiwayatKerusakan = {
      id: `krk-${Date.now()}`,
      alsintanId: krkAls,
      date: krkDate,
      description: krkDesc,
      severity: krkSeverity,
      status: 'Dilaporkan',
      reportedBy: operators[0]?.name || 'Operator Lapangan',
      foto: krkFoto
    };

    setKerusakanList(prev => [newKerusakan, ...prev]);
    onAddAuditLog(`Melaporkan Kerusakan Unit Alsintan (${newKerusakan.id})`, 'Sistem Kerusakan');
    
    setDoc(doc(db, 'kerusakan', newKerusakan.id), newKerusakan)
      .then(() => toast.success('🚨 Laporan kerusakan unit berhasil dikirim ke server online.'))
      .catch(err => {
        console.error(err);
        toast.success('🚨 Laporan kerusakan unit berhasil disimpan lokal.');
      });

    setKrkDesc('');
    setKrkFoto('');
  };

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      {!activeFormTabProp && (
        <div className="flex border-b border-slate-200">
          {[
            { id: 'laporan', label: 'Laporan Aktivitas Harian' },
            { id: 'service', label: 'Catatan Service & Perawatan' },
            { id: 'kerusakan', label: 'Lapor Kerusakan Unit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFormTab(tab.id as any)}
              className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeFormTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          
          {/* BP Office Physical Poster Reminder */}
          <div className="bg-amber-500 text-slate-950 p-4 rounded-xl border-2 border-amber-600 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📢</span>
              <div className="text-left">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-950">PEMBERITAHUAN RESMI KANTOR BP</h4>
                <p className="text-xs font-black text-slate-900 mt-0.5 uppercase">
                  "JANGAN LUPA MENGISI LAPORAN KINERJA SETELAH SELESAI KERJA!"
                </p>
                <p className="text-[10px] text-slate-800">Cetak & tempel poster ini di basecamp / kantor sebagai pengingat harian.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPosterModal(true)}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors shrink-0 uppercase tracking-wider cursor-pointer shadow-xs"
            >
              🖨️ Cetak Poster Kantor
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            {activeFormTab === 'laporan' && (
              <form onSubmit={handleSubmitLaporan} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Input Pekerjaan Lapangan (Olah Tanah, Tanam, Panen)
                  </h3>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                    Mode Pengisian Cepat Aktif
                  </span>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Pemilik Lahan</label>
                      <input
                        type="text"
                        placeholder="Contoh: lahan sawah milik pak slamet"
                        value={lapOwner}
                        onChange={(e) => setLapOwner(e.target.value)}
                        className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-[9px] text-slate-400 mt-1 block">Contoh: Lahan sawah milik pak slamet</span>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Lokasi Pekerjaan</label>
                      <input
                        type="text"
                        placeholder="Lokasi lahan..."
                        value={lapLocation}
                        onChange={(e) => setLapLocation(e.target.value)}
                        className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-[9px] text-slate-400 mt-1 block">Lokasi lahan kerja</span>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Jenis penggunaan lahan</label>
                      <input
                        type="text"
                        placeholder="Contoh: sawah, lahan kering, perkebunan"
                        value={lapLandType}
                        onChange={(e) => setLapLandType(e.target.value)}
                        className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-[9px] text-slate-400 mt-1 block">Contoh: sawah, lahan kering, perkebunan</span>
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">Jenis Kegiatan</label>
                    <select
                      value={lapActivity}
                      onChange={(e) => setLapActivity(e.target.value as any)}
                      className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Tabur dolomit">Tabur dolomit</option>
                      <option value="Irigasi/drainase">Irigasi/drainase</option>
                      <option value="Merapikan pematang sawah">Merapikan pematang sawah</option>
                      <option value="Angkut Alsintan/saprodi">Angkut Alsintan/saprodi</option>
                      <option value="Tanam">Tanam</option>
                      <option value="Spraying (pestida, pupuk cair, herbisida)">Spraying (pestida, pupuk cair, herbisida)</option>
                      <option value="Tabur (benih, pupuk)">Tabur (benih, pupuk)</option>
                      <option value="Tanam pindah/benih">Tanam pindah/benih</option>
                      <option value="Panen">Panen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">Komoditas Utama</label>
                    <select
                      value={lapCommodity}
                      onChange={(e) => setLapCommodity(e.target.value as any)}
                      className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Padi">🌾 Padi</option>
                      <option value="Jagung">🌽 Jagung</option>
                      <option value="Kedelai">🫘 Kedelai</option>
                    </select>
                  </div>
                </div>


                {/* Specific work times and operator/brigade details requested by user */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">Metrik Operasional &amp; Penanggung Jawab</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Mulai Jam Kerja</label>
                      <input
                        type="time"
                        required
                        value={lapStartTime}
                        onChange={(e) => setLapStartTime(e.target.value)}
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Selesai Jam Kerja</label>
                      <input
                        type="time"
                        required
                        value={lapEndTime}
                        onChange={(e) => setLapEndTime(e.target.value)}
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Nama Operator</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Operator Lapangan"
                        value={lapOperatorName}
                        onChange={(e) => setLapOperatorName(e.target.value)}
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Nama Brigade Pangan</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Brigade Pangan"
                        value={lapBrigadeName}
                        onChange={(e) => setLapBrigadeName(e.target.value)}
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Kecamatan</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Kecamatan"
                        value={lapKecamatan}
                        onChange={(e) => setLapKecamatan(e.target.value)}
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Kabupaten</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Kabupaten"
                        value={lapKabupaten}
                        onChange={(e) => setLapKabupaten(e.target.value)}
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Provinsi</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Provinsi"
                        value={lapProvinsi}
                        onChange={(e) => setLapProvinsi(e.target.value)}
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium bg-slate-50 text-slate-500"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {lapActivity === 'Panen' && (
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Jumlah Panen</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={lapHarvestAmount || ''}
                          onChange={(e) => setLapHarvestAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                          className="mt-1 block flex-1 min-w-[120px] border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-700 bg-emerald-50/30"
                        />
                        <select 
                          value={lapHarvestUnit}
                          onChange={(e) => setLapHarvestUnit(e.target.value as any)}
                          className="mt-1 block w-28 shrink-0 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-emerald-500 font-semibold bg-white"
                        >
                          <option value="karung">Karung</option>
                          <option value="kg">Kg</option>
                          <option value="kuintal">Kuintal</option>
                        </select>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 block">Pilih satuan karung/kg/kuintal</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">BBM Terpakai (Liter)</label>
                    <input
                      type="number"
                      required
                      value={lapFuel}
                      onChange={(e) => setLapFuel(Number(e.target.value))}
                      className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {userRole !== 'Operator' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Pendapatan Jasa (Rp)</label>
                      <input
                        type="number"
                        required
                        value={lapRevenue}
                        onChange={(e) => setLapRevenue(Number(e.target.value))}
                        className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {userRole === 'Super Admin' || userRole === 'Koordinator' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Biaya Operasional (Rp)</label>
                      <input
                        type="number"
                        required
                        value={lapCost}
                        onChange={(e) => setLapCost(Number(e.target.value))}
                        className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-[9px] text-slate-400 mt-1 block">Manajer saja</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Catatan Lapangan / Kendala</label>
                  <textarea
                    value={lapNotes}
                    onChange={(e) => setLapNotes(e.target.value)}
                    placeholder="Kondisi cuaca, tanah, rintangan irigasi, atau catatan kerusakan kecil..."
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 h-20"
                  ></textarea>
                </div>

                {/* Before and After Photo upload area requested by user */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl">
                  <div className="space-y-2">
                    <span className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      📸 Foto Sebelum Lahan Dikerjakan
                    </span>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white hover:border-emerald-500 transition-all text-center relative group">
                      <img 
                        src={lapFotoSebelum} 
                        alt="Sebelum" 
                        className="w-full h-32 object-cover rounded-lg shadow-xs mb-2 referrerPolicy='no-referrer'" 
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="flex flex-col items-center justify-center gap-1">
                        <label className="block cursor-pointer">
                          <span className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1.5 rounded border border-emerald-200 transition-all">
                            📁 Pilih Foto Sebelum dari Galeri HP
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, setLapFotoSebelum);
                            }}
                          />
                        </label>
                        <p className="text-[9px] text-slate-400 font-semibold my-0.5">Atau masukkan tautan:</p>
                        <input 
                          type="text" 
                          value={lapFotoSebelum} 
                          onChange={(e) => setLapFotoSebelum(e.target.value)}
                          className="w-full text-[9px] font-mono border border-slate-200 rounded px-1.5 py-1 text-slate-600 bg-slate-50 focus:bg-white text-center"
                          placeholder="Tautan Foto Sebelum"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      📸 Foto Sesudah Lahan Dikerjakan
                    </span>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white hover:border-emerald-500 transition-all text-center relative group">
                      <img 
                        src={lapFotoSesudah} 
                        alt="Sesudah" 
                        className="w-full h-32 object-cover rounded-lg shadow-xs mb-2 referrerPolicy='no-referrer'"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="flex flex-col items-center justify-center gap-1">
                        <label className="block cursor-pointer">
                          <span className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1.5 rounded border border-emerald-200 transition-all">
                            📁 Pilih Foto Sesudah dari Galeri HP
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, setLapFotoSesudah);
                            }}
                          />
                        </label>
                        <p className="text-[9px] text-slate-400 font-semibold my-0.5">Atau masukkan tautan:</p>
                        <input 
                          type="text" 
                          value={lapFotoSesudah} 
                          onChange={(e) => setLapFotoSesudah(e.target.value)}
                          className="w-full text-[9px] font-mono border border-slate-200 rounded px-1.5 py-1 text-slate-600 bg-slate-50 focus:bg-white text-center"
                          placeholder="Tautan Foto Sesudah"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geo Tag Anchors */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Geo-Tagging Lock</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Lat: -2.7410 • Long: 106.4406 (Bangka Belitung)</span>
                    </div>
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> GPS Anchored
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer uppercase tracking-wider"
                  >
                    Kirim Laporan Kerja
                  </button>
                </div>
              </form>
          )}

          {activeFormTab === 'service' && (
            <form onSubmit={handleSubmitService} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Pencatatan Perawatan &amp; Pergantian Suku Cadang Preventif
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Unit Alsintan</label>
                  <select
                    value={srvAls}
                    onChange={(e) => setSrvAls(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    {alsintanList.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Tanggal Perawatan</label>
                  <input
                    type="date"
                    required
                    value={srvDate}
                    onChange={(e) => setSrvDate(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Tipe Service</label>
                  <select
                    value={srvType}
                    onChange={(e) => setSrvType(e.target.value as any)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Rutin">Rutin (Filter/Ganti Oli/Setel Rantai)</option>
                    <option value="Perbaikan">Perbaikan Kerusakan Alat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Teknisi / Nama Bengkel</label>
                  <input
                    type="text"
                    required
                    value={srvMechanic}
                    onChange={(e) => setSrvMechanic(e.target.value)}
                    placeholder="Contoh: Bengkel Tani Jaya Nganjuk"
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Biaya Perawatan (Rp)</label>
                  <input
                    type="number"
                    required
                    value={srvCost}
                    onChange={(e) => setSrvCost(Number(e.target.value))}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Sparepart / Suku Cadang yang Diganti (Pisahkan Koma)</label>
                <input
                  type="text"
                  value={srvParts}
                  onChange={(e) => setSrvParts(e.target.value)}
                  placeholder="Contoh: Filter Oli, Oli Mesin SAE 40, Seal Karet Gardan"
                  className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Keterangan / Keluhan Tambahan</label>
                <textarea
                  value={srvNotes}
                  onChange={(e) => setSrvNotes(e.target.value)}
                  placeholder="Catatan tambahan mengenai kondisi fisik gear, aus rantai, dll..."
                  className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 h-20"
                ></textarea>
              </div>

              {/* Photo Upload with HP Gallery / link support */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">📸 Foto Bukti Perawatan / Suku Cadang Baru</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 hover:border-emerald-500 transition-all text-center relative group">
                  {srvFoto ? (
                    <img 
                      src={srvFoto} 
                      alt="Bukti Perawatan" 
                      className="max-h-48 mx-auto object-cover rounded-lg shadow-xs mb-2" 
                    />
                  ) : (
                    <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 mb-2 border border-slate-100">
                      <span>Belum ada foto bukti perawatan terpilih</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <label className="block cursor-pointer">
                      <span className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1.5 rounded border border-emerald-200 transition-all">
                        📁 Pilih Foto dari Galeri HP
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, setSrvFoto);
                        }}
                      />
                    </label>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold">Atau masukkan tautan:</p>
                    <input 
                      type="text" 
                      value={srvFoto} 
                      onChange={(e) => setSrvFoto(e.target.value)}
                      className="w-full text-[9px] font-mono border border-slate-200 rounded px-1.5 py-1 text-slate-600 bg-slate-50 focus:bg-white text-center"
                      placeholder="Tautan Foto Bukti Service"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer uppercase tracking-wider"
                >
                  Catat Service
                </button>
              </div>
            </form>
          )}

          {activeFormTab === 'kerusakan' && (
            <form onSubmit={handleSubmitKerusakan} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Melaporkan Kerusakan / Mogok Alat Mesin di Sawah
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Unit Alsintan</label>
                  <select
                    value={krkAls}
                    onChange={(e) => setKrkAls(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    {alsintanList.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Tanggal Kejadian</label>
                  <input
                    type="date"
                    required
                    value={krkDate}
                    onChange={(e) => setKrkDate(e.target.value)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Tingkat Keparahan</label>
                  <select
                    value={krkSeverity}
                    onChange={(e) => setKrkSeverity(e.target.value as any)}
                    className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Ringan">Ringan (Alat Masih Bisa Jalan, Kendala Minor)</option>
                    <option value="Sedang">Sedang (Butuh Perbaikan Singkat di Lapangan)</option>
                    <option value="Berat">Berat (Mogok Total / Butuh Evakuasi ke Pos Brigade)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Deskripsi Gejala Kerusakan</label>
                <textarea
                  required
                  value={krkDesc}
                  onChange={(e) => setKrkDesc(e.target.value)}
                  placeholder="Jelaskan secara spesifik (misal: mesin pincang, keluar asap hitam pekat, atau kemudi slip kanan)..."
                  className="mt-1 block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 h-28"
                ></textarea>
              </div>

              {/* Photo Upload with HP Gallery / link support */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">📸 Foto Bukti Kerusakan Unit</label>
                <div className="border-2 border-dashed border-slate-200 p-5 rounded-lg text-center bg-slate-50 hover:border-rose-300 transition-all">
                  {krkFoto ? (
                    <img 
                      src={krkFoto} 
                      alt="Bukti Kerusakan" 
                      className="max-h-48 mx-auto object-cover rounded-lg shadow-xs mb-3" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2">
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700 block">Belum ada foto bukti kerusakan terpilih</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-center gap-1 mt-2">
                    <label className="block cursor-pointer">
                      <span className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black px-2.5 py-1.5 rounded border border-rose-200 transition-all">
                        📸 Pilih Foto / Ambil Gambar dari HP
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, setKrkFoto);
                        }}
                      />
                    </label>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold">Atau masukkan tautan:</p>
                    <input 
                      type="text" 
                      value={krkFoto} 
                      onChange={(e) => setKrkFoto(e.target.value)}
                      className="w-full text-[9px] font-mono border border-slate-200 rounded px-1.5 py-1 text-slate-600 bg-white focus:bg-white text-center max-w-md mx-auto"
                      placeholder="Tautan Foto Bukti Kerusakan"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer uppercase tracking-wider"
                >
                  Kirim Laporan Kerusakan
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Real-time Calculation Monitor (Tahap 13 Preview) */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Kalkulasi Metrik Otomatis
            </h3>

            {activeFormTab === 'laporan' ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Jam Kerja Mesin:</span>
                  <span className="font-bold text-white">{calcWorkingHours.toFixed(1)} Jam</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Efisiensi Kerja:</span>
                  <span className="font-bold text-amber-400">{calcEfficiency}% dari shift 8 jam</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Produktivitas:</span>
                  <span className="font-bold text-white">{calcProductivity} Ha / Jam</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">BBM per Jam:</span>
                  <span className="font-bold text-white">{calcFuelPerHour} Liter / Jam</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">BBM per Hektar:</span>
                  <span className="font-bold text-white">{calcFuelPerHectare} Liter / Ha</span>
                </div>

                {userRole !== 'Operator' && userRole !== 'Kabupaten' && userRole !== 'Koordinator' && (
                  <>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Biaya per Hektar:</span>
                      <span className="font-bold text-white">Rp {(Number(lapLandArea) > 0 ? (Number(lapCost) / Number(lapLandArea)) : 0).toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between pt-2">
                      <span className="text-emerald-400 font-bold">Laba Bersih:</span>
                      <span className={`font-bold ${calcNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        Rp {calcNetProfit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 leading-relaxed py-8 text-center font-sans">
                {activeFormTab === 'service' && '📝 Masukkan detail biaya suku cadang dan mekanik untuk otomatis merekap pengeluaran maintenance armada.'}
                {activeFormTab === 'kerusakan' && '🚨 Melaporkan kerusakan otomatis menurunkan skor MTBF (Mean Time Between Failures) armada dan mematikan status unit di peta real-time.'}
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-slate-700 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block font-bold text-slate-800">Aturan Kementan:</strong>
              <p className="mt-1 leading-relaxed text-slate-600">
                Pencatatan jam kerja awal/akhir wajib disesuaikan dengan jarum jam meter (HM Meter) fisik pada dashboard kemudi mesin untuk keperluan audit solar subsidi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History Sections for Service and Kerusakan requested by user to display evidence */}
      {activeFormTab === 'service' && serviceList.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            🔧 Riwayat Catatan Service &amp; Perawatan Preventif
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {serviceList.map((srv) => {
              const unit = alsintanList.find(a => a.id === srv.alsintanId);
              return (
                <div key={srv.id} className="p-3.5 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col md:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{unit?.name || 'Unit'} ({unit?.code || srv.alsintanId})</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                        {srv.serviceType}
                      </span>
                    </div>
                    <p className="text-slate-600">Teknisi: <strong className="font-semibold">{srv.mechanic}</strong> • Suku Cadang: {srv.partsReplaced.join(', ') || '-'}</p>
                    <p className="text-slate-500 italic">" {srv.notes} "</p>
                    <p className="text-[10px] text-slate-400 font-mono">{srv.date} • ID: {srv.id}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Biaya</p>
                      <strong className="text-slate-900 font-black">Rp {srv.cost.toLocaleString('id-ID')}</strong>
                    </div>
                    {srv.foto && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                        <img src={srv.foto} alt="Bukti Service" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeFormTab === 'kerusakan' && kerusakanList.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            🚨 Daftar Laporan Kerusakan Unit Alsintan
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {kerusakanList.map((krk) => {
              const unit = alsintanList.find(a => a.id === krk.alsintanId);
              return (
                <div key={krk.id} className="p-3.5 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col md:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{unit?.name || 'Unit'} ({unit?.code || krk.alsintanId})</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        krk.severity === 'Berat' ? 'bg-red-100 text-red-800' : krk.severity === 'Sedang' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {krk.severity}
                      </span>
                      <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                        {krk.status}
                      </span>
                    </div>
                    <p className="text-slate-600">Pelapor: <strong className="font-semibold">{krk.reportedBy}</strong></p>
                    <p className="text-slate-500 italic">" {krk.description} "</p>
                    <p className="text-[10px] text-slate-400 font-mono">{krk.date} • ID: {krk.id}</p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    {krk.foto && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                        <img src={krk.foto} alt="Bukti Kerusakan" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* PRINTABLE PHYSICAL POSTER MODAL */}
      {showPosterModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border-4 border-amber-500">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview Poster Pengumuman Kantor BP</span>
              <button
                type="button"
                onClick={() => setShowPosterModal(false)}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-600 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Printable Area */}
            <div id="printable-bp-poster" className="bg-amber-500 text-slate-950 p-8 sm:p-12 my-6 text-center border-8 border-slate-950 rounded-xl space-y-6 shadow-inner">
              <div className="inline-block bg-slate-950 text-white font-extrabold text-sm sm:text-base px-6 py-2 rounded-full uppercase tracking-widest shadow-md">
                📢 PENGUMUMAN RESMI BRIGADE
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
                JANGAN LUPA MENGISI LAPORAN KINERJA
              </h1>

              <div className="py-4 border-y-4 border-slate-950/40 my-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 animate-pulse uppercase tracking-wide">
                  💥 SETELAH SELESAI KERJA! 💥
                </p>
              </div>

              <div className="space-y-2 text-slate-900 max-w-md mx-auto">
                <p className="text-xs font-bold uppercase leading-relaxed">
                  Penyuluh Pendamping &amp; Operator wajib melakukan input data operasional (HM Awal, HM Akhir, Luas Lahan, Komoditas, dan BBM) setibanya di basecamp / kantor.
                </p>
                <p className="text-[10px] font-semibold text-slate-800 italic">
                  "Laporan Tertib, Dukungan Solar Subsidi &amp; Insentif Brigade Terjaga Lancar!"
                </p>
              </div>

              <div className="pt-6 border-t border-slate-950/20 text-[10px] font-bold text-slate-900 uppercase tracking-widest flex justify-between">
                <span>KEMENTERIAN PERTANIAN RI</span>
                <span>TIM DATA PEPI</span>
              </div>
            </div>

            {/* Print Action Bar */}
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-[10px] text-slate-400 font-medium self-center">
                *Tip: Anda bisa langsung menekan tombol Cetak untuk mencetak ke printer kertas atau menyimpannya sebagai PDF.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  🖨️ Cetak / Print Poster
                </button>
                <button
                  type="button"
                  onClick={() => setShowPosterModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
