
import React, { useState, useRef, useEffect } from 'react';
import { Room } from '../types';
import { uploadRoomImage } from '../services/supabase';

interface RoomManagerProps {
  rooms: Room[];
  roomTypes: string[];
  onUpdateRoom: (room: Room) => void;
  onAddRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onUpdateRoomTypes: (types: string[]) => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({ 
  rooms, 
  roomTypes, 
  onUpdateRoom, 
  onAddRoom, 
  onDeleteRoom, 
  onUpdateRoomTypes 
}) => {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [formData, setFormData] = useState<Partial<Room>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Estados para la edición de tipos
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);
  const [tempTypeName, setTempTypeName] = useState('');

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraActive, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let finalImageUrl = formData.image_url;

      if (formData.image_url?.startsWith('data:image')) {
        const id = isAdding ? `temp-${Date.now()}` : (editingRoom?.id || '0');
        const cloudUrl = await uploadRoomImage(id, formData.image_url);
        if (cloudUrl) finalImageUrl = cloudUrl;
      }

      const roomToSave = {
        number: String(formData.number || '000').trim(),
        type: formData.type || roomTypes[0] || 'Individual',
        status: (formData.status as any) || 'Disponible',
        price: Math.abs(Number(formData.price)) || 0,
        image_url: finalImageUrl,
      };

