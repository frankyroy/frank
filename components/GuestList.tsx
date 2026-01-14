
import React, { useState, useMemo } from 'react';
import { Guest, Reservation } from '../types';

interface GuestListProps {
  guests: Guest[];
  reservations: Reservation[];
  onAddGuest: (guest: Guest) => void;
  onUpdateGuest: (guest: Guest) => void;
  onDeleteGuest: (guestId: string) => void;
}

const GuestList: React.FC<GuestListProps> = ({ guests, reservations, onAddGuest, onUpdateGuest, onDeleteGuest }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', idNumber: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [guests, searchTerm]);

  const calculateGuestTotal = (guestId: string) => {
    return reservations
      .filter(res => res.guestId === guestId && res.status !== 'Cancelada')
      .reduce((sum, res) => sum + (res.totalPrice || 0), 0);
  };

  const handleOpenAdd = () => {
    setEditingGuest(null);
    setFormData({ name: '', email: '', phone: '', idNumber: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({ 
      name: guest.name, 
      email: guest.email, 
      phone: guest.phone, 
      idNumber: guest.idNumber 
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGuest) {
      onUpdateGuest({ ...formData, id: editingGuest.id });
    } else {
      onAddGuest({ ...formData, id: Date.now().toString() });
    }
    setShowModal(false);
    setFormData({ name: '', email: '', phone: '', idNumber: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, email o DNI..." 
            className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none shadow-sm transition-all font-medium text-gray-700"
          />
          <svg className="absolute left-3.5 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center shadow-2xl shadow-indigo-100 transition-all active:scale-95 group uppercase text-xs tracking-widest"
        >
          <svg className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Nuevo Huésped
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
              <tr>
                <th className="px-8 py-6">Huésped</th>
                <th className="px-8 py-6">Identificación</th>
                <th className="px-8 py-6">Contacto</th>
                <th className="px-8 py-6">Total Reservas</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredGuests.map((guest) => {
                const totalAmount = calculateGuestTotal(guest.id);
                return (
                  <tr key={guest.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-[1rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-black mr-4 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          {guest.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-gray-800 text-base">{guest.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {guest.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-700">{guest.idNumber}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">DNI / Pasaporte</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-600">{guest.email}</p>
                      <p className="text-xs text-gray-400 font-medium">{guest.phone}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className={`text-lg font-black ${totalAmount > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                          ${totalAmount}
                        </span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Acumulado</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(guest)}
                          className="text-gray-400 hover:text-indigo-600 p-3 bg-white hover:shadow-lg rounded-xl transition-all border border-gray-100 active:scale-90" 
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => onDeleteGuest(guest.id)}
                          className="text-gray-400 hover:text-rose-500 p-3 bg-white hover:shadow-lg rounded-xl transition-all border border-gray-100 active:scale-90" 
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredGuests.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gray-50 text-gray-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No se encontraron huéspedes</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-gray-800 mb-8 tracking-tight">
              {editingGuest ? 'Editar Huésped' : 'Nuevo Huésped'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all font-black text-gray-700" placeholder="Ej. Juan Pérez" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all font-black text-gray-700" placeholder="juan@ejemplo.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all font-black text-gray-700" placeholder="+34..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">DNI / Pasaporte</label>
                  <input required value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all font-black text-gray-700" placeholder="A123..." />
                </div>
              </div>
              <div className="flex space-x-4 pt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 border border-gray-100 rounded-2xl font-black text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95 uppercase text-[10px] tracking-widest">Descartar</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 uppercase text-[10px] tracking-widest">
                  {editingGuest ? 'Guardar Cambios' : 'Guardar Perfil'}
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
