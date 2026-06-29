import React, { useState } from 'react';
import { LaporanHarian, Brigade, Alsintan, Operator, User } from '../types';
import { FileText, Download, Printer, Filter, Calendar, Users, Hammer, MapPin, Eye, EyeOff, Clock, Camera, Sprout } from 'lucide-react';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportsExportsViewProps {
  laporanList: LaporanHarian[];
  brigades: Brigade[];
  alsintanList: Alsintan[];
  operators: Operator[];
  currentUser: User | null;
}

export default function ReportsExportsView({
  laporanList,
  brigades,
  alsintanList,
  operators,
  currentUser,
}: ReportsExportsViewProps) {
  const showFinancial = currentUser?.role === 'Koordinator' || currentUser?.role === 'Super Admin';
  const [filterBrigade, setFilterBrigade] = useState('Semua');
  const [filterAlsintanType, setFilterAlsintanType] = useState('Semua');
  const [filterOperator, setFilterOperator] = useState('Semua');
  const [filterAlsintan, setFilterAlsintan] = useState('Semua');
  const [filterKecamatan, setFilterKecamatan] = useState('Semua');
  const [filterKabupaten, setFilterKabupaten] = useState('Semua');
  const [filterActivity, setFilterActivity] = useState('Semua');
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-30');
  const [expandedLapId, setExpandedLapId] = useState<string | null>(null);
  const [selectedPrintReport, setSelectedPrintReport] = useState<LaporanHarian | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 20;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterBrigade, filterAlsintanType, filterOperator, filterAlsintan, filterKecamatan, filterKabupaten, filterActivity, startDate, endDate]);

  // Helper functions
  const getBrigadeName = (id: string) => brigades.find(b => b.id === id)?.name || id;
  const getOperatorName = (id: string) => operators.find(o => o.id === id)?.name || id;
  const getAlsintanName = (id: string) => alsintanList.find(a => a.id === id)?.name || id;
  const getAlsintanType = (id: string) => alsintanList.find(a => a.id === id)?.type || '';
  const getBrigadeKecamatan = (id: string) => brigades.find(b => b.id === id)?.district || '';
  const getBrigadeKabupaten = (id: string) => brigades.find(b => b.id === id)?.regency || '';

  // Get dynamic unique lists for filter options from current dataset
  const uniqueAlsintanTypes = Array.from(new Set(
    alsintanList.map(a => a.type).filter(Boolean)
  )).sort();

  const uniqueKecamatans = Array.from(new Set(
    laporanList.map(lap => lap.kecamatan || getBrigadeKecamatan(lap.brigadeId)).filter(Boolean)
  )).sort();

  const uniqueKabupatens = Array.from(new Set(
    laporanList.map(lap => lap.kabupaten || getBrigadeKabupaten(lap.brigadeId)).filter(Boolean)
  )).sort();

  // Filter Logic
  const filteredReports = laporanList.filter((lap) => {
    // 0. Date Range Filter
    if (startDate && lap.date < startDate) return false;
    if (endDate && lap.date > endDate) return false;

    // 1. BP (Brigade Pangan) Filter
    if (filterBrigade !== 'Semua' && lap.brigadeId !== filterBrigade) return false;

    // 2. Jenis Alat Filter
    if (filterAlsintanType !== 'Semua') {
      const type = getAlsintanType(lap.alsintanId);
      if (type !== filterAlsintanType) return false;
    }

    // 3. Operator Filter
    if (filterOperator !== 'Semua' && lap.operatorId !== filterOperator) return false;

    // 4. Specific Unit Alsintan Filter
    if (filterAlsintan !== 'Semua' && lap.alsintanId !== filterAlsintan) return false;

    // 5. Kecamatan Filter
    if (filterKecamatan !== 'Semua') {
      const kec = lap.kecamatan || getBrigadeKecamatan(lap.brigadeId);
      if (kec !== filterKecamatan) return false;
    }

    // 6. Kabupaten Filter
    if (filterKabupaten !== 'Semua') {
      const kab = lap.kabupaten || getBrigadeKabupaten(lap.brigadeId);
      if (kab !== filterKabupaten) return false;
    }

    // 7. Activity Type Filter
    if (filterActivity !== 'Semua' && lap.activityType !== filterActivity) return false;

    return true;
  });

  // Export 1: CSV Detail Laporan Harian
  const handleExportCSV = () => {
    const headers = 'ID Laporan,Tanggal,Nama Brigade,Nama Operator,Unit Alsintan,Jenis Alat,Jenis Kegiatan,Komoditas,Mulai Jam Kerja,Selesai Jam Kerja,Engine HM Kerja,Luas Lahan (Ha),BBM (L),Kecamatan,Kabupaten,Provinsi,Foto Sebelum,Foto Sesudah,Pendapatan,Biaya,Laba';
    const rows = filteredReports.map(lap => [
      lap.id,
      lap.date,
      `"${lap.brigadeName || getBrigadeName(lap.brigadeId)}"`,
      `"${lap.operatorName || getOperatorName(lap.operatorId)}"`,
      `"${getAlsintanName(lap.alsintanId)}"`,
      `"${getAlsintanType(lap.alsintanId)}"`,
      lap.activityType,
      lap.commodity,
      lap.startTime || '07:30',
      lap.endTime || '15:30',
      lap.workingHours,
      lap.landArea,
      lap.fuelUsed,
      `"${lap.kecamatan || getBrigadeKecamatan(lap.brigadeId) || '-'}"`,
      `"${lap.kabupaten || getBrigadeKabupaten(lap.brigadeId) || '-'}"`,
      `"${lap.provinsi || 'Kepulauan Bangka Belitung'}"`,
      `"${lap.fotoSebelum || '-'}"`,
      `"${lap.fotoSesudah || '-'}"`,
      lap.revenue,
      lap.cost,
      (lap.revenue - lap.cost)
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_harian_alsintan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export 2: CSV Rekap Harian (Grouped & Summarized by Date)
  const handleExportRekapHarianCSV = () => {
    const dailyGroup: { [date: string]: LaporanHarian[] } = {};
    filteredReports.forEach((lap) => {
      if (!dailyGroup[lap.date]) {
        dailyGroup[lap.date] = [];
      }
      dailyGroup[lap.date].push(lap);
    });

    const sortedDates = Object.keys(dailyGroup).sort((a, b) => b.localeCompare(a));

    const headers = 'Tanggal,Jumlah Laporan Kerja,Total Luas Layanan Lahan (Ha),Total BBM Subsidi (L),Total Jam HM Kerja,Total Pendapatan (Rp),Total Biaya Operasional (Rp),Laba Bersih (Rp)';
    
    const rows = sortedDates.map((date) => {
      const reports = dailyGroup[date];
      const count = reports.length;
      const totalArea = reports.reduce((sum, r) => sum + r.landArea, 0);
      const totalFuel = reports.reduce((sum, r) => sum + r.fuelUsed, 0);
      const totalHours = reports.reduce((sum, r) => sum + r.workingHours, 0);
      const totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0);
      const totalCost = reports.reduce((sum, r) => sum + r.cost, 0);
      const totalProfit = totalRevenue - totalCost;

      return [
        date,
        count,
        totalArea.toFixed(1),
        totalFuel,
        totalHours,
        totalRevenue,
        totalCost,
        totalProfit
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_harian_alsintan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = async (elementIdOrEvent: string | React.MouseEvent) => {
    const elementId = typeof elementIdOrEvent === 'string' ? elementIdOrEvent : 'global-print-area';
    const element = document.getElementById(elementId);
    if (!element) {
      window.print();
      return;
    }
    
    try {
      const originalStyle = element.style.cssText;
      // Ensure the element is visible and properly sized for canvas rendering
      element.style.padding = '30px';
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const orientation = elementId === 'global-print-area' ? 'landscape' : 'portrait';
      
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`laporan_pepi_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Filter className="w-4 h-4 text-emerald-600" /> Filter Parameter Laporan Kinerja
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Tanggal Awal */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Tanggal Awal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* BP (Brigade Pangan) Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Brigade Pangan (BP)</label>
            <select
              value={filterBrigade}
              onChange={(e) => setFilterBrigade(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Brigade (BP)</option>
              {brigades.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Jenis Alat Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Jenis Alat Alsintan</label>
            <select
              value={filterAlsintanType}
              onChange={(e) => setFilterAlsintanType(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Jenis Alat</option>
              {uniqueAlsintanTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Operator Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Operator</label>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Operator</option>
              {operators.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Kabupaten Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Wilayah Kabupaten</label>
            <select
              value={filterKabupaten}
              onChange={(e) => setFilterKabupaten(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kabupaten</option>
              {uniqueKabupatens.map(kab => (
                <option key={kab} value={kab}>{kab}</option>
              ))}
            </select>
          </div>

          {/* Kecamatan Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Wilayah Kecamatan</label>
            <select
              value={filterKecamatan}
              onChange={(e) => setFilterKecamatan(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kecamatan</option>
              {uniqueKecamatans.map(kec => (
                <option key={kec} value={kec}>{kec}</option>
              ))}
            </select>
          </div>

          {/* Unit Alsintan Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit Alat Spesifik</label>
            <select
              value={filterAlsintan}
              onChange={(e) => setFilterAlsintan(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Unit</option>
              {alsintanList.map(a => (
                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>

          {/* Jenis Kegiatan Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Jenis Kegiatan</label>
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              className="mt-1 block w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kegiatan</option>
              <option value="Olah Tanah">Olah Tanah</option>
              <option value="Tanam">Tanam</option>
              <option value="Pompanisasi">Pompanisasi</option>
              <option value="Panen">Panen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner print:hidden">
        <span className="text-xs font-semibold text-slate-600">Terbaca: <strong className="text-slate-800">{filteredReports.length} rekam data laporan</strong></span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Export Laporan Harian
          </button>
          <button
            onClick={handleExportRekapHarianCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Export Rekap Harian
          </button>
          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs cursor-pointer shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan Resmi
          </button>
        </div>
      </div>

      {/* Main Table Viewer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold">
                <th className="p-3">ID Laporan</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Brigade</th>
                <th className="p-3">Alsintan</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Kegiatan</th>
                <th className="p-3">Luas Lahan</th>
                {showFinancial && <th className="p-3 text-right">Laba Operasional</th>}
                <th className="p-3 text-center">Aksi / Foto 📸</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReports.length > 0 ? (
                (() => {
                  const indexOfLastReport = currentPage * ROWS_PER_PAGE;
                  const indexOfFirstReport = indexOfLastReport - ROWS_PER_PAGE;
                  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
                  const totalPages = Math.ceil(filteredReports.length / ROWS_PER_PAGE);

                  return (
                    <>
                      {currentReports.map((lap) => {
                        const isExpanded = expandedLapId === lap.id;
                        const resolvedBrigadeName = lap.brigadeName || getBrigadeName(lap.brigadeId);
                        const resolvedOperatorName = lap.operatorName || getOperatorName(lap.operatorId);
                        
                        return (
                          <React.Fragment key={lap.id}>
                            <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-emerald-50/20' : ''}`}>
                              <td className="p-3 font-mono font-bold text-emerald-700">{lap.id}</td>
                              <td className="p-3 font-medium">{lap.date}</td>
                              <td className="p-3 font-semibold text-slate-800">{resolvedBrigadeName}</td>
                              <td className="p-3">{getAlsintanName(lap.alsintanId)}</td>
                              <td className="p-3 font-medium">{resolvedOperatorName}</td>
                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {lap.activityType}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold">{lap.landArea} Ha</td>
                              {showFinancial && <td className="p-3 text-right font-mono font-bold text-emerald-700">Rp {(lap.revenue - lap.cost).toLocaleString('id-ID')}</td>}
                              <td className="p-3 text-center">
                                <div className="flex gap-1.5 justify-center">
                                  <button
                                    onClick={() => setExpandedLapId(isExpanded ? null : lap.id)}
                                    className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-md hover:bg-emerald-100 transition-all uppercase cursor-pointer"
                                    title={isExpanded ? "Tutup detail" : "Buka detail operasional"}
                                  >
                                    {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    <span className="sr-only">Detail</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedPrintReport(lap)}
                                    className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 px-2.5 py-1 rounded-md transition-all uppercase cursor-pointer shadow-3xs"
                                    title="Cetak Bukti Laporan Fisik PEPI (PDF)"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>PDF</span>
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expandable Section with photos, times, locations */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={9} className="p-4 bg-slate-50 border-l-4 border-emerald-600">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                                    {/* Left Section: Operational Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-emerald-600" /> Detail Waktu &amp; Personel
                                      </h4>
                                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Mulai Jam Kerja:</span>
                                          <span className="font-bold text-slate-800">{lap.startTime || '07:30'} WIB</span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Selesai Kerja:</span>
                                          <span className="font-bold text-slate-800">{lap.endTime || '15:30'} WIB</span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Engine Hour (HM):</span>
                                          <span className="font-bold text-slate-800">{lap.workingHours} Jam Kerja Mesin</span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Nama Operator:</span>
                                          <span className="font-bold text-slate-800">{resolvedOperatorName}</span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Brigade Pangan:</span>
                                          <span className="font-bold text-slate-800 text-right">{resolvedBrigadeName}</span>
                                        </p>
                                      </div>
                                    </div>

                                    {/* Middle Section: Regional Info */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-emerald-600" /> Wilayah Kerja Lapangan
                                      </h4>
                                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Kecamatan:</span>
                                          <span className="font-bold text-slate-800">{lap.kecamatan || 'Toboali'}</span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Kabupaten:</span>
                                          <span className="font-bold text-slate-800">{lap.kabupaten || 'Bangka Selatan'}</span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Provinsi:</span>
                                          <span className="font-bold text-slate-800">{lap.provinsi || 'Kepulauan Bangka Belitung'}</span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-400 font-medium">Koordinat GPS:</span>
                                          <span className="font-mono text-amber-700 font-bold">{lap.latitude.toFixed(4)}, {lap.longitude.toFixed(4)}</span>
                                        </p>
                                      </div>
                                    </div>

                                    {/* Right Section: Before / After Pictures */}
                                    <div className="space-y-2 md:col-span-1">
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                                        <Camera className="w-4 h-4 text-emerald-600" /> Dokumentasi Lahan Pertanian
                                      </h4>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                                          <span className="block text-[8px] font-extrabold text-slate-500 uppercase text-center mb-1 bg-amber-50 rounded">SEBELUM</span>
                                          <img 
                                            src={lap.fotoSebelum || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&auto=format&fit=crop&q=80'} 
                                            alt="Sebelum" 
                                            className="w-full h-20 object-cover rounded shadow-3xs referrerPolicy='no-referrer'" 
                                          />
                                        </div>
                                        <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                                          <span className="block text-[8px] font-extrabold text-slate-500 uppercase text-center mb-1 bg-emerald-50 rounded">SESUDAH</span>
                                          <img 
                                            src={lap.fotoSesudah || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=300&auto=format&fit=crop&q=80'} 
                                            alt="Sesudah" 
                                            className="w-full h-20 object-cover rounded shadow-3xs referrerPolicy='no-referrer'" 
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* New action bar to print single physical report with PEPI letterhead */}
                                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-end gap-2">
                                    <button
                                      onClick={() => setSelectedPrintReport(lap)}
                                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs transition-all uppercase"
                                    >
                                      <Printer className="w-4 h-4" /> Cetak Bukti Laporan Fisik (Kop PEPI)
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Pagination Controls */}
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">
                              Menampilkan {indexOfFirstReport + 1} - {Math.min(indexOfLastReport, filteredReports.length)} dari {filteredReports.length} laporan
                            </span>
                            <div className="flex gap-2">
                              <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 shadow-2xs"
                              >
                                Previous
                              </button>
                              <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 shadow-2xs"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })()
              ) : (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 font-medium">
                    📭 Tidak ada data laporan yang cocok dengan filter di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Performance Report Template (Visual PDF Simulator) */}
      <div id="global-print-area" className="bg-white p-8 rounded-xl border border-slate-300 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none">
        {/* Garuda / Kop Surat */}
        <div className="flex items-center gap-4 border-b-[3px] border-black pb-1 mb-1 relative">
          {/* Logo Placeholder */}
          <div className="w-24 h-24 shrink-0 flex items-center justify-center">
            {/* Fallback CSS logo to resemble PEPI logo if image fails */}
            <div className="w-20 h-20 rounded-full border-[3px] border-orange-500 bg-emerald-600 flex flex-col items-center justify-center text-white shadow-inner relative overflow-hidden">
              <div className="absolute inset-1 rounded-full border border-white/30"></div>
              <Sprout className="w-8 h-8 text-white mb-0.5" />
              <span className="text-[7px] font-black tracking-widest text-white mt-1">PEPI</span>
            </div>
          </div>
          
          <div className="flex-1 text-center font-sans">
            <h1 className="text-xl font-black uppercase text-[#002060] tracking-tight leading-tight">POLITEKNIK ENJIRING PERTANIAN INDONESIA</h1>
            <h2 className="text-[13px] font-bold uppercase text-black leading-tight mt-1">BADAN PENYULUHAN DAN PENGEMBANGAN SDM PERTANIAN</h2>
            <h2 className="text-[13px] font-bold uppercase text-black leading-tight">KEMENTERIAN PERTANIAN</h2>
            <p className="text-xs text-black mt-1 font-medium">Jl. Sinarmas Boulevard Nomor 01, Pagedangan, Kec. Pagedangan, Tangerang, Banten 15338</p>
          </div>
        </div>
        <div className="border-b-[1.5px] border-black w-full mb-6"></div>

        <div className="text-center mb-8 space-y-4">
          <h2 className="text-[15px] font-black uppercase text-black">SISTEM INFORMASI LAPORAN KINERJA ALSINTAN</h2>
          <h3 className="text-[13px] font-bold uppercase text-black">
            LAPORAN KINERJA ALSIN BRIGADE PANGAN {currentUser?.role === 'Operator' || currentUser?.role === 'Koordinator' 
              ? (brigades.find(b => b.id === currentUser?.brigadeId)?.name || '.........................')
              : (filterBrigade !== 'Semua' ? getBrigadeName(filterBrigade).toUpperCase() : '.........................')
            }
          </h3>
        </div>

        <div className="flex justify-between items-start text-xs text-black mb-4 font-semibold">
          <div>
            <table className="text-left text-xs">
              <tbody>
                <tr>
                  <td className="pr-2 py-0.5 align-top">Periode Laporan</td>
                  <td className="px-1 py-0.5 align-top">:</td>
                  <td className="py-0.5">{startDate ? new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Semua'} s/d {endDate ? new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Semua'}</td>
                </tr>
                <tr>
                  <td className="pr-2 py-0.5 align-top">Lokasi Lahan</td>
                  <td className="px-1 py-0.5 align-top">:</td>
                  <td className="py-0.5">
                    {currentUser?.role === 'Operator' || currentUser?.role === 'Koordinator' 
                      ? `${brigades.find(b => b.id === currentUser?.brigadeId)?.village || '...'}, Kec. ${brigades.find(b => b.id === currentUser?.brigadeId)?.district || '...'}, Kab. ${brigades.find(b => b.id === currentUser?.brigadeId)?.regency || '...'}`
                      : (filterBrigade !== 'Semua'
                          ? `${brigades.find(b => b.id === filterBrigade)?.village || '...'}, Kec. ${brigades.find(b => b.id === filterBrigade)?.district || '...'}, Kab. ${brigades.find(b => b.id === filterBrigade)?.regency || '...'}`
                          : (filterKecamatan !== 'Semua' ? filterKecamatan : 'Semua Wilayah'))
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-right">
            <table className="text-left text-xs ml-auto">
              <tbody>
                <tr>
                  <td className="pr-2 py-0.5 align-top text-right">Sifat</td>
                  <td className="px-1 py-0.5 align-top">:</td>
                  <td className="py-0.5">|</td>
                </tr>
                <tr>
                  <td className="pr-2 py-0.5 align-top text-right">Tanggal Cetak</td>
                  <td className="px-1 py-0.5 align-top">:</td>
                  <td className="py-0.5">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Daily Report Table */}
        <div className="mb-12">
          <table className="w-full text-left border-collapse border border-black text-xs font-serif">
            <thead>
              <tr className="bg-[#1e3a8a] text-white">
                <th className="border border-black p-2 font-bold text-center">No</th>
                <th className="border border-black p-2 font-bold text-center">Tanggal</th>
                <th className="border border-black p-2 font-bold text-center">Alsintan</th>
                <th className="border border-black p-2 font-bold text-center">Operator</th>
                <th className="border border-black p-2 font-bold text-center">Luas (Ha)</th>
                <th className="border border-black p-2 font-bold text-center">BBM (L)</th>
                {showFinancial && <th className="border border-black p-2 font-bold text-center">Biaya (Rp)</th>}
                {showFinancial && <th className="border border-black p-2 font-bold text-center">Pendapatan (Rp)</th>}
                {showFinancial && <th className="border border-black p-2 font-bold text-center">Laba (Rp)</th>}
              </tr>
            </thead>
            <tbody className="text-black">
              {filteredReports.length > 0 ? filteredReports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((lap, idx) => (
                <tr key={lap.id}>
                  <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                  <td className="border border-black p-2 text-center align-top">{new Date(lap.date).toLocaleDateString('id-ID')}</td>
                  <td className="border border-black p-2 align-top">{getAlsintanName(lap.alsintanId)}<br/><span className="text-[10px] text-slate-700">{getAlsintanType(lap.alsintanId)}</span></td>
                  <td className="border border-black p-2 align-top">{getOperatorName(lap.operatorId)}</td>
                  <td className="border border-black p-2 text-center align-top">{lap.landArea.toFixed(1)}</td>
                  <td className="border border-black p-2 text-center align-top">{lap.fuelUsed.toFixed(1)}</td>
                  {showFinancial && <td className="border border-black p-2 text-right align-top">{lap.cost.toLocaleString('id-ID')}</td>}
                  {showFinancial && <td className="border border-black p-2 text-right align-top">{lap.revenue.toLocaleString('id-ID')}</td>}
                  {showFinancial && <td className="border border-black p-2 text-right font-bold align-top">{(lap.revenue - lap.cost).toLocaleString('id-ID')}</td>}
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="border border-black p-4 text-center text-slate-500 font-medium">
                    Tidak ada data laporan untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="text-black">
              <tr className="font-bold">
                <td colSpan={4} className="border border-black p-2 text-center">TOTAL</td>
                <td className="border border-black p-2 text-center">{filteredReports.reduce((s, l) => s + l.landArea, 0).toFixed(1)}</td>
                <td className="border border-black p-2 text-center">{filteredReports.reduce((s, l) => s + l.fuelUsed, 0).toFixed(1)}</td>
                <td className="border border-black p-2 text-right">{filteredReports.reduce((s, l) => s + l.cost, 0).toLocaleString('id-ID')}</td>
                <td className="border border-black p-2 text-right">{filteredReports.reduce((s, l) => s + l.revenue, 0).toLocaleString('id-ID')}</td>
                <td className="border border-black p-2 text-right">{filteredReports.reduce((s, l) => s + (l.revenue - l.cost), 0).toLocaleString('id-ID')}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature lines */}
        <div className="flex justify-between text-sm text-black mt-16 mb-8 font-serif px-8">
          <div className="text-left">
            <p className="text-[#3b82f6]">Manajer BP,</p>
            <div className="h-24"></div>
            <p className="font-bold underline">
              {currentUser?.role === 'Operator' || currentUser?.role === 'Koordinator' 
                ? (brigades.find(b => b.id === currentUser?.brigadeId)?.leader || '................................')
                : (filterBrigade !== 'Semua' ? (brigades.find(b => b.id === filterBrigade)?.leader || '................................') : '................................')
              }
            </p>
          </div>
          <div className="text-left">
            <p className="text-[#3b82f6]">Katimker Penyuluh (BPP),</p>
            <div className="h-24"></div>
            <p className="font-bold">........................................</p>
          </div>
        </div>

        {/* Print Button at the bottom */}
        <div className="flex justify-center mt-6 print:hidden">
          <button
            onClick={() => handlePrintPDF('global-print-area')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm cursor-pointer shadow-md transition-colors"
          >
            <Printer className="w-5 h-5" /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Official Print Modal (Surat Bukti Laporan Fisik Resmi PEPI) */}
      {selectedPrintReport && (
        <div className="fixed inset-0 z-[999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:absolute print:inset-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col print:max-h-none print:overflow-visible print:shadow-none print:border-none print:rounded-none">
            {/* Modal Control Header (Hidden during print) */}
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-200 rounded-t-2xl print:hidden sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Pratinjau Cetak Bukti Laporan Fisik
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                    Politeknik Enjiniring Pertanian Indonesia (PEPI)
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintPDF('modal-print-area')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" /> Cetak / Unduh PDF
                </button>
                <button
                  onClick={() => setSelectedPrintReport(null)}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold rounded-lg text-xs cursor-pointer shadow-2xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="modal-print-area" className="p-10 print:p-0 bg-white text-slate-900 max-w-3xl mx-auto w-full font-serif leading-relaxed">
              {/* Kop Surat Resmi PEPI */}
              <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-3 mb-6">
                {/* Visual Seal Emblem */}
                <div className="w-18 h-18 bg-emerald-800 text-white flex flex-col items-center justify-center rounded-full p-2 border-2 border-amber-400 font-sans shadow-inner shrink-0">
                  <span className="text-[10px] font-black tracking-widest text-amber-300">PEPI</span>
                  <div className="w-10 h-0.5 bg-amber-300 my-0.5"></div>
                  <span className="text-[6px] text-center font-extrabold leading-tight">KEMENTAN RI</span>
                </div>

                <div className="flex-1 text-center font-serif">
                  <h3 className="text-[10px] font-bold tracking-wider uppercase leading-none text-slate-800">Kementerian Pertanian Republik Indonesia</h3>
                  <h2 className="text-[10px] font-bold tracking-tight uppercase leading-snug text-slate-700">Badan Penyuluhan dan Pengembangan SDM Pertanian</h2>
                  <h1 className="text-sm font-black tracking-tight uppercase leading-snug text-emerald-800 mt-0.5">Politeknik Enjiniring Pertanian Indonesia</h1>
                  <p className="text-[8px] font-sans font-medium text-slate-500 leading-tight mt-1">
                    Kampus Serpong: Jl. Kompleks Garuda No. 1, Dukuh, Serpong, Tangerang, Banten 15310
                  </p>
                  <p className="text-[8px] font-sans font-semibold text-emerald-600 leading-none">
                    Surel: info.pepi@pertanian.go.id | Situs Resmi: www.pepi.ac.id | Telp: (021) 5000000
                  </p>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center mb-6 space-y-1">
                <h2 className="text-xs font-black tracking-widest uppercase underline text-slate-950">SURAT BUKTI LAPORAN FISIK OPERASIONAL ALSINTAN</h2>
                <p className="text-[10px] font-mono text-slate-600 font-bold">Nomor: B-{selectedPrintReport.id}/PEPI/SR.120/{new Date(selectedPrintReport.date).getMonth() + 1}/2026</p>
              </div>

              {/* Content intro */}
              <p className="text-[11px] mb-4 text-justify leading-relaxed indent-8 text-slate-800">
                Berdasarkan hasil pencatatan sistem monitoring terintegrasi dan validasi fisik di lapangan, dengan ini menerangkan bahwa operator di bawah binaan koordinasi Politeknik Enjiniring Pertanian Indonesia (PEPI) telah menyelesaikan pengerjaan operasional alat mesin pertanian (Alsintan) dengan rincian data sebagai berikut:
              </p>

              {/* Table Data */}
              <div className="border border-slate-900 text-[11px] divide-y divide-slate-900 mb-6 bg-white shadow-3xs">
                {/* Section I */}
                <div className="bg-slate-100 px-3 py-1 font-sans font-bold text-[9px] tracking-wider text-slate-800 uppercase">I. IDENTITAS OPERASIONAL &amp; PERSONEL</div>
                <div className="grid grid-cols-2 divide-x divide-slate-900">
                  <div className="p-2.5 space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">ID Laporan Kerja:</span> <strong className="font-mono text-emerald-800 text-[11px]">{selectedPrintReport.id}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tanggal Operasional:</span> <strong className="text-slate-900">{selectedPrintReport.date}</strong></div>
                  </div>
                  <div className="p-2.5 space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Nama Operator:</span> <strong className="text-slate-900">{selectedPrintReport.operatorName || getOperatorName(selectedPrintReport.operatorId)}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Brigade Pangan (BP):</span> <strong className="text-slate-900">{selectedPrintReport.brigadeName || getBrigadeName(selectedPrintReport.brigadeId)}</strong></div>
                  </div>
                </div>

                {/* Section II */}
                <div className="bg-slate-100 px-3 py-1 font-sans font-bold text-[9px] tracking-wider text-slate-800 uppercase">II. SPESIFIKASI ALAT &amp; KONSUMSI ENERGI</div>
                <div className="grid grid-cols-2 divide-x divide-slate-900">
                  <div className="p-2.5 space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Alat &amp; Mesin (Alsintan):</span> <strong className="text-slate-900">{getAlsintanName(selectedPrintReport.alsintanId)}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Jenis Alat Alsintan:</span> <strong className="text-slate-900">{getAlsintanType(selectedPrintReport.alsintanId)}</strong></div>
                  </div>
                  <div className="p-2.5 space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Engine Hour (HM) Mulai:</span> <strong className="text-slate-900">{selectedPrintReport.startHM || 100} HM</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Engine Hour (HM) Akhir:</span> <strong className="text-slate-900">{selectedPrintReport.endHM || 108} HM</strong></div>
                  </div>
                </div>

                {/* Section III */}
                <div className="bg-slate-100 px-3 py-1 font-sans font-bold text-[9px] tracking-wider text-slate-800 uppercase">III. CAPAIAN KINERJA &amp; LOKASI LAPANGAN</div>
                <div className="grid grid-cols-2 divide-x divide-slate-900">
                  <div className="p-2.5 space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Jenis Kegiatan:</span> <strong className="text-emerald-800 uppercase font-sans text-[10px]">{selectedPrintReport.activityType}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Komoditas Utama:</span> <strong className="text-slate-900">{selectedPrintReport.commodity || 'Padi'}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Waktu Kerja Efektif:</span> <strong className="text-slate-900">{selectedPrintReport.startTime || '07:30'} s.d. {selectedPrintReport.endTime || '15:30'} WIB</strong></div>
                  </div>
                  <div className="p-2.5 space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Luas Lahan Layanan:</span> <strong className="text-slate-900">{selectedPrintReport.landArea} Hektar (Ha)</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Konsumsi BBM Bersubsidi:</span> <strong className="text-slate-900">{selectedPrintReport.fuelUsed} Liter (L)</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Koordinat Lokasi GPS:</span> <strong className="font-mono text-amber-800">{selectedPrintReport.latitude.toFixed(5)}, {selectedPrintReport.longitude.toFixed(5)}</strong></div>
                  </div>
                </div>

                {/* Regional details inside the report */}
                <div className="bg-slate-50 p-2 text-center text-[10px] font-sans font-semibold text-slate-700">
                  Lokasi Kerja: Kecamatan {selectedPrintReport.kecamatan || getBrigadeKecamatan(selectedPrintReport.brigadeId) || '-'}, Kabupaten {selectedPrintReport.kabupaten || getBrigadeKabupaten(selectedPrintReport.brigadeId) || '-'}, Provinsi {selectedPrintReport.provinsi || 'Kepulauan Bangka Belitung'}
                </div>

                {/* Section IV */}
                <div className="bg-slate-100 px-3 py-1 font-sans font-bold text-[9px] tracking-wider text-slate-800 uppercase">IV. ANALISIS BIAYA &amp; KEUANGAN</div>
                <div className="grid grid-cols-3 divide-x divide-slate-900 text-center">
                  <div className="p-2.5">
                    <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-semibold">Total Pendapatan Jasa</span>
                    <strong className="text-emerald-700 font-mono text-[11px]">Rp {selectedPrintReport.revenue.toLocaleString('id-ID')}</strong>
                  </div>
                  { (currentUser?.role === 'Operator' || currentUser?.role === 'Super Admin') && (
                    <div className="p-2.5">
                      <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-semibold">Biaya Operasional</span>
                      <strong className="text-red-600 font-mono text-[11px]">Rp {selectedPrintReport.cost.toLocaleString('id-ID')}</strong>
                    </div>
                  )}
                  <div className="p-2.5 bg-emerald-50/20">
                    <span className="text-slate-800 block text-[8px] uppercase tracking-wider font-bold">Laba Bersih Operasional</span>
                    <strong className="text-emerald-900 font-mono text-xs font-black">Rp {(selectedPrintReport.revenue - selectedPrintReport.cost).toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>

              {/* Photos Block */}
              <div className="space-y-2 mb-8">
                <h4 className="text-[9px] font-bold uppercase text-slate-800 tracking-wider">V. DOKUMENTASI FISIK LAHAN PERTANIAN</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-900 p-2 bg-white flex flex-col items-center">
                    <span className="block text-[8px] font-extrabold text-center mb-1.5 uppercase tracking-widest bg-amber-50 text-amber-800 px-2 py-0.5 rounded">FOTO SEBELUM OPERASIONAL</span>
                    <img 
                      src={selectedPrintReport.fotoSebelum || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&auto=format&fit=crop&q=80'} 
                      alt="Foto Sebelum" 
                      className="w-full h-36 object-cover border border-slate-200" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[7px] text-slate-500 mt-1 italic font-sans">Kamera ID: CAM-BEF-{selectedPrintReport.id}</span>
                  </div>
                  <div className="border border-slate-900 p-2 bg-white flex flex-col items-center">
                    <span className="block text-[8px] font-extrabold text-center mb-1.5 uppercase tracking-widest bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">FOTO SESUDAH OPERASIONAL</span>
                    <img 
                      src={selectedPrintReport.fotoSesudah || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=300&auto=format&fit=crop&q=80'} 
                      alt="Foto Sesudah" 
                      className="w-full h-36 object-cover border border-slate-200" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[7px] text-slate-500 mt-1 italic font-sans">Kamera ID: CAM-AFT-{selectedPrintReport.id}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="text-[11px] mb-8 font-sans">
                <p className="text-right text-slate-800">Tangerang Selatan, {new Date(selectedPrintReport.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="grid grid-cols-2 text-center mt-4">
                  <div>
                    <p className="text-slate-700 font-semibold">Operator Alsintan Lapangan,</p>
                    <div className="h-16 flex items-center justify-center text-slate-400 italic text-[9px]">
                      ( Tanda Tangan Fisik )
                    </div>
                    <p className="font-extrabold underline uppercase text-slate-900">{selectedPrintReport.operatorName || getOperatorName(selectedPrintReport.operatorId)}</p>
                    <p className="text-[8px] text-slate-500">ID Operator: {selectedPrintReport.operatorId}</p>
                  </div>
                  <div>
                    <p className="text-slate-700 font-semibold">Mengetahui,<br />Manajer BP,</p>
                    <div className="h-16 flex items-center justify-center relative">
                      {/* Interactive verified badge stamp */}
                      <div className="absolute border border-emerald-600 text-emerald-600 rounded-full px-2 py-0.5 font-bold text-[7px] tracking-widest uppercase rotate-6 bg-white/90 shadow-3xs select-none pointer-events-none">
                        APPROVED BY PEPI
                      </div>
                      <span className="text-[8px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">TERKUNCI SISTEM ELEKTRONIK</span>
                    </div>
                    <p className="font-extrabold underline uppercase text-slate-900">Heri Prasetyo, M.Si.</p>
                    <p className="text-[8px] text-slate-500">NIP: 19840212 201012 1 003</p>
                  </div>
                </div>
              </div>

              {/* Footer text */}
              <div className="border-t border-slate-300 pt-2.5 text-center text-[8px] text-slate-400 font-mono">
                Bukti fisik laporan operasional ini sah dan terdaftar resmi pada database Politeknik Enjiniring Pertanian Indonesia.
                <br />
                Sistem Penjamin Mutu PEPI • Dicetak otomatis pada {new Date().toLocaleString('id-ID')} WIB.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled print media definitions */}
      <style>{`
        @media print {
          /* Hide all page layouts except the active print-area */
          body * {
            visibility: hidden !important;
          }
          #${selectedPrintReport ? 'modal-print-area' : 'global-print-area'}, #${selectedPrintReport ? 'modal-print-area' : 'global-print-area'} * {
            visibility: visible !important;
          }
          #${selectedPrintReport ? 'modal-print-area' : 'global-print-area'} {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Ensure images and borders print properly */
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          div, td, th {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
