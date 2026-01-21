
import React, { useState, useMemo } from 'react';
import { Guest, Reservation, Room } from '../types';

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
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', id_number: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (guest.id_number && guest.id_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [guests, searchTerm]);

  const calculateGuestTotal = (guestId: string) => {
    return reservations
      .filter(res => res.guest_id === guestId && res.status !== 'Cancelada')
      .reduce((sum, res) => sum + (Number(res.total_price) || 0), 0);
  };

  const getAssignedRoom = (guestId: string) => {
    const activeRes = [...reservations]
      .filter(res => res.guest_id === guestId && (res.status === 'Check-in' || res.status === 'Confirmada'))
      .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())[0];

    if (!activeRes) return null;
    return rooms.find(r => r.id === activeRes.room_id);
  };

  const handleOpenAdd = () => {
    setEditingGuest(null);
    setFormData({ name: '', email: '', phone: '', id_number: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({ 
      name: guest.name, 
      email: guest.email || '', 
      phone: guest.phone || '', 
      id_number: guest.id_number 
    });
    setShowModal(true);
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
      console.error("Error al guardar huésped:", error);
      alert(`Error: ${error.message || "No se pudo sincronizar."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
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
        <button 
          onClick={handleOpenAdd}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[1.8rem] font-black flex items-center justify-center shadow-2xl shadow-indigo-100 transition-all active:scale-95 group uppercase text-xs tracking-widest"
        >
          <svg className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Huésped
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-10 py-8">Perfil del Huésped</th>
                <th className="px-10 py-8">Identificación</th>
                <th className="px-10 py-8">Habitación</th>
                <th className="px-10 py-8">Contacto</th>
                <th className="px-10 py-8">Gasto Total</th>
                <th className="px-10 py-8 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredGuests.length > 0 ? filteredGuests.map((guest) => {
                const totalAmount = calculateGuestTotal(guest.id);
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
                          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Huésped Cloud</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <p className="text-sm font-black text-gray-800 tracking-tight">{guest.id_number}</p>
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
                          Sin estancia
                        </span>
                      )}
                    </td>
                    <td className="px-10 py-7">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{guest.email || '-'}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-[10px] text-gray-400 font-medium">{guest.phone || '-'}</p>
                          {guest.phone && (
                            <a 
                              href={formatWhatsAppLink(guest.phone)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-100"
                              title="Enviar WhatsApp"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.661 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className={`text-xl font-black tracking-tighter ${totalAmount > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                        ${totalAmount}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleOpenEdit(guest)} className="p-3 bg-white border border-gray-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
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
                  <td colSpan={6} className="py-24 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    No se encontraron resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter text-center mb-10">
              {editingGuest ? 'Editar Huésped' : 'Nuevo Registro'}
            </h2>
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
                  {isSaving ? "Guardando..." : "Sincronizar Datos"}
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
