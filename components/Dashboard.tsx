
import React, { useState } from 'react';
import { Room, Guest, Reservation, MaintenanceTask } from '../types';

interface DashboardProps {
  data: {
    rooms: Room[];
    guests: Guest[];
    reservations: Reservation[];
    maintenance: MaintenanceTask[];
  };
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [showCopyBadge, setShowCopyBadge] = useState(false);

  const statusLabels: Record<string, string> = {
    'Disponible': 'Libre',
    'Ocupada': 'Ocupada',
    'Limpieza': 'Limpieza',
    'Mantenimiento': 'Mantenimiento'
  };

  const stats = [
    { label: 'Ocupación', value: data.rooms.length > 0 ? `${(data.rooms.filter(r => r.status === 'Ocupada').length / data.rooms.length * 100).toFixed(0)}%` : '0%', icon: '🏠', color: 'bg-blue-500' },
    { label: 'Check-ins Hoy', value: data.reservations.filter(r => r.check_in === new Date().toISOString().split('T')[0]).length.toString(), icon: '🔑', color: 'bg-green-500' },
    { label: 'Limpieza Pendiente', value: data.rooms.filter(r => r.status === 'Limpieza').length, icon: '🧹', color: 'bg-yellow-500' },
    { label: 'Incidencias', value: data.maintenance.filter(m => m.status !== 'Completado').length, icon: '🛠️', color: 'bg-red-500' },
  ];

  const handleShare = async () => {
    const occupation = data.rooms.length > 0 ? (data.rooms.filter(r => r.status === 'Ocupada').length / data.rooms.length * 100).toFixed(0) : 0;
    const cleaning = data.rooms.filter(r => r.status === 'Limpieza').length;
    const maintenanceCount = data.maintenance.filter(m => m.status !== 'Completado').length;
    
    let report = `📊 INFORME HOSTALAI - ${new Date().toLocaleDateString()}\n`;
    report += `-----------------------------------\n\n`;
    
    report += `📈 ESTADO GENERAL:\n`;
    report += `- Ocupación: ${occupation}%\n`;
    report += `- Limpiezas pendientes: ${cleaning}\n`;
    report += `- Incidencias activas: ${maintenanceCount}\n\n`;
    
    report += `🏠 INVENTARIO DE HABITACIONES:\n`;
    [...data.rooms].sort((a, b) => a.number.localeCompare(b.number)).forEach(room => {
      report += `- Hab. ${room.number} (${room.type}): ${statusLabels[room.status] || room.status}\n`;
    });

    const counts = data.rooms.reduce((acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    report += `\nRESUMEN DE ESTADOS:\n`;
    Object.entries(counts).forEach(([status, count]) => {
      report += `- ${statusLabels[status] || status}: ${count}\n`;
    });

    report += `\n🏨 ÚLTIMAS RESERVAS:\n`;
    data.reservations.slice(0, 5).forEach(res => {
      const guest = data.guests.find(g => g.id === res.guest_id);
      const room = data.rooms.find(r => r.id === res.room_id);
      report += `- ${guest?.name || 'Huésped'}: Hab. ${room?.number} (${res.status})\n`;
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Informe HostalAI',
          text: report,
        });
      } catch (err) {
        console.error("Error al compartir", err);
      }
    } else {
      await navigator.clipboard.writeText(report);
      setShowCopyBadge(true);
      setTimeout(() => setShowCopyBadge(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Resumen de Operaciones</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Visión global de tu hostal</p>
        </div>
        <div className="flex items-center space-x-3">
          {showCopyBadge && (
            <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-right-2">
              COPIADO AL PORTAPAPELES
            </span>
          )}
          <button 
            onClick={handleShare}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-4 rounded-2xl transition-all active:scale-95 flex items-center space-x-3 group"
          >
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-xs font-black uppercase tracking-widest">Compartir Informe</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`${stat.color} text-white p-4 rounded-2xl text-2xl shadow-lg`}>{stat.icon}</div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Reservas Recientes</h3>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Ver Todas</button>
          </div>
          <div className="space-y-4">
            {data.reservations.slice(0, 5).map(res => {
              const guest = data.guests.find(g => g.id === res.guest_id);
              const room = data.rooms.find(r => r.id === res.room_id);
              return (
                <div key={res.id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      {guest?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{guest?.name}</p>
                      <p className="text-xs text-gray-400 font-medium tracking-tight">Hab. {room?.number} • {res.check_in} al {res.check_out}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    res.status === 'Check-in' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {res.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Estado Habitaciones</h3>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Gestionar</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {data.rooms.map(room => (
              <div key={room.id} className="p-5 border border-gray-50 bg-gray-50/30 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 hover:bg-white hover:border-gray-100 hover:shadow-md transition-all">
                <span className="text-lg font-black text-gray-800">Hab. {room.number}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{room.type}</span>
                <div className={`w-full py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                  room.status === 'Disponible' ? 'bg-emerald-100 text-emerald-600' :
                  room.status === 'Ocupada' ? 'bg-rose-100 text-rose-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {statusLabels[room.status] || room.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
