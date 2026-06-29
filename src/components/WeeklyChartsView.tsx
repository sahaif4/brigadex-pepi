import React, { useMemo } from 'react';
import { LaporanHarian } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar, Info } from 'lucide-react';

interface WeeklyChartsViewProps {
  laporanList: LaporanHarian[];
}

export default function WeeklyChartsView({ laporanList }: WeeklyChartsViewProps) {
  const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

  const chartData = useMemo(() => {
    // We aggregate the number of reports per month for each activity type
    return MONTH_NAMES.map((month, index) => {
      const monthNum = index + 1;
      const monthReports = laporanList.filter(l => {
        if (!l.date) return false;
        const parts = l.date.split('-');
        return parts.length >= 2 && parseInt(parts[1]) === monthNum;
      });

      return {
        name: month,
        'Tanam': monthReports.filter(l => l.activityType === 'Tanam').length,
        'Olah Tanah': monthReports.filter(l => l.activityType === 'Tanam pindah/benih').length,
        'Drainase': monthReports.filter(l => l.activityType === 'Irigasi/drainase').length,
        'Dolomit': monthReports.filter(l => l.activityType === 'Tabur dolomit').length,
      };
    });
  }, [laporanList]);

  // Calculate grand totals for each activity type
  const totals = useMemo(() => {
    return {
      tanam: laporanList.filter(l => l.activityType === 'Tanam').length,
      olahTanah: laporanList.filter(l => l.activityType === 'Tanam pindah/benih').length,
      drainase: laporanList.filter(l => l.activityType === 'Irigasi/drainase').length,
      dolomit: laporanList.filter(l => l.activityType === 'Tabur dolomit').length,
    };
  }, [laporanList]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/80">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100 mb-5">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Komparasi Intensitas Operasional Lahan
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
            Analisis perbandingan aktivitas Tanam, Olah Tanah, Drainase, dan Dolomit dalam bentuk grafik garis
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 self-start sm:self-auto uppercase">
          <Calendar className="w-3.5 h-3.5" />
          <span>Tren 6 Bulan</span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tick={{ fontWeight: '600' }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tick={{ fontWeight: '600' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
              }} 
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 'bold', paddingTop: '15px' }}
            />
            <Line 
              name="Tanam" 
              type="monotone" 
              dataKey="Tanam" 
              stroke="#10b981" 
              strokeWidth={3} 
              activeDot={{ r: 6 }} 
              dot={{ strokeWidth: 2, r: 4 }}
            />
            <Line 
              name="Olah Tanah" 
              type="monotone" 
              dataKey="Olah Tanah" 
              stroke="#f59e0b" 
              strokeWidth={3} 
              activeDot={{ r: 6 }} 
              dot={{ strokeWidth: 2, r: 4 }}
            />
            <Line 
              name="Drainase" 
              type="monotone" 
              dataKey="Drainase" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              activeDot={{ r: 6 }} 
              dot={{ strokeWidth: 2, r: 4 }}
            />
            <Line 
              name="Dolomit" 
              type="monotone" 
              dataKey="Dolomit" 
              stroke="#8b5cf6" 
              strokeWidth={3} 
              activeDot={{ r: 6 }} 
              dot={{ strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Premium Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
        <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/40 text-center">
          <span className="text-[9px] text-emerald-800 font-extrabold uppercase tracking-wider block">Total Tanam</span>
          <span className="text-sm font-black text-emerald-700 mt-1 block">{totals.tanam} Laporan</span>
        </div>
        <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/40 text-center">
          <span className="text-[9px] text-amber-800 font-extrabold uppercase tracking-wider block">Total Olah Tanah</span>
          <span className="text-sm font-black text-amber-700 mt-1 block">{totals.olahTanah} Laporan</span>
        </div>
        <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/40 text-center">
          <span className="text-[9px] text-blue-800 font-extrabold uppercase tracking-wider block">Total Drainase</span>
          <span className="text-sm font-black text-blue-700 mt-1 block">{totals.drainase} Laporan</span>
        </div>
        <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100/40 text-center">
          <span className="text-[9px] text-purple-800 font-extrabold uppercase tracking-wider block">Total Dolomit</span>
          <span className="text-sm font-black text-purple-700 mt-1 block">{totals.dolomit} Laporan</span>
        </div>
      </div>

      <div className="mt-4 bg-slate-50 border border-slate-200/50 p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed flex items-start gap-2 font-medium">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          💡 <strong>Rasio Komparasi:</strong> Grafik di atas membantu Admin dalam melakukan monitoring perbandingan porsi pengerjaan fisik lahan di seluruh pos brigade yang aktif secara simultan.
        </div>
      </div>
    </div>
  );
}
