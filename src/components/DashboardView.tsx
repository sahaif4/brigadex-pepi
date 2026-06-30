import React, { useState, useMemo, useEffect } from 'react';
import { Alsintan, LaporanHarian, RiwayatService, RiwayatKerusakan, Role, TargetRealisasi, Brigade, Operator, User } from '../types';
import {
  Sprout,
  Activity,
  Compass,
  Flame,
  DollarSign,
  PenTool,
  CheckSquare,
  Wrench,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Map as MapIcon,
  Globe,
  CheckCircle2,
  Phone,
  AlertCircle,
  TrendingUp,
  LayoutGrid,
  Calendar,
  Filter,
  Tractor,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';
import WeeklyChartsView from './WeeklyChartsView';
import MonthlyChartsView from './MonthlyChartsView';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet';

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

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      animate: true,
      duration: 1.5,
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

interface DashboardViewProps {
  userRole: Role;
  currentUser?: User | null;
  selectedProvince: string;
  setSelectedProvince: (prov: string) => void;
  laporanList: LaporanHarian[];
  alsintanList: Alsintan[];
  serviceList: RiwayatService[];
  kerusakanList: RiwayatKerusakan[];
  targets: TargetRealisasi[];
  brigades: Brigade[];
  operators: Operator[];
  setIsWaBillingOpen: (open: boolean) => void;
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

export default function DashboardView({
  userRole,
  currentUser,
  selectedProvince,
  setSelectedProvince,
  laporanList,
  alsintanList,
  serviceList,
  kerusakanList,
  targets,
  brigades,
  operators,
  setIsWaBillingOpen,
}: DashboardViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [filterRegency, setFilterRegency] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterBrigade, setFilterBrigade] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const regencies = useMemo(() => Array.from(new Set(brigades.map(b => b.regency))), [brigades]);
  const districts = useMemo(() => Array.from(new Set(brigades.filter(b => !filterRegency || b.regency === filterRegency).map(b => b.district))), [brigades, filterRegency]);
  const filteredBrigades = useMemo(() => brigades.filter(b => 
    (!filterRegency || b.regency === filterRegency) && 
    (!filterDistrict || b.district === filterDistrict) &&
    (!filterBrigade || b.id === filterBrigade)
  ), [brigades, filterRegency, filterDistrict, filterBrigade]);

  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
  );
  const [serviceSchedules] = useState(() => {
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

  const activeSchedules = useMemo(() => {
    const todayStr = '2026-06-28';
    return serviceSchedules.map((sch: any) => {
      const hasCompletedService = serviceList.some(
        s => s.alsintanId === sch.alsintanId && s.date >= sch.dueDate
      );
      if (hasCompletedService) {
        return { ...sch, status: 'Selesai' };
      }
      if (sch.status === 'Pending' && sch.dueDate < todayStr) {
        return { ...sch, status: 'Terlewat' };
      }
      return sch;
    });
  }, [serviceSchedules, serviceList]);

  const dashboardNotifications = useMemo(() => {
    const alerts: any[] = [];
    
    // 1. Damage reports
    kerusakanList.forEach(k => {
      if (k.status === 'Dilaporkan') {
        const unit = alsintanList.find(a => a.id === k.alsintanId);
        alerts.push({
          id: `notif-krk-${k.id}`,
          type: 'kerusakan',
          title: 'Kerusakan Alsintan Dilaporkan',
          message: `${unit?.name || 'Unit'} (${unit?.code || ''}): "${k.description}" dilaporkan oleh ${k.reportedBy}.`,
          date: k.date,
          severity: k.severity,
          unitId: k.alsintanId,
          unitName: unit?.name || 'Unit',
          unitCode: unit?.code || '',
          foto: k.foto,
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
          title: 'Jadwal Preventif Servis Terlewat',
          message: `Unit ${unit?.name || 'Unit'} (${unit?.code || ''}) telah melewati jadwal servis rutin pada tanggal ${sch.dueDate} (Target: ${sch.targetHM} HM).`,
          date: sch.dueDate,
          severity: sch.type === 'Mayor' ? 'Berat' : 'Sedang',
          unitId: sch.alsintanId,
          unitName: unit?.name || 'Unit',
          unitCode: unit?.code || '',
        });
      }
    });

    return alerts.sort((a, b) => b.date.localeCompare(a.date));
  }, [kerusakanList, activeSchedules, alsintanList]);

  const [filterCommodity, setFilterCommodity] = useState<string>('Semua');
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [viewMode, setViewMode] = useState<'marker' | 'heatmap'>('marker');
  const [showPolygons, setShowPolygons] = useState<boolean>(true);

  // Date Range Filter States
  const [dateFilterType, setDateFilterType] = useState<'all' | 'month' | 'q1' | 'q2' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default is June (index 5)
  const [customStartDate, setCustomStartDate] = useState<string>('2026-06-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-06-30');

  // Date filter for Brigade role (Operators/Coordinators)
  const [bpDateFilterType, setBpDateFilterType] = useState<'all' | '7days' | '30days' | 'month' | 'custom'>('all');
  const [bpCustomStartDate, setBpCustomStartDate] = useState<string>('2026-06-01');
  const [bpCustomEndDate, setBpCustomEndDate] = useState<string>('2026-06-28');

  // 1. Dynamic Filtering of Reports based on Selected Province & Commodity
  const filteredLaporan = useMemo(() => {
    return laporanList.filter((lap) => {
      // Find brigade for this report to get province
      if (selectedProvince !== 'Semua') {
        const brigade = brigades.find((b) => b.id === lap.brigadeId);
        if (!brigade || normalizeProvince(brigade.province) !== normalizeProvince(selectedProvince)) return false;
      }
      if (filterCommodity !== 'Semua' && lap.commodity !== filterCommodity) return false;
      return true;
    });
  }, [laporanList, brigades, selectedProvince, filterCommodity]);

  // 1b. Filter reports for productivity charts by date range
  const productivityFilteredLaporan = useMemo(() => {
    return filteredLaporan.filter((lap) => {
      const dateParts = lap.date.split('-');
      if (dateParts.length < 2) return true;
      const month = parseInt(dateParts[1]) - 1; // 0-indexed month

      if (dateFilterType === 'all') return true;
      if (dateFilterType === 'month') return month === selectedMonth;
      if (dateFilterType === 'q1') return month >= 0 && month <= 2;
      if (dateFilterType === 'q2') return month >= 3 && month <= 5;
      if (dateFilterType === 'custom') {
        return lap.date >= customStartDate && lap.date <= customEndDate;
      }
      return true;
    });
  }, [filteredLaporan, dateFilterType, selectedMonth, customStartDate, customEndDate]);

  // 2. Dynamic Filtering of Machinery based on Selected Province
  const filteredAlsintan = useMemo(() => {
    return alsintanList.filter((a) => {
      if (selectedProvince !== 'Semua') {
        const brigade = brigades.find((b) => b.id === a.brigadeId);
        if (!brigade || normalizeProvince(brigade.province) !== normalizeProvince(selectedProvince)) return false;
      }
      return true;
    });
  }, [alsintanList, brigades, selectedProvince]);

  // 3. Dynamic Filtering of Failures/Damages based on Selected Province
  const filteredKerusakan = useMemo(() => {
    return kerusakanList.filter((k) => {
      if (selectedProvince !== 'Semua') {
        const machine = alsintanList.find((m) => m.id === k.alsintanId);
        if (!machine) return false;
        const brigade = brigades.find((b) => b.id === machine.brigadeId);
        if (!brigade || normalizeProvince(brigade.province) !== normalizeProvince(selectedProvince)) return false;
      }
      return true;
    });
  }, [kerusakanList, alsintanList, brigades, selectedProvince]);

  // 4. Dynamic Filtering of Target Realization based on Selected Province
  const filteredTargets = useMemo(() => {
    if (selectedProvince === 'Semua') return targets;
    return targets.filter((t) => normalizeProvince(t.province) === normalizeProvince(selectedProvince));
  }, [targets, selectedProvince]);

  // 5. Automatic Calculations of Core KPIs
  const totalHours = useMemo(() => filteredLaporan.reduce((sum, lap) => sum + lap.workingHours, 0), [filteredLaporan]);
  const totalArea = useMemo(() => filteredLaporan.reduce((sum, lap) => sum + lap.landArea, 0), [filteredLaporan]);
  const totalFuel = useMemo(() => filteredLaporan.reduce((sum, lap) => sum + lap.fuelUsed, 0), [filteredLaporan]);
  const totalCost = useMemo(() => filteredLaporan.reduce((sum, lap) => sum + lap.cost, 0), [filteredLaporan]);
  const totalRevenue = useMemo(() => filteredLaporan.reduce((sum, lap) => sum + lap.revenue, 0), [filteredLaporan]);
  const totalProfit = totalRevenue - totalCost;

  // Efficiency & Operational Calculations
  const averageProductivity = totalHours > 0 ? (totalArea / totalHours).toFixed(2) : '0'; // Ha/Jam
  const averageFuelPerHectare = totalArea > 0 ? (totalFuel / totalArea).toFixed(1) : '0'; // Liter/Ha
  const averageFuelPerHour = totalHours > 0 ? (totalFuel / totalHours).toFixed(1) : '0'; // Liter/Jam

  // Machine status counts based on active province
  const totalActiveAlsintan = useMemo(() => filteredAlsintan.filter(a => a.status === 'Aktif').length, [filteredAlsintan]);
  const totalServiceAlsintan = useMemo(() => filteredAlsintan.filter(a => a.status === 'Service' || a.status === 'Standby').length, [filteredAlsintan]);
  const totalRusakAlsintan = useMemo(() => filteredAlsintan.filter(a => a.status === 'Rusak').length, [filteredAlsintan]);

  // RAMS reliability metrics (MTBF, MTTR, Availability)
  const uptimeHours = totalHours;
  const downtimeHours = filteredKerusakan.length * 24; // simulated 24 hours per reported damage for calculations
  const totalCycles = uptimeHours + downtimeHours;
  const availabilityRate = totalCycles > 0 ? ((uptimeHours / totalCycles) * 100).toFixed(1) : '95.0';

  const failureCount = filteredKerusakan.length || 1;
  const mtbf = (uptimeHours / failureCount).toFixed(1);
  const mttr = (downtimeHours / failureCount).toFixed(1);

  // Targets and realization total computed from the filtered targets list
  const targetAreaTotal = useMemo(() => filteredTargets.reduce((sum, t) => sum + t.targetArea, 0), [filteredTargets]);
  const realizedAreaTotal = useMemo(() => filteredTargets.reduce((sum, t) => sum + t.realizedArea, 0), [filteredTargets]);
  const targetPercentage = targetAreaTotal > 0 ? ((realizedAreaTotal / targetAreaTotal) * 100).toFixed(1) : '0.0';

  // 6-Month historical seasonal productivity trend of machine operational hours
  const monthlyTrendData = useMemo(() => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    
    // Base operational hours multiplier based on selectedProvince
    let provinceMultiplier = 1.0;
    const normSelected = normalizeProvince(selectedProvince);
    if (normSelected === 'Kepulauan Bangka Belitung') provinceMultiplier = 0.28;
    else if (normSelected === 'Jawa Timur') provinceMultiplier = 0.22;
    else if (normSelected === 'Jawa Tengah') provinceMultiplier = 0.22;
    else if (normSelected === 'Jawa Barat') provinceMultiplier = 0.18;
    else if (normSelected === 'Sumatera Selatan') provinceMultiplier = 0.15;
    else if (normSelected === 'Sulawesi Selatan') provinceMultiplier = 0.10;
    else if (normSelected === 'Kalimantan Barat') provinceMultiplier = 0.07;

    // Commodity multiplier
    let commodityMultiplier = 1.0;
    if (filterCommodity === 'Padi') commodityMultiplier = 0.75;
    else if (filterCommodity === 'Jagung') commodityMultiplier = 0.20;
    else if (filterCommodity === 'Kedelai') commodityMultiplier = 0.05;

    // Base seasonal index for agricultural activities (Jan to Jun)
    // March & June: High activity periods (land prep for main seasons)
    const seasonalIndices = [55, 98, 142, 70, 95, 128]; 

    return months.map((month, index) => {
      const baseHours = seasonalIndices[index] * 12.5; // Scale to total
      const calculatedHours = Math.round(baseHours * provinceMultiplier * commodityMultiplier);
      const calculatedArea = Math.round(calculatedHours * 0.85); // roughly ~0.85 Ha/Hour
      
      return {
        month,
        'Jam Kerja': calculatedHours,
        'Luas Olah (Ha)': calculatedArea,
      };
    });
  }, [selectedProvince, filterCommodity]);

  const monthlyData = useMemo(() => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    const data = months.map((month, index) => ({
      name: month,
      panen: 0,
      biaya: 0,
      operatorHours: 0,
      uniqueOperators: new Set<string>()
    }));

    filteredLaporan.forEach(lap => {
      const dateParts = lap.date.split('-');
      if (dateParts.length < 2) return;
      const monthIndex = parseInt(dateParts[1]) - 1;
      if (monthIndex >= 0 && monthIndex < 6) {
        data[monthIndex].panen += lap.harvestAmount || 0;
        data[monthIndex].biaya += lap.cost || 0;
        data[monthIndex].operatorHours += lap.workingHours || 0;
        data[monthIndex].uniqueOperators.add(lap.operatorId);
      }
    });

    return data.map(d => ({
      name: d.name,
      panen: d.panen,
      biaya: d.biaya,
      efisiensi: d.uniqueOperators.size > 0 ? (d.operatorHours / d.uniqueOperators.size) : 0
    }));
  }, [filteredLaporan]);

  // Active month indexes for the 6-month trend (0-indexed)
  const activeMonthIndexes = useMemo(() => {
    if (dateFilterType === 'all') return [0, 1, 2, 3, 4, 5];
    if (dateFilterType === 'q1') return [0, 1, 2];
    if (dateFilterType === 'q2') return [3, 4, 5];
    if (dateFilterType === 'month') return [selectedMonth];
    if (dateFilterType === 'custom') {
      const startParts = customStartDate.split('-');
      const endParts = customEndDate.split('-');
      if (startParts.length < 2 || endParts.length < 2) return [0, 1, 2, 3, 4, 5];
      const startM = parseInt(startParts[1]) - 1;
      const endM = parseInt(endParts[1]) - 1;
      const indexes: number[] = [];
      for (let i = Math.max(0, startM); i <= Math.min(5, endM); i++) {
        indexes.push(i);
      }
      return indexes.length > 0 ? indexes : [0, 1, 2, 3, 4, 5];
    }
    return [0, 1, 2, 3, 4, 5];
  }, [dateFilterType, selectedMonth, customStartDate, customEndDate]);

  const filteredMonthlyTrendData = useMemo(() => {
    return monthlyTrendData.filter((_, index) => activeMonthIndexes.includes(index));
  }, [monthlyTrendData, activeMonthIndexes]);

  // Aggregate total work hours and coverage area for all operators in the selected region
  const operatorWorkData = useMemo(() => {
    const aggregation: Record<string, { id: string; name: string; totalHours: number; totalArea: number; brigadeName: string }> = {};

    // 1. Process real log reports
    productivityFilteredLaporan.forEach((lap) => {
      const opId = lap.operatorId || 'unknown';
      const op = operators?.find((o) => o.id === opId);
      const opName = op ? op.name : opId;
      const b = brigades.find((br) => br.id === lap.brigadeId);
      const bName = b ? b.name : 'Brigade Lapangan';

      if (!aggregation[opId]) {
        aggregation[opId] = {
          id: opId,
          name: opName,
          totalHours: 0,
          totalArea: 0,
          brigadeName: bName,
        };
      }
      aggregation[opId].totalHours += lap.workingHours || 0;
      aggregation[opId].totalArea += lap.landArea || 0;
    });

    let result = Object.values(aggregation);

    // 2. Augment with local register data if the list is small to ensure visual richness
    if (result.length < 5) {
      const currentRegBrigadeIds = brigades
        .filter(b => selectedProvince === 'Semua' || normalizeProvince(b.province) === normalizeProvince(selectedProvince))
        .map(b => b.id);
      
      const localOperators = operators.filter(o => 
        selectedProvince === 'Semua' || currentRegBrigadeIds.includes(o.brigadeId)
      );

      localOperators.forEach(o => {
        if (!aggregation[o.id]) {
          const b = brigades.find(br => br.id === o.brigadeId);
          const seed = o.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          
          // Scale mock hours and area based on the length of the selected period
          let periodScale = 1.0;
          if (dateFilterType === 'month') {
            periodScale = 1 / 6;
          } else if (dateFilterType === 'q1' || dateFilterType === 'q2') {
            periodScale = 0.5;
          } else if (dateFilterType === 'custom') {
            try {
              const start = new Date(customStartDate);
              const end = new Date(customEndDate);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
              periodScale = Math.min(1.0, diffDays / 180); // max 6 months
            } catch (e) {
              periodScale = 0.5;
            }
          }

          const mockHours = Math.round(((seed % 45) + 20) * periodScale); // scale mock data proportionally
          const mockArea = parseFloat((((seed % 45) + 20) * 0.85 * periodScale).toFixed(1));

          aggregation[o.id] = {
            id: o.id,
            name: o.name,
            totalHours: mockHours,
            totalArea: mockArea,
            brigadeName: b ? b.name : 'Brigade Lapangan',
          };
        }
      });
      result = Object.values(aggregation);
    }

    // Sort by total working hours descending to identify top performers
    return result.sort((a, b) => b.totalHours - a.totalHours).slice(0, 8); // Top 8 operators
  }, [productivityFilteredLaporan, operators, brigades, selectedProvince, dateFilterType, customStartDate, customEndDate, selectedMonth]);

  // Find all Brigade Pangan belonging to the currently selected province
  const regionalBrigades = useMemo(() => {
    return brigades.filter((b) => {
      if (selectedProvince === 'Semua') return true;
      return normalizeProvince(b.province) === normalizeProvince(selectedProvince);
    });
  }, [brigades, selectedProvince]);

  // Compute stats for each province to display list totals
  const provincialSummary = useMemo(() => {
    const list = ['Kepulauan Bangka Belitung'];
    return list.map((prov) => {
      const pBrigades = brigades.filter((b) => normalizeProvince(b.province) === normalizeProvince(prov));
      const pReports = laporanList.filter((l) => pBrigades.some(b => b.id === l.brigadeId));
      const pArea = pReports.reduce((sum, r) => sum + r.landArea, 0);
      const pTarget = targets.find((t) => normalizeProvince(t.province) === normalizeProvince(prov))?.targetArea || 0;
      return {
        province: prov,
        brigadesCount: pBrigades.length,
        areaCount: pArea,
        targetArea: pTarget,
      };
    });
  }, [brigades, laporanList, targets]);

  const mapCenter = useMemo(() => {
    const norm = normalizeProvince(selectedProvince);
    const coords = PROVINCE_COORDS[norm];
    if (coords) {
      return { center: [coords.lat, coords.lng] as [number, number], zoom: coords.zoom };
    }
    return { center: [-2.5, 118.0] as [number, number], zoom: 5 };
  }, [selectedProvince]);

  const markersData = useMemo(() => {
    return provincialSummary.map((item) => {
      const coords = PROVINCE_COORDS[normalizeProvince(item.province)] || { lat: -2.5, lng: 118.0, zoom: 5 };
      const isSelected = normalizeProvince(selectedProvince) === normalizeProvince(item.province);
      
      // Get detailed brigade list for real-time popup
      const pBrigades = brigades.filter((b) => normalizeProvince(b.province) === normalizeProvince(item.province));
      
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
  }, [provincialSummary, selectedProvince, brigades]);

  // Operational Summary Stats for Current Month (Bulan Berjalan)
  const statsBulanBerjalan = useMemo(() => {
    // Current selected month
    const activeMonthName = MONTH_NAMES[selectedMonth] || 'Juni';
    
    // Filter reports belonging to the selectedMonth
    const currentMonthReports = filteredLaporan.filter((lap) => {
      const dateParts = lap.date.split('-');
      if (dateParts.length < 2) return false;
      const month = parseInt(dateParts[1]) - 1;
      return month === selectedMonth;
    });

    const totalHoursCur = currentMonthReports.reduce((sum, lap) => sum + lap.workingHours, 0);
    const totalFuelCur = currentMonthReports.reduce((sum, lap) => sum + lap.fuelUsed, 0);
    const totalCostCur = currentMonthReports.reduce((sum, lap) => sum + lap.cost, 0);
    const totalAreaCur = currentMonthReports.reduce((sum, lap) => sum + lap.landArea, 0);

    // Group cost by brigade
    const brigadeCostsCur: Record<string, number> = {};
    currentMonthReports.forEach((lap) => {
      brigadeCostsCur[lap.brigadeId] = (brigadeCostsCur[lap.brigadeId] || 0) + lap.cost;
    });

    const activeBrigadesCount = Object.keys(brigadeCostsCur).length;
    // Average cost per active brigade
    const averageCostPerBrigadeCur = activeBrigadesCount > 0 
      ? totalCostCur / activeBrigadesCount 
      : 0;

    return {
      monthName: activeMonthName,
      totalHours: totalHoursCur,
      totalFuel: totalFuelCur,
      totalCost: totalCostCur,
      totalArea: totalAreaCur,
      averageCostPerBrigade: averageCostPerBrigadeCur,
      activeBrigadesCount,
      reportsCount: currentMonthReports.length
    };
  }, [filteredLaporan, selectedMonth]);

  const isBPRole = userRole === 'Operator' || userRole === 'Koordinator';
  const currentBrigade = isBPRole && currentUser ? brigades.find(b => b.id === currentUser.brigadeId) : null;
  
  const bpAlsintanCount = currentBrigade ? alsintanList.filter(a => a.brigadeId === currentBrigade.id).length : 0;
  const bpOperatorsCount = currentBrigade ? 10 : 0;
  
  const bpReportsAll = useMemo(() => {
    return currentBrigade ? laporanList.filter(l => l.brigadeId === currentBrigade.id) : [];
  }, [laporanList, currentBrigade]);

  const bpReportsFiltered = useMemo(() => {
    return bpReportsAll.filter(l => {
      if (bpDateFilterType === 'all') return true;
      
      const reportDate = l.date;
      const todayStr = '2026-06-28';
      const today = new Date(todayStr);
      
      if (bpDateFilterType === '7days') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
        return reportDate >= sevenDaysAgoStr && reportDate <= todayStr;
      }
      if (bpDateFilterType === '30days') {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
        return reportDate >= thirtyDaysAgoStr && reportDate <= todayStr;
      }
      if (bpDateFilterType === 'month') {
        return reportDate >= '2026-06-01' && reportDate <= '2026-06-30';
      }
      if (bpDateFilterType === 'custom') {
        return reportDate >= bpCustomStartDate && reportDate <= bpCustomEndDate;
      }
      return true;
    });
  }, [bpReportsAll, bpDateFilterType, bpCustomStartDate, bpCustomEndDate]);

  const bpRealizedArea = useMemo(() => {
    return bpReportsFiltered.reduce((sum, r) => sum + r.landArea, 0);
  }, [bpReportsFiltered]);

  const bpTargetArea = 200; // Fixed target for BP as requested
  const bpTargetPercentage = Math.min((bpRealizedArea / bpTargetArea) * 100, 100).toFixed(1);

  const bpWeeklyTrend = useMemo(() => {
    if (!currentBrigade) return [];
    
    let startStr = '2026-06-22';
    let endStr = '2026-06-28';
    const todayStr = '2026-06-28';
    
    if (bpDateFilterType === '7days') {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - 6);
      startStr = d.toISOString().split('T')[0];
      endStr = todayStr;
    } else if (bpDateFilterType === '30days') {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - 29);
      startStr = d.toISOString().split('T')[0];
      endStr = todayStr;
    } else if (bpDateFilterType === 'month') {
      startStr = '2026-06-01';
      endStr = '2026-06-30';
    } else if (bpDateFilterType === 'custom') {
      startStr = bpCustomStartDate;
      endStr = bpCustomEndDate;
    } else {
      // 'all'
      const dates = bpReportsAll.map(r => r.date).filter(Boolean);
      if (dates.length > 0) {
        dates.sort();
        startStr = dates[0];
        endStr = dates[dates.length - 1];
        if (startStr > todayStr) startStr = todayStr;
      } else {
        startStr = '2026-06-22';
        endStr = '2026-06-28';
      }
    }
    
    const start = new Date(startStr);
    const end = new Date(endStr);
    const days = [];
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays <= 31) {
      const current = new Date(start);
      while (current <= end) {
        days.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    } else {
      const adjustedStart = new Date(end);
      adjustedStart.setDate(adjustedStart.getDate() - 30);
      const current = new Date(adjustedStart);
      while (current <= end) {
        days.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    }
    
    return days.map(dateStr => {
      const dateReports = bpReportsAll.filter(r => r.date === dateStr);
      const totalArea = dateReports.reduce((sum, r) => sum + r.landArea, 0);
      return {
        date: new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        'Luas (Ha)': parseFloat(totalArea.toFixed(1))
      };
    });
  }, [bpReportsAll, bpDateFilterType, bpCustomStartDate, bpCustomEndDate, currentBrigade]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header & Quick Switcher Controls */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-primary-green rounded-lg">
              {isBPRole ? <Tractor className="w-5 h-5 text-emerald-600" /> : <Globe className="w-5 h-5 text-emerald-600" />}
            </span>
            {isBPRole ? `Dashboard Brigade: ${currentBrigade?.name || currentUser?.brigadeId}` : 'Dashboard Pemantauan Nasional'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isBPRole 
              ? 'Real-time data evaluasi kinerja dan target Brigade Pangan Anda.' 
              : 'Real-time data evaluasi kinerja Brigade Pangan, sebaran wilayah kerja, dan utilitas alsintan.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Periode:</span>
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value as any)}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-2 py-1 rounded-md focus:outline-none"
            >
              <option value="all">Semua</option>
              <option value="month">Bulan</option>
              <option value="q1">Q1</option>
              <option value="q2">Q2</option>
              <option value="custom">Kustom</option>
            </select>
            
            {dateFilterType === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-2 py-1 rounded-md"
              >
                {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            )}

            {dateFilterType === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-1 py-1 rounded-md"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-1 py-1 rounded-md"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Provinsi:</span>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              disabled={currentUser?.role !== 'Super Admin'}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <option value="Kepulauan Bangka Belitung">Kepulauan Bangka Belitung</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Komoditas:</span>
            <select
              value={filterCommodity}
              onChange={(e) => setFilterCommodity(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              <option value="Semua">🌾 Semua Komoditas</option>
              <option value="Padi">Padi</option>
              <option value="Jagung">Jagung</option>
              <option value="Kedelai">Kedelai</option>
            </select>
          </div>
        </div>
      </div>

      {/* 1.5 ALERTS / WARNINGS SECTION FOR KOORDINATOR / ADMIN */}
      {(['Koordinator', 'Super Admin', 'Kabupaten', 'Provinsi'].includes(userRole)) && dashboardNotifications.length > 0 && (
        <div className="bg-red-50/85 border-2 border-red-200 rounded-xl p-4.5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <h3 className="text-sm font-black text-red-900 uppercase tracking-wider flex items-center gap-1">
                Sistem Peringatan Internal Brigade (Perlu Tindakan Koordinator)
              </h3>
            </div>
            <span className="bg-red-200 text-red-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {dashboardNotifications.length} Masalah Aktif
            </span>
          </div>
          
          <button
            onClick={() => setIsWaBillingOpen(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Buka Pusat Penagihan WA
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {dashboardNotifications.map((alert: any) => (
              <div key={alert.id} className="bg-white border border-red-100 rounded-lg p-3.5 flex items-start gap-3 shadow-3xs hover:border-red-300 transition-all">
                <div className="mt-0.5 shrink-0">
                  {alert.type === 'kerusakan' ? (
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Wrench className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-800 text-xs leading-tight">{alert.title}</span>
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      alert.severity === 'Berat' || alert.severity === 'Penting'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">
                    {alert.message}
                  </p>
                  {alert.foto && (
                    <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-100 shadow-3xs max-w-[120px] bg-slate-50 flex items-center justify-center">
                      <img src={alert.foto} alt="Bukti Fisik Kerusakan" className="w-full h-16 object-cover" />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 font-bold pt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tanggal Laporan/Jadwal: {alert.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isBPRole ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{currentBrigade?.name || 'Brigade Pangan'}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    {currentBrigade?.village}, {currentBrigade?.district}, {currentBrigade?.regency}, {currentBrigade?.province}
                  </p>
                </div>
                
                {/* Date Filter Panel */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 self-start sm:self-auto shadow-3xs">
                  <span className="text-[10px] font-black text-slate-500 uppercase px-1.5">Filter Periode:</span>
                  <select
                    value={bpDateFilterType}
                    onChange={(e) => setBpDateFilterType(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">Semua Periode</option>
                    <option value="7days">7 Hari Terakhir</option>
                    <option value="30days">30 Hari Terakhir</option>
                    <option value="month">Bulan Ini (Juni)</option>
                    <option value="custom">Kustom Tanggal</option>
                  </select>
                  
                  {bpDateFilterType === 'custom' && (
                    <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
                      <input
                        type="date"
                        value={bpCustomStartDate}
                        onChange={(e) => setBpCustomStartDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-slate-400 text-xs font-bold">s/d</span>
                      <input
                        type="date"
                        value={bpCustomEndDate}
                        onChange={(e) => setBpCustomEndDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-3xl font-black text-emerald-600 mb-1">{bpAlsintanCount}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Alsintan</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-3xl font-black text-emerald-600 mb-1">{bpOperatorsCount}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Operator Aktif</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-3xl font-black text-amber-600 mb-1">{bpRealizedArea.toFixed(1)}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Realisasi (Ha)</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-3xl font-black text-indigo-600 mb-1">{bpTargetArea}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Luas Lahan (Ha)</div>
                  </div>
                </div>
              )}


              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Progres Kinerja Brigade</span>
                  <span className="text-sm font-black text-emerald-600">{bpTargetPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(Number(bpTargetPercentage), 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {bpDateFilterType === '7days' && 'Tren Luas Lahan (7 Hari Terakhir)'}
                    {bpDateFilterType === '30days' && 'Tren Luas Lahan (30 Hari Terakhir)'}
                    {bpDateFilterType === 'month' && 'Tren Luas Lahan (Bulan Ini)'}
                    {bpDateFilterType === 'all' && 'Tren Luas Lahan (Semua Periode)'}
                    {bpDateFilterType === 'custom' && `Tren Luas Lahan (${new Date(bpCustomStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(bpCustomEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`}
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="h-48 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bpWeeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLuas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey="Luas (Ha)" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorLuas)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="md:w-72 bg-emerald-50 rounded-xl p-5 border border-emerald-100 flex-shrink-0 w-full">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Info Koordinator
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-emerald-600/80 font-semibold uppercase">Nama Koordinator</div>
                  <div className="text-sm font-bold text-emerald-900">{currentBrigade?.leader || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600/80 font-semibold uppercase">Kontak</div>
                  <div className="text-sm font-bold text-emerald-900 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5" /> {currentBrigade?.phone || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        {/* Left Column (2/3 Width): Interactive Indonesia Map Suite */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <MapIcon className="w-4 h-4 text-emerald-600" /> Peta Interaktif Sebaran Brigade
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                  Visualisasi sebaran pos brigade pangan di seluruh Indonesia
                </p>
              </div>

              {/* MAP CONTROLS GROUP */}
              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                {/* Boundary layer toggle */}
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

                {/* Heatmap / Marker mode toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setViewMode('marker')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                      viewMode === 'marker'
                        ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-950/5'
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
                        ? 'bg-white text-amber-700 shadow-2xs border border-amber-950/5'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🔥 Heatmap Kerja
                  </button>
                </div>

                {/* Base map type toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setMapType('street')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                      mapType === 'street' ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-950/5' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🗺️ Peta Jalan
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapType('satellite')}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                      mapType === 'satellite' ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-950/5' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🛰️ Satelit
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Leaflet Map via React-Leaflet */}
            <div className="flex gap-2 mb-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200 z-20 relative">
              <select value={filterRegency} onChange={(e) => { setFilterRegency(e.target.value); setFilterDistrict(''); setFilterBrigade(''); }} className="text-xs p-1 border border-slate-300 rounded">
                <option value="">Semua Kabupaten</option>
                {regencies.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setFilterBrigade(''); }} className="text-xs p-1 border border-slate-300 rounded">
                <option value="">Semua Kecamatan</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative h-[420px] bg-slate-900 z-10">
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
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                )}

                {/* PROVINCIAL COVERAGE POLYGONS */}
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
                        }
                      }}
                    >
                      <Popup>
                        <div className="p-2 font-sans text-slate-100 text-xs leading-relaxed">
                          <span className="font-extrabold uppercase text-emerald-400 block mb-0.5">{provName}</span>
                          <span className="text-[10px] text-slate-300">Wilayah Kerja / Cakupan Sawah Brigade Pangan Kementan</span>
                        </div>
                      </Popup>
                    </Polygon>
                  );
                })}

                {/* STANDARD MARKER PIN VIEW */}
                {viewMode === 'marker' && (
                  <MarkerClusterGroup>
                    {markersData.map((item) => {
                  const isSelected = normalizeProvince(selectedProvince) === normalizeProvince(item.province);
                  const icon = L.divIcon({
                    html: `
                      <div class="relative flex items-center justify-center">
                        <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full ${
                          isSelected ? 'bg-amber-500' : 'bg-emerald-600'
                        } opacity-35" style="animation-duration: 2s;"></span>
                        <div class="relative flex h-8 w-8 items-center justify-center rounded-full ${
                          isSelected ? 'bg-amber-500 text-amber-950 border-amber-300' : 'bg-emerald-600 text-white border-emerald-400'
                        } border-2 shadow-md text-[10px] font-black">
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
                        <div className="font-sans p-2 text-slate-100 max-h-[320px] overflow-y-auto">
                          <div className="border-b border-slate-700 pb-2 mb-2 flex justify-between items-center">
                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">{item.province}</h4>
                            {isSelected && (
                              <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black uppercase">
                                Terpilih
                              </span>
                            )}
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
                            <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-bold">
                              <span>Target: {item.targetArea} Ha</span>
                            </div>
                          </div>

                          <div className="border-t border-slate-700/60 pt-2 mb-3">
                            <span className="text-[9px] text-slate-400 font-black block uppercase mb-1.5">Pos Brigade Pangan:</span>
                            <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                              {item.brigadesList.length === 0 ? (
                                <div className="text-[10px] text-slate-500 italic py-1">Tidak ada brigade terdaftar.</div>
                              ) : (
                                item.brigadesList.map((b) => (
                                  <div key={b.id} className="text-[10px] bg-slate-800/40 border border-slate-700/30 p-1.5 rounded-md flex flex-col gap-0.5">
                                    <div className="flex justify-between items-center">
                                      <span className="font-extrabold text-slate-200 text-xs">{b.name}</span>
                                      <span className="text-[8px] font-bold text-slate-400 uppercase">{b.regency}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] text-slate-400">
                                      <span>Ketua: {b.leader}</span>
                                      <span className="text-emerald-400 font-mono font-bold">
                                        📞 {b.phone}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProvince(item.province)}
                            className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg font-black text-[10px] transition-all uppercase tracking-wide cursor-pointer"
                          >
                            Fokus Wilayah Ini
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                  </MarkerClusterGroup>
                )}

                {/* THERMAL HEATMAP INTENSITY VIEW */}
                {viewMode === 'heatmap' && markersData.map((item) => {
                  const isSelected = normalizeProvince(selectedProvince) === normalizeProvince(item.province);
                  const baseRadius = 45000;
                  const scalingFactor = 150; // Metres per hectare
                  const outerRadius = baseRadius + (item.areaCount * scalingFactor);
                  const middleRadius = (baseRadius * 0.6) + (item.areaCount * scalingFactor * 0.6);
                  const innerRadius = (baseRadius * 0.35) + (item.areaCount * scalingFactor * 0.35);

                  return (
                    <React.Fragment key={`heat-${item.province}`}>
                      {/* Outer Soft Halo */}
                      <Circle
                        center={[item.lat, item.lng]}
                        radius={outerRadius}
                        pathOptions={{
                          color: 'transparent',
                          fillColor: '#ef4444',
                          fillOpacity: 0.12,
                        }}
                        eventHandlers={{
                          click: () => setSelectedProvince(item.province)
                        }}
                      />
                      {/* Middle Medium Heat Ring */}
                      <Circle
                        center={[item.lat, item.lng]}
                        radius={middleRadius}
                        pathOptions={{
                          color: 'transparent',
                          fillColor: '#f97316',
                          fillOpacity: 0.25,
                        }}
                        eventHandlers={{
                          click: () => setSelectedProvince(item.province)
                        }}
                      />
                      {/* Core Thermal Hotspot */}
                      <Circle
                        center={[item.lat, item.lng]}
                        radius={innerRadius}
                        pathOptions={{
                          color: 'transparent',
                          fillColor: '#eab308',
                          fillOpacity: 0.55,
                        }}
                        eventHandlers={{
                          click: () => setSelectedProvince(item.province)
                        }}
                      >
                        <Popup minWidth={280}>
                          <div className="font-sans p-2 text-slate-100 max-h-[320px] overflow-y-auto">
                            <div className="border-b border-slate-700 pb-2 mb-2 flex justify-between items-center">
                              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">🔥 INTENSITAS: {item.province}</h4>
                              {isSelected && (
                                <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black uppercase">
                                  Fokus
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                                <span className="text-[8px] text-slate-400 font-bold block uppercase">Pos Terbuka</span>
                                <strong className="text-xs text-slate-200">{item.brigadesCount} Brigade</strong>
                              </div>
                              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                                <span className="text-[8px] text-slate-400 font-bold block uppercase">Kerja Tanam</span>
                                <strong className="text-xs text-amber-400">{item.areaCount} Ha</strong>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="flex justify-between items-center text-[9px] mb-1">
                                <span className="text-slate-400 font-bold">REALISASI TARGET</span>
                                <span className="text-slate-200 font-black">
                                  {item.targetArea > 0 ? ((item.areaCount / item.targetArea) * 100).toFixed(1) : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-amber-500 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(100, item.targetArea > 0 ? (item.areaCount / item.targetArea) * 100 : 0)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-bold">
                                <span>Target Kerja: {item.targetArea} Ha</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedProvince(item.province)}
                              className="w-full text-center bg-amber-600 hover:bg-amber-500 text-white py-1.5 rounded-lg font-black text-[10px] transition-all uppercase tracking-wide cursor-pointer"
                            >
                              Fokus Wilayah Ini
                            </button>
                          </div>
                        </Popup>
                      </Circle>
                    </React.Fragment>
                  );
                })}
              </MapContainer>

              <div className="absolute bottom-3 left-3 bg-slate-900/95 text-slate-200 p-2 rounded-lg text-[9px] font-mono pointer-events-none border border-slate-800 z-[1000]">
                ⚡ ENGINE: React-Leaflet &bull; LAYER: {mapType === 'satellite' ? 'Esri World Imagery' : 'CartoDB Light'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Filter Wilayah Saat Ini: <strong className="text-emerald-700">{selectedProvince === 'Semua' ? 'SELURUH INDONESIA (NASIONAL)' : selectedProvince.toUpperCase()}</strong>
            </span>
            {selectedProvince !== 'Semua' && (currentUser?.role === 'Super Admin') && (
              <button
                type="button"
                onClick={() => setSelectedProvince('Semua')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[10px] px-3 py-1 rounded-lg uppercase tracking-wide cursor-pointer transition-all"
              >
                🔄 Reset ke Nasional
              </button>
            )}
          </div>
        </div>

        {/* Right Column (1/3 Width): Drill-down Region Summary & Regional Brigade List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" /> Profil &amp; Target Wilayah
            </h3>

            {/* Target Card */}
            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 shadow-3xs">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Target Luas Layanan</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                    {selectedProvince === 'Semua' ? 'Nasional' : 'Provinsi'}
                  </span>
                </div>
                
                <div className="my-2">
                  <span className="text-2xl font-black text-slate-900">{targetPercentage}%</span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                    Realisasi: {realizedAreaTotal.toLocaleString('id-ID')} Ha dari {targetAreaTotal.toLocaleString('id-ID')} Ha
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(Number(targetPercentage), 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Brigade List in Selected Province */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Daftar Posko Brigade ({regionalBrigades.length})
                </span>

                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {regionalBrigades.map((b) => {
                    const bLaporan = laporanList.filter(l => l.brigadeId === b.id);
                    const bArea = bLaporan.reduce((acc, curr) => acc + curr.landArea, 0);
                    const bHours = bLaporan.reduce((acc, curr) => acc + curr.workingHours, 0);
                    const bMachines = alsintanList.filter(m => m.brigadeId === b.id).length;

                    return (
                      <div 
                        key={b.id} 
                        className="p-3 bg-white rounded-lg border border-slate-100 shadow-3xs hover:border-emerald-200 transition-all text-xs"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-extrabold text-slate-800 leading-tight block">{b.name}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase">
                            {b.regency}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mb-2">
                          Koor: {b.leader} • {bMachines} Unit Alsintan
                        </p>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-[10px]">
                          <div className="text-slate-500 font-medium">
                            Progres: <strong className="text-emerald-700">{bArea.toFixed(1)} Ha</strong> ({bHours.toFixed(1)} Jam)
                          </div>
                          
                          {/* Direct WhatsApp WA.me billing contact */}
                          <a
                            href={`https://wa.me/${b.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Halo Pak ${b.leader} dari ${b.name} (${b.province}). Kami dari Tim Data Kementan mengonfirmasi progres pengerjaan Anda sebesar ${bArea.toFixed(1)} Ha. Terimakasih atas dedikasinya!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded flex items-center gap-1 transition-all"
                            title="Hubungi Koordinator"
                          >
                            <Phone className="w-2.5 h-2.5" /> WA
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 mt-2 border-t border-slate-50 text-[9px] text-slate-400 font-mono">
            DATA SYNCHRONIZED • KEMENTAN 2026
          </div>
        </div>

      </div>
      )}

      {/* 3. Dynamic Bento Grid KPIs (National / Provincial Drill-down) */}
      <div className={`grid gap-4 ${userRole === 'Operator' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-600" /> Jam Kerja Mesin
          </span>
          <div className="flex items-end justify-between mt-2.5">
            <span className="text-2xl font-black text-slate-900">{totalHours.toFixed(1)} <span className="text-xs font-semibold text-slate-400">Jam</span></span>
            <span className="text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{availabilityRate}% Availability</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" /> Luas Layanan Pangan
          </span>
          <div className="flex items-end justify-between mt-2.5">
            <span className="text-2xl font-black text-slate-900">{totalArea.toFixed(1)} <span className="text-xs font-semibold text-slate-400">Ha</span></span>
            <span className="text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{averageProductivity} Ha/Jam</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-emerald-600" /> Konsumsi BBM
          </span>
          <div className="flex items-end justify-between mt-2.5">
            <span className="text-2xl font-black text-slate-900">{totalFuel} <span className="text-xs font-semibold text-slate-400">L</span></span>
            <span className="text-amber-700 text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{averageFuelPerHectare} L/Ha</span>
          </div>
        </div>

        {/* KPI 4 */}
        {userRole !== 'Operator' && userRole !== 'Kabupaten' && userRole !== 'Koordinator' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Laba Operasional
            </span>
            <div className="flex items-end justify-between mt-2.5">
              <span className="text-2xl font-black text-slate-900">Rp {totalProfit.toLocaleString('id-ID')}</span>
              <span className="text-indigo-700 text-[10px] font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(0) : '0'}% Margin
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3b. Ringkasan Operasional Bulan Berjalan (Current Month Summary Statistics) */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-emerald-200/60">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
              <span className="p-1 bg-emerald-600 text-white rounded">
                <LayoutGrid className="w-4 h-4" />
              </span>
              Statistik Ringkasan Operasional Bulan Berjalan ({statsBulanBerjalan.monthName} 2026)
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
              Data operasional dikhususkan pada bulan aktif berjalan yang dipilih pada sistem
            </p>
          </div>
          <div className="bg-emerald-600/10 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-emerald-600/20">
            {statsBulanBerjalan.reportsCount} Laporan Kerja Terbaca
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Jam Kerja */}
          <div className="bg-white p-4.5 rounded-xl border border-emerald-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Jam Kerja</p>
              <h4 className="text-xl font-black text-slate-900 mt-1">
                {statsBulanBerjalan.totalHours.toFixed(1)} <span className="text-xs font-semibold text-slate-400">Jam</span>
              </h4>
              <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Bulan berjalan: {statsBulanBerjalan.monthName}</p>
            </div>
          </div>

          {/* Total Konsumsi BBM */}
          <div className="bg-white p-4.5 rounded-xl border border-emerald-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Konsumsi BBM</p>
              <h4 className="text-xl font-black text-slate-900 mt-1">
                {statsBulanBerjalan.totalFuel.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-400">L</span>
              </h4>
              <p className="text-[9px] text-slate-500 mt-0.5 font-medium">BBM bersubsidi tersalurkan</p>
            </div>
          </div>

          {/* Rata-Rata Biaya Operasional per Brigade ATAU Total Luas Layanan Pangan */}
          {(userRole === 'Operator' || userRole === 'Super Admin') ? (
            <div className="bg-white p-4.5 rounded-xl border border-emerald-100 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rata-rata Biaya Operasional per BP</p>
                <h4 className="text-xl font-black text-indigo-900 mt-1">
                  Rp {Math.round(statsBulanBerjalan.averageCostPerBrigade).toLocaleString('id-ID')}
                </h4>
                <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Dihitung dari {statsBulanBerjalan.activeBrigadesCount} Brigade pangan aktif</p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4.5 rounded-xl border border-emerald-100 shadow-3xs flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Luas Layanan Pangan</p>
                <h4 className="text-xl font-black text-indigo-900 mt-1">
                  {statsBulanBerjalan.totalArea.toFixed(1)} <span className="text-xs font-semibold text-slate-400">Ha</span>
                </h4>
                <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Bulan berjalan: {statsBulanBerjalan.monthName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {userRole !== 'Operator' && userRole !== 'Kabupaten' && (
        <>
          {/* Date Range Filter Panel for Productivity Charts */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Penyaring Rentang Waktu Produktivitas
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                Mengatur periode analisis grafik tren musiman dan komparasi kinerja operator
              </p>
            </div>
          </div>
          
          {/* Active Period Pill indicator */}
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 self-start md:self-auto">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-mono font-black uppercase text-slate-300">
              Periode Aktif: {
                dateFilterType === 'all' ? 'Januari - Juni 2026' :
                dateFilterType === 'q1' ? 'Kuartal 1 (Jan - Mar)' :
                dateFilterType === 'q2' ? 'Kuartal 2 (Apr - Jun)' :
                dateFilterType === 'month' ? `Bulan ${MONTH_NAMES[selectedMonth]}` :
                `Kustom (${customStartDate} s/d ${customEndDate})`
              }
            </span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-slate-800">
          {/* Type Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block">
              Tipe Filter Rentang Waktu
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Semua Periode' },
                { id: 'q1', label: 'Kuartal 1' },
                { id: 'q2', label: 'Kuartal 2' },
                { id: 'month', label: 'Bulan' },
                { id: 'custom', label: 'Kustom' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDateFilterType(opt.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all border cursor-pointer ${
                    dateFilterType === opt.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Input Fields */}
          <div className="md:col-span-7 flex flex-col justify-end">
            {dateFilterType === 'month' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block">
                  Pilih Bulan Analisis
                </label>
                <div className="grid grid-cols-6 gap-1 bg-slate-800/40 p-1 rounded-xl border border-slate-800">
                  {MONTH_NAMES.map((name, idx) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedMonth(idx)}
                      className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                        selectedMonth === idx
                          ? 'bg-slate-100 text-slate-900 font-extrabold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dateFilterType === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block">
                  Pilih Tanggal Mulai & Akhir
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      min="2026-01-01"
                      max="2026-06-30"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-black">s/d</span>
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      min="2026-01-01"
                      max="2026-06-30"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {dateFilterType === 'all' && (
              <div className="text-[10px] text-slate-500 font-bold italic uppercase pb-2">
                Menampilkan keseluruhan tren produktivitas 6 bulan penuh (Januari - Juni 2026)
              </div>
            )}
            
            {dateFilterType === 'q1' && (
              <div className="text-[10px] text-emerald-500/80 font-bold italic uppercase pb-2">
                Menampilkan tren produktivitas Kuartal Pertama (Januari, Februari, Maret 2026)
              </div>
            )}

            {dateFilterType === 'q2' && (
              <div className="text-[10px] text-emerald-500/80 font-bold italic uppercase pb-2">
                Menampilkan tren produktivitas Kuartal Kedua (April, Mei, Juni 2026)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Trend Line Chart (Machine Operational Hours Trend over last 6 months) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Tren Kinerja Operasional &amp; Produktivitas Musiman (6 Bulan Terakhir)
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
              Visualisasi jam kerja mesin dan estimasi cakupan lahan untuk {selectedProvince === 'Semua' ? 'Nasional' : selectedProvince} ({filterCommodity === 'Semua' ? 'Semua Komoditas' : filterCommodity})
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
            <span>Mode Grafik Sebaran Musiman</span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredMonthlyTrendData}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                label={{ value: 'Total Jam / Hektar', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: '10px', fill: '#94a3b8', fontWeight: 'bold' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600'
                }} 
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 'bold', paddingTop: '10px' }}
              />
              <Line 
                name="Total Jam Kerja Mesin" 
                type="monotone" 
                dataKey="Jam Kerja" 
                stroke="#059669" 
                strokeWidth={3} 
                activeDot={{ r: 8 }} 
                dot={{ strokeWidth: 2 }}
              />
              <Line 
                name="Estimasi Luas Olah (Ha)" 
                type="monotone" 
                dataKey="Luas Olah (Ha)" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={{ strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 bg-slate-50 border border-slate-200/50 p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed flex flex-col sm:flex-row justify-between gap-3 font-medium">
          <div>
            📈 <strong>Analisis Produktivitas Pertanian:</strong> Lonjakan aktivitas pada bulan <strong>Maret</strong> mencerminkan puncak pengolahan tanah musim tanam utama (MT-1) di posko-posko brigade pangan nasional.
          </div>
          <div className="shrink-0 text-slate-400 font-mono self-end sm:self-auto uppercase">
            Data Sumber: Laporan Pendamping Kementan
          </div>
        </div>
      </div>

      {/* Operator Productivity Comparison Chart & Performance Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Bar Chart Comparison (takes 2 cols on xl) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs xl:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" /> Komparasi Produktivitas &amp; Total Jam Kerja Operator
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                  Menilai efisiensi kerja individu berdasarkan akumulasi jam kerja mesin dan luas lahan yang dikelola ({selectedProvince === 'Semua' ? 'Nasional' : selectedProvince})
                </p>
              </div>
              <div className="bg-amber-50 text-amber-800 border border-amber-100/50 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 self-start sm:self-auto">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                <span>Analisis Kinerja Individu</span>
              </div>
            </div>

            <div className="h-[300px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={operatorWorkData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: 'Jam Kerja Kumulatif', position: 'insideBottom', offset: -5, style: { fontSize: '10px', fill: '#94a3b8', fontWeight: 'bold' } }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#334155" 
                    fontSize={11} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-700 shadow-lg text-xs font-sans max-w-[240px] z-50">
                            <p className="font-black text-emerald-400 border-b border-slate-700 pb-1 mb-1.5 uppercase text-[10px] tracking-wider">{data.name}</p>
                            <p className="text-slate-300 font-bold mb-0.5">Brigade: <span className="text-slate-100">{data.brigadeName}</span></p>
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-1.5 border-t border-slate-800">
                              <div>
                                <span className="text-[8px] text-slate-400 font-black block uppercase">TOTAL JAM</span>
                                <strong className="text-slate-100 font-bold text-xs">{data.totalHours} Jam</strong>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 font-black block uppercase">LUAS LAHAN</span>
                                <strong className="text-slate-100 font-bold text-xs">{data.totalArea} Ha</strong>
                              </div>
                            </div>
                            <div className="mt-2 text-[8.5px] text-emerald-300 font-mono bg-emerald-500/10 p-1 rounded border border-emerald-500/20 text-center">
                              Rasio Kerja: {(data.totalArea / Math.max(1, data.totalHours)).toFixed(2)} Ha/Jam
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    name="Jam Kerja Mesin" 
                    dataKey="totalHours" 
                    fill="#10b981" 
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                  >
                    {operatorWorkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#047857' : index === 1 ? '#059669' : index === 2 ? '#10b981' : '#34d399'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="mt-3 bg-slate-50 border border-slate-200/50 p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed font-medium">
            💡 <strong>Rasio Efisiensi Kerja:</strong> Operator dengan rasio hektar-per-jam yang tinggi menunjukkan kemahiran taktis dalam menavigasi alsintan di lapangan serta meminimalkan downtime teknis.
          </div>
        </div>

        {/* Weekly Charts Row */}
        <div className="mt-6">
            <WeeklyChartsView laporanList={laporanList} />
        </div>

        {/* Monthly Charts Row */}
        <div className="mt-6">
            <MonthlyChartsView data={monthlyData} />
        </div>

        {/* Right Side: Productivity Ranking & Stats Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-4 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Peringkat Produktivitas Operator
            </h3>
            <div className="space-y-3">
              {operatorWorkData.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Tidak ada data operator di wilayah ini.
                </div>
              ) : (
                operatorWorkData.map((op, idx) => {
                  const ratio = op.totalHours > 0 ? (op.totalArea / op.totalHours).toFixed(2) : '0.00';
                  return (
                    <div key={op.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/30 hover:border-emerald-200 hover:bg-emerald-50/25 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                          idx === 0 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : idx === 1 
                              ? 'bg-slate-200 text-slate-800' 
                              : idx === 2 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-slate-800 block truncate">{op.name}</span>
                          <span className="text-[9px] text-slate-400 block font-semibold truncate uppercase">{op.brigadeName}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-700 block">{op.totalHours} Jam</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono inline-block mt-0.5">{ratio} Ha/Jam</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <span>Metode Evaluasi</span>
            <span className="text-emerald-600">Jam Operasional / Ha</span>
          </div>
        </div>
      </div>

      {/* 4. Machinery Status & RAMS Reliability Grid (Reacting to Region) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Machinery Status Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-4">Status &amp; Ketersediaan Unit</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Unit Aktif (Siap Kerja)</span>
                  <span className="text-emerald-600 font-bold">
                    {totalActiveAlsintan} Unit ({filteredAlsintan.length > 0 ? ((totalActiveAlsintan / filteredAlsintan.length) * 100).toFixed(0) : '0'}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${filteredAlsintan.length > 0 ? (totalActiveAlsintan / filteredAlsintan.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Unit Standby / Masa Perawatan</span>
                  <span className="text-amber-600 font-bold">
                    {totalServiceAlsintan} Unit ({filteredAlsintan.length > 0 ? ((totalServiceAlsintan / filteredAlsintan.length) * 100).toFixed(0) : '0'}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${filteredAlsintan.length > 0 ? (totalServiceAlsintan / filteredAlsintan.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Unit Rusak / Perbaikan Berat</span>
                  <span className="text-rose-600 font-bold">
                    {totalRusakAlsintan} Unit ({filteredAlsintan.length > 0 ? ((totalRusakAlsintan / filteredAlsintan.length) * 100).toFixed(0) : '0'}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${filteredAlsintan.length > 0 ? (totalRusakAlsintan / filteredAlsintan.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between text-[10px] font-bold text-slate-500 uppercase">
            <div>Armada Terdaftar: <strong className="text-slate-700">{filteredAlsintan.length} Unit</strong></div>
            <div>Alert Perbaikan: <strong className="text-rose-600">{totalRusakAlsintan} Unit</strong></div>
          </div>
        </div>

        {/* Reliability Calculations Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-4">Real-Time Reliability Index (RAMS)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">MTBF</span>
                <p className="text-lg font-black text-emerald-600 mt-1">{mtbf} Jam</p>
                <span className="text-[8px] text-slate-400 block">Mean Time Between Failure</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">MTTR</span>
                <p className="text-lg font-black text-rose-800 mt-1">{mttr} Jam</p>
                <span className="text-[8px] text-slate-400 block">Mean Time To Repair</span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-amber-50/50 border border-amber-100 rounded-lg text-xs text-slate-600 leading-relaxed">
              💡 <strong>Rekomendasi Perawatan:</strong> Nilai keandalan di wilayah terpilih berada dalam kategori prima. Selalu bersihkan radiator mesin alsintan setiap selesai dinas.
            </div>
          </div>

          <div className="text-center pt-2 border-t border-slate-50 text-[9px] text-slate-400 font-mono uppercase">
            RAMS Evaluator Engine v1.2
          </div>
        </div>

        {/* National / Regional Provincial Contributions Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Kontribusi Luas Provinsi
            </h3>
            
            <div className="space-y-2 max-h-[190px] overflow-y-auto">
              {provincialSummary.map((ps) => {
                const targetPercentage = ps.targetArea > 0 ? ((ps.areaCount / ps.targetArea) * 100).toFixed(0) : '0';
                return (
                  <div 
                    key={ps.province}
                    onClick={() => setSelectedProvince(ps.province)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all text-xs flex justify-between items-center ${selectedProvince === ps.province ? 'bg-amber-50 border-amber-300 font-bold' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div>
                      <span className="text-slate-800 font-extrabold block text-[11px]">{ps.province}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{ps.brigadesCount} Brigade</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 font-black block text-[11px]">{ps.areaCount.toFixed(1)} Ha</span>
                      <span className="text-[9px] text-emerald-600 font-extrabold">{targetPercentage}% dari target</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center pt-2 mt-2 border-t border-slate-50 text-[9px] text-slate-400 font-mono">
            KONTRIBUSI LAHAN INTEGRASI PUSAT
          </div>
        </div>

      </div>
        </>
      )}

    </div>
  );
}
