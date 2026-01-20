
import React, { useState, useMemo } from 'react';
import { Guest, Reservation } from '../types';

interface GuestListProps {
  guests: Guest[];
  reservations: Reservation[];
  onAddGuest: (guest: Guest) => Promise<void>;
  onUpdateGuest: (guest: Guest) => Promise<void>;
  onDeleteGuest: (guestId: string) => Promise<void>;
}

const GuestList: React.FC<GuestListProps> = ({ guests, reservations, onAddGuest, onUpdateGuest, onDeleteGuest }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', idNumber: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
      email: guest.email || '', 
      phone: guest.phone || '', 
      idNumber: guest.idNumber 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingGuest) {
        await onUpdateGuest({ ...formData, id: editingGuest.id });
      } else {
        await onAddGuest({ ...formData, id: crypto.randomUUID() });
      }
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', idNumber: '' });
    } catch (error: any) {
      console.error("Error al guardar huésped:", error);
      if (error.code === 'PGRST205') {
        alert("Error de sincronización: Supabase aún no reconoce la tabla 'guests'. Por favor, re-ejecuta el script SQL y espera 1 minuto.");
      } else {
        alert(`Error: ${error.message || "No se pudieron guardar los datos."}`);
      }
    } finally {
      setIsSaving(false);
    }
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
                <th className="px-10 py-8">Documentación</th>
                <th className="px-10 py-8">Contacto Directo</th>
                <th className="px-10 py-8">Historial de Gasto</th>
                <th className="px-10 py-8 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredGuests.length > 0 ? filteredGuests.map((guest) => {
                const totalAmount = calculateGuestTotal(guest.id);
                return (
                  <tr key={guest.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {guest.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-lg leading-tight">{guest.name}</p>
                          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Huésped</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-800 tracking-tight">{guest.idNumber}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">ID DOCUMENT</p>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-700">{guest.email || 'Sin email'}</p>
                        <p className="text-xs text-gray-400 font-medium">{guest.phone || 'Sin teléfono'}</p>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex flex-col">
                        <span className={`text-2xl font-black tracking-tighter ${totalAmount > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                          ${totalAmount}
                        </span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gasto Total</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleOpenEdit(guest)}
                          className="p-4 bg-white border border-gray-100 text-indigo-600 rounded-2xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all active:scale-90" 
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => { if(window.confirm('¿Eliminar registro?')) onDeleteGuest(guest.id) }}
                          className="p-4 bg-white border border-gray-100 text-rose-500 rounded-2xl shadow-sm hover:bg-rose-500 hover:text-white transition-all active:scale-90" 
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-gray-400">
                    No hay huéspedes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
                {editingGuest ? 'Editar Huésped' : 'Nuevo Registro'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nombre</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:bg-white transition-all font-black text-gray-800 text-lg shadow-inner" placeholder="Alejandro Martínez" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:bg-white transition-all font-bold text-gray-700 shadow-inner" placeholder="ejemplo@correo.com" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Teléfono</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:bg-white transition-all font-bold text-gray-700 shadow-inner" placeholder="+54..." />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Identificación</label>
                  <input required value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:bg-white transition-all font-bold text-gray-700 shadow-inner" placeholder="DNI / PAS" />
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-6 bg-gray-50 rounded-[2rem] font-black text-gray-400 uppercase text-[10px]">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-8 py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl uppercase text-xs flex items-center justify-center disabled:opacity-50">
                  {isSaving ? "Guardando..." : (editingGuest ? 'Actualizar' : 'Guardar')}
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
