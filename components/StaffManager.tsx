
import React, { useState, useMemo } from 'react';
import { Staff, StaffTask, StaffMessage } from '../types';

interface StaffManagerProps {
  staff: Staff[];
  onAddStaff: (member: Staff) => Promise<void>;
  onUpdateStaff: (member: Staff) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
}

const ROLES = ['Recepción', 'Limpieza', 'Mantenimiento', 'Administración', 'Cocina'];
const SHIFTS = ['Mañana', 'Tarde', 'Noche', 'Rotativo'];

const roleColors: Record<string, string> = {
  'Recepción': 'bg-indigo-100 text-indigo-600',
  'Limpieza': 'bg-amber-100 text-amber-600',
  'Mantenimiento': 'bg-rose-100 text-rose-600',
  'Administración': 'bg-slate-800 text-white',
  'Cocina': 'bg-emerald-100 text-emerald-600'
};

const StaffManager: React.FC<StaffManagerProps> = ({ staff, onAddStaff, onUpdateStaff, onDeleteStaff }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState<Staff | null>(null);
  const [activeTab, setActiveTab] = useState<'tareas' | 'notas' | 'mensajes'>('tareas');
  const [editingMember, setEditingMember] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    role: 'Recepción',
    phone: '',
    email: '',
    shift: 'Mañana'
  });

  // Auxiliares para el panel de detalles
  const [newTask, setNewTask] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const filteredStaff = useMemo(() => {
    return staff.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({ name: '', role: 'Recepción', phone: '', email: '', shift: 'Mañana' });
    setShowModal(true);
  };

  const handleOpenEdit = (member: Staff) => {
    setEditingMember(member);
    setFormData(member);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingMember) {
      await onUpdateStaff({ ...editingMember, ...formData } as Staff);
    } else {
      await onAddStaff({ 
        ...formData, 
        id: crypto.randomUUID(),
        tasks: [],
        messages: [],
        notes: ''
      } as Staff);
    }
    setShowModal(false);
  };

  // Funciones para gestionar tareas/notas/mensajes
  const updateStaffExtras = async (member: Staff, updates: Partial<Staff>) => {
    const updated = { ...member, ...updates };
    await onUpdateStaff(updated);
    setShowDetails(updated);
  };

  const addTask = () => {
    if (!newTask.trim() || !showDetails) return;
    const tasks = [...(showDetails.tasks || []), { id: crypto.randomUUID(), text: newTask, completed: false }];
    updateStaffExtras(showDetails, { tasks });
    setNewTask('');
  };

  const toggleTask = (taskId: string) => {
    if (!showDetails) return;
    const tasks = showDetails.tasks?.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    updateStaffExtras(showDetails, { tasks });
  };

  const addMessage = () => {
    if (!newMessage.trim() || !showDetails) return;
    const messages = [...(showDetails.messages || []), { 
      id: crypto.randomUUID(), 
      text: newMessage, 
      sender: 'Admin', 
      date: new Date().toLocaleString() 
    }];
    updateStaffExtras(showDetails, { messages });
    setNewMessage('');
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
            placeholder="Buscar por nombre o cargo..." 
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all font-medium text-gray-700 shadow-inner"
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
          Añadir Empleado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredStaff.map((member) => (
          <div key={member.id} className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            
            <div className="relative flex items-center space-x-6 mb-8">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-100 shrink-0">
                {member.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight truncate">{member.name}</h3>
                <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mt-2 ${roleColors[member.role] || 'bg-gray-100 text-gray-600'}`}>
                  {member.role}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turno</span>
                <span className="font-bold text-gray-700">{member.shift}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tareas</span>
                <span className="font-bold text-indigo-600">
                  {member.tasks?.filter(t => t.completed).length || 0}/{member.tasks?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto</span>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-gray-700 text-xs">{member.phone}</span>
                  {member.phone && (
                    <a href={formatWhatsAppLink(member.phone)} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.661 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-50">
              <button 
                onClick={() => setShowDetails(member)}
                className="flex-1 py-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
              >
                Gestionar Notas/Tareas
              </button>
              <div className="flex space-x-2">
                <button onClick={() => handleOpenEdit(member)} className="p-4 bg-gray-50 text-gray-400 hover:bg-gray-200 rounded-2xl transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => { if(window.confirm('¿Eliminar empleado?')) onDeleteStaff(member.id) }} className="p-4 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Principal (Nuevo/Editar) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter text-center mb-10">{editingMember ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nombre Completo</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black text-gray-800" placeholder="Ej: Elena Ruiz" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Cargo / Rol</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 appearance-none">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Turno</label>
                  <select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value as any})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 appearance-none">
                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Teléfono de Contacto</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800" placeholder="+34 600 000 000" />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 bg-gray-50 rounded-[1.8rem] font-black text-gray-400 uppercase text-[10px]">Cancelar</button>
                <button type="submit" className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black shadow-lg uppercase text-xs transition-all active:scale-95">Sincronizar Equipo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Panel de Detalles (Notas, Tareas, Mensajes) */}
      {showDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[60] p-6" onClick={() => setShowDetails(null)}>
          <div className="bg-white rounded-[4rem] p-10 max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black">
                  {showDetails.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Gestión de {showDetails.name}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{showDetails.role} • Turno {showDetails.shift}</p>
                </div>
              </div>
              <button onClick={() => setShowDetails(null)} className="p-4 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
              {(['tareas', 'notas', 'mensajes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {activeTab === 'tareas' && (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={newTask} 
                      onChange={e => setNewTask(e.target.value)} 
                      placeholder="Añadir nueva tarea..." 
                      className="flex-1 p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={addTask} className="px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Añadir</button>
                  </div>
                  <div className="space-y-3">
                    {showDetails.tasks?.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:border-indigo-100">
                        <div className="flex items-center space-x-4">
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}
                          >
                            {task.completed && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <span className={`font-bold text-gray-700 ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.text}</span>
                        </div>
                        <button onClick={() => {
                          const tasks = showDetails.tasks?.filter(t => t.id !== task.id);
                          updateStaffExtras(showDetails, { tasks });
                        }} className="p-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notas' && (
                <div className="h-full flex flex-col space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas de Desempeño / Privadas</p>
                  <textarea
                    value={showDetails.notes || ''}
                    onChange={e => updateStaffExtras(showDetails, { notes: e.target.value })}
                    placeholder="Escribe notas internas aquí... (se guardan automáticamente)"
                    className="flex-1 w-full p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-gray-700 resize-none h-full"
                  />
                </div>
              )}

              {activeTab === 'mensajes' && (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={newMessage} 
                      onChange={e => setNewMessage(e.target.value)} 
                      placeholder="Enviar un comunicado/alerta..." 
                      className="flex-1 p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={addMessage} className="px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Enviar</button>
                  </div>
                  <div className="space-y-4">
                    {showDetails.messages?.slice().reverse().map(msg => (
                      <div key={msg.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm relative">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{msg.sender}</span>
                           <span className="text-[9px] text-gray-400 font-bold">{msg.date}</span>
                        </div>
                        <p className="text-gray-700 font-medium">{msg.text}</p>
                        <button onClick={() => {
                          const messages = showDetails.messages?.filter(m => m.id !== msg.id);
                          updateStaffExtras(showDetails, { messages });
                        }} className="absolute top-4 right-4 text-gray-200 hover:text-rose-500">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setShowDetails(null)} className="w-full mt-8 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">
              Finalizar Gestión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
