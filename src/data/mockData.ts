import { User, Brigade, Alsintan, Operator, LaporanHarian, RiwayatService, RiwayatKerusakan, AuditTrail, TargetRealisasi } from '../types';
import { parseBabelCsvData } from './csvParser';

export const mockUsers: User[] = [
  { 
    id: 'usr-000', 
    name: 'Irwan Pepi', 
    role: 'Super Admin', 
    brigadeId: 'all', 
    province: 'Kepulauan Bangka Belitung',
    email: 'irwan.pepi2020@gmail.com',
    phone: '081234567890',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  { 
    id: 'usr-001', 
    name: 'Super Admin PEPI', 
    role: 'Super Admin', 
    brigadeId: 'all', 
    province: 'Kepulauan Bangka Belitung',
    email: 'super.admin@alsintan.id',
    phone: '081122334455',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  { 
    id: 'usr-002', 
    name: 'Admin Kementan', 
    role: 'Super Admin', 
    brigadeId: 'all', 
    province: 'Kepulauan Bangka Belitung',
    email: 'admin.kementan@alsintan.id',
    phone: '081234567890',
    photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  { 
    id: 'usr-003', 
    name: 'Kelsi Babel', 
    role: 'Provinsi', 
    brigadeId: 'all', 
    province: 'Kepulauan Bangka Belitung',
    email: 'kelsi.babel@alsintan.id',
    phone: '081987654321',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  { 
    id: 'usr-004', 
    name: 'Dedi-Laksmana', 
    role: 'Koordinator', 
    brigadeId: 'brg-006', 
    province: 'Kepulauan Bangka Belitung',
    email: 'samsul.bahri@alsintan.id',
    phone: '081278945612',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  { 
    id: 'usr-005', 
    name: 'Agus Zakaria', 
    role: 'Operator', 
    brigadeId: 'brg-006', 
    province: 'Kepulauan Bangka Belitung',
    email: 'operator.agusz@alsintan.id',
    phone: '085677889901',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  
  // ADMIN KATIMKER KABUPATEN
  {
    id: 'usr-kab-basel',
    name: 'Katimker Bangka Selatan',
    role: 'Kabupaten',
    regency: 'Bangka Selatan',
    brigadeId: 'all',
    province: 'Kepulauan Bangka Belitung',
    email: 'katimker.basel@alsintan.id',
    phone: '081223344556',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'usr-kab-babar',
    name: 'Katimker Bangka Barat',
    role: 'Kabupaten',
    regency: 'Bangka Barat',
    brigadeId: 'all',
    province: 'Kepulauan Bangka Belitung',
    email: 'katimker.babar@alsintan.id',
    phone: '081223344557',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'usr-kab-bangka',
    name: 'Katimker Bangka',
    role: 'Kabupaten',
    regency: 'Bangka',
    brigadeId: 'all',
    province: 'Kepulauan Bangka Belitung',
    email: 'katimker.bangka@alsintan.id',
    phone: '081223344558',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'usr-kab-bateng',
    name: 'Katimker Bangka Tengah',
    role: 'Kabupaten',
    regency: 'Bangka Tengah',
    brigadeId: 'all',
    province: 'Kepulauan Bangka Belitung',
    email: 'katimker.bateng@alsintan.id',
    phone: '081223344559',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'usr-kab-belitung',
    name: 'Katimker Belitung',
    role: 'Kabupaten',
    regency: 'Belitung',
    brigadeId: 'all',
    province: 'Kepulauan Bangka Belitung',
    email: 'katimker.belitung@alsintan.id',
    phone: '081223344560',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'usr-kab-beltim',
    name: 'Katimker Belitung Timur',
    role: 'Kabupaten',
    regency: 'Belitung Timur',
    brigadeId: 'all',
    province: 'Kepulauan Bangka Belitung',
    email: 'katimker.beltim@alsintan.id',
    phone: '081223344561',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },

  // BRIGADE RIAS MAKMUR TOBOALI (BANGKA SELATAN)
  {
    id: 'operator.basel',
    name: 'Operator BP Rias Makmur',
    role: 'Operator',
    brigadeId: 'brg-006',
    province: 'Kepulauan Bangka Belitung',
    email: 'operator.basel@alsintan.id',
    phone: '085311223344',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'manajer.basel',
    name: 'Manajer BP Rias Makmur',
    role: 'Koordinator',
    brigadeId: 'brg-006',
    province: 'Kepulauan Bangka Belitung',
    email: 'manajer.basel@alsintan.id',
    phone: '085311223345',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },

  // BRIGADE PANGKON SEJAHTERA TEMPILANG (BANGKA BARAT)
  {
    id: 'operator.babar',
    name: 'Operator BP Pangkon Sejahtera',
    role: 'Operator',
    brigadeId: 'brg-007',
    province: 'Kepulauan Bangka Belitung',
    email: 'operator.babar@alsintan.id',
    phone: '085311223346',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'manajer.babar',
    name: 'Manajer BP Pangkon Sejahtera',
    role: 'Koordinator',
    brigadeId: 'brg-007',
    province: 'Kepulauan Bangka Belitung',
    email: 'manajer.babar@alsintan.id',
    phone: '085311223347',
    photoUrl: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },

  // BRIGADE KEMUJA SEJAHTERA MENDO BARAT (BANGKA)
  {
    id: 'operator.bangka',
    name: 'Operator BP Kemuja Sejahtera',
    role: 'Operator',
    brigadeId: 'brg-008',
    province: 'Kepulauan Bangka Belitung',
    email: 'operator.bangka@alsintan.id',
    phone: '085311223348',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'manajer.bangka',
    name: 'Manajer BP Kemuja Sejahtera',
    role: 'Koordinator',
    brigadeId: 'brg-008',
    province: 'Kepulauan Bangka Belitung',
    email: 'manajer.bangka@alsintan.id',
    phone: '085311223349',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },

  // BRIGADE AIK DANAU BELILIK NAMANG (BANGKA TENGAH)
  {
    id: 'operator.bateng',
    name: 'Operator BP Aik Danau Belilik',
    role: 'Operator',
    brigadeId: 'brg-009',
    province: 'Kepulauan Bangka Belitung',
    email: 'operator.bateng@alsintan.id',
    phone: '085311223350',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'manajer.bateng',
    name: 'Manajer BP Aik Danau Belilik',
    role: 'Koordinator',
    brigadeId: 'brg-009',
    province: 'Kepulauan Bangka Belitung',
    email: 'manajer.bateng@alsintan.id',
    phone: '085311223351',
    photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },

  // BRIGADE BP BELITUNG II MEMBALONG (BELITUNG)
  {
    id: 'operator.belitung',
    name: 'Operator BP Belitung II',
    role: 'Operator',
    brigadeId: 'brg-010',
    province: 'Kepulauan Bangka Belitung',
    email: 'operator.belitung@alsintan.id',
    phone: '085311223352',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'manajer.belitung',
    name: 'Manajer BP Belitung II',
    role: 'Koordinator',
    brigadeId: 'brg-010',
    province: 'Kepulauan Bangka Belitung',
    email: 'manajer.belitung@alsintan.id',
    phone: '085311223353',
    photoUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },

  // BRIGADE BP MUFAKAT GANTUNG (BELITUNG TIMUR)
  {
    id: 'operator.beltim',
    name: 'Operator BP Mufakat Gantung',
    role: 'Operator',
    brigadeId: 'brg-011',
    province: 'Kepulauan Bangka Belitung',
    email: 'operator.beltim@alsintan.id',
    phone: '085311223354',
    photoUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
  {
    id: 'manajer.beltim',
    name: 'Manajer BP Mufakat Gantung',
    role: 'Koordinator',
    brigadeId: 'brg-011',
    province: 'Kepulauan Bangka Belitung',
    email: 'manajer.beltim@alsintan.id',
    phone: '085311223355',
    photoUrl: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150&auto=format&fit=crop&q=80',
    isApproved: true
  },
];

export const mockBrigades: Brigade[] = [
  { id: 'brg-006', name: 'Brigade Rias Makmur Toboali', province: 'Kepulauan Bangka Belitung', regency: 'Bangka Selatan', district: 'Toboali', village: 'Rias', leader: 'Samsul Bahri', phone: '081278945612' },
  { id: 'brg-007', name: 'Brigade Pangkon Sejahtera Tempilang', province: 'Kepulauan Bangka Belitung', regency: 'Bangka Barat', district: 'Tempilang', village: 'Simpang Yul', leader: 'Sulaiman', phone: '081398765412' },
  { id: 'brg-008', name: 'Brigade Kemuja Sejahtera Mendo Barat', province: 'Kepulauan Bangka Belitung', regency: 'Bangka', district: 'Mendo Barat', village: 'Kemuja', leader: 'Hasbullah', phone: '081265432198' },
  { id: 'brg-009', name: 'Brigade Aik Danau Belilik Namang', province: 'Kepulauan Bangka Belitung', regency: 'Bangka Tengah', district: 'Namang', village: 'Belilik', leader: 'Mardiono', phone: '081198765432' },
  { id: 'brg-010', name: 'Brigade BP Belitung II Membalong', province: 'Kepulauan Bangka Belitung', regency: 'Belitung', district: 'Membalong', village: 'Perpat', leader: 'Heru Purwono', phone: '081392810398' },
  { id: 'brg-011', name: 'Brigade BP Mufakat Gantung', province: 'Kepulauan Bangka Belitung', regency: 'Belitung Timur', district: 'Gantung', village: 'Gantung', leader: 'Lizar S', phone: '081293029102' },
];

export const mockAlsintanList: Alsintan[] = [
  { id: 'als-babel-01', code: 'AL-TR4-BABEL-01', name: 'Kubota L5018 Rias', type: 'Traktor Roda 4', brand: 'Kubota', model: 'L5018 (50 HP)', year: 2024, status: 'Aktif', brigadeId: 'brg-006' },
  { id: 'als-babel-02', code: 'AL-TR2-BABEL-01', name: 'Quick G3000 Rias', type: 'Traktor Roda 2', brand: 'Quick', model: 'G3000', year: 2024, status: 'Aktif', brigadeId: 'brg-006' },
  { id: 'als-babel-03', code: 'AL-PMP-BABEL-01', name: 'Honda 3 Inch Rias', type: 'Pompa Air', brand: 'Honda', model: 'WL30XN 3 Inch', year: 2024, status: 'Standby', brigadeId: 'brg-006' },
  
  { id: 'als-babel-04', code: 'AL-CMB-BABEL-01', name: 'Yanmar AW82V Tempilang', type: 'Combine Harvester', brand: 'Yanmar', model: 'AW82V', year: 2022, status: 'Aktif', brigadeId: 'brg-007' },
  { id: 'als-babel-05', code: 'AL-TR4-BABEL-02', name: 'Kubota L5018 Pangkon', type: 'Traktor Roda 4', brand: 'Kubota', model: 'L5018', year: 2022, status: 'Standby', brigadeId: 'brg-007' },
  { id: 'als-babel-06', code: 'AL-PMP-BABEL-02', name: 'Honda 3 Inch Tempilang', type: 'Pompa Air', brand: 'Honda', model: 'WL30XN 3 Inch', year: 2024, status: 'Aktif', brigadeId: 'brg-007' },
  
  { id: 'als-babel-07', code: 'AL-CMB-BABEL-02', name: 'Yanmar AW82V Kemuja', type: 'Combine Harvester', brand: 'Yanmar', model: 'AW82V', year: 2025, status: 'Aktif', brigadeId: 'brg-008' },
  { id: 'als-babel-08', code: 'AL-TR4-BABEL-03', name: 'John Deere 5050D Kemuja', type: 'Traktor Roda 4', brand: 'John Deere', model: '5050D', year: 2025, status: 'Aktif', brigadeId: 'brg-008' },
  { id: 'als-babel-09', code: 'AL-TR2-BABEL-02', name: 'Quick G3000 Kemuja', type: 'Traktor Roda 2', brand: 'Quick', model: 'G3000', year: 2025, status: 'Aktif', brigadeId: 'brg-008' },
  
  { id: 'als-babel-10', code: 'AL-TR4-BABEL-04', name: 'Kubota L5018 Belilik', type: 'Traktor Roda 4', brand: 'Kubota', model: 'L5018', year: 2024, status: 'Aktif', brigadeId: 'brg-009' },
  { id: 'als-babel-11', code: 'AL-TR2-BABEL-03', name: 'Quick G3000 Belilik', type: 'Traktor Roda 2', brand: 'Quick', model: 'G3000', year: 2024, status: 'Standby', brigadeId: 'brg-009' },
  { id: 'als-babel-12', code: 'AL-PMP-BABEL-03', name: 'Honda 3 Inch Koba', type: 'Pompa Air', brand: 'Honda', model: 'WL30XN 3 Inch', year: 2024, status: 'Aktif', brigadeId: 'brg-009' },
  
  { id: 'als-babel-13', code: 'AL-TR4-BABEL-05', name: 'John Deere 5050D Membalong', type: 'Traktor Roda 4', brand: 'John Deere', model: '5050D', year: 2025, status: 'Aktif', brigadeId: 'brg-010' },
  { id: 'als-babel-14', code: 'AL-TR2-BABEL-04', name: 'Quick G3000 Membalong', type: 'Traktor Roda 2', brand: 'Quick', model: 'G3000', year: 2025, status: 'Aktif', brigadeId: 'brg-010' },
  
  { id: 'als-babel-15', code: 'AL-CMB-BABEL-03', name: 'Yanmar AW82V Gantung', type: 'Combine Harvester', brand: 'Yanmar', model: 'AW82V', year: 2024, status: 'Aktif', brigadeId: 'brg-011' },
  { id: 'als-babel-16', code: 'AL-TR2-BABEL-05', name: 'Quick G3000 Gantung', type: 'Traktor Roda 2', brand: 'Quick', model: 'G3000', year: 2025, status: 'Aktif', brigadeId: 'brg-011' },
  ...parseBabelCsvData()
];

export const mockOperators: Operator[] = [
  { id: 'opr-001', name: 'Budi Santoso', phone: '085677889901', brigadeId: 'brg-006', status: 'Bertugas' },
  { id: 'opr-002', name: 'Slamet Riyadi', phone: '085677889902', brigadeId: 'brg-006', status: 'Tersedia' },
  { id: 'opr-003', name: 'Wayan Sudiarta', phone: '085677889903', brigadeId: 'brg-007', status: 'Bertugas' },
  { id: 'opr-004', name: 'Ahmad Fauzi', phone: '085677889904', brigadeId: 'brg-008', status: 'Tersedia' },
  { id: 'opr-005', name: 'Joko Widodo', phone: '085677889905', brigadeId: 'brg-009', status: 'Bertugas' },
  { id: 'opr-006', name: 'Samsul Arifin', phone: '085677889906', brigadeId: 'brg-010', status: 'Tersedia' },
  { id: 'opr-007', name: 'Rian Hidayat', phone: '085677889907', brigadeId: 'brg-011', status: 'Tersedia' },
];

export const mockLaporanList: LaporanHarian[] = [
  {
    id: 'lap-babel-01',
    date: '2026-06-25',
    alsintanId: 'als-babel-01',
    operatorId: 'opr-001',
    brigadeId: 'brg-006',
    activityType: 'Tabur dolomit',
    hoursStart: 10.0,
    hoursEnd: 18.0,
    workingHours: 8.0,
    landArea: 3.0,
    commodity: 'Padi',
    fuelUsed: 40,
    oilUsed: 0,
    revenue: 3000000,
    cost: 1000000,
    notes: 'Olah tanah di hamparan Rias Bangka Selatan menggunakan traktor Kubota.',
    latitude: -3.0123,
    longitude: 106.4521,
    
    // Custom requested fields
    startTime: '07:30',
    endTime: '15:30',
    operatorName: 'Budi Santoso',
    brigadeName: 'Brigade Rias Makmur Toboali',
    kecamatan: 'Toboali',
    kabupaten: 'Bangka Selatan',
    provinsi: 'Kepulauan Bangka Belitung',
    fotoSebelum: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
    fotoSesudah: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'lap-babel-02',
    date: '2026-06-26',
    alsintanId: 'als-babel-04',
    operatorId: 'opr-003',
    brigadeId: 'brg-007',
    activityType: 'Panen',
    hoursStart: 5.0,
    hoursEnd: 11.0,
    workingHours: 6.0,
    landArea: 2.2,
    commodity: 'Padi',
    fuelUsed: 35,
    oilUsed: 0.5,
    revenue: 4400000,
    cost: 1400000,
    notes: 'Panen padi lancar di Tempilang Bangka Barat menggunakan Combine Harvester.',
    latitude: -1.9542,
    longitude: 105.4219,

    // Custom requested fields
    startTime: '08:00',
    endTime: '14:00',
    operatorName: 'Wayan Sudiarta',
    brigadeName: 'Brigade Pangkon Sejahtera Tempilang',
    kecamatan: 'Tempilang',
    kabupaten: 'Bangka Barat',
    provinsi: 'Kepulauan Bangka Belitung',
    fotoSebelum: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    fotoSesudah: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'lap-babel-03',
    date: '2026-06-26',
    alsintanId: 'als-babel-08',
    operatorId: 'opr-004',
    brigadeId: 'brg-008',
    activityType: 'Merapikan pematang sawah',
    hoursStart: 12.0,
    hoursEnd: 20.0,
    workingHours: 8.0,
    landArea: 3.5,
    commodity: 'Padi',
    fuelUsed: 50,
    oilUsed: 1.0,
    revenue: 3500000,
    cost: 1200000,
    notes: 'Pengerjaan traktor roda 4 John Deere di Mendo Barat Bangka.',
    latitude: -2.1321,
    longitude: 106.0129,

    // Custom requested fields
    startTime: '07:00',
    endTime: '15:00',
    operatorName: 'Ahmad Fauzi',
    brigadeName: 'Brigade Kemuja Sejahtera Mendo Barat',
    kecamatan: 'Mendo Barat',
    kabupaten: 'Bangka',
    provinsi: 'Kepulauan Bangka Belitung',
    fotoSebelum: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&auto=format&fit=crop&q=80',
    fotoSesudah: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80'
  }
];

export const mockRiwayatService: RiwayatService[] = [
  { id: 'srv-001', alsintanId: 'als-babel-01', date: '2026-06-10', serviceType: 'Rutin', cost: 750000, mechanic: 'Bengkel Tani Toboali', partsReplaced: ['Filter Oli', 'Oli Mesin'], notes: 'Ganti oli rutin setelah 50 jam kerja.' },
];

export const mockRiwayatKerusakan: RiwayatKerusakan[] = [
  { id: 'krk-001', alsintanId: 'als-babel-04', date: '2026-06-22', description: 'Gardan belakang bunyi kasar dan slip transmisi.', severity: 'Berat', status: 'Dalam Perbaikan', reportedBy: 'Operator Wayan' },
];

export const mockAuditTrail: AuditTrail[] = [
  { id: 'aud-001', timestamp: '2026-06-26T10:15:00Z', username: 'Super Admin Pusat', role: 'Super Admin', action: 'Login Berhasil', module: 'Auth', ipAddress: '182.253.14.98' },
  { id: 'aud-002', timestamp: '2026-06-26T10:22:15Z', username: 'Samsul Bahri', role: 'Koordinator', action: 'Input Laporan Kerja lap-babel-01', module: 'Laporan Harian', ipAddress: '114.79.12.24' },
  { id: 'aud-003', timestamp: '2026-06-26T10:30:45Z', username: 'Budi Santoso', role: 'Operator', action: 'Update Status Operator opr-001 -> Bertugas', module: 'Operator', ipAddress: '114.79.12.33' },
];

export const mockTargetRealisasi: TargetRealisasi[] = [
  { id: 'tr-006', province: 'Kepulauan Bangka Belitung', targetArea: 6000, realizedArea: 4850, targetHours: 14000, realizedHours: 11800 },
];