      if (isAdding) {
        onAddRoom({ ...roomToSave, id: crypto.randomUUID() } as Room);
      } else if (editingRoom) {
        onUpdateRoom({ ...editingRoom, ...roomToSave } as Room);
      }
      closeModal();
    } catch (err) {
      console.error("Save error:", err);
      alert("Error al guardar en la nube.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddType = () => {
    if (newTypeName.trim() && !roomTypes.includes(newTypeName.trim())) {
      onUpdateRoomTypes([...roomTypes, newTypeName.trim()]);
      setNewTypeName('');
    }
  };

  const handleRemoveType = (typeToRemove: string) => {
    if (roomTypes.length <= 1) {
      alert("Debes tener al menos un tipo de habitación definido.");
      return;
    }
    const isUsed = rooms.some(r => r.type === typeToRemove);
    if (isUsed) {
      alert("No puedes eliminar este tipo porque hay habitaciones que lo utilizan actualmente.");
      return;
    }
    onUpdateRoomTypes(roomTypes.filter(t => t !== typeToRemove));
  };

  const startEditType = (index: number, name: string) => {
    setEditingTypeIndex(index);
    setTempTypeName(name);
  };

  const cancelEditType = () => {
    setEditingTypeIndex(null);
    setTempTypeName('');
  };

  const handleSaveTypeEdit = (oldName: string) => {
    const newName = tempTypeName.trim();
    if (!newName || newName === oldName) {
      cancelEditType();
      return;
    }
    if (roomTypes.includes(newName)) {
      alert("Este tipo ya existe en la lista.");
      return;
    }

    // Actualizar todas las habitaciones que tengan el tipo antiguo
    const affectedRooms = rooms.filter(r => r.type === oldName);
    if (affectedRooms.length > 0) {
      if (window.confirm(`Esto actualizará ${affectedRooms.length} habitaciones con el nuevo nombre "${newName}". ¿Deseas continuar?`)) {
        affectedRooms.forEach(room => {
          onUpdateRoom({ ...room, type: newName });
        });
      } else {
        return;
      }
    }

    const newTypes = [...roomTypes];
    newTypes[editingTypeIndex!] = newName;
    onUpdateRoomTypes(newTypes);
    cancelEditType();
  };

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
    'Mantenimiento': 'Mantenimiento'
  };

  const handleStatusChange = (room: Room, newStatus: Room['status']) => {
    onUpdateRoom({ ...room, status: newStatus });
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({ ...room });
    setIsAdding(false);
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      number: '',
      type: roomTypes[0] || 'Individual',
      status: 'Disponible',
      price: 0
    });
    setIsAdding(true);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err) {
      alert("Error cámara: " + err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, image_url: dataUrl }));
        stopCamera();
      }
    }
  };

  const closeModal = () => {
    stopCamera();
    setEditingRoom(null);
    setIsAdding(false);
    setFormData({});
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Inventario en la Nube</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">{rooms.length} Habitaciones • {roomTypes.length} Categorías</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowTypeManager(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-6 py-4 rounded-2xl font-black flex items-center transition-all active:scale-95 uppercase text-[10px] tracking-widest border border-indigo-100"
          >
            Gestionar Tipos
          </button>
          <button 
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase text-[10px] tracking-widest"
          >
            Añadir Habitación
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {rooms.map(room => {
          const statusConfig = statusColors[room.status] || statusColors.default;
          return (
            <div key={room.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-500 flex flex-col">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={room.image_url || `https://picsum.photos/seed/room${room.id}/800/600`} 
                  alt={room.number} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleOpenEdit(room)} className="p-3 bg-white/90 backdrop-blur text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white shadow-xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onDeleteRoom(room.id)} className="p-3 bg-rose-50/90 backdrop-blur text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white shadow-xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} border border-white/20 shadow-lg backdrop-blur-sm`}>
                  {statusLabels[room.status]}
                </div>
              </div>
              <div className="p-7">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">Hab. {room.number}</h3>
                    <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{room.type}</p>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tracking-tighter">${room.price}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['Disponible', 'Limpieza', 'Mantenimiento', 'Ocupada'] as Room['status'][]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(room, s)}
                      className={`py-2.5 text-[9px] font-black rounded-xl border transition-all ${room.status === s ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-indigo-200'}`}
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

      {/* Modal Gestor de Tipos */}
      {showTypeManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[60] p-6 animate-in fade-in duration-300" onClick={() => { setShowTypeManager(false); cancelEditType(); }}>
          <div className="bg-white rounded-[3.5rem] p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Categorías</h2>
              <button onClick={() => { setShowTypeManager(false); cancelEditType(); }} className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newTypeName} 
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="Nueva categoría (Ej: Suite)..."
                  className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700"
                />
                <button 
                  onClick={handleAddType}
                  className="bg-indigo-600 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                  Añadir
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {roomTypes.map((type, index) => (
                  <div key={type} className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:border-indigo-100">
                    {editingTypeIndex === index ? (
                      <div className="flex gap-2 w-full">
                        <input 
                          type="text" 
                          autoFocus
                          value={tempTypeName} 
                          onChange={e => setTempTypeName(e.target.value)}
                          className="flex-1 p-2 bg-white border border-indigo-400 rounded-lg focus:outline-none font-bold text-gray-700 uppercase text-xs"
                        />
                        <button onClick={() => handleSaveTypeEdit(type)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button onClick={cancelEditType} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <span className="font-black text-gray-700 text-sm uppercase tracking-wider">{type}</span>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => startEditType(index, type)}
                            className="p-2 text-indigo-400 hover:text-indigo-600 bg-white rounded-lg shadow-sm border border-gray-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button 
                            onClick={() => handleRemoveType(type)}
                            className="p-2 text-rose-300 hover:text-rose-500 bg-white rounded-lg shadow-sm border border-gray-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => { setShowTypeManager(false); cancelEditType(); }} className="w-full mt-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">
              Cerrar Gestor
            </button>
          </div>
        </div>
      )}

      {/* Modal Edición de Habitación */}
      {(editingRoom || isAdding) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[4rem] p-10 max-w-2xl w-full shadow-2xl my-auto relative animate-in zoom-in duration-300">
            <button onClick={closeModal} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 z-10 transition-colors">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-3xl font-black text-gray-800 mb-8 tracking-tight">
              {isAdding ? 'Nueva Habitación' : 'Editar Habitación'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="relative group aspect-square rounded-[2.5rem] overflow-hidden border-4 border-gray-50 bg-gray-100 shadow-inner flex items-center justify-center bg-slate-50">
                    {isCameraActive ? (
                      <div className="relative w-full h-full flex flex-col bg-black">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6 px-6 z-20">
                           <button type="button" onClick={capturePhoto} className="p-6 bg-white text-indigo-600 rounded-full shadow-2xl active:scale-90 transition-transform">
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                           </button>
                           <button type="button" onClick={stopCamera} className="p-6 bg-rose-500 text-white rounded-full shadow-2xl active:scale-90 transition-transform">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6" /></svg>
                           </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={formData.image_url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'} 
                          className="w-full h-full object-cover" 
                          alt="Preview"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-y-4 backdrop-blur-sm">
                          <button type="button" onClick={startCamera} className="bg-white/95 backdrop-blur px-8 py-3.5 rounded-2xl flex items-center space-x-3 shadow-2xl hover:bg-indigo-600 hover:text-white transition-all w-52 justify-center">
                            <span className="font-black uppercase text-[10px] tracking-widest">Tomar Foto</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número</label>
                      <input required type="text" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-black text-gray-700 text-lg" placeholder="101" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio por Noche</label>
                      <input required type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-black text-gray-700 text-lg" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Habitación</label>
                    <select 
                      value={formData.type || roomTypes[0]} 
                      onChange={e => setFormData({...formData, type: e.target.value})} 
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700 appearance-none"
                    >
                      {roomTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-8 flex flex-col space-y-4">
                    <button 
                      type="submit" 
                      disabled={isUploading}
                      className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center uppercase tracking-widest text-xs"
                    >
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      ) : null}
                      {isAdding ? 'Guardar en la Nube' : 'Actualizar Cambios'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default RoomManager;
