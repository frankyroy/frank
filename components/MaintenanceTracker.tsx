
import React, { useState, useEffect } from 'react';
import { MaintenanceTask, Room } from '../types';

interface MaintenanceTrackerProps {
  tasks: MaintenanceTask[];
  rooms: Room[];
  onUpdateTask: (task: MaintenanceTask) => void;
  onAddTask: (task: MaintenanceTask) => void;
}

const COMMON_AREAS = [
  'Áreas Sociales',
  'Comedor',
  'Hamacas',
  'Garage',
  'Piscina',
  'Lavandería',
  'Jardinería'
];

const MaintenanceTracker: React.FC<MaintenanceTrackerProps> = ({ tasks, rooms, onUpdateTask, onAddTask }) => {
  const [showForm, setShowForm] = useState(false);
  const [locationType, setLocationType] = useState<'room' | 'area'>('room');
  const [newTask, setNewTask] = useState({ 
    room_id: '', 
    area: '', 
    description: '', 
    priority: 'Media' as any 
  });

  useEffect(() => {
    if (rooms.length > 0 && !newTask.room_id) {
      setNewTask(prev => ({ ...prev, room_id: rooms[0].id }));
    }
    if (!newTask.area) {
      setNewTask(prev => ({ ...prev, area: COMMON_AREAS[0] }));
    }
  }, [rooms, showForm]);

  const priorityColors = {
    'Baja': 'bg-blue-50 text-blue-600 border-blue-100',
    'Media': 'bg-amber-50 text-amber-600 border-amber-100',
    'Alta': 'bg-rose-50 text-rose-600 border-rose-100'
  };

  const statusLabels = {
    'Pendiente': 'Pendiente',
    'En Progreso': 'En Proceso',
    'Completado': 'Finalizado'
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: any = {
      id: crypto.randomUUID(),
      description: newTask.description,
      priority: newTask.priority,
      status: 'Pendiente',
      created_at: new Date().toISOString()
    };

    if (locationType === 'room') {
      taskData.room_id = newTask.room_id;
    } else {
      taskData.area = newTask.area;
    }
    
    onAddTask(taskData as MaintenanceTask);
    setShowForm(false);
    setNewTask({ 
      room_id: rooms[0]?.id || '', 
      area: COMMON_AREAS[0], 
      description: '', 
      priority: 'Media' 
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Control de Mantenimiento</h2>
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mt-1">Gestión de incidencias en habitaciones y áreas comunes.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center shadow-xl shadow-indigo-100 transition-all active:scale-95 group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Reportar Incidencia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tasks.map(task => {
          const room = task.room_id ? rooms.find(r => r.id === task.room_id) : null;
          return (
            <div key={task.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500 group border-b-4 border-b-transparent hover:border-b-indigo-500">
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                    {new Date(task.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-800 mb-1 flex items-center">
                    {task.area ? (
                      <><span className="mr-2">📍</span> {task.area}</>
                    ) : (
                      <><span className="mr-2 text-indigo-400">🏠</span> Habitación {room?.number || '??'}</>
                    )}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium line-clamp-3">{task.description}</p>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'Completado' ? 'bg-emerald-500' :
                    task.status === 'En Progreso' ? 'bg-amber-500 animate-pulse' :
                    'bg-slate-300'
                  }`} />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{statusLabels[task.status as keyof typeof statusLabels]}</span>
                </div>
                <div className="flex space-x-2">
                  {task.status !== 'Completado' && (
                    <button 
                      onClick={() => onUpdateTask({ ...task, status: 'Completado' })}
                      className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all duration-300 active:scale-90 border border-emerald-100"
                      title="Marcar Finalizado"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </button>
                  )}
                  {task.status === 'Pendiente' && (
                    <button 
                       onClick={() => onUpdateTask({ ...task, status: 'En Progreso' })}
                       className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all duration-300 active:scale-90 border border-indigo-100"
                       title="Iniciar Reparación"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="bg-emerald-50 p-6 rounded-[2rem] mb-6">
               <svg className="w-16 h-16 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-gray-800 font-black uppercase tracking-[0.2em] text-sm">Todo en perfecto estado</p>
            <p className="text-gray-400 text-xs mt-2 font-medium">No hay averías activas ni pendientes.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-gray-800 mb-6 tracking-tight">Reportar Incidencia</h2>
            
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
              <button 
                type="button"
                onClick={() => setLocationType('room')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${locationType === 'room' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                Habitación
              </button>
              <button 
                type="button"
                onClick={() => setLocationType('area')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${locationType === 'area' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                Zona Común
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              {locationType === 'room' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Habitación Afectada</label>
                  <select 
                    required 
                    value={newTask.room_id} 
                    onChange={e => setNewTask({...newTask, room_id: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none font-bold text-gray-700"
                  >
                    <option value="" disabled>Seleccionar habitación</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>Habitación {r.number}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Área o Zona</label>
                  <select 
                    required 
                    value={newTask.area} 
                    onChange={e => setNewTask({...newTask, area: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none font-bold text-gray-700"
                  >
                    {COMMON_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción del Problema</label>
                <textarea 
                  required 
                  value={newTask.description} 
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Explica detalladamente qué sucede..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32 font-medium resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nivel de Prioridad</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Baja', 'Media', 'Alta'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTask({...newTask, priority: p})}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        newTask.priority === p 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-white hover:border-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-6 py-4 border border-gray-100 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 active:scale-95 transition-all">Descartar</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all">Enviar Reporte</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceTracker;
