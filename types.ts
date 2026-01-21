
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  id_number: string;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  status: 'Disponible' | 'Ocupada' | 'Limpieza' | 'Mantenimiento';
  price: number;
  image_url?: string;
}

export interface Reservation {
  id: string;
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  status: 'Confirmada' | 'Check-in' | 'Check-out' | 'Cancelada';
  total_price: number;
}

export interface MaintenanceTask {
  id: string;
  room_id?: string;
  area?: string;
  description: string;
  priority: 'Baja' | 'Media' | 'Alta';
  status: 'Pendiente' | 'En Progreso' | 'Completado';
  created_at: string;
}

export interface StaffTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface StaffMessage {
  id: string;
  text: string;
  date: string;
  sender: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Recepción' | 'Limpieza' | 'Mantenimiento' | 'Administración' | 'Cocina';
  phone: string;
  email: string;
  shift: 'Mañana' | 'Tarde' | 'Noche' | 'Rotativo';
  notes?: string;
  tasks?: StaffTask[];
  messages?: StaffMessage[];
  created_at?: string;
}

export type View = 'Dashboard' | 'Calendar' | 'Guests' | 'Rooms' | 'Maintenance' | 'Staff' | 'AI';

export interface GroundingSource {
  title: string;
  uri: string;
}
