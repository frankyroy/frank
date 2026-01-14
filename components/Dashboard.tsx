
import React from 'react';
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
  const stats = [
    { label: 'Ocupación', value: `${(data.rooms.filter(r => r.status === 'Ocupada').length / data.rooms.length * 100).toFixed(0)}%`, icon: '🏠', color: 'bg-blue-500' },
    { label: 'Check-ins Hoy', value: '3', icon: '🔑', color: 'bg-green-500' },
    { label: 'Limpieza Pendiente', value: data.rooms.filter(r => r.status === 'Limpieza').length, icon: '🧹', color: 'bg-yellow-500' },
    { label: 'Incidencias', value: data.maintenance.filter(m => m.status !== 'Completado').length, icon: '🛠️', color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
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
              const guest = data.guests.find(g => g.id === res.guestId);
              const room = data.rooms.find(r => r.id === res.roomId);
              return (
                <div key={res.id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      {guest?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{guest?.name}</p>
                      <p className="text-xs text-gray-400 font-medium tracking-tight">Hab. {room?.number} • {res.checkIn} al {res.checkOut}</p>
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
                  {room.status}
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
