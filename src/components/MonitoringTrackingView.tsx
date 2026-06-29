import React, { useState, useMemo } from 'react';
import { Brigade, Alsintan, Operator, LaporanHarian } from '../types';
import { MapPin, Search, Sprout, ShieldCheck, Phone, Check, Info, FileText, ChevronRight, Globe, Layers, Map as MapIcon, Activity } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet';
import { mockTargetRealisasi } from '../data/mockData';

const PROVINCE_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Kepulauan Bangka Belitung': { lat: -2.7410, lng: 106.4406, zoom: 8 },
  'Jawa Timur': { lat: -7.5360, lng: 112.2384, zoom: 8 },
  'Jawa Tengah': { lat: -7.1509, lng: 110.1402, zoom: 8 },
  'Jawa Barat': { lat: -7.0909, lng: 107.6689, zoom: 8 },
  'Sumatera Selatan': { lat: -3.3194, lng: 104.9145, zoom: 7 },
  'Sulawesi Selatan': { lat: -5.1476, lng: 119.4327, zoom: 7 },
  'Kalimantan Barat': { lat: -0.2789, lng: 109.7970, zoom: 7 },
};

const PROVINCE_POLYGONS: Record<string, [number, number][]> = {
  'Kepulauan Bangka Belitung': [
    [-2.40, 105.70], [-1.65, 106.10], [-1.90, 106.65], [-2.35, 106.90], [-3.15, 106.40], [-3.10, 105.65]
  ],
  'Jawa Timur': [
    [-7.10, 111.00], [-6.75, 112.45], [-6.85, 114.25], [-7.55, 114.70], [-8.45, 114.35], [-8.50, 111.15]
  ],
  'Jawa Tengah': [
    [-6.85, 108.75], [-6.35, 110.85], [-7.15, 111.60], [-8.25, 111.05], [-7.75, 108.95]
  ],
  'Jawa Barat': [
    [-5.95, 106.35], [-5.85, 108.05], [-7.15, 108.85], [-7.75, 108.45], [-7.65, 106.25]
  ],
  'Sumatera Selatan': [
    [-2.15, 102.05], [-1.55, 103.95], [-2.75, 105.75], [-4.65, 105.15], [-4.15, 103.65]
  ],
  'Sulawesi Selatan': [
    [-1.95, 119.15], [-1.75, 120.45], [-2.65, 121.55], [-4.45, 120.35], [-5.75, 119.75], [-4.95, 119.25]
  ],
  'Kalimantan Barat': [
    [2.15, 108.85], [1.45, 112.55], [-1.35, 113.05], [-3.15, 110.45], [-1.75, 108.65]
  ]
};

const BRIGADE_COORDS: Record<string, { lat: number; lng: number }> = {
  'brg-001': { lat: -7.6012, lng: 111.9015 },
  'brg-002': { lat: -7.4260, lng: 111.0232 },
  'brg-003': { lat: -6.3124, lng: 107.2913 },
  'brg-004': { lat: -2.8913, lng: 104.7942 },
  'brg-005': { lat: -0.1242, lng: 109.4321 },
  'brg-006': { lat: -3.0123, lng: 106.4406 },
  'brg-007': { lat: -1.9542, lng: 105.4121 },
  'brg-008': { lat: -2.1321, lng: 105.8942 },
  'brg-009': { lat: -2.2541, lng: 106.1842 },
  'brg-010': { lat: -3.1251, lng: 107.5412 },
  'brg-011': { lat: -2.9512, lng: 108.1215 }
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
      duration: 0.8
    });
  }, [center, zoom, map]);
  return null;
}

function normalizeProvince(prov: string): string {
  if (!prov) return '';
  const p = prov.trim().toLowerCase();
  if (p === 'bangka belitung' || p === 'bangka-belitung' || p === 'kepulauan bangka belitung' || p === 'kep. bangka belitung') {
    return 'Kepulauan Bangka Belitung';
  }
  return prov;
}

