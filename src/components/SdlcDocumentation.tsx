import React, { useState } from 'react';
import {
  BookOpen,
  RefreshCw,
  FileText,
  Share2,
  Database,
  Shield,
  Cpu,
  Play,
  Settings,
  Terminal,
  CheckCircle,
  Calendar,
  MapPin,
  Activity,
  AlertCircle,
  ArrowRight,
  Clock,
  Users,
  Check,
  X,
  ShieldAlert,
  Clipboard,
  AlertTriangle,
  Flame,
  TrendingUp,
  Sliders,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function SdlcDocumentation() {
  const [activeTab, setActiveTab] = useState<'analisis' | 'bpmn' | 'requirements' | 'usecase' | 'erd' | 'api' | 'security' | 'deploy'>('analisis');
  const [selectedBpmPhase, setSelectedBpmPhase] = useState<'all' | 'penjadwalan' | 'operasional' | 'pelaporan' | 'monitoring'>('all');
  const [selectedBpmNode, setSelectedBpmNode] = useState<string | null>('node-1');
  const [simStep, setSimStep] = useState<number>(0);
  const [showSimInfo, setShowSimInfo] = useState<boolean>(true);
  const bpmnNodes = [
    {
      id: 'node-1',
      phase: 'penjadwalan',
      lane: 'pusat',
      title: 'Menetapkan Target & Alokasi Kuota',
      icon: TrendingUp,
      desc: 'Kementerian Pertanian dan Dinas Pertanian Provinsi merumuskan sasaran target Luas Layanan Pertanian (Ha) untuk setiap wilayah kabupaten (Brigade) berdasarkan potensi Masa Tanam (MT) setempat.',
      inputs: ['Data Luas Lahan Potensial', 'Target Ketahanan Pangan Nasional', 'Stok Unit Alsintan Aktif'],
      outputs: ['Target Alokasi Brigade (Surat Keputusan Target Ha/MT)'],
      rules: ['Target akumulatif brigade tidak boleh melebihi kapasitas operasional unit alsintan di provinsi tersebut.'],
      kpis: ['Target Realisasi Luas Layanan Pangan (%)']
    },
    {
      id: 'node-2',
      phase: 'penjadwalan',
      lane: 'koordinator',
      title: 'Penyusunan Jadwal & Plotting Operator',
      icon: Calendar,
      desc: 'Koordinator Brigade menerjemahkan target wilayah ke dalam penugasan mingguan. Menentukan unit Alsintan mana yang dikerahkan (berdasarkan status "Aktif") dan menugaskan Operator yang tersedia untuk menggarap kelompok tani tertentu.',
      inputs: ['Target SK Kabupaten', 'Daftar Unit Standby', 'Ketersediaan Operator', 'Peta Kelompok Tani Pemesan'],
      outputs: ['Jadwal Tugas Mingguan', 'Surat Perintah Kerja (SPK) Digital'],
      rules: ['Unit yang berstatus "Service" atau "Rusak" tidak boleh masuk dalam penjadwalan.', 'Operator tidak boleh dijadwalkan melampaui 8 jam kerja per hari.'],
      kpis: ['Utilitasi Alsintan (%)', 'Kecepatan Alokasi Tugas']
    },
    {
      id: 'node-3',
      phase: 'operasional',
      lane: 'operator',
      title: 'Inspeksi Pra-Operasional & HM Start',
      icon: Clipboard,
      desc: 'Sebelum berangkat ke sawah, Operator melakukan inspeksi visual mesin (cek bahan bakar, oli, sistem hidrolik, ban/crawler) dan menginput angka Hour Meter (HM) awal mesin serta volume level BBM ke dalam aplikasi.',
      inputs: ['Kondisi fisik unit', 'Angka Hour Meter fisik mesin', 'Sisa BBM fisik di tangki'],
      outputs: ['Log Checksheet Pra-Operasional', 'Angka Hour Meter Awal (HM Start)', 'Level BBM Awal'],
      rules: ['HM Start harus sama dengan HM End dari laporan terakhir untuk unit yang bersangkutan (mencegah manipulasi kilometer/jam mesin di luar kerja).'],
      kpis: ['Kesiapan Operasional Alat (Availability - %)']
    },
    {
      id: 'node-4',
      phase: 'operasional',
      lane: 'operator',
      title: 'Eksekusi Garap Lahan Pertanian',
      icon: Cpu,
      desc: 'Operator memobilisasi mesin ke lokasi sawah kelompok tani dan melakukan pengerjaan lahan (membajak dengan traktor roda 4, menanam dengan transplanter, atau memanen dengan combine harvester).',
      inputs: ['Akses Lahan Kelompok Tani', 'Bahan Bakar Mesin'],
      outputs: ['Lahan Tergarap Fisik'],
      rules: ['Mesin hanya boleh dioperasikan di dalam area kerja rill (koordinat sawah penerima bantuan).'],
      kpis: ['Produktivitas Kerja Lapangan (Ha/Hari)']
    },
    {
      id: 'node-5',
      phase: 'pelaporan',
      lane: 'operator',
      title: 'Pencatatan Jam Akhir & Luas Lahan',
      icon: Clock,
      desc: 'Setelah pekerjaan harian selesai, Operator mematikan mesin, mencatat jam akhir Hour Meter (HM End), taksiran sisa BBM, komoditas yang dikerjakan, dan luas lahan rill (Ha) yang berhasil digarap pada hari itu.',
      inputs: ['Angka Hour Meter Akhir pada mesin', 'Luas lahan rill hasil ukur lapangan', 'Jenis komoditas'],
      outputs: ['Draft Laporan Harian (Waktu kerja, jam mesin rill, volume BBM terpakai)'],
      rules: ['HM End wajib lebih besar dari HM Start.', 'Selisih jam kerja (HM End - HM Start) maksimal adalah 12 jam per hari untuk mencegah overheating dan kerusakan mesin.'],
      kpis: ['Jam Kerja Mesin Efektif (Hour Meter Hours)']
    },
    {
      id: 'node-6',
      phase: 'pelaporan',
      lane: 'operator',
      title: 'Pengambilan Foto Hasil & Geo-Tagging GPS',
      icon: MapPin,
      desc: 'Operator mengambil foto kondisi lapangan/Alsintan sebagai bukti fisik hasil kerja. Aplikasi secara otomatis mengambil koordinat garis lintang/bujur (Latitude/Longitude) dan timestamp presisi dari GPS handphone operator.',
      inputs: ['Foto Kamera Smartphone', 'Koordinat Sensor GPS internal perangkat'],
      outputs: ['Foto Bukti Hasil Kerja berformat Metadata Geo-Tagging, Koordinat GPS, Waktu Submit'],
      rules: ['Izin akses GPS perangkat wajib diaktifkan.', 'Foto tidak boleh diunggah dari galeri (harus diambil langsung dari kamera aplikasi secara real-time) untuk menangkal manipulasi foto lama.'],
      kpis: ['Tingkat Keakuratan Data Laporan (Anti-Fraud Rate)']
    },
    {
      id: 'node-7',
      phase: 'pelaporan',
      lane: 'koordinator',
      title: 'Verifikasi & Rekonsiliasi Lapangan',
      icon: Shield,
      desc: 'Koordinator memeriksa Laporan Harian yang dikirim operator. Koordinator memverifikasi kesesuaian koordinat GPS dengan wilayah kerja brigade, rasio bahan bakar per hektar, dan durasi jam kerja rill mesin.',
      inputs: ['Draft Laporan Harian Operator', 'Foto Geo-Tagged', 'Data historis BBM mesin'],
      outputs: ['Status Laporan: "Approved" (Disetujui) atau "Rejected" (Ditolak/Kembali untuk Revisi)'],
      rules: ['Jika koordinat GPS berada di luar wilayah administrasi brigade (> 10 km dari koordinat rujukan) atau jika rasio konsumsi BBM di luar ambang batas wajar (misal traktor roda 4 > 25 Liter/Ha), laporan wajib ditolak dan dikembalikan ke operator untuk diklarifikasi.'],
      kpis: ['Akurasi Penyerapan Anggaran BBM', 'Kecepatan Verifikasi Laporan']
    },
    {
      id: 'node-8',
      phase: 'monitoring',
      lane: 'sistem',
      title: 'Automated Metric Engine (Kalkulasi Efisiensi)',
      icon: Activity,
      desc: 'Setelah laporan berstatus "Approved", engine sistem secara otomatis memproses data: menghitung efisiensi bahan bakar (Liter/Ha), biaya per hektar, laju produktivitas kerja (Ha/Jam), serta mengakumulasikan total realisasi luas lahan nasional.',
      inputs: ['Laporan Harian berstatus Approved', 'Tarif Sewa/Ha', 'Harga BBM per Liter'],
      outputs: ['Metrik Efisiensi Terkalkulasi', 'Update Agregat Realisasi Luas Layanan Pangan Nasional & Provinsi'],
      rules: ['Algoritma perhitungan otomatis dipicu secara real-time (event-driven) setelah mutasi status laporan menjadi "Approved".'],
      kpis: ['Efisiensi BBM (Liter/Ha)', 'Biaya Kerja Rata-Rata (Rp/Ha)']
    },
    {
      id: 'node-9',
      phase: 'monitoring',
      lane: 'sistem',
      title: 'Sistem Alarm Pemeliharaan Preventif (50 HM)',
      icon: AlertTriangle,
      desc: 'Sistem melacak total jam operasi kumulatif (Hour Meter) tiap unit Alsintan. Jika total jam kerja mencapai kelipatan 50 jam (50 HM, 100 HM, 150 HM, dsb), sistem otomatis menghasilkan alarm notifikasi peringatan service preventif (ganti oli, filter bbm, dsb) demi mencegah kerusakan berat.',
      inputs: ['Total Jam Operasi Kumulatif unit Alsintan (Sum of Hours Worked)'],
      outputs: ['Alarm Peringatan Service Preventif (Notifikasi WhatsApp/Sistem ke Koordinator & Operator)'],
      rules: ['Trigger otomatis saat total_hm_operasi MODULO 50 == 0 atau melewati ambang batas toleransi +5 jam.'],
      kpis: ['Rasio Pemeliharaan Preventif vs Perbaikan Darurat (Preventive Maintenance Ratio)', 'Umur Ekonomis Unit']
    },
    {
      id: 'node-10',
      phase: 'monitoring',
      lane: 'koordinator',
      title: 'Perencanaan Service & Log Kerusakan',
      icon: Settings,
      desc: 'Berdasarkan alarm preventif dari sistem atau laporan kerusakan darurat dari operator, Koordinator Brigade memesan mekanik/suku cadang dan mencatat log perawatan serta biaya service ke dalam menu Riwayat Service / Kerusakan.',
      inputs: ['Alarm Preventif Sistem', 'Tiket Pengaduan Kerusakan Operator', 'Estimasi Biaya Perbaikan'],
      outputs: ['Log Riwayat Perawatan Mesin Terdaftar, Biaya Service Terakumulasi, Update Status Unit (dari "Aktif" -> "Service" -> "Aktif" kembali)'],
      rules: ['Unit yang sedang berstatus "Service" dikunci dalam sistem agar tidak bisa dialokasikan pada jadwal operasional lapangan.'],
      kpis: ['Down-Time Mesin (MTTR - Mean Time To Repair, MTBF - Mean Time Between Failures)']
    },
    {
      id: 'node-11',
      phase: 'monitoring',
      lane: 'pusat',
      title: 'Dashboard Sebaran Spasial & Evaluasi Ketahanan Pangan',
      icon: Terminal,
      desc: 'Dinas Pertanian Provinsi and Pejabat Kementerian (Pusat) memantau peta interaktif sebaran spasial seluruh unit Alsintan dan grafik pencapaian target kerja. Data ini digunakan untuk mengevaluasi efektivitas mekanisasi pertanian dan merencanakan kebijakan redistribusi alat pertanian guna mempercepat swasembada pangan.',
      inputs: ['Seluruh Transaksi Laporan Harian Terpilih, Data Log Koordinat GPS Alsintan, Target Realisasi Provinsi'],
      outputs: ['Peta Sebaran Alsintan Nasional, Laporan Kinerja Eksekutif Berformat PDF/Excel, Keputusan Strategis Redistribusi Alsintan'],
      rules: ['Data peta sebaran spasial menggunakan clustering koordinat rill 24 jam terakhir untuk merepresentasikan pergerakan fisik alsintan di lapangan.'],
      kpis: ['Persentase Ketercapaian Target Luas Layanan Nasional (%)', 'Indeks Produktivitas Mekanisasi Pangan']
    }
  ];

  const simSteps = [
    {
      phase: 'PENJADWALAN',
      title: 'Perilisan Target Nasional',
      narrative: 'Kementerian Pertanian (Pusat) merilis Keputusan Target Luas Layanan sebesar 500 Hektar untuk musim tanam ini bagi Brigade Kepulauan Bangka Belitung. Data ini masuk sebagai acuan di database.',
      baCommentary: 'Target ini disimpan di tabel `targets_realisasi` dan menjadi dasar perhitungan performa (%).',
      dataState: {
        laporan_id: 'N/A',
        operator_name: 'Belum Ditugaskan',
        alsintan_code: 'Belum Ditugaskan',
        laporan_status: 'NOT_CREATED',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 0.0,
        realisasi_percentage: '0%'
      }
    },
    {
      phase: 'PENJADWALAN',
      title: 'Penyusunan Jadwal & SPK',
      narrative: 'Koordinator Brigade Babel di Pangkalpinang menjadwalkan pengerjaan lahan Kelompok Tani Tunas Makmur menggunakan traktor TR-01 roda-4, dan menugaskan Operator Budi Santoso untuk menggarap lahan seluas 1.2 Ha mulai besok.',
      baCommentary: 'Sistem membuat record baru di tabel jadwal dan mengirimkan notifikasi penugasan digital ke handphone Operator Budi.',
      dataState: {
        laporan_id: 'lap-202606-001',
        laporan_date: '2026-06-29',
        operator_name: 'Budi Santoso',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        hours_start: 0.0,
        hours_end: 0.0,
        land_area_ha: 1.2,
        laporan_status: 'SCHEDULED',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 0.0,
        realisasi_percentage: '0%'
      }
    },
    {
      phase: 'OPERASIONAL',
      title: 'Inspeksi & HM Start',
      narrative: 'Pagi hari di pangkalan, Budi melakukan pengecekan visual (oli, air radiator, aki) traktor TR-01. Budi mencatat angka Hour Meter awal fisik mesin (120.0) dan level tangki BBM (40 Liter), lalu men-submit form persiapan.',
      baCommentary: 'Validasi sistem memeriksa kecocokan HM Start dengan laporan kerja terakhir. Karena sama, sistem meloloskan pengisian draf.',
      dataState: {
        laporan_id: 'lap-202606-001',
        laporan_date: '2026-06-29',
        operator_name: 'Budi Santoso',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        hours_start: 120.0,
        hours_end: 0.0,
        land_area_ha: 1.2,
        fuel_start_liters: 40.0,
        laporan_status: 'PREPARATION_SUBMITTED',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 0.0,
        realisasi_percentage: '0%'
      }
    },
    {
      phase: 'OPERASIONAL',
      title: 'Eksekusi Olah Lahan',
      narrative: 'Budi memobilisasi traktor TR-01 ke petak sawah Kelompok Tani Tunas Makmur dan melaksanakan pengolahan tanah (membajak sawah). Traktor bekerja sepanjang hari dalam kondisi prima.',
      baCommentary: 'Selama mesin menyala, nilai Hour Meter terus berputar secara mekanis seiring putaran poros mesin.',
      dataState: {
        laporan_id: 'lap-202606-001',
        laporan_date: '2026-06-29',
        operator_name: 'Budi Santoso',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        hours_start: 120.0,
        hours_end: 0.0,
        land_area_ha: 1.2,
        fuel_start_liters: 40.0,
        laporan_status: 'IN_OPERATION',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 0.0,
        realisasi_percentage: '0%'
      }
    },
    {
      phase: 'PELAPORAN',
      title: 'Pencatatan HM End & Hasil',
      narrative: 'Sore hari, Budi memarkir traktor. Budi mencatat jam akhir Hour Meter mesin TR-01 menunjukkan angka 126.5 (berarti traktor menyala selama 6.5 jam). Budi menginput sisa BBM di tangki sebanyak 15 Liter, luas garapan rill 1.2 Ha, dan komoditas padi.',
      baCommentary: 'Validasi Business Rules: HM End (126.5) > HM Start (120.0). Selisih 6.5 jam berada di bawah batas maksimal harian 12 jam. Lulus validasi awal.',
      dataState: {
        laporan_id: 'lap-202606-001',
        laporan_date: '2026-06-29',
        operator_name: 'Budi Santoso',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        hours_start: 120.0,
        hours_end: 126.5,
        hours_worked: 6.5,
        land_area_ha: 1.2,
        fuel_start_liters: 40.0,
        fuel_end_liters: 15.0,
        fuel_used_liters: 25.0,
        komoditas: 'Padi',
        laporan_status: 'DRAFT_COMPLETED',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 0.0,
        realisasi_percentage: '0%'
      }
    },
    {
      phase: 'PELAPORAN',
      title: 'Pengambilan Foto & GPS',
      narrative: 'Budi mengambil foto traktor TR-01 berlatar belakang sawah yang sudah dibajak. Sistem mendeteksi koordinat GPS rill dari perangkat: Latitude -2.1345, Longitude 106.1124, lalu Budi mengirimkan (submit) laporan tersebut.',
      baCommentary: 'Sistem mengambil metadata GPS secara native untuk mencegah pemalsuan lokasi kerja (anti-fraud). Status laporan berubah menjadi "Submitted".',
      dataState: {
        laporan_id: 'lap-202606-001',
        laporan_date: '2026-06-29',
        operator_name: 'Budi Santoso',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        hours_start: 120.0,
        hours_end: 126.5,
        hours_worked: 6.5,
        land_area_ha: 1.2,
        fuel_used_liters: 25.0,
        komoditas: 'Padi',
        latitude: -2.1345,
        longitude: 106.1124,
        photo_url: 'https://images.unsplash.com/...',
        laporan_status: 'SUBMITTED',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 0.0,
        realisasi_percentage: '0%'
      }
    },
    {
      phase: 'PELAPORAN',
      title: 'Verifikasi Koordinator',
      narrative: 'Koordinator memeriksa laporan Budi melalui aplikasi. Ia mengonfirmasi koordinat GPS berada dalam geo-fence Kelompok Tani Tunas Makmur, mencocokkan foto sawah asli, serta memeriksa rasio BBM: 25 Liter / 1.2 Ha = 20.8 Liter/Ha (di bawah ambang batas boros 25L/Ha). Koordinator memberikan persetujuan (Approve).',
      baCommentary: 'Persetujuan memicu sistem untuk mengunci data laporan (immutable) dan memulai agregasi data otomatis.',
      dataState: {
        laporan_id: 'lap-202606-001',
        laporan_date: '2026-06-29',
        operator_name: 'Budi Santoso',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        hours_start: 120.0,
        hours_end: 126.5,
        hours_worked: 6.5,
        land_area_ha: 1.2,
        fuel_used_liters: 25.0,
        komoditas: 'Padi',
        latitude: -2.1345,
        longitude: 106.1124,
        laporan_status: 'APPROVED',
        verified_by: 'Koordinator Babel',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 1.2,
        realisasi_percentage: '0.24%'
      }
    },
    {
      phase: 'MONITORING',
      title: 'Kalkulasi Otomatis KPI',
      narrative: 'Sistem ALKINTAN memproses data laporan rill. Menghitung efisiensi BBM (20.8 L/Ha), produktivitas (1.2 Ha / 6.5 Jam = 0.18 Ha/Jam), dan menambahkan 1.2 Hektar ke realisasi kumulatif nasional. Jam operasional mesin TR-01 di-update menjadi 126.5 jam kerja.',
      baCommentary: 'Proses ini berjalan di server menggunakan pemicu event (event-driven database trigger) setelah status laporan berganti menjadi APPROVED.',
      dataState: {
        laporan_id: 'lap-202606-001',
        operator_name: 'Budi Santoso',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        hours_worked: 6.5,
        land_area_ha: 1.2,
        fuel_used_liters: 25.0,
        calculated_fuel_efficiency_l_ha: 20.83,
        calculated_productivity_ha_hour: 0.18,
        laporan_status: 'KPI_CALCULATED',
        alsintan_total_hours_kumulatif: 126.5,
        target_ha: 500.0,
        realisasi_ha_kumulatif: 1.2,
        realisasi_percentage: '0.24%'
      }
    },
    {
      phase: 'MONITORING',
      title: 'Sistem Alarm Perawatan',
      narrative: 'Sistem mendeteksi jam operasi kumulatif traktor TR-01 kini bernilai 126.5 HM. Kelipatan 50 HM terdekat belum terlampaui sejak service terakhir. Sistem menetapkan unit berstatus aman ("Aktif"), tidak menghasilkan alarm perawatan preventif.',
      baCommentary: 'Sistem menggunakan algoritma scheduler preventif: jika `total_hm % 50 == 0`, alarm ganti oli otomatis dikirim ke Koordinator.',
      dataState: {
        laporan_id: 'lap-202606-001',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        alsintan_total_hours_kumulatif: 126.5,
        last_service_hm: 100.0,
        next_service_hm_trigger: 150.0,
        maintenance_alert: 'NONE',
        alsintan_status_db: 'Aktif',
        laporan_status: 'MONITORED_AND_SAFE',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 1.2,
        realisasi_percentage: '0.24%'
      }
    },
    {
      phase: 'MONITORING',
      title: 'Update Dashboard & Peta',
      narrative: 'Data yang telah divalidasi dan dikalkulasi secara instan diperbarui pada dashboard Menteri Pertanian (Pusat) dan Dinas Provinsi. Marker koordinat GPS TR-01 muncul di peta sebaran rill wilayah Kepulauan Bangka Belitung, dan total realisasi wilayah bertambah menjadi 1.2 Ha.',
      baCommentary: 'Data real-time disajikan dalam peta GIS Leaflet dan grafik Recharts untuk mendukung keputusan taktis ketahanan pangan pemerintah.',
      dataState: {
        laporan_id: 'lap-202606-001',
        alsintan_code: 'TR-01 (Traktor Roda 4)',
        latitude: -2.1345,
        longitude: 106.1124,
        gis_map_marker: 'UPDATED',
        chart_data_realtime: 'SYNCHRONIZED',
        laporan_status: 'FLOW_COMPLETED',
        target_ha: 500.0,
        realisasi_ha_kumulatif: 1.2,
        realisasi_percentage: '0.24%',
        swasembada_index_score: '+0.02'
      }
    }
  ];

  const renderBpmNode = (nodeId: string) => {
    const node = bpmnNodes.find(n => n.id === nodeId);
    if (!node) return null;

    const NodeIcon = node.icon;
    const isSelected = selectedBpmNode === node.id;
    const isFilteredOut = selectedBpmPhase !== 'all' && node.phase !== selectedBpmPhase;

    return (
      <button
        key={node.id}
        onClick={() => setSelectedBpmNode(node.id)}
        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer relative ${
          isSelected
            ? 'bg-slate-850 border-emerald-500 text-white shadow-md ring-2 ring-emerald-500/30 scale-[1.01] z-10'
            : isFilteredOut
            ? 'bg-slate-900/10 border-slate-950 text-slate-700 opacity-20'
            : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
        }`}
      >
        <div className="flex items-start gap-2">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            <NodeIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[11px] leading-snug tracking-tight font-sans truncate">
              {node.title}
            </p>
            <span className="text-[8px] font-mono block text-slate-500 mt-0.5 uppercase tracking-wider">
              {node.phase}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="absolute right-1.5 top-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </button>
    );
  };


  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 text-white py-8 px-6 shadow-md border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400 text-emerald-950 font-mono text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Dokumentasi Rekayasa Perangkat Lunak
              </span>
              <span className="bg-teal-500 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-full">
                Enterprise Spec v1.2
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Sistem Informasi Laporan Kinerja Alsintan - Cetak Biru Sistem & Spesifikasi Teknis</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Dokumen resmi analisis kebutuhan, proses bisnis, rancangan database, arsitektur keamanan, dan panduan operasional.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-200">Peran Aktif:</span>
            <div className="bg-white/10 px-3 py-1.5 rounded border border-white/20 font-medium text-xs text-white">
              👑 System Analyst & Software Architect Team
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {[
            { id: 'analisis', label: 'Tahap 1: Kebutuhan', icon: BookOpen },
            { id: 'bpmn', label: 'Tahap 2: Alur Bisnis', icon: RefreshCw },
            { id: 'requirements', label: 'Tahap 3: Spesifikasi SRS', icon: FileText },
            { id: 'usecase', label: 'Tahap 4: Use Case', icon: Share2 },
            { id: 'erd', label: 'Tahap 5-6: DB & ERD', icon: Database },
            { id: 'api', label: 'Tahap 10: API Spec', icon: Terminal },
            { id: 'security', label: 'Tahap 15: Keamanan', icon: Shield },
            { id: 'deploy', label: 'Tahap 17: Deployment', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'analisis' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-600 pl-3 mb-4">Tahap 1: Analisis Kebutuhan Sistem</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Sistem Laporan Kinerja Alat Mesin Pertanian (ALSINTAN) dirancang untuk memantau, mendata, dan menganalisis utilisasi alat mesin pertanian (Alsintan) yang dikelola oleh Brigade Pangan Nasional secara real-time. Hal ini bertujuan untuk mengoptimalisasi investasi alsintan pemerintah dan meningkatkan ketahanan pangan nasional melalui mekanisasi pertanian modern.
              </p>

              <h3 className="text-sm font-bold text-slate-900 mt-6 mb-3">A. Ruang Lingkup Sistem</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Fungsionalitas Inti</h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Registrasi dan Manajemen Unit Alsintan (Traktor, Harvester, Pompa, Transplanter).</li>
                    <li>Registrasi Operator dan Manajemen Brigade per Wilayah.</li>
                    <li>Pencatatan aktivitas harian kerja (Jam kerja awal/akhir, komoditas, luas lahan).</li>
                    <li>Pemantauan konsumsi BBM dan biaya perawatan/service.</li>
                    <li>Perhitungan performa otomatis (Efisiensi, MTTR, MTBF, Availability).</li>
                  </ul>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Batasan Sistem (Constraint)</h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Sistem harus responsif (Mobile First) untuk memudahkan operator melakukan input langsung dari sawah/lapangan.</li>
                    <li>Dukungan offline-first (pencatatan lokal sebelum sinkronisasi) dikarenakan jaringan internet di area pertanian tidak menentu.</li>
                    <li>Pencatatan GPS wajib dilakukan pada saat laporan kerja disubmit sebagai bukti fisik pekerjaan (anti-fraud).</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-6 mb-3">B. Identifikasi Stakeholders & Hak Akses</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3 border border-slate-200">Peran (Role)</th>
                      <th className="p-3 border border-slate-200">Deskripsi & Perilaku Pengguna</th>
                      <th className="p-3 border border-slate-200">Kebutuhan Utama Fungsional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-emerald-700 border border-slate-200">Operator Lapangan</td>
                      <td className="p-3 border border-slate-200">Mengendarai alsintan langsung di sawah, sering mengalami kendala sinyal internet.</td>
                      <td className="p-3 border border-slate-200">Pencatatan laporan harian kerja, input pengisian BBM/Oli, laporkan kerusakan unit.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-700 border border-slate-200">Koordinator Brigade</td>
                      <td className="p-3 border border-slate-200">Penanggung jawab alsintan & operator di satu kabupaten/brigade pangan.</td>
                      <td className="p-3 border border-slate-200">Approval laporan kerja, atur jadwal perawatan alsintan, manajemen operator lokal, rekap bulanan biaya operasional.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-700 border border-slate-200">Admin Provinsi</td>
                      <td className="p-3 border border-slate-200">Dinas Pertanian Provinsi, memonitor sebaran di seluruh wilayah kabupaten provinsinya.</td>
                      <td className="p-3 border border-slate-200">Dashboard kinerja provinsi, analisis luas layanan kumulatif, redistribusi alsintan antar brigade.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-700 border border-slate-200">Pusat / Kementerian</td>
                      <td className="p-3 border border-slate-200">Menteri Pertanian & Dirjen Prasarana Sarana Pertanian (PSP).</td>
                      <td className="p-3 border border-slate-200">Dashboard monitoring nasional, monitoring sebaran geografis, persentase ketercapaian target pangan, export laporan tahunan.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-700 border border-slate-200">Super Admin</td>
                      <td className="p-3 border border-slate-200">Tim IT Pengembang / DevOps Administrator.</td>
                      <td className="p-3 border border-slate-200">Konfigurasi hak akses RBAC, log audit keamanan, manajemen pengguna global, backup data berkala.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bpmn' && (
          <div className="space-y-6 animate-fade-in text-slate-800">
            {/* Phase Selector Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pilih Fase Alur Bisnis (BPMN Filter)</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Tampilkan Semua', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200' },
                    { id: 'penjadwalan', label: 'I. Penjadwalan & Alokasi', color: 'bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200' },
                    { id: 'operasional', label: 'II. Operasional Lahan', color: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200' },
                    { id: 'pelaporan', label: 'III. Pelaporan Harian', color: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200' },
                    { id: 'monitoring', label: 'IV. Monitoring & Perawatan', color: 'bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => {
                        setSelectedBpmPhase(btn.id as any);
                        // Auto-select first node of the phase if filter is narrowed
                        if (btn.id !== 'all') {
                          const firstNode = bpmnNodes.find(n => n.phase === btn.id);
                          if (firstNode) setSelectedBpmNode(firstNode.id);
                        }
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        selectedBpmPhase === btn.id
                          ? 'ring-2 ring-emerald-600/50 shadow-sm font-extrabold bg-emerald-600 border-emerald-600 text-white'
                          : btn.color
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Metodologi Analisis:</span>
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">BPMN 2.0 Standard Specification</span>
              </div>
            </div>

            {/* Main Visualizer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Swimlane Board (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                  <div className="bg-slate-800 border-b border-slate-700/60 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
                      <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
                        Peta Swimlane Proses Bisnis ALKINTAN
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Klik pada kotak tugas untuk melihat spesifikasi detail BA
                    </span>
                  </div>

                  {/* Swimlane Container */}
                  <div className="p-4 overflow-x-auto">
                    <div className="min-w-[760px] space-y-4">
                      {/* Lane 1: PUSAT & PROVINSI */}
                      <div className="flex border border-slate-800/40 rounded-xl overflow-hidden bg-slate-950/20">
                        {/* Lane Label */}
                        <div className="w-24 shrink-0 bg-blue-950/80 border-r border-slate-800 flex flex-col items-center justify-center p-3 text-center">
                          <Users className="w-5 h-5 text-blue-400 mb-1" />
                          <span className="text-[10px] font-extrabold text-blue-200 tracking-wider uppercase font-mono leading-tight">
                            Pusat &amp; Provinsi
                          </span>
                        </div>
                        {/* Lane Content Grid */}
                        <div className="flex-1 p-3 grid grid-cols-4 gap-3">
                          {/* Phase 1: Penjadwalan */}
                          <div className="space-y-2">
                            {renderBpmNode('node-1')}
                          </div>
                          {/* Phase 2: Operasional */}
                          <div className="bg-slate-900/10 rounded-lg border border-dashed border-slate-800/20 min-h-[64px] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                            N/A
                          </div>
                          {/* Phase 3: Pelaporan */}
                          <div className="bg-slate-900/10 rounded-lg border border-dashed border-slate-800/20 min-h-[64px] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                            N/A
                          </div>
                          {/* Phase 4: Monitoring */}
                          <div className="space-y-2">
                            {renderBpmNode('node-11')}
                          </div>
                        </div>
                      </div>

                      {/* Lane 2: KOORDINATOR BRIGADE */}
                      <div className="flex border border-slate-800/40 rounded-xl overflow-hidden bg-slate-950/20">
                        {/* Lane Label */}
                        <div className="w-24 shrink-0 bg-amber-950/80 border-r border-slate-800 flex flex-col items-center justify-center p-3 text-center">
                          <Sliders className="w-5 h-5 text-amber-400 mb-1" />
                          <span className="text-[10px] font-extrabold text-amber-200 tracking-wider uppercase font-mono leading-tight">
                            Koordinator Brigade
                          </span>
                        </div>
                        {/* Lane Content Grid */}
                        <div className="flex-1 p-3 grid grid-cols-4 gap-3">
                          {/* Phase 1: Penjadwalan */}
                          <div className="space-y-2">
                            {renderBpmNode('node-2')}
                          </div>
                          {/* Phase 2: Operasional */}
                          <div className="bg-slate-900/10 rounded-lg border border-dashed border-slate-800/20 min-h-[64px] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                            N/A
                          </div>
                          {/* Phase 3: Pelaporan */}
                          <div className="space-y-2">
                            {renderBpmNode('node-7')}
                          </div>
                          {/* Phase 4: Monitoring */}
                          <div className="space-y-2">
                            {renderBpmNode('node-10')}
                          </div>
                        </div>
                      </div>

                      {/* Lane 3: OPERATOR LAPANGAN */}
                      <div className="flex border border-slate-800/40 rounded-xl overflow-hidden bg-slate-950/20">
                        {/* Lane Label */}
                        <div className="w-24 shrink-0 bg-emerald-950/80 border-r border-slate-800 flex flex-col items-center justify-center p-3 text-center">
                          <Cpu className="w-5 h-5 text-emerald-400 mb-1" />
                          <span className="text-[10px] font-extrabold text-emerald-200 tracking-wider uppercase font-mono leading-tight">
                            Operator Lapangan
                          </span>
                        </div>
                        {/* Lane Content Grid */}
                        <div className="flex-1 p-3 grid grid-cols-4 gap-3">
                          {/* Phase 1: Penjadwalan */}
                          <div className="bg-slate-900/10 rounded-lg border border-dashed border-slate-800/20 min-h-[64px] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                            N/A
                          </div>
                          {/* Phase 2: Operasional */}
                          <div className="space-y-2">
                            {renderBpmNode('node-3')}
                            {renderBpmNode('node-4')}
                          </div>
                          {/* Phase 3: Pelaporan */}
                          <div className="space-y-2">
                            {renderBpmNode('node-5')}
                            {renderBpmNode('node-6')}
                          </div>
                          {/* Phase 4: Monitoring */}
                          <div className="bg-slate-900/10 rounded-lg border border-dashed border-slate-800/20 min-h-[64px] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                            N/A
                          </div>
                        </div>
                      </div>

                      {/* Lane 4: SISTEM ALKINTAN (CLOUD AUTOMATION) */}
                      <div className="flex border border-slate-800/40 rounded-xl overflow-hidden bg-slate-950/20">
                        {/* Lane Label */}
                        <div className="w-24 shrink-0 bg-purple-950/80 border-r border-slate-800 flex flex-col items-center justify-center p-3 text-center">
                          <Terminal className="w-5 h-5 text-purple-400 mb-1" />
                          <span className="text-[10px] font-extrabold text-purple-200 tracking-wider uppercase font-mono leading-tight">
                            Sistem ALKINTAN
                          </span>
                        </div>
                        {/* Lane Content Grid */}
                        <div className="flex-1 p-3 grid grid-cols-4 gap-3">
                          {/* Phase 1: Penjadwalan */}
                          <div className="bg-slate-900/10 rounded-lg border border-dashed border-slate-800/20 min-h-[64px] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                            N/A
                          </div>
                          {/* Phase 2: Operasional */}
                          <div className="bg-slate-900/10 rounded-lg border border-dashed border-slate-800/20 min-h-[64px] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                            N/A
                          </div>
                          {/* Phase 3: Pelaporan */}
                          <div className="bg-slate-900/10 rounded-lg border border-dashed border-slate-800/20 min-h-[64px] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                            N/A
                          </div>
                          {/* Phase 4: Monitoring */}
                          <div className="space-y-2">
                            {renderBpmNode('node-8')}
                            {renderBpmNode('node-9')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Columns Indicators */}
                  <div className="bg-slate-950/50 border-t border-slate-800/60 p-3 grid grid-cols-4 gap-3 text-center font-mono text-[10px] text-slate-400 min-w-[760px]">
                    <div className="flex items-center justify-center gap-1.5 border-r border-slate-800">
                      <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-[9px] font-bold">FASE I</span>
                      PENJADWALAN &amp; ALOKASI
                    </div>
                    <div className="flex items-center justify-center gap-1.5 border-r border-slate-800">
                      <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold">FASE II</span>
                      MOBILISASI &amp; OPERASIONAL
                    </div>
                    <div className="flex items-center justify-center gap-1.5 border-r border-slate-800">
                      <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold">FASE III</span>
                      PELAPORAN &amp; BUKTI GPS
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[9px] font-bold">FASE IV</span>
                      MONITORING &amp; PERAWATAN
                    </div>
                  </div>
                </div>

                {/* BPMN Legend Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 font-mono uppercase tracking-wider">Kunci Notasi BPMN (BPMN Legend Key):</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-50 shrink-0"></span>
                      <span className="text-slate-600 font-medium">Start Event</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-50 shrink-0"></span>
                      <span className="text-slate-600 font-medium">End Event</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-4 rounded bg-slate-800 border border-slate-700 shrink-0"></span>
                      <span className="text-slate-600 font-medium">Task / Proses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rotate-45 border border-slate-800 bg-slate-100 shrink-0"></span>
                      <span className="text-slate-600 font-medium">Gateway (Logika)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border border-dashed border-slate-500 bg-white shrink-0"></span>
                      <span className="text-slate-600 font-medium">Data Object</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 shrink-0">➔</span>
                      <span className="text-slate-600 font-medium">Sequence Flow</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: BA Specs Panel & Detail Viewer (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                {selectedBpmNode ? (
                  (() => {
                    const node = bpmnNodes.find(n => n.id === selectedBpmNode)!;
                    const NodeIcon = node.icon;
                    return (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4 sticky top-[100px]">
                        {/* Header Title */}
                        <div className="border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider font-mono ${
                              node.phase === 'penjadwalan' ? 'bg-sky-100 text-sky-800' :
                              node.phase === 'operasional' ? 'bg-emerald-100 text-emerald-800' :
                              node.phase === 'pelaporan' ? 'bg-amber-100 text-amber-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              Fase: {node.phase}
                            </span>
                            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-700 uppercase px-2 py-0.5 rounded-full tracking-wider font-mono">
                              Lane: {node.lane}
                            </span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-100 shrink-0 mt-0.5">
                              <NodeIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-slate-900 tracking-tight">{node.title}</h3>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">BPM_NODE_ID: {node.id}</p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Deskripsi Langkah BA:</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans">{node.desc}</p>
                        </div>

                        {/* Input Documents / Data Objects */}
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Input (Data / Dokumen):</h4>
                          <div className="flex flex-wrap gap-1">
                            {node.inputs.map((inp, idx) => (
                              <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[9px] px-2 py-1 rounded">
                                📥 {inp}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Output Documents / Data Objects */}
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Output (Data / Hasil):</h4>
                          <div className="flex flex-wrap gap-1">
                            {node.outputs.map((out, idx) => (
                              <span key={idx} className="bg-emerald-50/50 border border-emerald-100 text-emerald-800 font-mono text-[9px] px-2 py-1 rounded">
                                📤 {out}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Business Rules */}
                        <div>
                          <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1 font-mono">Business Rules (Aturan Validasi):</h4>
                          <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                            {node.rules.map((rule, idx) => (
                              <li key={idx} className="leading-normal">{rule}</li>
                            ))}
                          </ul>
                        </div>

                        {/* KPI Affected */}
                        <div>
                          <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 font-mono">Key Performance Indicator (KPI):</h4>
                          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <div className="text-[10px] text-blue-950 font-bold">
                              {node.kpis.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold">Pilih salah satu box proses di sebelah kiri untuk melihat detail spesifikasi fungsional (Input/Output/Aturan).</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Document Flow Simulation Sandbox */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin-slow" />
                    Simulator Alur Laporan &amp; Data Objek (Interactive Sandbox)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simulasikan pergerakan draf laporan kerja harian dan perubahan state data dari lapangan hingga ke dasbor KEMENTAN
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSimStep(0)}
                    className="text-xs font-bold px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    Reset Simulasi
                  </button>
                  <button
                    onClick={() => setSimStep(prev => Math.min(simSteps.length - 1, prev + 1))}
                    disabled={simStep === simSteps.length - 1}
                    className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    Langkah Selanjutnya
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Tracker Horizontal */}
              <div className="flex overflow-x-auto gap-2 pb-4 pt-1 mb-4 border-b border-slate-100/60">
                {simSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSimStep(idx)}
                    className={`flex-1 min-w-[120px] text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      simStep === idx
                        ? 'bg-emerald-50 border-emerald-600 shadow-xs ring-1 ring-emerald-500/10'
                        : idx < simStep
                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-[9px] font-extrabold block text-slate-400 font-mono mb-0.5">
                      LANGKAH {idx + 1}
                    </span>
                    <span className="text-xs font-bold block leading-tight truncate">
                      {step.title}
                    </span>
                  </button>
                ))}
              </div>

              {/* Simulation Workspace: Left Visual Narrative, Right JSON Object */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Visual Narrative Block (7 Cols) */}
                <div className="md:col-span-7 bg-slate-50/70 p-5 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono flex items-center justify-center text-sm">
                      {simStep + 1}
                    </span>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Tahapan Aktif</span>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {simSteps[simStep].phase} - {simSteps[simStep].title}
                      </h4>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium whitespace-pre-line">
                      {simSteps[simStep].narrative}
                    </p>
                  </div>

                  {/* BA Commentary */}
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-[11px] text-amber-900 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Analisis Business Analyst (BA):</span>
                      <p className="mt-0.5 leading-normal">{simSteps[simStep].baCommentary}</p>
                    </div>
                  </div>
                </div>

                {/* Live Data Object Block (5 Cols) */}
                <div className="md:col-span-5 bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 shadow-inner flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        ⚙️ LIVE_DATABASE_STATE.json
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">
                        STATE: {simSteps[simStep].dataState.laporan_status}
                      </span>
                    </div>
                    <pre className="font-mono text-[10px] leading-relaxed text-sky-300 max-h-[220px] overflow-y-auto p-1 bg-slate-950/40 rounded border border-slate-800">
                      {JSON.stringify(simSteps[simStep].dataState, null, 2)}
                    </pre>
                  </div>
                  <div className="border-t border-slate-800 pt-2.5 mt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Database Engine: PostgreSQL v15</span>
                    <span>ORM: Drizzle TS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-600 pl-3 mb-4">Tahap 3: Requirement Analysis (SRS)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Functional Requirements (FR)</h3>
                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">FR-01: Multi-Role Authentication</span>
                      <p className="text-slate-500 mt-1">Sistem harus membedakan hak akses berdasarkan JWT Token yang merepresentasikan 6 peran pengguna.</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">FR-02: Auto-calculate Metrics</span>
                      <p className="text-slate-500 mt-1">Sistem wajib menghitung otomatis konsumsi BBM/Ha, biaya/Ha, produktivitas, MTBF, dan MTTR saat laporan disubmit.</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">FR-03: Offline-First Local Draft</span>
                      <p className="text-slate-500 mt-1">Sistem mampu menyimpan draf laporan secara offline di LocalStorage apabila sambungan internet mati dan menyinkronkannya saat online.</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">FR-04: Export PDF &amp; Excel</span>
                      <p className="text-slate-500 mt-1">Pengguna level Koordinator, Provinsi, dan Pusat dapat mengekspor data yang difilter ke dokumen PDF dan file Excel.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Non-Functional Requirements (NFR)</h3>
                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">NFR-01: Response Time</span>
                      <p className="text-slate-500 mt-1">Setiap request API ke backend harus direspon dalam waktu kurang dari 500ms dalam kondisi beban normal.</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">NFR-02: Security &amp; Protection</span>
                      <p className="text-slate-500 mt-1">Perlindungan terhadap SQL Injection, XSS, CSRF, enkripsi sensitif payload, dan hashing password menggunakan Argon2/BCrypt.</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">NFR-03: Responsive Layout (PWA)</span>
                      <p className="text-slate-500 mt-1">Mendukung resolusi minimum 360px lebar layar (mobile) hingga 4K UHD desktop tanpa kerusakan tata letak UI.</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-bold text-slate-700">NFR-04: High Availability</span>
                      <p className="text-slate-500 mt-1">Sistem di-deploy menggunakan container Docker dengan restart policy untuk menjamin SLA uptime sebesar 99.9%.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-6 mb-3">C. Business Rules</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
                <p>📌 <strong>BR-01:</strong> Jam kerja mesin akhir (Hours End) tidak boleh lebih kecil atau sama dengan jam kerja awal (Hours Start).</p>
                <p>📌 <strong>BR-02:</strong> Validasi koordinat GPS wajib berada di dalam perimeter administrasi Brigade yang terdaftar agar laporan dapat diterima.</p>
                <p>📌 <strong>BR-03:</strong> Peringatan service rutin otomatis dikirimkan ke koordinator jika total jam operasi alsintan kelipatan 50 jam mesin.</p>
                <p>📌 <strong>BR-04:</strong> Hanya Super Admin yang berhak memodifikasi relasi hak akses dan mengaudit audit trail.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usecase' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-600 pl-3 mb-4">Tahap 4: Use Case Diagram & Aktor</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Representasi usecase menunjukkan fungsionalitas utama yang dapat dilakukan oleh tiap aktor:
              </p>

              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Actor 1 */}
                  <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-3">
                      <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono">Aktor</span>
                      Operator Lapangan
                    </div>
                    <ul className="space-y-1.5 text-slate-600 list-disc pl-4 font-medium">
                      <li>Mengisi Laporan Harian Kerja</li>
                      <li>Mengisi Penggunaan BBM &amp; Oli</li>
                      <li>Melaporkan Kerusakan Alsintan</li>
                      <li>Mengambil Foto Lapangan &amp; GPS</li>
                    </ul>
                  </div>

                  {/* Actor 2 */}
                  <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                    <div className="font-bold text-amber-800 flex items-center gap-1.5 mb-3">
                      <span className="bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono">Aktor</span>
                      Koordinator Brigade
                    </div>
                    <ul className="space-y-1.5 text-slate-600 list-disc pl-4 font-medium">
                      <li>Verifikasi / Approval Laporan Operator</li>
                      <li>Manajemen Alat Mesin Pertanian (Alsintan)</li>
                      <li>Input Riwayat Perawatan &amp; Service</li>
                      <li>Melihat Laporan Keuangan Lokal</li>
                    </ul>
                  </div>

                  {/* Actor 3 */}
                  <div className="bg-teal-50/50 p-4 rounded-lg border border-teal-100">
                    <div className="font-bold text-teal-800 flex items-center gap-1.5 mb-3">
                      <span className="bg-teal-200 text-teal-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono">Aktor</span>
                      Provinsi &amp; Pusat
                    </div>
                    <ul className="space-y-1.5 text-slate-600 list-disc pl-4 font-medium">
                      <li>Monitoring Dashboard Nasional &amp; Provinsi</li>
                      <li>Analisis Sebaran Spasial (Peta Brigade)</li>
                      <li>Ekspor Laporan Komprehensif (Excel &amp; PDF)</li>
                      <li>Alokasi Target Luas Layanan Pangan</li>
                    </ul>
                  </div>
                </div>

                {/* Conceptual SVG Graph */}
                <div className="mt-8 bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-4">Visualisasi Pemetaan Relasi Use Case</span>
                  <div className="inline-flex flex-wrap justify-center gap-4">
                    <span className="bg-white px-3 py-1.5 rounded-full border border-slate-300 font-medium text-xs text-slate-700">🔒 Login &amp; Autentikasi JWT</span>
                    <span className="bg-white px-3 py-1.5 rounded-full border border-slate-300 font-medium text-xs text-slate-700">🚜 Kelola Unit Alsintan</span>
                    <span className="bg-white px-3 py-1.5 rounded-full border border-slate-300 font-medium text-xs text-slate-700">📊 Kalkulasi KPI Otomatis</span>
                    <span className="bg-white px-3 py-1.5 rounded-full border border-slate-300 font-medium text-xs text-slate-700">📍 Geo-Tagging Lokasi Lahan</span>
                    <span className="bg-white px-3 py-1.5 rounded-full border border-slate-300 font-medium text-xs text-slate-700">💾 Ekspor Data Excel/PDF</span>
                    <span className="bg-white px-3 py-1.5 rounded-full border border-slate-300 font-medium text-xs text-slate-700">🛠️ Perawatan &amp; Service Preventif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'erd' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-600 pl-3 mb-4">Tahap 5 &amp; 6: Entity Relationship Diagram &amp; Database Design</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Arsitektur database dirancang menggunakan standard normalisasi tinggi (3NF) untuk menjamin integritas data transaksi operasional, BBM, service, serta audit trail.
              </p>

              {/* Database Schema Explorer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs border border-slate-800 shadow-lg">
                  <div className="border-b border-slate-700 pb-2 mb-2">
                    <span className="text-emerald-400 font-bold">📂 Table: users</span>
                    <span className="text-[10px] text-slate-400 block">Master pengguna & autentikasi</span>
                  </div>
                  <ul className="space-y-1">
                    <li><span className="text-amber-400">id</span> INT (PK, AutoIncrement)</li>
                    <li><span className="text-sky-300">name</span> VARCHAR(100) NOT NULL</li>
                    <li><span className="text-sky-300">email</span> VARCHAR(100) UNIQUE</li>
                    <li><span className="text-sky-300">password</span> VARCHAR(255) NOT NULL</li>
                    <li><span className="text-sky-300">role_id</span> INT (FK {"->"} roles.id)</li>
                    <li><span className="text-sky-300">brigade_id</span> INT (FK {"->"} brigades.id, NULLABLE)</li>
                  </ul>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs border border-slate-800 shadow-lg">
                  <div className="border-b border-slate-700 pb-2 mb-2">
                    <span className="text-emerald-400 font-bold">📂 Table: alsintan</span>
                    <span className="text-[10px] text-slate-400 block">Master data Alat Mesin Pertanian</span>
                  </div>
                  <ul className="space-y-1">
                    <li><span className="text-amber-400">id</span> INT (PK)</li>
                    <li><span className="text-sky-300">code</span> VARCHAR(50) UNIQUE</li>
                    <li><span className="text-sky-300">name</span> VARCHAR(100)</li>
                    <li><span className="text-sky-300">brand</span> VARCHAR(50)</li>
                    <li><span className="text-sky-300">type</span> ENUM('Traktor', 'Combine', ...)</li>
                    <li><span className="text-sky-300">brigade_id</span> INT (FK {"->"} brigades.id)</li>
                    <li><span className="text-sky-300">status</span> ENUM('Aktif', 'Service', 'Rusak', 'Standby')</li>
                  </ul>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs border border-slate-800 shadow-lg">
                  <div className="border-b border-slate-700 pb-2 mb-2">
                    <span className="text-emerald-400 font-bold">📂 Table: laporan_harian</span>
                    <span className="text-[10px] text-slate-400 block">Transaksi harian kerja alsintan</span>
                  </div>
                  <ul className="space-y-1">
                    <li><span className="text-amber-400">id</span> INT (PK)</li>
                    <li><span className="text-sky-300">date</span> DATE NOT NULL</li>
                    <li><span className="text-sky-300">alsintan_id</span> INT (FK {"->"} alsintan.id)</li>
                    <li><span className="text-sky-300">operator_id</span> INT (FK {"->"} operators.id)</li>
                    <li><span className="text-sky-300">hours_start</span> DECIMAL(10,2)</li>
                    <li><span className="text-sky-300">hours_end</span> DECIMAL(10,2)</li>
                    <li><span className="text-sky-300">land_area</span> DECIMAL(10,2)</li>
                    <li><span className="text-sky-300">fuel_used</span> DECIMAL(10,2) (Liter)</li>
                    <li><span className="text-sky-300">revenue</span> DECIMAL(15,2) (Rp)</li>
                    <li><span className="text-sky-300">latitude</span> DECIMAL(10,8)</li>
                    <li><span className="text-sky-300">longitude</span> DECIMAL(11,8)</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Database Constraints & Indexes (Optimasi)</h3>
                <div className="text-xs text-slate-600 space-y-2">
                  <p>🔹 <strong>Unique Constraint:</strong> Email pada tabel <code>users</code> dan Kode Unit pada tabel <code>alsintan</code> wajib memiliki nilai unik.</p>
                  <p>🔹 <strong>Foreign Key Cascading:</strong> Relasi relasional menggunakan <code>ON DELETE RESTRICT</code> untuk mencegah terhapusnya entitas induk (seperti Brigade) yang masih memiliki relasi transaksi laporan harian.</p>
                  <p>🔹 <strong>Index Optimasi:</strong> Indexing diletakkan pada kolom pencarian dinamis: <code>laporan_harian.date</code>, <code>laporan_harian.alsintan_id</code>, dan <code>alsintan.brigade_id</code> demi mempercepat performa load dashboard multi-tahun.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-600 pl-3 mb-4">Tahap 10: Arsitektur REST API &amp; Kontrak Data</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Seluruh pertukaran data antara aplikasi web/mobile dengan backend menggunakan standard REST API dengan enkapsulasi JSON yang aman dan termonitor.
              </p>

              <div className="space-y-4">
                {/* Endpoint 1 */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-600 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">POST</span>
                    <span className="font-mono text-xs font-bold text-slate-800">/api/v1/auth/login</span>
                    <span className="text-xs text-slate-500 ml-auto">Autentikasi Pengguna</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="bg-slate-900 text-slate-300 p-3 rounded font-mono text-[10px]">
                      <span className="text-slate-400 block mb-1">// Request Body</span>
                      {`{
  "email": "operator.budi@alsintan.id",
  "password": "secure_password_123"
}`}
                    </div>
                    <div className="bg-slate-900 text-slate-300 p-3 rounded font-mono text-[10px]">
                      <span className="text-slate-400 block mb-1">// Response (200 OK)</span>
                      {`{
  "success": true,
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "name": "Budi Santoso",
    "role": "Operator"
  }
}`}
                    </div>
                  </div>
                </div>

                {/* Endpoint 2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-600 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">POST</span>
                    <span className="font-mono text-xs font-bold text-slate-800">/api/v1/laporan-harian</span>
                    <span className="text-xs text-slate-500 ml-auto">Submit Laporan Kerja (Auth Required)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="bg-slate-900 text-slate-300 p-3 rounded font-mono text-[10px]">
                      <span className="text-slate-400 block mb-1">// Request Headers</span>
                      {`Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json`}
                    </div>
                    <div className="bg-slate-900 text-slate-300 p-3 rounded font-mono text-[10px]">
                      <span className="text-slate-400 block mb-1">// Response (201 Created)</span>
                      {`{
  "success": true,
  "data": {
    "id": "lap-992",
    "status": "Submitted",
    "auto_calculated_efficiency": "88.5%"
  }
}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-600 pl-3 mb-4">Tahap 15: Arsitektur Keamanan Enterprise</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Metode Proteksi Inti</h3>
                  
                  <div className="flex gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 h-9 w-9 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Role-Based Access Control (RBAC)</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Membatasi akses rute, menu UI, dan API endpoints secara ketat berdasarkan role pengguna yang disematkan dalam JWT claim.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 h-9 w-9 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Validasi Input &amp; Sanitasi XSS</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Seluruh parameter input divalidasi ketat (misal: koordinat GPS harus format float valid, jam kerja tidak boleh bernilai negatif). Sanitasi input HTML mencegah injeksi skrip.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 h-9 w-9 flex items-center justify-center shrink-0">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Immutable Audit Trail Logs</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Tiap mutasi data (CREATE/UPDATE/DELETE) secara otomatis direkam ke tabel logs audit yang tidak dapat dimodifikasi (append-only), mencatat alamat IP dan detail sesi.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Model Perlindungan Lapisan Jaringan</h3>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>🔒 <strong>Enkripsi SSL/TLS (HTTPS):</strong> Seluruh payload dikirim menggunakan TLS 1.3 demi menangkal serangan sniffing / Man-In-The-Middle.</p>
                    <p>🔒 <strong>Rate Limiter:</strong> Dilengkapi limit 100 requests per menit per IP address untuk melindungi server dari serangan Denial of Service (DoS) dan brute force login.</p>
                    <p>🔒 <strong>Prepared Statements:</strong> Backend menggunakan ORM modern (seperti Laravel Eloquent atau Drizzle TS) yang otomatis mem-parameterisasi query SQL untuk memblokir total celah SQL Injection.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 border-l-4 border-emerald-600 pl-3 mb-4">Tahap 17: Rencana Deployment &amp; DevOps</h2>
              
              <div className="space-y-4 text-xs text-slate-600">
                <p className="text-sm">ALSINTAN dikemas menggunakan Docker Containerization untuk menjamin konsistensi performa antar server pengembangan, testing, hingga produksi.</p>

                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono leading-relaxed overflow-x-auto">
                  <span className="text-slate-400 block mb-2"># docker-compose.prod.yml</span>
                  {`version: '3.8'

services:
  alsintan-web:
    image: alsintan-enterprise:latest
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres-db
      - REDIS_HOST=redis-cache
    restart: always
    depends_on:
      - postgres-db

  postgres-db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=alsintan_db
      - POSTGRES_PASSWORD=SuperSecurePasswordHere
    restart: always

volumes:
  pgdata:`}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Pipeline CI/CD (GitHub Actions)</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Setiap push ke branch <code>main</code> memicu pengujian otomatis (Unit, Integration, dan Linter), diikuti oleh pembuatan image Docker dan deployment otomatis tanpa downtime (Rolling Update) ke server Cloud Run / VM Server.
                    </p>
                  </div>

                  <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Skema Backup Otomatis</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Cronjob berjalan setiap hari jam 01:00 pagi untuk melakukan backup database (pg_dump), mengompres file dmp ke format .tar.gz, dan menyimpannya secara aman di cloud storage terpisah yang memiliki redundansi tinggi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
