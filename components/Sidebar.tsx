
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const menuItems: { name: View; label: string; icon: string }[] = [
    { name: 'Dashboard', label: 'Panel', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Calendar', label: 'Calendario', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Guests', label: 'Huéspedes', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Rooms', label: 'Habitaciones', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Maintenance', label: 'Mantenimiento', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
  ];

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300">
      <div className="p-6 flex items-center space-x-2">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <span className="hidden md:block font-bold text-xl text-gray-800 tracking-tight">HostalAI</span>
      </div>
      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setView(item.name)}
            className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 group active:scale-95 ${
              currentView === item.name 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
            }`}
          >
            <svg className={`w-6 h-6 transition-colors duration-200 ${currentView === item.name ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
            <span className="ml-3 hidden md:block font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-2">
        <button className="w-full flex items-center p-2 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 text-left border border-transparent hover:border-gray-200">
          <img src="https://picsum.photos/40/40" alt="Avatar" className="rounded-xl w-8 h-8 object-cover shadow-sm" />
          <div className="ml-3 hidden md:block">
            <p className="text-sm font-bold text-gray-800">Administrador</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Ver Perfil</p>
          </div>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center p-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all active:scale-95 group"
        >
          <svg className="w-6 h-6 text-rose-400 group-hover:text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="ml-3 hidden md:block font-bold text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
