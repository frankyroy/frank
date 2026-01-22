
import React, { useState, useMemo, useEffect } from 'react';
import { Guest, Reservation, Room, SavedSearch } from '../types';

interface GuestListProps {
  guests: Guest[];
  rooms: Room[];
  reservations: Reservation[];
  onAddGuest: (guest: Guest) => Promise<void>;
  onUpdateGuest: (guest: Guest) => Promise<void>;
  onDeleteGuest: (guestId: string) => Promise<void>;
}

const GuestList: React.FC<GuestListProps> = ({ guests, rooms, reservations, onAddGuest, onUpdateGuest, onDeleteGuest }) => {
  const [showModal, setShowModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', id_number: '' });
  
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
      // Filtro de texto básico
      const matchesSearch = 
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (guest.id_number && guest.id_number.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtros avanzados sobre las reservas del huésped
      const guestRes = reservations.filter(r => r.guest_id === guest.id);
      
      // Si no hay reservas y hay filtros activos de reserva, descartar (excepto si buscamos "Todos")
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
                        <p className="text-[10px] text-gray-400 font-bold">{guest.phone || 'N/A'}</p>
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
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingGuest(guest); setFormData({ name: guest.name, email: guest.email || '', phone: guest.phone || '', id_number: guest.id_number }); setShowModal(true); }} className="p-3 bg-white border border-gray-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => { if(window.confirm('¿Eliminar registro?')) onDeleteGuest(guest.id) }} className="p-3 bg-white border border-gray-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
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
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 bg-gray-50 rounded-[1.8rem] font-black text-gray-400 uppercase text-[10px]">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black shadow-lg uppercase text-xs disabled:opacity-50 transition-all active:scale-95">
                  {isSaving ? "Guardando..." : "Sincronizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;
