import React, { useState, useMemo } from 'react';
import { Brigade, LaporanHarian } from '../types';
import {
  X,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Info,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  FileText
} from 'lucide-react';

interface WABillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  brigades: Brigade[];
  laporanList: LaporanHarian[];
}

export default function WABillingModal({
  isOpen,
  onClose,
  brigades,
  laporanList
}: WABillingModalProps) {
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-26');
  const [selectedProvince, setSelectedProvince] = useState<string>('Semua');
  const [selectedRegency, setSelectedRegency] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Belum' | 'Sudah'>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Contacted tracking (session-based helper)
  const [contactedBrigades, setContactedBrigades] = useState<Record<string, boolean>>({});

  // Clipboard copy status tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pre-configured and Custom WA Templates state
  const [templates, setTemplates] = useState<{ id: string; name: string; text: string }[]>(() => {
    const saved = localStorage.getItem('sipp_wa_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to defaults
      }
    }
    return [
      {
        id: 'standar',
        name: '📝 Pengingat Standar Laporan',
        text: 'Halo Pak [Leader] dari [Brigade] ([Kabupaten]). Kami dari Tim Data PEPI Kementan mengingatkan bahwa laporan harian operasional alsintan untuk tanggal [Tanggal] belum terinput di Sistem Informasi Laporan Kinerja Alsintan. Mohon segera diisi melalui HP atau di kantor BP agar penyaluran solar subsidi dan insentif tetap lancar. Terima kasih!'
      },
      {
        id: 'mendesak',
        name: '⚠️ Mendesak (Batas Akhir Subsidi)',
        text: 'PENTING & SEGERA: Kepada Pak [Leader] ([Brigade]). Batas waktu pelaporan Laporan Kinerja Alsintan untuk tanggal [Tanggal] akan segera ditutup malam ini. Mohon input laporan luas lahan kerja traktor hari ini sekarang juga demi kelancaran alokasi kuota pupuk dan solar subsidi brigade Anda. Terima kasih.'
      },
      {
        id: 'sopan',
        name: '🤝 Kasual & Pendampingan Lapangan',
        text: 'Semangat sore Pak [Leader] ([Brigade]). Bagaimana progres olah tanah dan tanam hari ini? Mohon dibantu untuk melengkapi laporan harian tanggal [Tanggal] di aplikasi Laporan Kinerja Alsintan ya Pak. Jika ada kendala sinyal atau unit alsintan di [Kabupaten], segera infokan ke kami. Terimakasih banyak!'
      }
    ];
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('standar');

  // Find the currently active template object
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Actual editable message text
  const [messageTemplate, setMessageTemplate] = useState<string>(activeTemplate.text);

  // Sync messageTemplate state whenever selectedTemplateId changes
  React.useEffect(() => {
    if (activeTemplate) {
      setMessageTemplate(activeTemplate.text);
    }
  }, [selectedTemplateId]);

  // Name state for adding a new template
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [showAddTemplate, setShowAddTemplate] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Save changes made to the current template text
  const handleSaveCurrentTemplateText = () => {
    const updated = templates.map((t) => {
      if (t.id === selectedTemplateId) {
        return { ...t, text: messageTemplate };
      }
      return t;
    });
    setTemplates(updated);
    localStorage.setItem('sipp_wa_templates', JSON.stringify(updated));
    triggerSuccessAlert('Perubahan teks berhasil disimpan!');
  };

  // Create a new template variation
  const handleCreateNewTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newId = `custom-${Date.now()}`;
    const newTpl = {
      id: newId,
      name: `⭐ ${newTemplateName.trim()}`,
      text: messageTemplate
    };
    const updated = [...templates, newTpl];
    setTemplates(updated);
    localStorage.setItem('sipp_wa_templates', JSON.stringify(updated));
    setSelectedTemplateId(newId);
    setNewTemplateName('');
    setShowAddTemplate(false);
    triggerSuccessAlert('Template baru berhasil ditambahkan!');
  };

  // Delete current custom template
  const handleDeleteTemplate = (idToDelete: string) => {
    if (['standar', 'mendesak', 'sopan'].includes(idToDelete)) {
      alert('Template bawaan sistem tidak dapat dihapus.');
      return;
    }
    const updated = templates.filter((t) => t.id !== idToDelete);
    setTemplates(updated);
    localStorage.setItem('sipp_wa_templates', JSON.stringify(updated));
    setSelectedTemplateId('standar');
    triggerSuccessAlert('Template berhasil dihapus.');
  };

  const triggerSuccessAlert = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3000);
  };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSelectedDate('2026-06-26');
    setSelectedProvince('Semua');
    setSelectedRegency('Semua');
    setStatusFilter('Semua');
    setSearchQuery('');
  };

  // Get list of unique provinces
  const provinces = useMemo(() => {
    const list = new Set(brigades.map((b) => b.province));
    return ['Semua', ...Array.from(list)];
  }, [brigades]);

  // Get list of unique regencies based on selected province
  const regencies = useMemo(() => {
    let filtered = brigades;
    if (selectedProvince !== 'Semua') {
      filtered = brigades.filter((b) => b.province === selectedProvince);
    }
    const list = new Set(filtered.map((b) => b.regency));
    return ['Semua', ...Array.from(list)];
  }, [brigades, selectedProvince]);

  // Determine which brigades have submitted reports for the selected date
  const reportingStatusMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    brigades.forEach((b) => {
      const reported = laporanList.some(
        (l) => l.brigadeId === b.id && l.date === selectedDate
      );
      map[b.id] = reported;
    });
    return map;
  }, [brigades, laporanList, selectedDate]);

  // Computed & Filtered Brigades
  const filteredBrigades = useMemo(() => {
    return brigades.filter((b) => {
      // Province filter
      if (selectedProvince !== 'Semua' && b.province !== selectedProvince) {
        return false;
      }
      // Regency filter
      if (selectedRegency !== 'Semua' && b.regency !== selectedRegency) {
        return false;
      }
      // Status filter
      const isReported = reportingStatusMap[b.id];
      if (statusFilter === 'Belum' && isReported) return false;
      if (statusFilter === 'Sudah' && !isReported) return false;

      // Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesLeader = b.leader.toLowerCase().includes(query);
        const matchesRegency = b.regency.toLowerCase().includes(query);
        const matchesDistrict = b.district.toLowerCase().includes(query);
        if (!matchesName && !matchesLeader && !matchesRegency && !matchesDistrict) {
          return false;
        }
      }

      return true;
    });
  }, [brigades, selectedProvince, selectedRegency, statusFilter, searchQuery, reportingStatusMap]);

  // Compliance metrics based on filtered results
  const metrics = useMemo(() => {
    const total = filteredBrigades.length;
    const reportedCount = filteredBrigades.filter((b) => reportingStatusMap[b.id]).length;
    const missingCount = total - reportedCount;
    const rate = total > 0 ? Math.round((reportedCount / total) * 100) : 0;

    return { total, reportedCount, missingCount, rate };
  }, [filteredBrigades, reportingStatusMap]);

  // Group filtered brigades by regency (Kabupaten) for structured presentation
  const groupedBrigades = useMemo(() => {
    const groups: Record<string, Brigade[]> = {};
    filteredBrigades.forEach((b) => {
      if (!groups[b.regency]) {
        groups[b.regency] = [];
      }
      groups[b.regency].push(b);
    });
    return groups;
  }, [filteredBrigades]);

  // Generate dynamic message content for a specific brigade
  const getDynamicMessage = (brigade: Brigade) => {
    let msg = messageTemplate;
    msg = msg.replace(/\[Leader\]/g, brigade.leader);
    msg = msg.replace(/\[Brigade\]/g, brigade.name);
    msg = msg.replace(/\[Kabupaten\]/g, `Kab. ${brigade.regency}`);
    msg = msg.replace(/\[Tanggal\]/g, selectedDate);
    return msg;
  };

  // Copy message to clipboard action
  const handleCopyMessage = (brigade: Brigade) => {
    const text = getDynamicMessage(brigade);
    navigator.clipboard.writeText(text);
    setCopiedId(brigade.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Toggle "Sudah Dihubungi" state helper
  const toggleContacted = (id: string) => {
    setContactedBrigades((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans overflow-hidden">
      <div 
        id="wa-billing-panel"
        className="bg-slate-50 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col border border-slate-200"
      >
        {/* Header */}
        <div className="bg-primary-green text-white px-5 py-4 flex justify-between items-center border-b border-accent-yellow/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-700/50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-accent-yellow animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight uppercase">
                Pusat Penagihan Laporan Harian WA
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium">
                Sistem Pemantauan Kepatuhan Brigade Pangan • Tim Data PEPI Kementan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Tutup Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Info Card / Tip */}
          <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3.5 rounded-r-xl flex gap-3 shadow-2xs">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed font-sans">
              <span className="font-extrabold text-emerald-800">Smart Billing:</span> Filter di bawah mencerminkan live data dari aktivitas pelaporan alsintan harian. Anda dapat memfilter spesifik **Kabupaten** dan langsung menagih pengurus Brigade Pangan yang belun lapor melalui pintasan **WhatsApp langsung** atau **salin pesan**.
            </div>
          </div>

          {/* Metrics Summary Area */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Brigades */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs text-center flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Brigade</span>
              <span className="text-2xl font-black text-slate-800 my-1">{metrics.total}</span>
              <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full self-center">Dalam Filter</span>
            </div>

            {/* Reported */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs text-center flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sudah Lapor</span>
              <span className="text-2xl font-black text-emerald-600 my-1">{metrics.reportedCount}</span>
              <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full self-center flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Aman
              </span>
            </div>

            {/* Belum Lapor */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs text-center flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-rose-500">Belum Lapor</span>
              <span className="text-2xl font-black text-rose-600 my-1">{metrics.missingCount}</span>
              <span className="text-[9px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded-full self-center animate-pulse">
                🔴 Tagih WA
              </span>
            </div>

            {/* Compliance Rate */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs text-center flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tingkat Kepatuhan</span>
              <span className="text-2xl font-black text-primary-green my-1">{metrics.rate}%</span>
              
              {/* Compliance visual bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 self-center max-w-[100px]">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${metrics.rate > 80 ? 'bg-emerald-600' : metrics.rate > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${metrics.rate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Filters Dashboard Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-3xs p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Filter className="w-3.5 h-3.5 text-slate-500" /> Filter Pemantauan
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset Filter
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Tanggal Operasional
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* Province Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Provinsi
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedRegency('Semua'); // reset regency when province changes
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                >
                  {provinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Regency / Kabupaten Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Kabupaten
                </label>
                <select
                  value={selectedRegency}
                  onChange={(e) => setSelectedRegency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                >
                  {regencies.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg === 'Semua' ? 'Semua Kabupaten' : reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Laporan Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Status Laporan
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Semua', 'Belum', 'Sudah'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center border cursor-pointer transition-all ${
                        statusFilter === status
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {status === 'Semua' ? 'Semua' : status === 'Belum' ? 'Belum' : 'Sudah'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input (Brigade Name, Leader Name) */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Search className="w-3 h-3 text-slate-400" /> Cari Pengurus / Nama Brigade
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama brigade, pendamping, kecamatan, atau desa..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white placeholder:text-slate-400"
                  />
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* MESSAGE TEMPLATE CUSTOMIZER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-3xs p-4">
            <details className="group" open>
              <summary className="list-none flex justify-between items-center cursor-pointer">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  💬 Kustomisasi &amp; Variasi Template Pesan WhatsApp
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold group-open:hidden">
                  Klik untuk ubah
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold hidden group-open:inline">
                  Template Aktif
                </span>
              </summary>
              
              <div className="mt-4 space-y-4 pt-3 border-t border-slate-100">
                {/* Save Success Alert inside card */}
                {saveSuccessMessage && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    {saveSuccessMessage}
                  </div>
                )}

                {/* Dropdown template selector and actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Pilih Variasi Teks Pengingat
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2 shrink-0">
                    {/* Add new template trigger */}
                    {!showAddTemplate && (
                      <button
                        type="button"
                        onClick={() => setShowAddTemplate(true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Baru
                      </button>
                    )}

                    {/* Delete current template (if custom) */}
                    {!['standar', 'mendesak', 'sopan'].includes(selectedTemplateId) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(selectedTemplateId)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] px-3 py-2 rounded-lg transition-colors flex items-center gap-1 border border-rose-100 cursor-pointer"
                        title="Hapus template kustom ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Add new template inline form */}
                {showAddTemplate && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3 animate-fade-in">
                    <div className="text-[10px] font-extrabold text-slate-500 uppercase">Buat Variasi Teks Baru</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Contoh: Pengingat Santai Sore"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={handleCreateNewTemplate}
                        disabled={!newTemplateName.trim()}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Simpan Variasi
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddTemplate(false);
                          setNewTemplateName('');
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg"
                      >
                        Batal
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400">Teks template di bawah akan diduplikasi ke dalam variasi baru ini.</p>
                  </div>
                )}

                {/* Textarea for editing */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Isi Pesan Template (Bisa diedit langsung)
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveCurrentTemplateText}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-1 hover:underline cursor-pointer animate-pulse"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Simpan Perubahan Teks
                    </button>
                  </div>
                  <textarea
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    rows={4}
                    className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 focus:bg-white leading-relaxed font-sans shadow-inner"
                    placeholder="Ketik template pesan WhatsApp di sini..."
                  />
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] text-slate-400 font-bold uppercase font-mono bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-500 font-extrabold">🏷️ Tag Otomatis:</span>
                    <span className="text-emerald-700">[Leader] = Nama Koor</span>
                    <span className="text-emerald-700">[Brigade] = Nama Brigade</span>
                    <span className="text-emerald-700 font-extrabold">[Kabupaten] = Kabupaten</span>
                    <span className="text-emerald-700 font-extrabold">[Tanggal] = Tanggal Terpilih</span>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* GROUPED BRIGADES LIST (BY KABUPATEN) */}
          <div className="space-y-4">
            {metrics.total === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 space-y-2.5">
                <div className="text-4xl">📭</div>
                <p className="text-xs font-bold text-slate-600 font-sans uppercase">Tidak Ada Data Ditemukan</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Tidak ada Brigade Pangan dalam kriteria filter Anda saat ini. Silakan atur kembali pencarian atau setelan status laporan Anda.
                </p>
              </div>
            ) : (
              Object.keys(groupedBrigades).sort().map((regencyName) => {
                const regencyBrigades = groupedBrigades[regencyName];
                return (
                  <div key={regencyName} className="space-y-2.5">
                    {/* Kabupaten Group Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans bg-amber-500/10 text-slate-900 border border-amber-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                        📍 KABUPATEN {regencyName.toUpperCase()}
                        <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded-full font-black">
                          {regencyBrigades.length} Brigade
                        </span>
                      </span>
                      <div className="flex-1 border-t border-slate-200/80"></div>
                    </div>

                    {/* Brigades inside this Kabupaten */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {regencyBrigades.map((brigade) => {
                        const isReported = reportingStatusMap[brigade.id];
                        const isContacted = !!contactedBrigades[brigade.id];
                        const dynamicMessage = getDynamicMessage(brigade);
                        const whatsappUrl = `https://wa.me/${brigade.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(dynamicMessage)}`;

                        return (
                          <div
                            key={brigade.id}
                            className={`bg-white rounded-xl border p-4 shadow-3xs transition-all relative overflow-hidden flex flex-col justify-between ${
                              isContacted 
                                ? 'opacity-70 border-slate-200 bg-slate-50' 
                                : isReported 
                                  ? 'border-emerald-200 hover:border-emerald-300' 
                                  : 'border-rose-200 hover:border-rose-300 ring-1 ring-rose-500/5'
                            }`}
                          >
                            {/* Card Header */}
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                  <h4 className="text-xs font-black text-slate-800 font-sans tracking-tight">
                                    {brigade.name}
                                  </h4>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                    Desa {brigade.village}, Kec. {brigade.district}
                                  </p>
                                </div>

                                {/* Status Pill */}
                                {isReported ? (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black px-2 py-0.5 rounded-full uppercase shrink-0 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    Lapor
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200/60 font-black px-2 py-0.5 rounded-full uppercase shrink-0 flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                    Belum lapor
                                  </span>
                                )}
                              </div>

                              {/* Leader details */}
                              <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 mb-3 space-y-1 text-[10px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-semibold">Pendamping / Koor:</span>
                                  <span className="font-bold text-slate-700 uppercase">{brigade.leader}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-semibold">HP / WhatsApp:</span>
                                  <span className="font-mono text-slate-600 font-bold">{brigade.phone}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions footer */}
                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                              {!isReported ? (
                                <>
                                  <div className="flex gap-2">
                                    {/* Direct WA button */}
                                    <a
                                      href={whatsappUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => {
                                        // Auto-mark as contacted for session convenience
                                        setContactedBrigades(prev => ({ ...prev, [brigade.id]: true }));
                                      }}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-colors text-center flex items-center justify-center gap-1.5 uppercase shadow-2xs"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      Hubungi WA
                                    </a>

                                    {/* Copy Template Message */}
                                    <button
                                      type="button"
                                      onClick={() => handleCopyMessage(brigade)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                                      title="Salin Teks Pesan"
                                    >
                                      {copiedId === brigade.id ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          <span className="text-emerald-700">Disalin!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Salin</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Session "Sudah Dihubungi" Toggle */}
                                  <label className="flex items-center gap-2 mt-1 px-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isContacted}
                                      onChange={() => toggleContacted(brigade.id)}
                                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                    />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                      {isContacted ? 'Sudah Ditagih via WA ✓' : 'Tandai Sudah Dihubungi Hari Ini'}
                                    </span>
                                  </label>
                                </>
                              ) : (
                                <div className="text-center py-1 text-[9px] text-emerald-700 font-extrabold bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex items-center justify-center gap-1 font-sans">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  LAPORAN HARI INI AMAN TERKIRIM
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest font-mono">
            BILLING v2.4 • PEPI DATA INTEL
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[10px] px-4 py-1.5 rounded-lg uppercase tracking-wide transition-all cursor-pointer shadow-3xs"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
