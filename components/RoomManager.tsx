
import React, { useState, useRef } from 'react';
import { Room } from '../types';
import { editImage } from '../services/gemini';

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
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    'Disponible': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Ocupada': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
    'Limpieza': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    'Mantenimiento': { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
    'default': { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' }
  };

  const statusLabels: Record<string, string> = {
    'Disponible': 'Libre',
    'Ocupada': 'Ocupada',
    'Limpieza': 'Limpieza',
    'Mantenimiento': 'Mantenimiento',
    'default': 'Desconocido'
  };

  const handleStatusChange = (room: Room, newStatus: Room['status']) => {
    onUpdateRoom({ ...room, status: newStatus });
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({ ...room });
    setIsAdding(false);
    setAiPrompt('');
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
    setAiPrompt('');
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

  const handleAiImageEdit = async () => {
    const currentImg = formData.imageUrl;
    if (!currentImg || !aiPrompt) {
      alert("Sube una imagen primero e ingresa una instrucción para la IA.");
      return;
    }

    setIsProcessingAI(true);
    try {
      const editedBase64 = await editImage(currentImg, aiPrompt);
      if (editedBase64) {
        setFormData(prev => ({ ...prev, imageUrl: editedBase64 }));
      }
    } catch (error) {
      console.error("Error editando imagen con IA:", error);
      alert("No se pudo editar la imagen. Asegúrate de que la clave de API sea válida.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const roomToSave = {
      number: String(formData.number || '000').trim(),
      type: (formData.type as any) || 'Individual',
      status: (formData.status as any) || 'Disponible',
      price: Math.abs(Number(formData.price)) || 0,
      imageUrl: formData.imageUrl,
    };

    if (isAdding) {
      onAddRoom({
        ...roomToSave,
        id: Date.now().toString(),
      } as Room);
    } else if (editingRoom) {
      onUpdateRoom({
        ...editingRoom,
        ...roomToSave,
        id: editingRoom.id
      } as Room);
    }
    
    closeModal();
  };

  const closeModal = () => {
    setEditingRoom(null);
    setIsAdding(false);
    setFormData({});
    setAiPrompt('');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Gestión de Habitaciones</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{rooms.length} Activas</p>
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
        {rooms.map(room => {
          const statusConfig = statusColors[room.status] || statusColors.default;
          return (
            <div key={room.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-500 flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={room.imageUrl || `https://picsum.photos/seed/room${room.id}/800/600`} 
                  alt={room.number} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button onClick={() => handleOpenEdit(room)} className="p-3 bg-white/90 backdrop-blur text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white shadow-xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onDeleteRoom(room.id)} className="p-3 bg-rose-50/90 backdrop-blur text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white shadow-xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} border border-white/20 shadow-md`}>
                  {statusLabels[room.status]}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-800">Hab. {room.number}</h3>
                    <p className="text-gray-400 text-[10px] font-bold uppercase">{room.type}</p>
                  </div>
                  <p className="text-xl font-black text-indigo-600">${room.price}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['Disponible', 'Limpieza', 'Mantenimiento', 'Ocupada'] as Room['status'][]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(room, s)}
                      className={`py-2 text-[9px] font-black rounded-lg border transition-all ${room.status === s ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(editingRoom || isAdding) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-3xl font-black text-gray-800 mb-8 tracking-tight">
              {isAdding ? 'Crear Habitación' : 'Editar Habitación'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="relative group aspect-video rounded-3xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img 
                      src={formData.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400'} 
                      className="w-full h-full object-cover" 
                      alt="Preview"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <span className="text-white font-black uppercase text-xs">Cambiar Foto</span>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Edición Mágica con IA</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="Ej: Añadir plantas y luz cálida..."
                        className="flex-1 p-3 bg-white border border-indigo-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleAiImageEdit}
                        disabled={isProcessingAI || !formData.imageUrl}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        {isProcessingAI ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número</label>
                      <input required type="text" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-gray-700" placeholder="101" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio ($)</label>
                      <input required type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-gray-700" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                    <select value={formData.type || 'Individual'} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-gray-700">
                      <option value="Individual">Individual</option>
                      <option value="Doble">Doble</option>
                      <option value="Suite">Suite</option>
                      <option value="Dormitorio">Dormitorio</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado Inicial</label>
                    <select value={formData.status || 'Disponible'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-gray-700">
                      <option value="Disponible">Disponible</option>
                      <option value="Limpieza">Limpieza</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Ocupada">Ocupada</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-6 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 border border-gray-100 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 uppercase tracking-widest text-[10px]">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase tracking-widest text-[10px]">
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
