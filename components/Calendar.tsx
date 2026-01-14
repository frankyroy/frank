
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
  
  // Form State
  const [formData, setFormData] = useState<Partial<Reservation>>({
    guestId: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    status: 'Confirmada',
    totalPrice: 0
  });

  // Ordenar reservaciones cronológicamente para la vista Agenda
  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  }, [reservations]);

  // Calculate total price automatically
  useEffect(() => {
    if ((modalMode === 'add' || modalMode === 'edit') && formData.checkIn && formData.checkOut && formData.roomId) {
      const room = rooms.find(r => r.id === formData.roomId);
      if (room) {
        const start = new Date(formData.checkIn);
        const end = new Date(formData.checkOut);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          const calculatedPrice = diffDays * room.price;
          setFormData(prev => ({ ...prev, totalPrice: calculatedPrice }));
        } else {
          setFormData(prev => ({ ...prev, totalPrice: 0 }));
        }
      }
    }
  }, [formData.checkIn, formData.checkOut, formData.roomId, modalMode, rooms]);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleOpenAdd = (roomId: string, date: Date) => {
    const checkIn = date.toISOString().split('T')[0];
    const checkOutDate = new Date(date);
    checkOutDate.setDate(date.getDate() + 1);
    const checkOut = checkOutDate.toISOString().split('T')[0];
    const room = rooms.find(r => r.id === roomId);

    setFormData({
      guestId: guests[0]?.id || '',
      roomId,
      checkIn,
      checkOut,
      status: 'Confirmada',
      totalPrice: room ? room.price : 0
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
        id: `res-${Date.now()}`
      });
    } else if (modalMode === 'edit' && selectedRes) {
      onUpdateReservation(formData as Reservation);
    }
    setModalMode(null);
  };

  const getReservationDetails = (res: Reservation) => {
    const guest = guests.find(g => g.id === res.guestId);
    const room = rooms.find(r => r.id === res.roomId);
    return { guest, room, reservation: res };
  };

  const selectedData = selectedRes ? getReservationDetails(selectedRes) : null;

  return (
    <div className="space-y-6">
      {/* Header con Switcher de Vistas */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm gap-4">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setViewType('timeline')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'timeline' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Cronograma
          </button>
          <button 
            onClick={() => setViewType('agenda')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'agenda' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Agenda
          </button>
        </div>
        <div className="text-right px-4 hidden sm:block">
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Vista Actual</p>
           <p className="text-sm font-black text-gray-800">{viewType === 'timeline' ? 'Grilla de 14 Días' : 'Lista Cronológica'}</p>
        </div>
      </div>

      {viewType === 'timeline' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <div className="w-40 p-6 font-black text-gray-400 border-r flex items-center justify-center bg-gray-50 uppercase text-[10px] tracking-widest">Habitación</div>
              <div className="flex-1 flex">
                {days.map((day, i) => (
                  <div key={i} className="flex-1 p-5 text-center border-r last:border-r-0">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                    <p className="font-black text-gray-700 text-lg">{day.getDate()}</p>
                  </div>
                ))}
              </div>
            </div>

            {rooms.map(room => (
              <div key={room.id} className="flex border-b border-gray-100 last:border-b-0 group">
                <div className="w-40 p-6 border-r flex flex-col justify-center items-center bg-gray-50/20 group-hover:bg-indigo-50/30 transition-colors">
                  <p className="font-black text-gray-800 text-lg">Hab. {room.number}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{room.type}</p>
                </div>
                <div className="flex-1 flex relative h-24">
                  {days.map((day, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleOpenAdd(room.id, day)}
                      className="flex-1 border-r last:border-r-0 hover:bg-gray-50/80 cursor-pointer transition-colors"
                    ></div>
                  ))}
                  
                  {reservations.filter(res => res.roomId === room.id).map(res => {
                    const guest = guests.find(g => g.id === res.guestId);
                    const checkInDate = new Date(res.checkIn);
                    const firstDay = days[0];
                    const diffDays = Math.floor((checkInDate.getTime() - firstDay.getTime()) / (1000 * 3600 * 24));
                    const checkOutDate = new Date(res.checkOut);
                    const duration = Math.max(1, Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
                    
                    if (diffDays + duration < 0 || diffDays >= 14) return null;

                    const start = Math.max(0, diffDays);
                    const end = Math.min(14, diffDays + duration);
                    const widthPercent = ((end - start) / 14) * 100;
                    const leftPercent = (start / 14) * 100;

                    return (
                      <button 
                        key={res.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenView(res);
                        }}
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        className={`absolute top-4 bottom-4 mx-1 rounded-2xl p-3 text-xs font-black shadow-lg flex items-center truncate transition-all active:scale-95 z-10 ${
                          res.status === 'Check-in' ? 'bg-indigo-600 text-white shadow-indigo-200' :
                          res.status === 'Confirmada' ? 'bg-blue-500 text-white shadow-blue-200' :
                          res.status === 'Check-out' ? 'bg-emerald-600 text-white shadow-emerald-200' :
                          'bg-gray-200 text-gray-600'
                        }`}
                      >
                        <span className="truncate">{guest?.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Vista Agenda Cronológica */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {sortedReservations.length > 0 ? (
            sortedReservations.map(res => {
              const { guest, room } = getReservationDetails(res);
              const checkInDate = new Date(res.checkIn);
              
              return (
                <button 
                  key={res.id}
                  onClick={() => handleOpenView(res)}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all text-left group flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{checkInDate.toLocaleDateString('es-ES', { month: 'short' })}</span>
                        <span className="text-xl font-black">{checkInDate.getDate()}</span>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        res.status === 'Check-in' ? 'bg-indigo-100 text-indigo-700' : 
                        res.status === 'Confirmada' ? 'bg-blue-100 text-blue-700' : 
                        res.status === 'Check-out' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-black text-gray-800 tracking-tight">{guest?.name || 'Huésped Desconocido'}</h4>
                      <p className="text-sm font-bold text-gray-400 mt-1">Habitación {room?.number || 'N/A'} • {room?.type}</p>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-bold text-gray-500 py-3 border-y border-gray-50">
                       <div className="flex-1">
                          <p className="text-[10px] uppercase text-gray-300 mb-0.5">Entrada</p>
                          <p>{res.checkIn}</p>
                       </div>
                       <div className="w-px h-6 bg-gray-100"></div>
                       <div className="flex-1 text-right">
                          <p className="text-[10px] uppercase text-gray-300 mb-0.5">Salida</p>
                          <p>{res.checkOut}</p>
                       </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <p className="text-xl font-black text-indigo-600">${res.totalPrice}</p>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
               <div className="bg-gray-50 p-6 rounded-[2rem] inline-block mb-4">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
               <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No hay reservas agendadas</p>
            </div>
          )}
        </div>
      )}

      {/* Modal View/Edit/Add Remains Identical but ensuring proper triggers */}
      {(modalMode === 'view' && selectedData) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div 
            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Detalle Reserva</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">ID: {selectedRes?.id}</p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex items-center space-x-5 p-6 bg-indigo-50/50 rounded-[2rem]">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100">
                  {selectedData.guest?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-800 tracking-tight">{selectedData.guest?.name}</p>
                  <p className="text-sm text-indigo-600 font-bold">{selectedData.guest?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Habitación</p>
                  <p className="font-black text-gray-800 text-lg">Hab. {selectedData.room?.number}</p>
                  <p className="text-xs text-gray-500 font-bold">{selectedData.room?.type}</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Monto Total</p>
                  <p className="font-black text-indigo-600 text-lg">${selectedData.reservation.totalPrice}</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Estancia</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Entrada</p>
                    <p className="font-black text-gray-800 text-lg">{selectedData.reservation.checkIn}</p>
                  </div>
                  <div className="h-0.5 bg-gray-200 flex-1 mx-6 rounded-full"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Salida</p>
                    <p className="font-black text-gray-800 text-lg">{selectedData.reservation.checkOut}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-2">
                <button 
                  onClick={() => handleOpenEdit(selectedData.reservation)}
                  className="flex-1 bg-white border border-gray-100 text-gray-800 py-5 rounded-[2rem] font-black shadow-lg shadow-gray-100 transition-all active:scale-[0.98] hover:bg-gray-50"
                >
                  Editar
                </button>
                <button 
                  onClick={() => setModalMode(null)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div 
            className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-3xl font-black text-gray-800 mb-8 tracking-tight">
              {modalMode === 'add' ? 'Nueva Reserva' : 'Editar Reserva'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Huésped</label>
                <select 
                  value={formData.guestId} 
                  onChange={e => setFormData({...formData, guestId: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700"
                >
                  {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Habitación</label>
                <select 
                  value={formData.roomId} 
                  onChange={e => setFormData({...formData, roomId: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700"
                >
                  {rooms.map(r => <option key={r.id} value={r.id}>Hab. {r.number} (${r.price}/noche)</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Check-In</label>
                <input 
                  type="date"
                  value={formData.checkIn} 
                  onChange={e => setFormData({...formData, checkIn: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Check-Out</label>
                <input 
                  type="date"
                  value={formData.checkOut} 
                  onChange={e => setFormData({...formData, checkOut: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700"
                >
                  <option value="Confirmada">Confirmada</option>
                  <option value="Check-in">Check-in</option>
                  <option value="Check-out">Check-out</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total a Cobrar ($)</label>
                <div className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-700 flex items-center justify-between">
                   <span>Calculado:</span>
                   <span className="text-xl">${formData.totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-10">
              <button 
                type="button" 
                onClick={() => setModalMode(null)} 
                className="flex-1 px-8 py-5 border border-gray-100 rounded-[2rem] font-black text-gray-400 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={!formData.totalPrice || (formData.totalPrice <= 0)}
                onClick={handleSave}
                className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-[2rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalMode === 'add' ? 'Crear Reserva' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
