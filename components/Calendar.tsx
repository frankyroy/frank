
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
  
  // Form State
  const [formData, setFormData] = useState<Partial<Reservation>>({
    guest_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    status: 'Confirmada',
    total_price: 0
  });

  // Generar array de 14 días a partir de la fecha de inicio
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

  // Navegación
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

  // Cálculo automático de precio y duración
  useEffect(() => {
    if ((modalMode === 'add' || modalMode === 'edit') && formData.check_in && formData.check_out && formData.room_id) {
      const room = rooms.find(r => r.id === formData.room_id);
      if (room) {
        const start = new Date(formData.check_in);
        const end = new Date(formData.check_out);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          setFormData(prev => ({ ...prev, total_price: diffDays * room.price }));
        } else {
          setFormData(prev => ({ ...prev, total_price: 0 }));
        }
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
      onAddReservation({
        ...(formData as Reservation),
        id: crypto.randomUUID()
      });
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

  const selectedData = selectedRes ? getReservationDetails(selectedRes) : null;

  const roomStatusColors = {
    'Disponible': 'bg-emerald-500',
    'Ocupada': 'bg-rose-500',
    'Limpieza': 'bg-amber-500',
    'Mantenimiento': 'bg-slate-400'
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
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button 
              onClick={() => setViewType('timeline')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Cronograma
            </button>
            <button 
              onClick={() => setViewType('agenda')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'agenda' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Agenda
            </button>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <button onClick={prevPeriod} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-indigo-600 transition-all active:scale-90">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={resetToToday} className="px-4 py-2 bg-white text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-sm hover:bg-indigo-50 transition-all border border-indigo-50">Hoy</button>
            <button onClick={nextPeriod} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-indigo-600 transition-all active:scale-90">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           <div className="text-right">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Ventana Actual</p>
              <p className="text-sm font-black text-gray-800">
                {days[0].toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - {days[13].toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
           </div>
        </div>
      </div>

      {viewType === 'timeline' ? (
        <div className="relative bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1600px] flex flex-col">
              <div className="flex border-b border-gray-100 bg-gray-50/50 sticky top-0 z-30">
                <div className="w-64 shrink-0 p-6 border-r border-gray-100 font-black text-gray-400 uppercase text-[10px] tracking-[0.2em] flex items-center justify-center bg-gray-50">
                  Habitaciones
                </div>
                <div className="flex-1 flex">
                  {days.map((day, i) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className={`flex-1 p-5 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-indigo-50/30' : ''}`}>
                        <p className={`text-[10px] uppercase font-black tracking-widest mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </p>
                        <p className={`font-black text-xl ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>{day.getDate()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col">
                {rooms.map(room => (
                  <div key={room.id} className="flex border-b border-gray-100 last:border-b-0 group">
                    <div className="w-64 shrink-0 p-6 border-r border-gray-100 flex items-center space-x-4 bg-white group-hover:bg-gray-50 transition-colors z-20">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${roomStatusColors[room.status] || 'bg-gray-300'} shadow-sm`}></div>
                      <div className="truncate">
                        <p className="font-black text-gray-800 text-lg leading-none">Hab. {room.number}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{room.type}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex relative h-32 bg-white group-hover:bg-indigo-50/5">
                      {days.map((day, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleOpenAdd(room.id, day)}
                          className="flex-1 border-r border-gray-50 last:border-r-0 hover:bg-indigo-50/20 cursor-pointer transition-colors"
                        />
                      ))}

                      {reservations.filter(res => res.room_id === room.id).map(res => {
                        const guest = guests.find(g => g.id === res.guest_id);
                        const checkInDate = new Date(res.check_in + 'T00:00:00');
                        const checkOutDate = new Date(res.check_out + 'T00:00:00');
                        
                        const viewStart = days[0];
                        const viewEnd = days[13];

                        if (checkOutDate < viewStart || checkInDate > viewEnd) return null;

                        const startDiff = Math.max(0, Math.floor((checkInDate.getTime() - viewStart.getTime()) / (1000 * 3600 * 24)));
                        const endDiff = Math.min(14, Math.ceil((checkOutDate.getTime() - viewStart.getTime()) / (1000 * 3600 * 24)));
                        
                        const left = (startDiff / 14) * 100;
                        const width = ((endDiff - startDiff) / 14) * 100;

                        return (
                          <button 
                            key={res.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenView(res);
                            }}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            className={`absolute top-6 bottom-6 mx-1 rounded-2xl p-4 text-xs font-black shadow-xl flex items-center justify-between truncate transition-all active:scale-[0.98] z-10 border-b-4 hover:brightness-110 animate-in zoom-in duration-300 ${
                              reservationStatusConfig[res.status] || 'bg-slate-500'
                            }`}
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                                {guest?.name.charAt(0)}
                              </div>
                              <span className="truncate tracking-tight">{guest?.name}</span>
                            </div>
                            <div className="hidden lg:flex flex-col items-end shrink-0 opacity-80 text-[8px] uppercase font-black">
                               <span>${res.total_price}</span>
                               <span className="bg-black/10 px-1.5 rounded mt-0.5">{res.status}</span>
                            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {sortedReservations.length > 0 ? (
            sortedReservations.map(res => {
              const { guest, room, nights } = getReservationDetails(res);
              const checkInDate = new Date(res.check_in + 'T00:00:00');
              const isToday = checkInDate.toDateString() === new Date().toDateString();
              
              return (
                <button 
                  key={res.id}
                  onClick={() => handleOpenView(res)}
                  className={`bg-white p-8 rounded-[3.5rem] border transition-all text-left group flex flex-col justify-between min-h-[380px] relative overflow-hidden ${
                    isToday ? 'border-indigo-200 ring-4 ring-indigo-500/5 shadow-2xl' : 'border-gray-100 shadow-sm hover:shadow-xl'
                  }`}
                >
                  {isToday && <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest z-10">Llegada Hoy</div>}
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-[1.8rem] transition-all duration-300 ${
                        isToday ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-gray-50 text-indigo-600 border border-indigo-50'
                      }`}>
                        <span className="text-[11px] font-black uppercase tracking-tighter mb-0.5">{checkInDate.toLocaleDateString('es-ES', { month: 'short' })}</span>
                        <span className="text-2xl font-black">{checkInDate.getDate()}</span>
                      </div>
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                         res.status === 'Check-in' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                         res.status === 'Confirmada' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                         'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-gray-800 tracking-tight leading-none truncate">{guest?.name}</h4>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">Hab. {room?.number}</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{nights} Noches</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-50">
                       <div>
                          <p className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1.5">Check-in</p>
                          <p className="text-sm font-black text-gray-800">{res.check_in}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1.5">Check-out</p>
                          <p className="text-sm font-black text-gray-800">{res.check_out}</p>
                       </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between items-center">
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Total</p>
                      <p className="text-3xl font-black text-gray-900 tracking-tighter">${res.total_price}</p>
                    </div>
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100">
               <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <h3 className="text-2xl font-black text-gray-800 tracking-tight">Agenda Vacía</h3>
               <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">No hay reservas para los próximos días</p>
            </div>
          )}
        </div>
      )}

      {(modalMode === 'view' && selectedData) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300" onClick={() => setModalMode(null)}>
          <div 
            className="bg-white rounded-[4rem] p-10 md:p-14 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Reserva</h2>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    reservationStatusConfig[selectedData.reservation.status]
                  }`}>
                    {selectedData.reservation.status}
                  </span>
                </div>
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] pt-2">Localizador: #{selectedData.reservation.id.slice(-8)}</p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-4 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 active:scale-90">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-10">
              <div className="bg-slate-50 rounded-[3rem] p-8 border border-slate-100 relative group overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-[0.02] transition-opacity"></div>
                <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-100 shrink-0">
                    {selectedData.guest?.name.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-3 truncate">
                    <p className="text-3xl font-black text-gray-900 tracking-tight leading-none truncate">{selectedData.guest?.name}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{selectedData.guest?.id_number}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span className="text-xs font-black text-slate-500">{selectedData.guest?.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Alojamiento</p>
                  <p className="font-black text-indigo-600 text-3xl tracking-tighter leading-none">H.{selectedData.room?.number}</p>
                  <p className="text-[10px] text-slate-400 font-black mt-3 uppercase tracking-widest">{selectedData.room?.type}</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Estancia</p>
                  <p className="font-black text-slate-900 text-3xl tracking-tighter leading-none">{selectedData.nights}</p>
                  <p className="text-[10px] text-slate-400 font-black mt-3 uppercase tracking-widest">Noches</p>
                </div>
                <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-center text-white">
                  <p className="text-[10px] font-black text-white/50 uppercase mb-4 tracking-widest">Total</p>
                  <p className="font-black text-white text-3xl tracking-tighter leading-none">${selectedData.reservation.total_price}</p>
                  <p className="text-[10px] text-white/50 font-black mt-3 uppercase tracking-widest">Liquidación</p>
                </div>
              </div>

              <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 relative">
                <div className="flex items-center justify-between relative z-10">
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Check-in</p>
                    <p className="font-black text-slate-900 text-2xl tracking-tight">{selectedData.reservation.check_in}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase">14:00h</p>
                  </div>
                  <div className="flex flex-col items-center flex-1 px-8">
                    <div className="h-0.5 bg-slate-200 w-full rounded-full relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Check-out</p>
                    <p className="font-black text-slate-900 text-2xl tracking-tight">{selectedData.reservation.check_out}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase">11:00h</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => handleOpenEdit(selectedData.reservation)}
                  className="flex-1 bg-white border-2 border-slate-100 text-slate-800 py-6 rounded-[2.5rem] font-black hover:bg-slate-50 transition-all active:scale-95 uppercase text-xs tracking-widest shadow-sm"
                >
                  Modificar
                </button>
                <button 
                  onClick={() => setModalMode(null)}
                  className="flex-1 bg-slate-900 text-white py-6 rounded-[2.5rem] font-black hover:bg-black shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-50 p-6" onClick={() => setModalMode(null)}>
          <div 
            className="bg-white rounded-[4rem] p-10 md:p-14 max-w-xl w-full shadow-2xl animate-in zoom-in duration-300 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-3">
                {modalMode === 'add' ? 'Nueva Estancia' : 'Editar Estancia'}
              </h2>
              <div className="w-12 h-1 bg-indigo-600 mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Huésped</label>
                <select 
                  value={formData.guest_id} 
                  onChange={e => setFormData({...formData, guest_id: e.target.value})}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-black text-gray-800 text-sm shadow-inner appearance-none"
                >
                  <option value="" disabled>Seleccionar</option>
                  {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Habitación</label>
                <select 
                  value={formData.room_id} 
                  onChange={e => setFormData({...formData, room_id: e.target.value})}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-black text-gray-800 text-sm shadow-inner appearance-none"
                >
                  <option value="" disabled>Seleccionar</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>Hab. {r.number} - ${r.price}</option>)}
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Entrada</label>
                <input 
                  type="date"
                  value={formData.check_in} 
                  onChange={e => setFormData({...formData, check_in: e.target.value})}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-black text-gray-800 text-sm shadow-inner"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Salida</label>
                <input 
                  type="date"
                  value={formData.check_out} 
                  onChange={e => setFormData({...formData, check_out: e.target.value})}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-black text-gray-800 text-sm shadow-inner"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Estado</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-black text-gray-800 text-sm shadow-inner"
                >
                  <option value="Confirmada">Confirmada</option>
                  <option value="Check-in">Check-in</option>
                  <option value="Check-out">Check-out</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2">Liquidación</label>
                <div className="w-full p-5 bg-indigo-50 border border-indigo-100 rounded-[1.8rem] font-black text-indigo-600 flex items-center justify-center text-2xl tracking-tighter shadow-sm">
                   ${formData.total_price}
                </div>
              </div>
            </div>

            <div className="flex space-x-6 pt-12">
              <button 
                type="button" 
                onClick={() => setModalMode(null)} 
                className="flex-1 px-8 py-6 bg-slate-50 rounded-[2.5rem] font-black text-slate-400 hover:bg-slate-100 active:scale-95 transition-all uppercase tracking-widest text-[10px]"
              >
                Cerrar
              </button>
              <button 
                type="button" 
                disabled={!formData.total_price || (formData.total_price <= 0)}
                onClick={handleSave}
                className="flex-1 px-8 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
              >
                Sincronizar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
