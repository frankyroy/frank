
import React, { useState, useRef } from 'react';
import { Room } from '../types';

interface RoomManagerProps {
  rooms: Room[];
  onUpdateRoom: (room: Room) => void;
  onAddRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({ rooms, onUpdateRoom, onAddRoom, onDeleteRoom }) => {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Room>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusColors: Record<Room['status'], { bg: string; text: string; dot: string }> = {
    'Disponible': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Ocupada': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
    'Limpieza': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    'Mantenimiento': { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' }
  };

  const statusLabels: Record<Room['status'], string> = {
    'Disponible': 'Libre',
    'Ocupada': 'Ocupada',
    'Limpieza': 'Limpieza',
    'Mantenimiento': 'Mantenimiento'
  };

  const handleStatusChange = (room: Room, newStatus: Room['status']) => {
    onUpdateRoom({ ...room, status: newStatus });
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData(room);
    setIsAdding(false);
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      number: '',
      type: 'Individual',
      status: 'Disponible',
      price: 0
    });
    setIsAdding(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) {
      const newRoom: Room = {
        ...formData,
        id: Date.now().toString(),
      } as Room;
      onAddRoom(newRoom);
      setIsAdding(false);
    } else if (editingRoom && formData) {
      onUpdateRoom({ ...editingRoom, ...formData } as Room);
      setEditingRoom(null);
    }
  };

  const handleDelete = (id: string) => {
    onDeleteRoom(id);
    setEditingRoom(null);
  };

  const closeModal = () => {
    setEditingRoom(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Inventario de Habitaciones</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{rooms.length} Habitaciones totales</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center shadow-2xl shadow-indigo-100 transition-all active:scale-95 group uppercase text-xs tracking-widest"
        >
          <svg className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Nueva Habitación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500 flex flex-col relative">
            <div className="relative h-56 overflow-hidden">
              <img 
                src={room.imageUrl || `https://picsum.photos/seed/room${room.id}/800/600`} 
                alt={`Habitación ${room.number}`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="absolute top-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <button 
                  onClick={() => handleOpenEdit(room)}
                  className="p-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-2xl hover:bg-white hover:text-indigo-600 shadow-xl transition-all"
                  title="Editar Habitación"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(room.id);
                  }}
                  className="p-3 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-white rounded-2xl hover:bg-rose-500 hover:text-white shadow-xl transition-all"
                  title="Eliminar Habitación"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center space-x-2 backdrop-blur-md border border-white/20 ${statusColors[room.status].bg} ${statusColors[room.status].text}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusColors[room.status].dot}`}></div>
                <span>{statusLabels[room.status]}</span>
              </div>
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                 <p className="text-xs font-medium uppercase tracking-widest text-white/80">Planta {room.number.charAt(0)}</p>
                 <p className="text-lg font-bold">Configuración {room.type}</p>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Habitación {room.number}</h3>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{room.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-600">${room.price}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Por Noche</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Cambiar Estado Rápido</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Disponible', 'Limpieza', 'Mantenimiento', 'Ocupada'] as Room['status'][]).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(room, status)}
                      className={`px-4 py-2.5 text-[10px] rounded-xl font-black uppercase tracking-wider border transition-all duration-300 active:scale-95 ${
                        room.status === status 
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'border-gray-100 bg-gray-50/50 text-gray-400 hover:border-gray-300 hover:bg-white hover:text-gray-600'
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(editingRoom || isAdding) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 my-8">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                {isAdding ? 'Nueva Habitación' : 'Editar Habitación'}
              </h2>
              {editingRoom && (
                <button 
                  type="button"
                  onClick={() => handleDelete(editingRoom.id)}
                  className="p-3 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"
                  title="Eliminar esta habitación"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              {/* Image Preview and Edit Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fotografía de la Habitación</label>
                <div className="relative group rounded-3xl overflow-hidden h-48 border border-gray-100 bg-gray-50">
                  <img 
                    src={formData.imageUrl || (editingRoom ? `https://picsum.photos/seed/room${editingRoom.id}/800/600` : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=800')} 
                    className="w-full h-full object-cover" 
                    alt="Preview"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black shadow-xl flex items-center space-x-2 active:scale-95 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>{formData.imageUrl ? 'Cambiar Foto' : 'Subir Foto'}</span>
                    </button>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número</label>
                  <input 
                    required 
                    type="text"
                    value={formData.number || ''} 
                    onChange={e => setFormData({...formData, number: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700 transition-all"
                    placeholder="Ej. 101"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio ($)</label>
                  <input 
                    required 
                    type="number"
                    value={formData.price || 0} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Habitación</label>
                <select 
                  required 
                  value={formData.type || 'Individual'} 
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700 transition-all"
                >
                  <option value="Individual">Individual</option>
                  <option value="Doble">Doble</option>
                  <option value="Suite">Suite</option>
                  <option value="Dormitorio">Dormitorio</option>
                </select>
              </div>

              {isAdding && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado Inicial</label>
                    <select 
                      required 
                      value={formData.status || 'Disponible'} 
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700 transition-all"
                    >
                      <option value="Disponible">Libre</option>
                      <option value="Limpieza">Limpieza</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
              )}

              <div className="flex space-x-4 pt-6">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="flex-1 px-6 py-4 border border-gray-100 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                  {isAdding ? 'Crear Habitación' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManager;