// Generate a deterministic coordinate offset for each Alsintan unit around its brigade base
function getAlsintanCoords(alsintan: Alsintan, brigadeLat: number, brigadeLng: number) {
  let hash = 0;
  for (let i = 0; i < alsintan.id.length; i++) {
    hash = alsintan.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate offset in range [-0.012, 0.012] degrees (approx 1.2km)
  const offsetLat = ((hash % 100) / 100) * 0.012 - 0.006;
  const offsetLng = (((hash >> 8) % 100) / 100) * 0.012 - 0.006;
  return {
    lat: brigadeLat + offsetLat,
    lng: brigadeLng + offsetLng
  };
}

// Custom Leaflet DivIcon for Alsintan units
function getAlsintanIcon(type: string, status: string, isSelected: boolean) {
  let emoji = '🚜';
  if (type === 'Pompa Air') emoji = '💧';
  else if (type === 'Rice Transplanter') emoji = '🌱';
  else if (type === 'Combine Harvester') emoji = '🌾';
  
  let statusColor = 'bg-blue-600 border-blue-400 text-white';
  if (status === 'Aktif') statusColor = 'bg-emerald-600 border-emerald-400 text-white';
  else if (status === 'Service') statusColor = 'bg-amber-500 border-amber-300 text-amber-950';
  else if (status === 'Rusak') statusColor = 'bg-rose-600 border-rose-400 text-white';
  else if (status === 'Standby') statusColor = 'bg-sky-600 border-sky-400 text-white';

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        ${isSelected ? `<span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-amber-500 opacity-40"></span>` : ''}
        <div class="relative flex h-6 w-6 items-center justify-center rounded-full ${statusColor} border-2 shadow-md text-xs font-bold transition-all">
          ${emoji}
        </div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

interface MonitoringTrackingViewProps {
  brigades: Brigade[];
  alsintanList: Alsintan[];
  operators: Operator[];
  laporanList: LaporanHarian[];
}

export default function MonitoringTrackingView({
  brigades,
  alsintanList,
  operators,
  laporanList
}: MonitoringTrackingViewProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>('Semua');
  const [selectedRegency, setSelectedRegency] = useState<string>('Semua');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrigadeId, setSelectedBrigadeId] = useState<string | null>(null);

  // Custom Map Controls to match Dashboard
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [viewMode, setViewMode] = useState<'marker' | 'heatmap'>('marker');
  const [showPolygons, setShowPolygons] = useState<boolean>(true);
  const [showAlsintanMarkers, setShowAlsintanMarkers] = useState<boolean>(true);

  // List of unique provinces from brigades data
  const provinces = useMemo(() => {
    const list = new Set(brigades.map((b) => b.province));
    return ['Semua', ...Array.from(list)];
  }, [brigades]);

  // List of unique regencies based on selected province
  const regencies = useMemo(() => {
    const filtered = brigades.filter(b => selectedProvince === 'Semua' || b.province === selectedProvince);
    const list = new Set(filtered.map((b) => b.regency));
    return ['Semua', ...Array.from(list)];
  }, [brigades, selectedProvince]);

  // List of unique districts based on selected regency
  const districts = useMemo(() => {
    const filtered = brigades.filter(b => 
      (selectedProvince === 'Semua' || b.province === selectedProvince) &&
      (selectedRegency === 'Semua' || b.regency === selectedRegency)
    );
    const list = new Set(filtered.map((b) => b.district));
    return ['Semua', ...Array.from(list)];
  }, [brigades, selectedProvince, selectedRegency]);

  // Compute brigade stats
  const brigadeStats = useMemo(() => {
    return brigades.map((b) => {
      // Find machines owned by this brigade
      const machines = alsintanList.filter((m) => m.brigadeId === b.id);
      // Find operators belonging to this brigade
      const bOperators = operators.filter((o) => o.brigadeId === b.id);
      // Find reports by this brigade
      const reports = laporanList.filter((l) => l.brigadeId === b.id);
      
      // Calculate manual land area recorded by this brigade
      const totalArea = reports.reduce((acc, curr) => acc + curr.landArea, 0);
      const totalHours = reports.reduce((acc, curr) => acc + curr.workingHours, 0);

      return {
        ...b,
        machinesCount: machines.length,
        operatorsCount: bOperators.length,
        totalArea,
        totalHours,
        reportsCount: reports.length
      };
    });
  }, [brigades, alsintanList, operators, laporanList]);

  // Filtered brigades for display list & map highlighting
  const filteredBrigades = useMemo(() => {
    return brigadeStats.filter((b) => {
      if (selectedProvince !== 'Semua' && b.province !== selectedProvince) return false;
      if (selectedRegency !== 'Semua' && b.regency !== selectedRegency) return false;
      if (selectedDistrict !== 'Semua' && b.district !== selectedDistrict) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesRegency = b.regency.toLowerCase().includes(query);
        const matchesDistrict = b.district.toLowerCase().includes(query);
        const matchesLeader = b.leader.toLowerCase().includes(query);
        if (!matchesName && !matchesRegency && !matchesDistrict && !matchesLeader) {
          return false;
        }
      }
      return true;
    });
  }, [brigadeStats, selectedProvince, selectedRegency, selectedDistrict, searchQuery]);

  // Selected Brigade Details (if any)
  const activeBrigade = useMemo(() => {
    if (!selectedBrigadeId) return null;
    return brigadeStats.find((b) => b.id === selectedBrigadeId) || null;
  }, [brigadeStats, selectedBrigadeId]);

  // Compute stats for each province to display list totals
  const provincialSummary = useMemo(() => {
    const list = ['Jawa Timur', 'Jawa Tengah', 'Jawa Barat', 'Sumatera Selatan', 'Sulawesi Selatan', 'Kalimantan Barat', 'Kepulauan Bangka Belitung'];
    return list.map((prov) => {
      const pBrigades = brigadeStats.filter((b) => normalizeProvince(b.province) === normalizeProvince(prov));
      const pReports = laporanList.filter((l) => pBrigades.some(b => b.id === l.brigadeId));
      const pArea = pReports.reduce((sum, r) => sum + r.landArea, 0);
      const pTarget = mockTargetRealisasi.find((t) => normalizeProvince(t.province) === normalizeProvince(prov))?.targetArea || 0;
      return {
        province: prov,
        brigadesCount: pBrigades.length,
        areaCount: pArea,
        targetArea: pTarget,
      };
    });
  }, [brigadeStats, laporanList]);

  // Dynamic Map Centering and Zoom Level
  const mapCenter = useMemo(() => {
    if (selectedBrigadeId) {
      const coords = BRIGADE_COORDS[selectedBrigadeId];
      if (coords) {
        return { center: [coords.lat, coords.lng] as [number, number], zoom: 11 };
      }
    }
    const norm = normalizeProvince(selectedProvince);
    const coords = PROVINCE_COORDS[norm];
    if (coords) {
      return { center: [coords.lat, coords.lng] as [number, number], zoom: coords.zoom };
    }
    return { center: [-2.5, 118.0] as [number, number], zoom: 5 };
  }, [selectedProvince, selectedBrigadeId]);

  // Provincial markers data
  const provincialMarkersData = useMemo(() => {
    return provincialSummary.map((item) => {
      const coords = PROVINCE_COORDS[normalizeProvince(item.province)] || { lat: -2.5, lng: 118.0, zoom: 5 };
      const isSelected = normalizeProvince(selectedProvince) === normalizeProvince(item.province);
      const pBrigades = brigadeStats.filter((b) => normalizeProvince(b.province) === normalizeProvince(item.province));
      
      return {
        province: item.province,
        lat: coords.lat,
        lng: coords.lng,
        brigadesCount: item.brigadesCount,
        areaCount: Math.round(item.areaCount),
        targetArea: Math.round(item.targetArea),
        isSelected,
        brigadesList: pBrigades,
      };
    });
  }, [provincialSummary, selectedProvince, brigadeStats]);

  // Individual brigade markers data
  const individualBrigadeMarkers = useMemo(() => {
    return brigadeStats.map((b) => {
      let coords = BRIGADE_COORDS[b.id];
      if (!coords) {
        // Fallback to province center + minor offset based on id hash so they don't pile up on the same exact coordinate
        const provCenter = PROVINCE_COORDS[normalizeProvince(b.province)] || { lat: -2.5, lng: 118.0 };
        let hash = 0;
        for (let i = 0; i < b.id.length; i++) {
          hash = b.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const offsetLat = ((hash % 100) / 100) * 0.1 - 0.05;
        const offsetLng = (((hash >> 8) % 100) / 100) * 0.1 - 0.05;
        coords = { lat: provCenter.lat + offsetLat, lng: provCenter.lng + offsetLng };
      }
      const isSelected = selectedBrigadeId === b.id;
      return {
        ...b,
        lat: coords.lat,
        lng: coords.lng,
        isSelected
      };
    }).filter(b => selectedProvince === 'Semua' || normalizeProvince(b.province) === normalizeProvince(selectedProvince));
  }, [brigadeStats, selectedProvince, selectedBrigadeId]);

  // Compute coordinate offsets for each Alsintan unit based on its brigade's location
  const alsintanMarkers = useMemo(() => {
    if (!showAlsintanMarkers) return [];
    
    const markers: { alsintan: Alsintan; brigadeName: string; lat: number; lng: number }[] = [];
    individualBrigadeMarkers.forEach((b) => {
      const machines = alsintanList.filter((m) => m.brigadeId === b.id);
      machines.forEach((m) => {
        const coords = getAlsintanCoords(m, b.lat, b.lng);
        markers.push({
          alsintan: m,
          brigadeName: b.name,
          lat: coords.lat,
          lng: coords.lng
        });
      });
    });
    return markers;
  }, [showAlsintanMarkers, individualBrigadeMarkers, alsintanList]);

  return (
    <div className="space-y-6 font-sans">
      {/* View Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-primary-green rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </span>
            Peta Sebaran Brigade Pangan Nasional
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi sebaran posko Brigade Pangan di seluruh Indonesia beserta kapasitas armada alsintan dan capaian luas tanam.
          </p>
        </div>
        <div className="bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200/40 text-xs font-semibold text-slate-600 flex items-center gap-2 self-start md:self-auto">
          <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping"></span>
          <span>Offline-Safe Map Mode</span>
        </div>
      </div>

      {/* Info Notice about Manual Area Logging */}
      <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-xl flex gap-3 shadow-3xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-extrabold text-emerald-800">Sistem Pencatatan Standar Kementan:</span> Berdasarkan arahan Tim Kerja, modul telemetri IOT otomatis telah disembunyikan. Pencatatan luas lahan kerja alsintan kini sepenuhnya menggunakan <span className="font-bold">input manual laporan harian</span> yang dilaporkan berkala oleh pendamping brigade, memudahkan evaluasi lapangan secara objektif.
        </div>
      </div>

      {/* Main Map & Filter Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Indonesia Interactive Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <MapIcon className="w-4 h-4 text-emerald-600" /> Peta Interaktif Sebaran Posko
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                  Visualisasi GIS sebaran brigade pangan terintegrasi
                </p>
              </div>
              
              {/* Hierarchical Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Fokus:</span>
                
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedRegency('Semua');
                    setSelectedDistrict('Semua');
                    setSelectedBrigadeId(null);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p === 'Semua' ? '🗺️ Prov: Semua' : `Prov: ${p}`}</option>
                  ))}
                </select>

                <select
                  value={selectedRegency}
                  onChange={(e) => {
                    setSelectedRegency(e.target.value);
                    setSelectedDistrict('Semua');
                    setSelectedBrigadeId(null);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  {regencies.map((r) => (
                    <option key={r} value={r}>{r === 'Semua' ? '🗺️ Kab: Semua' : `Kab: ${r}`}</option>
                  ))}
                </select>

                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedBrigadeId(null);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>{d === 'Semua' ? '🗺️ Kec: Semua' : `Kec: ${d}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* MAP LAYERS & PRESETS CONTROL */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/50 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Poligon Area toggle */}
                <button
                  type="button"
                  onClick={() => setShowPolygons(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all border cursor-pointer ${
                    showPolygons
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                  }`}
                >
                  🛡️ Poligon Area: {showPolygons ? 'ON' : 'OFF'}
                </button>

                {/* Unit Alsintan Markers toggle */}
                <button
                  type="button"
                  onClick={() => setShowAlsintanMarkers(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all border cursor-pointer ${
                    showAlsintanMarkers
                      ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-2xs'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                  }`}
                >
                  🚜 Unit Alsintan: {showAlsintanMarkers ? 'ON' : 'OFF'}
                </button>

                {/* Heatmap / Marker toggle */}
                <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('marker')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                      viewMode === 'marker'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📍 Pin Marker
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('heatmap')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                      viewMode === 'heatmap'
                        ? 'bg-white text-amber-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🔥 Heatmap Kerja
                  </button>
                </div>

                {/* Map style toggle */}
                <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMapType('street')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                      mapType === 'street' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🗺️ Peta Jalan
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapType('satellite')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                      mapType === 'satellite' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🛰️ Satelit
                  </button>
                </div>
              </div>

              {(selectedProvince !== 'Semua' || selectedRegency !== 'Semua' || selectedDistrict !== 'Semua' || selectedBrigadeId) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvince('Semua');
                    setSelectedRegency('Semua');
                    setSelectedDistrict('Semua');
                    setSelectedBrigadeId(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg uppercase transition-all tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  🔄 Reset Map
                </button>
              )}
            </div>

            {/* Interactive Leaflet Map container */}
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm relative h-[420px] bg-slate-900 z-10">
              <style dangerouslySetInnerHTML={{ __html: `
                .leaflet-popup-content-wrapper {
                  background: #0f172a !important;
                  color: #f8fafc !important;
                  border-radius: 12px !important;
                  border: 1px solid #1e293b !important;
                  padding: 2px !important;
                }
                .leaflet-popup-tip {
                  background: #0f172a !important;
                }
                .custom-leaflet-icon {
                  background: transparent !important;
                  border: none !important;
                }
              ` }} />
              <MapContainer 
                center={mapCenter.center} 
                zoom={mapCenter.zoom} 
                className="w-full h-full"
                scrollWheelZoom={true}
              >
                <ChangeView center={mapCenter.center} zoom={mapCenter.zoom} />
                
                {mapType === 'satellite' ? (
                  <TileLayer
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                )}

                {/* AREA POLYGONS */}
                {showPolygons && Object.entries(PROVINCE_POLYGONS).map(([provName, coords]) => {
                  const isSelected = normalizeProvince(selectedProvince) === normalizeProvince(provName);
                  return (
                    <Polygon
                      key={`poly-${provName}`}
                      positions={coords}
                      pathOptions={{
                        color: isSelected ? '#f59e0b' : '#10b981',
                        fillColor: isSelected ? '#f59e0b' : '#34d399',
                        fillOpacity: isSelected ? 0.22 : 0.08,
                        weight: isSelected ? 3 : 1.5,
                        dashArray: isSelected ? '5, 8' : undefined,
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedProvince(provName);
                          setSelectedBrigadeId(null);
                        }
                      }}
                    >
                      <Popup>
                        <div className="p-2 font-sans text-slate-100 text-xs leading-relaxed">
                          <span className="font-extrabold uppercase text-emerald-400 block mb-0.5">{provName}</span>
                          <span className="text-[10px] text-slate-300">Wilayah Cakupan Kerja Sawah Brigade Pangan Kementan</span>
                        </div>
                      </Popup>
                    </Polygon>
                  );
                })}

                {/* NATIONAL LEVEL MARKERS (PROVINCIAL LEVEL ACCUMULATIONS) */}
                {viewMode === 'marker' && selectedProvince === 'Semua' && provincialMarkersData.map((item) => {
                  const icon = L.divIcon({
                    html: `
                      <div class="relative flex items-center justify-center">
                        <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-emerald-600 opacity-35" style="animation-duration: 2s;"></span>
                        <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white border-emerald-400 border-2 shadow-md text-[10px] font-black">
                          ${item.brigadesCount}
                        </div>
                      </div>
                    `,
                    className: 'custom-leaflet-icon',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  });

                  return (
                    <Marker 
                      key={item.province} 
                      position={[item.lat, item.lng]} 
                      icon={icon}
                    >
                      <Popup minWidth={280}>
                        <div className="font-sans p-2 text-slate-100 max-h-[300px] overflow-y-auto">
                          <div className="border-b border-slate-700 pb-2 mb-2 flex justify-between items-center">
                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">{item.province}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                              <span className="text-[8px] text-slate-400 font-bold block uppercase">Total Pos</span>
                              <strong className="text-xs text-slate-200">{item.brigadesCount} Brigade</strong>
                            </div>
                            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                              <span className="text-[8px] text-slate-400 font-bold block uppercase">Realisasi</span>
                              <strong className="text-xs text-emerald-400">{item.areaCount} Ha</strong>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between items-center text-[9px] mb-1">
                              <span className="text-slate-400 font-bold">PROGRES TARGET</span>
                              <span className="text-slate-200 font-black">
                                {item.targetArea > 0 ? ((item.areaCount / item.targetArea) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, item.targetArea > 0 ? (item.areaCount / item.targetArea) * 100 : 0)}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProvince(item.province);
                              setSelectedBrigadeId(null);
                            }}
                            className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg font-black text-[10px] transition-all uppercase tracking-wide cursor-pointer"
                          >
                            Masuk Fokus Wilayah Ini
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* INDIVIDUAL BRIGADE MARKER PINS (SHOWN WHEN REGION SELECTED OR GENERAL OVERVIEW) */}
                {viewMode === 'marker' && individualBrigadeMarkers.map((b) => {
                  const isSelected = selectedBrigadeId === b.id;
                  const icon = L.divIcon({
                    html: `
                      <div class="relative flex items-center justify-center">
                        <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full ${
                          isSelected ? 'bg-amber-500' : 'bg-emerald-500'
                        } opacity-35" style="animation-duration: 2.5s;"></span>
                        <div class="relative flex h-6 w-6 items-center justify-center rounded-full ${
                          isSelected ? 'bg-amber-500 text-amber-950 border-amber-300' : 'bg-emerald-600 text-white border-emerald-400'
                        } border-2 shadow-md text-[10px] font-black">
                          📍
                        </div>
                      </div>
                    `,
                    className: 'custom-leaflet-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  });

                  return (
                    <Marker 
                      key={`brigade-pin-${b.id}`} 
                      position={[b.lat, b.lng]} 
                      icon={icon}
                    >
                      <Popup minWidth={240}>
                        <div className="font-sans p-2 text-slate-100">
                          <h4 className="text-xs font-black text-emerald-400 uppercase border-b border-slate-700 pb-1 mb-2 leading-tight">
                            {b.name}
                          </h4>
                          <div className="space-y-1.5 text-[10px] mb-3">
                            <p className="text-slate-300">
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Wilayah Operasional</span>
                              Desa {b.village}, Kec. {b.district}, Kab. {b.regency}, {b.province}
                            </p>
                            <p className="text-slate-300">
                              <span className="font-bold text-slate-400 block uppercase text-[8px]">Koordinator</span>
                              {b.leader} (&nbsp;<strong className="text-emerald-400">{b.phone}</strong>&nbsp;)
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                              <div>
                                <span className="text-[8px] text-slate-400 font-bold block uppercase">Alat Mesin</span>
                                <strong className="text-slate-100 text-xs">{b.machinesCount} Unit</strong>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 font-bold block uppercase">Capaian Lahan</span>
                                <strong className="text-emerald-400 text-xs">{b.totalArea.toFixed(1)} Ha</strong>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBrigadeId(b.id);
                              setSelectedProvince(b.province);
                            }}
                            className="w-full text-center bg-amber-500 hover:bg-amber-600 text-slate-950 py-1.5 rounded font-black text-[9px] transition-all uppercase tracking-wide cursor-pointer"
                          >
                            Pilih &amp; Lihat Profil Posko
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* PROVINCIAL HEATMAP VIEW */}
                {viewMode === 'heatmap' && selectedProvince === 'Semua' && provincialMarkersData.map((item) => {
                  const baseRadius = 45000;
                  const scalingFactor = 150; 
                  const outerRadius = baseRadius + (item.areaCount * scalingFactor);
                  const innerRadius = (baseRadius * 0.35) + (item.areaCount * scalingFactor * 0.35);

                  return (
                    <React.Fragment key={`heat-prov-${item.province}`}>
                      <Circle
                        center={[item.lat, item.lng]}
                        radius={outerRadius}
                        pathOptions={{
                          color: 'transparent',
                          fillColor: '#ef4444',
                          fillOpacity: 0.12,
                        }}
                        eventHandlers={{
                          click: () => {
                            setSelectedProvince(item.province);
                            setSelectedBrigadeId(null);
                          }
                        }}
                      />
                      <Circle
                        center={[item.lat, item.lng]}
                        radius={innerRadius}
                        pathOptions={{
                          color: 'transparent',
                          fillColor: '#eab308',
                          fillOpacity: 0.55,
                        }}
                        eventHandlers={{
                          click: () => {
                            setSelectedProvince(item.province);
                            setSelectedBrigadeId(null);
                          }
                        }}
                      >
                        <Popup minWidth={220}>
                          <div className="font-sans p-2 text-slate-100">
                            <span className="font-black text-amber-400 uppercase text-[10px] block mb-1">🔥 INTENSITAS TANAM: {item.province}</span>
                            <p className="text-[10px] text-slate-300">Total Kerja Brigade: <strong className="text-emerald-400">{item.areaCount} Ha</strong></p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProvince(item.province);
                                setSelectedBrigadeId(null);
                              }}
                              className="w-full mt-2 text-center bg-emerald-600 hover:bg-emerald-500 text-white py-1 rounded font-black text-[9px] transition-all uppercase tracking-wide cursor-pointer"
                            >
                              Fokus Wilayah Ini
                            </button>
                          </div>
                        </Popup>
                      </Circle>
                    </React.Fragment>
                  );
                })}

                {/* INDIVIDUAL BRIGADE HEATMAPS */}
                {viewMode === 'heatmap' && selectedProvince !== 'Semua' && individualBrigadeMarkers.map((b) => {
                  const baseRadius = 8000;
                  const scalingFactor = 250; 
                  const outerRadius = baseRadius + (b.totalArea * scalingFactor);
                  const innerRadius = (baseRadius * 0.4) + (b.totalArea * scalingFactor * 0.4);

                  return (
                    <React.Fragment key={`heat-brg-${b.id}`}>
                      <Circle
                        center={[b.lat, b.lng]}
                        radius={outerRadius}
                        pathOptions={{
                          color: 'transparent',
                          fillColor: '#ef4444',
                          fillOpacity: 0.15,
                        }}
                        eventHandlers={{
                          click: () => setSelectedBrigadeId(b.id)
                        }}
                      />
                      <Circle
                        center={[b.lat, b.lng]}
                        radius={innerRadius}
                        pathOptions={{
                          color: 'transparent',
                          fillColor: '#eab308',
                          fillOpacity: 0.5,
                        }}
                        eventHandlers={{
                          click: () => setSelectedBrigadeId(b.id)
                        }}
                      >
                        <Popup minWidth={220}>
                          <div className="font-sans p-1.5 text-slate-100">
                            <span className="font-black text-amber-400 uppercase text-[10px] block mb-0.5">{b.name}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-black block">KAB. {b.regency}</span>
                            <div className="mt-2 text-[10px] text-slate-300">
                              <p>Total Tanam: <strong className="text-emerald-400">{b.totalArea.toFixed(1)} Ha</strong></p>
                              <p>Jam Kerja: <strong className="text-slate-100">{b.totalHours.toFixed(1)} Jam</strong></p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedBrigadeId(b.id)}
                              className="w-full mt-2 text-center bg-amber-500 hover:bg-amber-600 text-slate-950 py-1 rounded font-bold text-[9px] transition-all uppercase tracking-wide cursor-pointer"
                            >
                              Pilih Posko Ini
                            </button>
                          </div>
                        </Popup>
                      </Circle>
                    </React.Fragment>
                  );
                })}

                {/* INDIVIDUAL ALSINTAN UNIT MARKERS */}
                {showAlsintanMarkers && alsintanMarkers.map((item) => {
                  const isSelected = selectedBrigadeId === item.alsintan.brigadeId;
                  const icon = getAlsintanIcon(item.alsintan.type, item.alsintan.status, isSelected);

                  return (
                    <Marker
                      key={`alsintan-pin-${item.alsintan.id}`}
                      position={[item.lat, item.lng]}
                      icon={icon}
                    >
                      <Popup minWidth={220}>
                        <div className="font-sans p-2 text-slate-100">
                          <div className="border-b border-slate-700 pb-1.5 mb-2">
                            <span className="text-[8px] text-emerald-400 font-extrabold uppercase tracking-wider block">🚜 Unit Alsintan Tersebar</span>
                            <h4 className="text-xs font-black text-slate-100 leading-tight">
                              {item.alsintan.name}
                            </h4>
                            <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{item.alsintan.code}</span>
                          </div>
                          
                          <div className="space-y-1 text-[10px] text-slate-300 mb-2.5">
                            <p><span className="text-slate-400 font-semibold">Jenis Alat:</span> {item.alsintan.type}</p>
                            <p><span className="text-slate-400 font-semibold">Merek / Model:</span> {item.alsintan.brand} {item.alsintan.model}</p>
                            <p><span className="text-slate-400 font-semibold">Tahun:</span> {item.alsintan.year}</p>
                            <p><span className="text-slate-400 font-semibold">Posko Brigade:</span> {item.brigadeName}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-slate-400 font-semibold">Status:</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                item.alsintan.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                item.alsintan.status === 'Standby' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                item.alsintan.status === 'Service' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}>
                                {item.alsintan.status}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBrigadeId(item.alsintan.brigadeId);
                            }}
                            className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white py-1 rounded font-black text-[9px] transition-all uppercase tracking-wide cursor-pointer"
                          >
                            Pilih &amp; Fokus Brigade
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>


          {/* BRIGADES TABLE / COMPREHENSIVE REGIONAL LIST */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Daftar Wilayah Brigade Pangan</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Menampilkan seluruh unit berdasarkan filter fokus</p>
              </div>

              {/* Quick search inside mapping view */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Kabupaten / Nama..."
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 w-full sm:w-48"
                />
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                    <th className="py-2.5 px-4">Nama Brigade</th>
                    <th className="py-2.5 px-4">Provinsi / Kab</th>
                    <th className="py-2.5 px-4 text-center">Armada</th>
                    <th className="py-2.5 px-4 text-right">Tanam (Manual)</th>
                    <th className="py-2.5 px-4 text-center">Status Laporan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBrigades.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBrigadeId(b.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-all ${selectedBrigadeId === b.id ? 'bg-amber-50/50 font-semibold' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{b.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Koor: {b.leader}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 block">{b.province}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">KAB. {b.regency}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          {b.machinesCount} Unit
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-primary-green font-bold block">{b.totalArea.toFixed(1)} Ha</span>
                        <span className="text-[9px] text-slate-400 font-bold">{b.totalHours.toFixed(1)} Jam Mesin</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 font-black text-[9px] uppercase px-2 py-0.5 rounded border border-emerald-200/50">
                          Aktif Terdaftar
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side Column: Detailed Sidebar Panel for the Selected Brigade */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" /> Profil Posko Terpilih
            </h3>

            {activeBrigade ? (
              <div className="space-y-4">
                {/* Posko Header */}
                <div>
                  <h4 className="text-sm font-black text-slate-800 leading-tight">{activeBrigade.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Kec. {activeBrigade.district}, Desa {activeBrigade.village}
                  </p>
                </div>

                {/* Local Stats */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Luas Tanam</span>
                    <span className="text-lg font-black text-emerald-700 block mt-0.5">{activeBrigade.totalArea.toFixed(1)} Ha</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Laporan Kerja</span>
                    <span className="text-lg font-black text-slate-800 block mt-0.5">{activeBrigade.reportsCount} Hari</span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-semibold">Provinsi:</span>
                    <span className="font-bold text-slate-800 uppercase">{activeBrigade.province}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-semibold">Kabupaten:</span>
                    <span className="font-bold text-slate-800 uppercase">Kab. {activeBrigade.regency}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-semibold">Koordinator Lapangan:</span>
                    <span className="font-extrabold text-emerald-700 uppercase">{activeBrigade.leader}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-semibold">WhatsApp / Telepon:</span>
                    <span className="font-mono text-slate-700 font-bold">{activeBrigade.phone}</span>
                  </div>
                </div>

                {/* Actions with WhatsApp direct contact */}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${activeBrigade.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Halo Pak ${activeBrigade.leader} dari ${activeBrigade.name}. Kami dari Tim Data Kementan memantau progres lapangan di Kab. ${activeBrigade.regency}. Semangat terus mengawal kedaulatan pangan!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-[10px] py-2 px-3 rounded-lg transition-colors text-center flex items-center justify-center gap-2 uppercase tracking-wide shadow-3xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Hubungi WhatsApp Koor
                  </a>
                </div>

                {/* Allocated Alsintan Units */}
                <div className="pt-4 border-t border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    🚜 Alokasi Unit Alsintan ({activeBrigade.machinesCount} Unit)
                  </h5>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {alsintanList
                      .filter((m) => m.brigadeId === activeBrigade.id)
                      .map((m) => {
                        let icon = '🚜';
                        if (m.type === 'Pompa Air') icon = '💧';
                        else if (m.type === 'Rice Transplanter') icon = '🌱';
                        else if (m.type === 'Combine Harvester') icon = '🌾';

                        return (
                          <div 
                            key={m.id} 
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{icon}</span>
                              <div>
                                <span className="font-extrabold text-slate-800 block text-[10.5px] leading-tight">{m.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono">{m.code} &bull; {m.brand}</span>
                              </div>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              m.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              m.status === 'Standby' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              m.status === 'Service' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <div className="text-3xl">👈</div>
                <p className="text-[11px] font-bold text-slate-500 font-sans uppercase">Belum Ada Brigade Terpilih</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Silakan klik salah satu titik pin posko pada peta di samping atau pilih dari daftar wilayah di bawah untuk memuat profil posko.
                </p>
              </div>
            )}
          </div>

          {/* Standar Verifikasi Card */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-4.5 rounded-xl space-y-3 shadow-3xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Sertifikasi Laporan Kementan
            </div>
            <p className="text-[10px] text-emerald-700/90 leading-relaxed font-medium">
              Data koordinat dan progres tanam dalam peta ini merupakan sinkronisasi final pusat yang diverifikasi oleh tim data **PEPI Kementan** berdasarkan laporan harian manual ber-foto dari masing-masing brigade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
