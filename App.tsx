
import React, { useState, useMemo, useEffect } from 'react';
import { View, Room, Guest, Reservation, MaintenanceTask } from './types';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import GuestList from './components/GuestList';
import RoomManager from './components/RoomManager';
import MaintenanceTracker from './components/MaintenanceTracker';
import Sidebar from './components/Sidebar';
import Login from './components/Login';

// Claves para LocalStorage
const STORAGE_KEYS = {
  ROOMS: 'hostalai_rooms',
  GUESTS: 'hostalai_guests',
  RESERVATIONS: 'hostalai_reservations',
  MAINTENANCE: 'hostalai_maintenance',
  AUTH: 'hostalai_authenticated'
};

const INITIAL_ROOMS: Room[] = [
  { id: '1', number: '101', type: 'Individual', status: 'Disponible', price: 45 },
  { id: '2', number: '102', type: 'Doble', status: 'Ocupada', price: 75 },
  { id: '3', number: '103', type: 'Suite', status: 'Limpieza', price: 120 },
  { id: '4', number: '201', type: 'Dormitorio', status: 'Disponible', price: 25 },
  { id: '5', number: '202', type: 'Dormitorio', status: 'Mantenimiento', price: 25 },
];

const INITIAL_GUESTS: Guest[] = [
  { id: 'g1', name: 'Juan Pérez', email: 'juan@ejemplo.com', phone: '123-456-789', idNumber: 'AB123456' },
  { id: 'g2', name: 'María García', email: 'maria@ejemplo.com', phone: '987-654-321', idNumber: 'XY987654' },
];

const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 'r1', guestId: 'g2', roomId: '2', checkIn: new Date().toISOString().split('T')[0], checkOut: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'Check-in', totalPrice: 225 },
];

const App: React.FC = () => {
  // Inicialización de estado con carga desde LocalStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });

  const [currentView, setCurrentView] = useState<View>('Dashboard');

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GUESTS);
    return saved ? JSON.parse(saved) : INITIAL_GUESTS;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    return saved ? JSON.parse(saved) : [];
  });

  // Efectos para persistir cambios automáticamente
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenance));
  }, [maintenance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, isAuthenticated.toString());
  }, [isAuthenticated]);

  const contextValue = useMemo(() => ({
    rooms, guests, reservations, maintenance,
    setRooms, setGuests, setReservations, setMaintenance
  }), [rooms, guests, reservations, maintenance]);

  const handleUpdateReservation = (res: Reservation) => {
    setReservations(prev => prev.map(r => r.id === res.id ? res : r));
  };

  const handleAddReservation = (res: Reservation) => {
    setReservations(prev => [...prev, res]);
  };

  const handleAddGuest = (guest: Guest) => {
    setGuests(prev => [...prev, guest]);
  };

  const handleUpdateGuest = (updatedGuest: Guest) => {
    setGuests(prev => prev.map(g => g.id === updatedGuest.id ? updatedGuest : g));
  };

  const handleDeleteGuest = (guestId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este huésped?')) {
      setGuests(prev => prev.filter(g => g.id !== guestId));
    }
  };

  const handleAddRoom = (room: Room) => {
    setRooms(prev => [...prev, room]);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta habitación? Esto también eliminará las reservas y tareas de mantenimiento asociadas.')) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setReservations(prev => prev.filter(res => res.roomId !== roomId));
      setMaintenance(prev => prev.filter(task => task.roomId !== roomId));
    }
  };

  const renderView = () => {
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
          onDeleteGuest={handleDeleteGuest}
        />
      );
      case 'Rooms': return (
        <RoomManager 
          rooms={rooms} 
          onUpdateRoom={(r) => setRooms(rooms.map(rm => rm.id === r.id ? r : rm))} 
          onAddRoom={handleAddRoom}
          onDeleteRoom={handleDeleteRoom}
        />
      );
      case 'Maintenance': return (
        <MaintenanceTracker 
          tasks={maintenance} 
          rooms={rooms} 
          onUpdateTask={(t) => setMaintenance(maintenance.map(m => m.id === t.id ? t : m))} 
          onAddTask={(t) => setMaintenance([...maintenance, t])} 
        />
      );
      default: return <Dashboard data={contextValue} />;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Opcional: limpiar redirección o estado si fuera necesario
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden animate-in fade-in duration-700">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">
              {currentView === 'Dashboard' ? 'Panel de Control' : 
               currentView === 'Calendar' ? 'Calendario de Reservas' :
               currentView === 'Guests' ? 'Listado de Huéspedes' :
               currentView === 'Rooms' ? 'Gestión de Habitaciones' :
               'Mantenimiento Técnico'}
            </h1>
            <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-1">Datos guardados localmente</p>
          </div>
          <div className="flex items-center space-x-4">
             <span className="text-sm font-semibold text-gray-400 capitalize bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </span>
             <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 border-2 border-white">M</div>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
