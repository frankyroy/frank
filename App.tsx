
import React, { useState, useMemo, useEffect } from 'react';
import { View, Room, Guest, Reservation, MaintenanceTask } from './types';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import GuestList from './components/GuestList';
import RoomManager from './components/RoomManager';
import MaintenanceTracker from './components/MaintenanceTracker';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [loading, setLoading] = useState(true);

  const [roomTypes, setRoomTypes] = useState<string[]>(['Individual', 'Doble', 'Suite', 'Dormitorio']);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([]);

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
      const results = await Promise.allSettled([
        supabase.from('rooms').select('*').order('number'),
        supabase.from('guests').select('*').order('name'),
        supabase.from('reservations').select('*'),
        supabase.from('maintenance_tasks').select('*')
      ]);

      results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          const { data, error } = res.value;
          if (error) {
             console.error(`Error en el índice de carga ${index}:`, error);
             if (error.code === 'PGRST205') {
               console.warn("Error de caché de esquema (PGRST205). Las tablas son nuevas. Intenta refrescar el Dashboard de Supabase o la app en 30 segundos.");
             }
          } else if (data) {
            if (index === 0) setRooms(data);
            if (index === 1) setGuests(data);
            if (index === 2) setReservations(data);
            if (index === 3) setMaintenance(data);
          }
        }
      });
    } catch (err) {
      console.error("Error crítico al obtener datos de la nube:", err);
    } finally {
      setLoading(false);
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
    if (window.confirm('¿Eliminar esta habitación de la nube?')) {
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
    rooms, guests, reservations, maintenance, roomTypes,
    setRooms, setGuests, setReservations, setMaintenance, setRoomTypes
  }), [rooms, guests, reservations, maintenance, roomTypes]);

  const renderView = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
          onUpdateRoomTypes={setRoomTypes}
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
      default: return <Dashboard data={contextValue} />;
    }
  };

  if (!session) return <Login onLogin={() => {}} />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={() => supabase.auth.signOut()} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">{currentView}</h1>
            <div className="flex items-center space-x-2 mt-1">
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
               <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Supabase Cloud Sync</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={fetchAllData} className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">REFRESCAR</button>
             <span className="text-sm font-semibold text-gray-400 capitalize bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hidden sm:block">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </span>
             <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 border-2 border-white">
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
