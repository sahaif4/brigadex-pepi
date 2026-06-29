import React, { useState } from 'react';
import { LaporanHarian, User } from '../types';
import { CheckCircle, Edit3, X } from 'lucide-react';

interface ValidasiLaporanViewProps {
  laporanList: LaporanHarian[];
  setLaporanList: React.Dispatch<React.SetStateAction<LaporanHarian[]>>;
  currentUser: User;
}

export default function ValidasiLaporanView({ laporanList, setLaporanList, currentUser }: ValidasiLaporanViewProps) {
  const [editingReport, setEditingReport] = useState<LaporanHarian | null>(null);
  
  const canEditReport = currentUser.role === 'Kabupaten' || currentUser.role === 'Provinsi' || currentUser.role === 'Super Admin';

  const handleApprove = (id: string) => {
    setLaporanList(prev => prev.map(lap => 
      lap.id === id ? { ...lap, isApproved: true, approvedBy: currentUser.name } : lap
    ));
    setEditingReport(null);
  };

  const handleUpdateReport = (id: string, landArea: number, date: string) => {
    setLaporanList(prev => prev.map(lap => 
      lap.id === id ? { ...lap, landArea, date } : lap
    ));
  };

  const pendingReports = laporanList.filter(l => !l.isApproved);

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-black text-slate-800 mb-4">Validasi Laporan Harian</h2>
      {pendingReports.length === 0 ? (
        <p className="text-slate-500">Tidak ada laporan menunggu validasi.</p>
      ) : (
        <div className="space-y-3">
          {pendingReports.map(lap => (
            <div key={lap.id} className="p-4 border rounded-lg flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{lap.activityType} - {lap.date}</p>
                  <p className="text-sm text-slate-600">Luas: {lap.landArea} Ha</p>
                </div>
                <div className="flex gap-2">
                  {canEditReport && (
                    <button 
                      onClick={() => setEditingReport(lap)}
                      className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-bold"
                    >
                      Edit Laporan
                    </button>
                  )}
                  <button 
                    onClick={() => handleApprove(lap.id)}
                    className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold"
                  >
                    Approve
                  </button>
                </div>
              </div>
              {editingReport?.id === lap.id && (
                <div className="mt-2 p-3 bg-slate-50 rounded border">
                  <label className="block text-xs font-bold">Luas Lahan (Ha)</label>
                  <input type="number" defaultValue={lap.landArea} className="border p-1 w-full rounded" 
                    onChange={(e) => handleUpdateReport(lap.id, Number(e.target.value), lap.date)}
                  />
                  <label className="block text-xs font-bold mt-2">Tanggal</label>
                  <input type="date" defaultValue={lap.date} className="border p-1 w-full rounded" 
                    onChange={(e) => handleUpdateReport(lap.id, lap.landArea, e.target.value)}
                  />
                  <button onClick={() => setEditingReport(null)} className="mt-2 text-xs text-red-600 font-bold">Tutup</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
