export type Role = 'Operator' | 'Koordinator' | 'Provinsi' | 'Super Admin' | 'Kabupaten';

export interface User {
  id: string;
  name: string;
  role: Role;
  brigadeId: string;
  province: string;
  regency?: string; // Kabupaten/Regency for Admin Kabupaten
  email?: string;
  phone?: string;
  photoUrl?: string;
  isApproved?: boolean;
  password?: string;
}

export interface Brigade {
  id: string;
  name: string;
  province: string;
  regency: string; // Kabupaten
  district: string; // Kecamatan
  village: string; // Desa
  leader: string;
  phone: string;
}

export interface Alsintan {
  id: string;
  code: string; // e.g., AL-TRK-001
  name: string;
  type: 'Traktor Roda 2' | 'Traktor Roda 4' | 'Combine Harvester' | 'Pompa Air' | 'Rice Transplanter';
  brand: string; // Merk
  model: string;
  year: number;
  status: 'Aktif' | 'Service' | 'Rusak' | 'Standby';
  brigadeId: string;
}

export interface Operator {
  id: string;
  name: string;
  phone: string;
  brigadeId: string;
  status: 'Tersedia' | 'Bertugas' | 'Cuti';
}

export interface LaporanHarian {
  id: string;
  date: string;
  alsintanId: string;
  operatorId: string;
  brigadeId: string;
  activityType: 'Tabur dolomit' | 'Irigasi/drainase' | 'Merapikan pematang sawah' | 'Angkut Alsintan/saprodi' | 'Tanam' | 'Spraying (pestida, pupuk cair, herbisida)' | 'Tabur (benih, pupuk)' | 'Tanam pindah/benih' | 'Panen';
  hoursStart: number;
  hoursEnd: number;
  workingHours: number; // calculated: hoursEnd - hoursStart
  landArea: number; // Luas Lahan (Ha)
  commodity: 'Padi' | 'Jagung' | 'Kedelai';
  fuelUsed: number; // BBM (Liter)
  oilUsed: number; // Oli (Liter)
  revenue: number; // Pendapatan (Rp)
  cost: number; // Biaya Operasional (Rp)
  notes: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  
  // Specific machine report fields requested by user
  startTime?: string;      // Mulai jam kerja, e.g. "07:30"
  endTime?: string;        // Selesai jam kerja, e.g. "15:30"
  operatorName?: string;   // Nama operator
  brigadeName?: string;    // Nama brigade pangan
  kecamatan?: string;      // Kecamatan
  kabupaten?: string;      // Kabupaten
  provinsi?: string;       // Provinsi
  fotoSebelum?: string;    // Foto sebelum dikerjakan
  fotoSesudah?: string;    // Foto sesudah dikerjakan
  
  // New operational fields
  ownerName?: string;
  location?: string;
  landType?: string;
  harvestAmount?: number;
  harvestUnit?: 'karung' | 'kg' | 'kuintal';

  // Approval fields
  isApproved?: boolean;
  approvedBy?: string;
}

export interface RiwayatService {
  id: string;
  alsintanId: string;
  date: string;
  serviceType: 'Rutin' | 'Perbaikan';
  cost: number;
  mechanic: string;
  partsReplaced: string[];
  notes: string;
  foto?: string;
}

export interface RiwayatKerusakan {
  id: string;
  alsintanId: string;
  date: string;
  description: string;
  severity: 'Ringan' | 'Sedang' | 'Berat';
  status: 'Dilaporkan' | 'Dalam Perbaikan' | 'Selesai';
  reportedBy: string;
  foto?: string;
}

export interface AuditTrail {
  id: string;
  timestamp: string;
  username: string;
  role: Role;
  action: string;
  module: string;
  ipAddress: string;
}

export interface TargetRealisasi {
  id: string;
  province: string;
  targetArea: number; // Target Luas Layanan (Ha)
  realizedArea: number; // Realisasi Luas Layanan (Ha)
  targetHours: number; // Target Jam Kerja
  realizedHours: number; // Realisasi Jam Kerja
}

export interface ServiceSchedule {
  id: string;
  alsintanId: string;
  dueDate: string;
  targetHM: number;
  type: 'Rutin' | 'Mayor';
  status: 'Pending' | 'Selesai' | 'Terlewat';
}

export interface SystemNotification {
  id: string;
  type: 'kerusakan' | 'servis_terlewat';
  title: string;
  message: string;
  date: string;
  severity: 'Ringan' | 'Sedang' | 'Berat' | 'Penting';
  unitId: string;
  unitName: string;
  unitCode: string;
  refId: string;
}

