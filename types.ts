
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  status: 'Disponible' | 'Ocupada' | 'Limpieza' | 'Mantenimiento';
  price: number;
  imageUrl?: string;
}

export interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: 'Confirmada' | 'Check-in' | 'Check-out' | 'Cancelada';
  totalPrice: number;
}

export interface MaintenanceTask {
  id: string;
  roomId: string;
  description: string;
  priority: 'Baja' | 'Media' | 'Alta';
  status: 'Pendiente' | 'En Progreso' | 'Completado';
  createdAt: string;
}

export type View = 'Dashboard' | 'Calendar' | 'Guests' | 'Rooms' | 'Maintenance';

export interface GroundingSource {
  title: string;
  uri: string;
}
