
import React, { useState, useEffect, useMemo } from 'react';
import { Reservation, Room, Guest } from '../types';

interface CalendarProps {
  reservations: Reservation[];
  rooms: Room[];
  guests: Guest[];
  onAddReservation: (res: Reservation) => void;
  onUpdateReservation: (res: Reservation) => void;
}

type ModalMode = 'view' | 'edit' | 'add' | null;
type ViewType = 'timeline' | 'agenda';

const Calendar: React.FC<CalendarProps> = ({ reservations, rooms, guests, onAddReservation, onUpdateReservation }) => {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [viewType, setViewType] = useState<ViewType>('timeline');
  const [startDate, setStartDate] = useState(new Date());
  
  const [formData, setFormData] = useState<Partial<Reservation>>({
    guest_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    status: 'Confirmada',
    total_price: 0
  });

  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(startDate);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startDate]);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());
  }, [reservations]);

  const nextPeriod = () => {
    const next = new Date(startDate);
    next.setDate(next.getDate() + 7);
    setStartDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(startDate);
    prev.setDate(prev.getDate() - 7);
    setStartDate(prev);
  };

  const resetToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today);
  };

  useEffect(() => {
    if ((modalMode === 'add' || modalMode === 'edit') && formData.check_in && formData.check_out && formData.room_id) {
      const room = rooms.find(r => r.id === formData.room_id);
      if (room) {
        const start = new Date(formData.check_in);
        const end = new Date(formData.check_out);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 0) setFormData(prev => ({ ...prev, total_price: diffDays * room.price }));
      }
    }
  }, [formData.check_in, formData.check_out, formData.room_id, modalMode, rooms]);

  const handleOpenAdd = (roomId: string, date: Date) => {
    const check_in = date.toISOString().split('T')[0];
    const checkOutDate = new Date(date);
    checkOutDate.setDate(date.getDate() + 1);
    const check_out = checkOutDate.toISOString().split('T')[0];
    const room = rooms.find(r => r.id === roomId);

    setFormData({
      guest_id: guests[0]?.id || '',
      room_id: roomId,
      check_in,
      check_out,
      status: 'Confirmada',
      total_price: room ? room.price : 0
    });
    setModalMode('add');
  };

  // Función para el botón global "Nueva Reserva"
  const handleGlobalAdd = () => {
    const today = new Date();
    const check_in = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const check_out = tomorrow.toISOString().split('T')[0];
    
    setFormData({
      guest_id: guests[0]?.id || '',
      room_id: rooms[0]?.id || '',
      check_in,
      check_out,
      status: 'Confirmada',
      total_price: rooms[0]?.price || 0
    });
    setModalMode('add');
  };

  const handleOpenEdit = (res: Reservation) => {
    setSelectedRes(res);
    setFormData(res);
    setModalMode('edit');
  };

  const handleOpenView = (res: Reservation) => {
    setSelectedRes(res);
    setModalMode('view');
  };

  const handleSave = () => {
    if (modalMode === 'add') {
      onAddReservation({ ...(formData as Reservation), id: crypto.randomUUID() });
    } else if (modalMode === 'edit' && selectedRes) {
      onUpdateReservation(formData as Reservation);
    }
    setModalMode(null);
  };

  const getReservationDetails = (res: Reservation) => {
    const guest = guests.find(g => g.id === res.guest_id);
    const room = rooms.find(r => r.id === res.room_id);
    const start = new Date(res.check_in + 'T00:00:00');
    const end = new Date(res.check_out + 'T00:00:00');
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return { guest, room, reservation: res, nights };
  };

  const reservationStatusConfig = {
    'Check-in': 'bg-indigo-600 text-white shadow-indigo-200 border-indigo-500',
    'Confirmada': 'bg-blue-500 text-white shadow-blue-200 border-blue-400',
    'Check-out': 'bg-emerald-500 text-white shadow-emerald-200 border-emerald-400',
    'Cancelada': 'bg-gray-400 text-white shadow-gray-100 border-gray-300'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setViewType('timeline')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Cronograma</button>
            <button onClick={() => setViewType('agenda')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'agenda' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Agenda</button>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <button onClick={prevPeriod} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={resetToToday} className="px-4 py-2 bg-white text-indigo-600 font-black text-[10px] uppercase rounded-xl">Hoy</button>
            <button onClick={nextPeriod} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>
        
        <button 
          onClick={handleGlobalAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center shadow-xl shadow-indigo-100 transition-all active:scale-95 group uppercase text-[10px] tracking-widest"
        >
          <svg className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Reserva
        </button>
      </div>

      {viewType === 'timeline' ? (
        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1600px] flex flex-col">
              <div className="flex border-b border-gray-100 bg-gray-50/50 sticky top-0 z-30">
                <div className="w-64 shrink-0 p-6 border-r font-black text-gray-400 uppercase text-[10px] text-center">Habitaciones</div>
                <div className="flex-1 flex">
                  {days.map((day, i) => (
                    <div key={i} className={`flex-1 p-5 text-center border-r ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-50/30' : ''}`}>
                      <p className="text-[10px] uppercase font-black text-gray-400 mb-1">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                      <p className="font-black text-xl text-gray-700">{day.getDate()}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col">
                {rooms.map(room => (
                  <div key={room.id} className="flex border-b border-gray-100 group">
                    <div className="w-64 shrink-0 p-6 border-r flex items-center space-x-4 bg-white">
                      <p className="font-black text-gray-800 text-lg">Hab. {room.number}</p>
                    </div>
                    <div className="flex-1 flex relative h-32">
                      {days.map((day, i) => (<div key={i} onClick={() => handleOpenAdd(room.id, day)} className="flex-1 border-r border-gray-50 hover:bg-indigo-50/20 cursor-pointer" />))}
                      {reservations.filter(res => res.room_id === room.id).map(res => {
                        const guest = guests.find(g => g.id === res.guest_id);
                        const cIn = new Date(res.check_in + 'T00:00:00');
                        const cOut = new Date(res.check_out + 'T00:00:00');
                        if (cOut < days[0] || cIn > days[13]) return null;
                        const start = Math.max(0, Math.floor((cIn.getTime() - days[0].getTime()) / (1000 * 3600 * 24)));
                        const end = Math.min(14, Math.ceil((cOut.getTime() - days[0].getTime()) / (1000 * 3600 * 24)));
                        return (
                          <button key={res.id} onClick={(e) => { e.stopPropagation(); handleOpenView(res); }} style={{ left: `${(start/14)*100}%`, width: `${((end-start)/14)*100}%` }} className={`absolute top-6 bottom-6 mx-1 rounded-2xl p-4 text-xs font-black shadow-xl flex items-center justify-between truncate z-10 ${reservationStatusConfig[res.status] || 'bg-slate-500'}`}>
                            <span className="truncate">{guest?.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {sortedReservations.map(res => {
            const { guest, room, nights } = getReservationDetails(res);
            return (
              <button key={res.id} onClick={() => handleOpenView(res)} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm text-left hover:shadow-lg transition-all">
                <h4 className="text-2xl font-black text-gray-800 mb-2">{guest?.name}</h4>
                <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Hab. {room?.number} • {nights} Noches</p>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between">
                  <div><p className="text-[10px] uppercase text-gray-400 font-black">Entrada</p><p className="font-bold">{res.check_in}</p></div>
                  <div className="text-right"><p className="text-[10px] uppercase text-gray-400 font-black">Salida</p><p className="font-bold">{res.check_out}</p></div>
                </div>
                <div className="mt-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${reservationStatusConfig[res.status]}`}>
                    {res.status}
                  </span>
                </div>
              </button>
            );
          })}
          {sortedReservations.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No hay reservas registradas</p>
            </div>
          )}
        </div>
      )}

      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-50 p-6" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-[4rem] p-10 max-w-xl w-full shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">{modalMode === 'add' ? 'Nueva Estancia' : 'Editar Estancia'}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Huésped</label>
                <select value={formData.guest_id} onChange={e => setFormData({...formData, guest_id: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl">
                  <option value="">Seleccionar</option>
                  {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Habitación</label>
                <select value={formData.room_id} onChange={e => setFormData({...formData, room_id: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl">
                  <option value="">Seleccionar</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>Hab. {r.number}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Entrada</label>
                <input type="date" value={formData.check_in} onChange={e => setFormData({...formData, check_in: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salida</label>
                <input type="date" value={formData.check_out} onChange={e => setFormData({...formData, check_out: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl" />
              </div>
              
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estado de la Reserva</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})} 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-800"
                >
                  <option value="Confirmada">Confirmada</option>
                  <option value="Check-in">Check-in</option>
                  <option value="Check-out">Check-out</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className="space-y-1 col-span-2 pt-2">
                <div className="w-full p-5 bg-indigo-50 border border-indigo-100 rounded-[1.8rem] font-black text-indigo-600 flex items-center justify-between text-xl tracking-tighter shadow-sm">
                  <span className="text-[10px] uppercase tracking-widest text-indigo-400">Liquidación Estimada:</span>
                  <span>${formData.total_price}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-6 pt-10">
              <button onClick={() => setModalMode(null)} className="flex-1 py-5 bg-slate-50 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-colors uppercase tracking-widest text-[10px]">Cerrar</button>
              <button onClick={handleSave} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-colors uppercase tracking-widest text-xs">Sincronizar Reserva</button>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'view' && selectedRes && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-50 p-6" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${reservationStatusConfig[selectedRes.status]}`}>
                  {selectedRes.status}
                </span>
                <h2 className="text-4xl font-black text-gray-900 mt-4 tracking-tight">Detalles de Reserva</h2>
              </div>
              <button onClick={() => handleOpenEdit(selectedRes)} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-[2.5rem]">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl">
                  {guests.find(g => g.id === selectedRes.guest_id)?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-800">{guests.find(g => g.id === selectedRes.guest_id)?.name}</p>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">DNI: {guests.find(g => g.id === selectedRes.guest_id)?.id_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estancia</p>
                  <div className="space-y-1">
                    <p className="font-black text-gray-800 text-lg">Habitación {rooms.find(r => r.id === selectedRes.room_id)?.number}</p>
                    <p className="text-sm font-medium text-gray-500">{rooms.find(r => r.id === selectedRes.room_id)?.type}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liquidación</p>
                  <p className="text-3xl font-black text-indigo-600 tracking-tighter">${selectedRes.total_price}</p>
                </div>
              </div>

              <div className="flex border-t border-gray-100 pt-8 gap-8">
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-In</p>
                  <p className="font-bold text-gray-800">{selectedRes.check_in}</p>
                </div>
                <div className="flex-1 space-y-1 text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-Out</p>
                  <p className="font-bold text-gray-800">{selectedRes.check_out}</p>
                </div>
              </div>
            </div>

            <button onClick={() => setModalMode(null)} className="w-full mt-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
              Cerrar Vista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
