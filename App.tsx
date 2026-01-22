
import React, { useState, useMemo, useEffect } from 'react';
import { View, Room, Guest, Reservation, MaintenanceTask, Staff } from './types';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import GuestList from './components/GuestList';
import RoomManager from './components/RoomManager';
import MaintenanceTracker from './components/MaintenanceTracker';
import StaffManager from './components/StaffManager';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [loading, setLoading] = useState(true);

  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [roomsRes, guestsRes, reservationsRes, maintenanceRes, staffRes, typesRes] = await Promise.all([
        supabase.from('rooms').select('*').order('number'),
        supabase.from('guests').select('*').order('name'),
        supabase.from('reservations').select('*'),
        supabase.from('maintenance_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('staff').select('*').order('name'),
        supabase.from('room_types').select('name').order('name')
      ]);

      if (roomsRes.data) setRooms(roomsRes.data);
      if (guestsRes.data) setGuests(guestsRes.data);
      if (reservationsRes.data) setReservations(reservationsRes.data);
      if (maintenanceRes.data) setMaintenance(maintenanceRes.data);
      if (staffRes.data) setStaff(staffRes.data);
      
      if (typesRes.data && typesRes.data.length > 0) {
        setRoomTypes(typesRes.data.map(t => t.name));
      } else {
        // Si no hay tipos en la nube, inicializamos con defaults y los persistimos
        const defaults = ['Individual', 'Doble', 'Suite', 'Dormitorio'];
        setRoomTypes(defaults);
        await supabase.from('room_types').insert(defaults.map(n => ({ name: n })));
      }

    } catch (err) {
      console.error("Error fatal en la comunicación con Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoomTypes = async (newTypes: string[]) => {
    try {
      // 1. Obtener tipos actuales de la DB para comparar
      const { data: currentDbTypes } = await supabase.from('room_types').select('name');
      const currentNames = currentDbTypes?.map(t => t.name) || [];

      // 2. Determinar qué añadir y qué borrar
      const toDelete = currentNames.filter(name => !newTypes.includes(name));
      const toAdd = newTypes.filter(name => !currentNames.includes(name)).map(name => ({ name }));

      // Ejecutar cambios en la nube
      if (toDelete.length > 0) {
        const { error } = await supabase.from('room_types').delete().in('name', toDelete);
        if (error) throw error;
      }

      if (toAdd.length > 0) {
        const { error } = await supabase.from('room_types').insert(toAdd);
        if (error) throw error;
      }

      // Actualizar estado local solo tras éxito en DB
      setRoomTypes([...newTypes].sort());
      
    } catch (err: any) {
      console.error("Error al sincronizar tipos de habitación:", err);
      alert(`Error Cloud: ${err.message || "No se pudo guardar la nueva categoría."}`);
      
      // Intentar restaurar estado desde la nube para evitar desincronización
      const { data } = await supabase.from('room_types').select('name').order('name');
      if (data) setRoomTypes(data.map(t => t.name));
    }
  };

  const handleAddRoom = async (room: Room) => {
    const { data, error } = await supabase.from('rooms').insert([room]).select();
    if (error) throw error;
    if (data) setRooms(prev => [...prev, data[0]]);
  };

  const handleUpdateRoom = async (updatedRoom: Room) => {
    const { error } = await supabase.from('rooms').update(updatedRoom).eq('id', updatedRoom.id);
    if (error) throw error;
    setRooms(prev => prev.map(rm => rm.id === updatedRoom.id ? updatedRoom : rm));
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (window.confirm('¿Eliminar esta habitación de la nube permanentemente?')) {
      const { error } = await supabase.from('rooms').delete().eq('id', roomId);
      if (error) throw error;
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  };

  const handleAddGuest = async (guest: Guest) => {
    const { data, error } = await supabase.from('guests').insert([guest]).select();
    if (error) throw error;
    if (data) setGuests(prev => [...prev, data[0]]);
  };

  const handleUpdateGuest = async (updatedGuest: Guest) => {
    const { error } = await supabase.from('guests').update(updatedGuest).eq('id', updatedGuest.id);
    if (error) throw error;
    setGuests(prev => prev.map(g => g.id === updatedGuest.id ? updatedGuest : g));
  };

  const handleAddReservation = async (res: Reservation) => {
    const { data, error } = await supabase.from('reservations').insert([res]).select();
    if (error) throw error;
    if (data) setReservations(prev => [...prev, data[0]]);
  };

  const handleUpdateReservation = async (res: Reservation) => {
    const { error } = await supabase.from('reservations').update(res).eq('id', res.id);
    if (error) throw error;
    setReservations(prev => prev.map(r => r.id === res.id ? res : r));
  };

  const contextValue = useMemo(() => ({
    rooms, guests, reservations, maintenance, staff, roomTypes,
    setRooms, setGuests, setReservations, setMaintenance, setStaff, setRoomTypes
  }), [rooms, guests, reservations, maintenance, staff, roomTypes]);

  const renderView = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest animate-pulse">Sincronizando con Cloud...</p>
      </div>
    );

    switch (currentView) {
      case 'Dashboard': return <Dashboard data={contextValue} />;
      case 'Calendar': return (
        <Calendar 
          reservations={reservations} 
          rooms={rooms} 
          guests={guests} 
          onAddReservation={handleAddReservation}
          onUpdateReservation={handleUpdateReservation}
        />
      );
      case 'Guests': return (
        <GuestList 
          guests={guests} 
          rooms={rooms}
          reservations={reservations}
          onAddGuest={handleAddGuest}
          onUpdateGuest={handleUpdateGuest}
          onDeleteGuest={async (id) => {
            const { error } = await supabase.from('guests').delete().eq('id', id);
            if (error) throw error;
            setGuests(prev => prev.filter(g => g.id !== id));
          }}
        />
      );
      case 'Rooms': return (
        <RoomManager 
          rooms={rooms}
          roomTypes={roomTypes}
          onUpdateRoom={handleUpdateRoom} 
          onAddRoom={handleAddRoom}
          onDeleteRoom={handleDeleteRoom}
          onUpdateRoomTypes={handleUpdateRoomTypes}
        />
      );
      case 'Maintenance': return (
        <MaintenanceTracker 
          tasks={maintenance} 
          rooms={rooms} 
          onUpdateTask={async (t) => {
            const { error } = await supabase.from('maintenance_tasks').update(t).eq('id', t.id);
            if (error) throw error;
            setMaintenance(prev => prev.map(m => m.id === t.id ? t : m));
          }} 
          onAddTask={async (t) => {
            const { data, error } = await supabase.from('maintenance_tasks').insert([t]).select();
            if (error) throw error;
            if (data) setMaintenance(prev => [...prev, data[0]]);
          }} 
        />
      );
      case 'Staff': return (
        <StaffManager 
          staff={staff}
          onAddStaff={async (m) => {
            const { data, error } = await supabase.from('staff').insert([m]).select();
            if (error) throw error;
            if (data) setStaff(prev => [...prev, data[0]]);
          }}
          onUpdateStaff={async (m) => {
            const { error } = await supabase.from('staff').update(m).eq('id', m.id);
            if (error) throw error;
            setStaff(prev => prev.map(member => member.id === m.id ? m : member));
          }}
          onDeleteStaff={async (id) => {
            const { error } = await supabase.from('staff').delete().eq('id', id);
            if (error) throw error;
            setStaff(prev => prev.filter(m => m.id !== id));
          }}
        />
      );
      default: return <Dashboard data={contextValue} />;
    }
  };

  if (!session) return <Login onLogin={() => {}} />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={() => supabase.auth.signOut()} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">
              {currentView === 'Staff' ? 'Equipo de Trabajo' :
               currentView === 'Guests' ? 'Directorio de Huéspedes' : 
               currentView === 'Rooms' ? 'Gestión de Habitaciones' : currentView}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Supabase Cloud Live</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-right duration-500">
             <button onClick={fetchAllData} className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 transition-all active:scale-95 shadow-sm">REFRESCAR</button>
             <span className="text-sm font-semibold text-gray-400 capitalize bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hidden lg:block">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </span>
             <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 border-2 border-white ring-4 ring-indigo-50">
               {session.user?.email?.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
