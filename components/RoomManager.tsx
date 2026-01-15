
import React, { useState, useRef, useEffect } from 'react';
import { Room } from '../types';

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
  const [formData, setFormData] = useState<Partial<Room>>({});
  const [newTypeInput, setNewTypeInput] = useState('');
  
  // States for Type Editing
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);
  const [editingTypeText, setEditingTypeText] = useState('');

  // Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Asegurar que el video se conecte al stream cuando el elemento se renderice
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraActive, cameraStream]);

  // Limpiar recursos al desmontar o cerrar
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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
      alert("No se pudo acceder a la cámara. Por favor, asegúrate de otorgar permisos en tu navegador.");
      console.error(err);
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
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        stopCamera();
      }
    }
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanType = newTypeInput.trim();
    if (cleanType && !roomTypes.includes(cleanType)) {
      onUpdateRoomTypes([...roomTypes, cleanType]);
      setNewTypeInput('');
    }
  };

  const handleStartEditType = (index: number, text: string) => {
    setEditingTypeIndex(index);
    setEditingTypeText(text);
  };

  const handleSaveTypeEdit = (index: number) => {
    const cleanNewText = editingTypeText.trim();
    if (cleanNewText && cleanNewText !== roomTypes[index]) {
      // Evitar duplicados
      if (roomTypes.some((t, i) => i !== index && t.toLowerCase() === cleanNewText.toLowerCase())) {
        alert("Este tipo ya existe en el catálogo.");
        setEditingTypeIndex(null);
        return;
      }
      const newTypes = [...roomTypes];
      newTypes[index] = cleanNewText;
      onUpdateRoomTypes(newTypes);
    }
    setEditingTypeIndex(null);
  };

  const handleRemoveType = (typeToRemove: string) => {
    const isUsed = rooms.some(r => r.type === typeToRemove);
    const message = isUsed 
      ? `El tipo "${typeToRemove}" está asignado a algunas habitaciones. ¿Seguro que quieres quitarlo de las opciones futuras?`
      : `¿Estás seguro de que deseas quitar el tipo "${typeToRemove}" del catálogo?`;

    if (window.confirm(message)) {
      onUpdateRoomTypes(roomTypes.filter(t => t !== typeToRemove));
    }
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
    stopCamera();
    
    const roomToSave = {
      number: String(formData.number || '000').trim(),
      type: formData.type || roomTypes[0] || 'Individual',
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
    stopCamera();
    setEditingRoom(null);
    setIsAdding(false);
    setFormData({});
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Gestión de Habitaciones</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{rooms.length} Activas</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowTypeManager(true)}
            className="bg-gray-50 hover:bg-gray-100 text-gray-500 p-4 rounded-2xl transition-all active:scale-95 group flex items-center space-x-2"
            title="Configurar Tipos"
          >
            <svg className="w-5 h-5 group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Tipos</span>
          </button>
          <button 
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center shadow-2xl shadow-indigo-100 transition-all active:scale-95 group uppercase text-[10px] tracking-widest"
          >
            <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Nueva
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {rooms.map(room => {
          const statusConfig = statusColors[room.status] || statusColors.default;
          return (
            <div key={room.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-500 flex flex-col">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={room.imageUrl || `https://picsum.photos/seed/room${room.id}/800/600`} 
                  alt={room.number} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

      {/* MODAL: Gestión de Tipos */}
      {showTypeManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Tipos de Habitación</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configuración del Catálogo</p>
              </div>
              <button onClick={() => setShowTypeManager(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddType} className="mb-8 shrink-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2">Añadir Nuevo Tipo</label>
              <div className="flex space-x-3">
                <input 
                  type="text" 
                  value={newTypeInput}
                  onChange={e => setNewTypeInput(e.target.value)}
                  placeholder="Ej: Deluxe, Familiar..."
                  className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700"
                />
                <button 
                  type="submit"
                  disabled={!newTypeInput.trim()}
                  className="bg-indigo-600 text-white px-6 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="space-y-2">
                {roomTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-100 hover:bg-white transition-all">
                    {editingTypeIndex === index ? (
                      <input 
                        autoFocus
                        type="text"
                        value={editingTypeText}
                        onChange={e => setEditingTypeText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveTypeEdit(index); if (e.key === 'Escape') setEditingTypeIndex(null); }}
                        onBlur={() => handleSaveTypeEdit(index)}
                        className="flex-1 bg-white border border-indigo-200 px-3 py-1 rounded-lg font-black text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    ) : (
                      <span 
                        className="font-black text-gray-700 text-sm flex-1 cursor-pointer hover:text-indigo-600 transition-colors"
                        onClick={() => handleStartEditType(index, type)}
                        title="Clic para editar"
                      >
                        {type}
                      </span>
                    )}
                    
                    <div className="flex items-center space-x-2 ml-4">
                       {editingTypeIndex !== index && (
                         <button 
                            onClick={() => handleStartEditType(index, type)}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Editar nombre"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                       )}
                      <button 
                        onClick={() => handleRemoveType(type)}
                        className="flex items-center space-x-2 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setShowTypeManager(false)}
              className="w-full mt-8 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shrink-0"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edición/Añadir Habitación */}
      {(editingRoom || isAdding) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl my-auto relative">
            <button onClick={closeModal} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 z-10">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-3xl font-black text-gray-800 mb-8 tracking-tight">
              {isAdding ? 'Añadir Nueva Habitación' : 'Editar Habitación'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="relative group aspect-square rounded-[2rem] overflow-hidden border-4 border-gray-50 bg-gray-100 shadow-inner group flex items-center justify-center bg-slate-50">
                    
                    {isCameraActive ? (
                      <div className="relative w-full h-full flex flex-col bg-black">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6 px-6 z-20">
                           <button type="button" onClick={capturePhoto} className="p-6 bg-white text-indigo-600 rounded-full shadow-2xl active:scale-90 transition-transform border-4 border-indigo-100">
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                           </button>
                           <button type="button" onClick={stopCamera} className="p-6 bg-rose-500 text-white rounded-full shadow-2xl active:scale-90 transition-transform">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={formData.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'} 
                          className="w-full h-full object-cover transition-all duration-700" 
                          alt="Preview"
                        />
                        
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-y-4">
                          <button type="button" onClick={startCamera} className="bg-white/95 backdrop-blur px-8 py-3.5 rounded-2xl flex items-center space-x-3 shadow-2xl hover:bg-indigo-600 hover:text-white transition-all w-52 justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="font-black uppercase text-[10px] tracking-widest">Usar Cámara</span>
                          </button>
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white/95 backdrop-blur px-8 py-3.5 rounded-2xl flex items-center space-x-3 shadow-2xl hover:bg-indigo-600 hover:text-white transition-all w-52 justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span className="font-black uppercase text-[10px] tracking-widest">Subir Archivo</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número Habitación</label>
                      <input required type="text" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700 text-lg" placeholder="101" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio por Noche ($)</label>
                      <input required type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700 text-lg" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Habitación</label>
                    <select 
                      value={formData.type || roomTypes[0] || 'Individual'} 
                      onChange={e => setFormData({...formData, type: e.target.value})} 
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700"
                    >
                      {roomTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      {roomTypes.length === 0 && <option value="Individual">Individual (Defecto)</option>}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                    <select value={formData.status || 'Disponible'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold text-gray-700">
                      <option value="Disponible">Disponible</option>
                      <option value="Limpieza">En Limpieza</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Ocupada">Ocupada</option>
                    </select>
                  </div>

                  <div className="pt-8 flex flex-col space-y-4">
                    <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-100 uppercase tracking-widest text-sm transition-all active:scale-[0.98]">
                      {isAdding ? 'Registrar Habitación' : 'Confirmar Cambios'}
                    </button>
                    <button type="button" onClick={closeModal} className="w-full py-5 bg-gray-50 text-gray-400 rounded-[1.8rem] font-black hover:bg-gray-100 uppercase tracking-widest text-[10px] transition-all">
                      Descartar
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManager;
