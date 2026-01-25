
import React, { useState, useMemo, useEffect } from 'react';
import { Guest, Reservation, Room, SavedSearch } from '../types';

interface GuestListProps {
  guests: Guest[];
  rooms: Room[];
  reservations: Reservation[];
  onAddGuest: (guest: Guest) => Promise<void>;
  onUpdateGuest: (guest: Guest) => Promise<void>;
  onDeleteGuest: (guestId: string) => Promise<void>;
  onUpdateReservation: (res: Reservation) => Promise<void>;
}

const GuestList: React.FC<GuestListProps> = ({ 
  guests, 
  rooms, 
  reservations, 
  onAddGuest, 
  onUpdateGuest, 
  onDeleteGuest,
  onUpdateReservation
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', id_number: '' });
  
  // Pago States
  const [selectedGuestForPayment, setSelectedGuestForPayment] = useState<Guest | null>(null);
  const [paymentResId, setPaymentResId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  // Filtros Avanzados
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInStart, setCheckInStart] = useState('');
  const [checkInEnd, setCheckInEnd] = useState('');
  const [roomType, setRoomType] = useState('Todos');
  const [resStatus, setResStatus] = useState('Todos');
  
  // Búsquedas Guardadas
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveSearchName, setSaveSearchName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('hostal_saved_searches');
    if (stored) setSavedSearches(JSON.parse(stored));
  }, []);

  const formatWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const saveCurrentSearch = () => {
    if (!saveSearchName.trim()) return;
    const newSearch: SavedSearch = {
      id: crypto.randomUUID(),
      name: saveSearchName,
      filters: { searchTerm, checkInStart, checkInEnd, roomType, resStatus }
    };
    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('hostal_saved_searches', JSON.stringify(updated));
    setSaveSearchName('');
  };

  const applySavedSearch = (s: SavedSearch) => {
    setSearchTerm(s.filters.searchTerm);
    setCheckInStart(s.filters.checkInStart);
    setCheckInEnd(s.filters.checkInEnd);
    setRoomType(s.filters.roomType);
    setResStatus(s.filters.resStatus);
    setShowAdvanced(true);
  };

  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('hostal_saved_searches', JSON.stringify(updated));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCheckInStart('');
    setCheckInEnd('');
    setRoomType('Todos');
    setResStatus('Todos');
  };

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = 
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (guest.id_number && guest.id_number.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      const guestRes = reservations.filter(r => r.guest_id === guest.id);
      const hasActiveResFilters = checkInStart || checkInEnd || roomType !== 'Todos' || resStatus !== 'Todos';
      if (hasActiveResFilters && guestRes.length === 0) return false;

      if (hasActiveResFilters) {
        return guestRes.some(res => {
          let matchesCheckIn = true;
          if (checkInStart) matchesCheckIn = matchesCheckIn && res.check_in >= checkInStart;
          if (checkInEnd) matchesCheckIn = matchesCheckIn && res.check_in <= checkInEnd;

          let matchesType = true;
          if (roomType !== 'Todos') {
            const room = rooms.find(r => r.id === res.room_id);
            matchesType = room?.type === roomType;
          }

          let matchesStatus = true;
          if (resStatus !== 'Todos') matchesStatus = res.status === resStatus;

          return matchesCheckIn && matchesType && matchesStatus;
        });
      }

      return true;
    });
  }, [guests, searchTerm, checkInStart, checkInEnd, roomType, resStatus, reservations, rooms]);

  const calculateGuestFinances = (guestId: string) => {
    const guestReservations = reservations.filter(res => res.guest_id === guestId && res.status !== 'Cancelada');
    const total = guestReservations.reduce((sum, res) => sum + (Number(res.total_price) || 0), 0);
    const advances = guestReservations.reduce((sum, res) => sum + (Number(res.advance_payment) || 0), 0);
    return { total, advances, balance: total - advances };
  };

  const getAssignedRoom = (guestId: string) => {
    const activeRes = [...reservations]
      .filter(res => res.guest_id === guestId && (res.status === 'Check-in' || res.status === 'Confirmada'))
      .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())[0];

    if (!activeRes) return null;
    return rooms.find(r => r.id === activeRes.room_id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id_number) return;
    setIsSaving(true);
    try {
      if (editingGuest) {
        await onUpdateGuest({ ...formData, id: editingGuest.id });
      } else {
        await onAddGuest({ ...formData, id: crypto.randomUUID() });
      }
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', id_number: '' });
    } catch (error: any) {
      alert(`Error: ${error.message || "No se pudo sincronizar."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (guest: Guest) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${guest.name}? Todos sus registros de contacto se perderán. (Si tiene reservas, el sistema impedirá el borrado).`)) {
      try {
        await onDeleteGuest(guest.id);
      } catch (err: any) {
        alert(err.message || "No se pudo eliminar al huésped.");
      }
    }
  };

  const handleOpenPayment = (guest: Guest) => {
    const guestRes = reservations.filter(r => r.guest_id === guest.id && r.status !== 'Cancelada' && (r.total_price - r.advance_payment > 0));
    if (guestRes.length === 0) {
      alert("Este huésped no tiene deudas pendientes.");
      return;
    }
    setSelectedGuestForPayment(guest);
    setPaymentResId(guestRes[0].id);
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!paymentResId || paymentAmount <= 0) return;
    const res = reservations.find(r => r.id === paymentResId);
    if (!res) return;

    setIsSaving(true);
    try {
      const updatedRes: Reservation = {
        ...res,
        advance_payment: Number(res.advance_payment) + Number(paymentAmount)
      };
      await onUpdateReservation(updatedRes);
      setShowPaymentModal(false);
      alert("¡Abono registrado con éxito!");
    } catch (err) {
      alert("Error al procesar el pago.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header y Buscador Principal */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full max-w-xl">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, DNI o correo..." 
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:bg-white transition-all font-medium text-gray-700 shadow-inner"
            />
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex-1 md:flex-none px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${showAdvanced ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-indigo-600 border border-indigo-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              Filtros
            </button>
            <button 
              onClick={() => { setEditingGuest(null); setFormData({ name: '', email: '', phone: '', id_number: '' }); setShowModal(true); }}
              className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[1.8rem] font-black flex items-center justify-center shadow-2xl shadow-indigo-100 transition-all active:scale-95 group uppercase text-xs tracking-widest"
            >
              Nuevo Huésped
            </button>
          </div>
        </div>

        {/* Panel de Filtros Avanzados */}
        {showAdvanced && (
          <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 animate-in slide-in-from-top-4 duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Check-In Inicio</label>
                <input type="date" value={checkInStart} onChange={e => setCheckInStart(e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Check-In Fin</label>
                <input type="date" value={checkInEnd} onChange={e => setCheckInEnd(e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Habitación</label>
                <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 text-sm appearance-none">
                  <option value="Todos">Todos</option>
                  {Array.from(new Set(rooms.map(r => r.type))).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado Reserva</label>
                <select value={resStatus} onChange={e => setResStatus(e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 text-sm appearance-none">
                  <option value="Todos">Todos</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Check-in">Check-in</option>
                  <option value="Check-out">Check-out</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                {savedSearches.map(s => (
                  <div key={s.id} className="flex items-center bg-white border border-indigo-100 px-4 py-2 rounded-xl shadow-sm group">
                    <button onClick={() => applySavedSearch(s)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mr-3">{s.name}</button>
                    <button onClick={() => deleteSavedSearch(s.id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                   <input 
                    type="text" 
                    value={saveSearchName} 
                    onChange={e => setSaveSearchName(e.target.value)}
                    placeholder="Nombre para guardar filtro..." 
                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                  />
                  <button onClick={saveCurrentSearch} disabled={!saveSearchName} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
                <button onClick={clearFilters} className="px-6 py-3 text-gray-400 hover:text-gray-600 font-black text-[10px] uppercase tracking-widest">Limpiar Filtros</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-10 py-8">Huésped</th>
                <th className="px-10 py-8">Habitación Actual/Próx.</th>
                <th className="px-10 py-8">Contacto</th>
                <th className="px-10 py-8 text-center">Consumo Total</th>
                <th className="px-10 py-8 text-center">Anticipos</th>
                <th className="px-10 py-8 text-center">Saldo</th>
                <th className="px-10 py-8 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredGuests.length > 0 ? filteredGuests.map((guest) => {
                const { total, advances, balance } = calculateGuestFinances(guest.id);
                const assignedRoom = getAssignedRoom(guest.id);
                return (
                  <tr key={guest.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {guest.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-lg leading-tight">{guest.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{guest.id_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      {assignedRoom ? (
                        <div className="flex flex-col space-y-1">
                          <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest w-fit">
                            Hab. {assignedRoom.number}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{assignedRoom.type}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest italic">
                          Sin estancia activa
                        </span>
                      )}
                    </td>
                    <td className="px-10 py-7">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <p className="text-[10px] text-gray-400 font-bold">{guest.phone || 'N/A'}</p>
                          {guest.phone && (
                            <a href={formatWhatsAppLink(guest.phone)} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm group/wa">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.661 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            </a>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">{guest.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className="text-lg font-black tracking-tighter text-gray-800">${total}</span>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className="text-lg font-black tracking-tighter text-emerald-600">${advances}</span>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <div className={`inline-block px-4 py-2 rounded-2xl font-black tracking-tighter text-lg ${balance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        ${balance}
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end space-x-3 transition-all">
                        <button 
                          onClick={() => handleOpenPayment(guest)} 
                          className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100" 
                          title="Registrar Pago"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <button 
                          onClick={() => { setEditingGuest(guest); setFormData({ name: guest.name, email: guest.email || '', phone: guest.phone || '', id_number: guest.id_number }); setShowModal(true); }} 
                          className="p-3 bg-white border border-gray-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="Editar Huésped"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(guest)} 
                          className="p-3 bg-white border border-gray-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          title="Eliminar Huésped"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    No se encontraron resultados con los filtros actuales
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Huésped */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter text-center mb-10">{editingGuest ? 'Editar Huésped' : 'Nuevo Registro'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nombre Completo</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black text-gray-800" placeholder="Ej: Juan Pérez" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Identificación (DNI/PAS)</label>
                <input required value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800" placeholder="Número de documento" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700" placeholder="correo@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Teléfono</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700" placeholder="+34 600 000 000" />
                </div>
              </div>
              
              <div className="flex flex-col gap-4 pt-6">
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 bg-gray-50 rounded-[1.8rem] font-black text-gray-400 uppercase text-[10px] hover:bg-gray-100 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black shadow-lg uppercase text-xs disabled:opacity-50 transition-all active:scale-95">
                    {isSaving ? "Guardando..." : "Sincronizar"}
                  </button>
                </div>
                
                {editingGuest && (
                  <div className="pt-4 border-t border-gray-50">
                    <button 
                      type="button" 
                      onClick={() => handleDeleteClick(editingGuest)}
                      disabled={isSaving}
                      className="w-full py-4 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 border border-rose-100 flex items-center justify-center space-x-2 group"
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Eliminar Huésped Permanentemente</span>
                    </button>
                    <p className="text-[8px] text-gray-400 font-bold text-center mt-2 uppercase tracking-widest">Esta acción no se puede deshacer</p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {showPaymentModal && selectedGuestForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-10 space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Registrar Cobro</h2>
              <p className="text-gray-400 font-bold text-sm">Huésped: {selectedGuestForPayment.name}</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Seleccionar Reserva / Habitación</label>
                <select 
                  value={paymentResId} 
                  onChange={e => setPaymentResId(e.target.value)}
                  className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-800 appearance-none"
                >
                  {reservations.filter(r => r.guest_id === selectedGuestForPayment.id && r.status !== 'Cancelada' && (r.total_price - r.advance_payment > 0)).map(r => {
                    const room = rooms.find(rm => rm.id === r.room_id);
                    const pending = r.total_price - r.advance_payment;
                    return (
                      <option key={r.id} value={r.id}>
                        Hab. {room?.number} - Pendiente: ${pending} ({r.check_in})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Monto del Abono</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl">$</span>
                   <input 
                    type="number" 
                    autoFocus
                    value={paymentAmount || ''} 
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    className="w-full p-8 pl-14 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-3xl text-gray-800 shadow-inner" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Saldo Nuevo</p>
                    <p className="text-2xl font-black text-emerald-800 tracking-tighter">
                      ${Math.max(0, (reservations.find(r => r.id === paymentResId)?.total_price || 0) - (reservations.find(r => r.id === paymentResId)?.advance_payment || 0) - paymentAmount)}
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Reserva</p>
                    <p className="text-xl font-bold text-emerald-700 tracking-tight">${reservations.find(r => r.id === paymentResId)?.total_price}</p>
                 </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-8 py-5 bg-gray-50 rounded-[1.8rem] font-black text-gray-400 uppercase text-[10px]">Cancelar</button>
                <button 
                  onClick={handleProcessPayment}
                  disabled={isSaving || paymentAmount <= 0}
                  className="flex-1 px-8 py-5 bg-emerald-600 text-white rounded-[1.8rem] font-black shadow-lg shadow-emerald-100 uppercase text-xs disabled:opacity-50 transition-all active:scale-95"
                >
                  {isSaving ? "Procesando..." : "Sincronizar Pago"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;
