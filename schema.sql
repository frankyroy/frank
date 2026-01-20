
-- 1. TABLA DE HABITACIONES
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Disponible', 'Ocupada', 'Limpieza', 'Mantenimiento')) DEFAULT 'Disponible',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  imageUrl TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TABLA DE HUÉSPEDES
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  idNumber TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TABLA DE RESERVAS
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guestId UUID REFERENCES guests(id) ON DELETE CASCADE,
  roomId UUID REFERENCES rooms(id) ON DELETE CASCADE,
  checkIn DATE NOT NULL,
  checkOut DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Confirmada', 'Check-in', 'Check-out', 'Cancelada')) DEFAULT 'Confirmada',
  totalPrice NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TABLA DE MANTENIMIENTO
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roomId UUID REFERENCES rooms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Baja', 'Media', 'Alta')) DEFAULT 'Media',
  status TEXT NOT NULL CHECK (status IN ('Pendiente', 'En Progreso', 'Completado')) DEFAULT 'Pendiente',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. POLÍTICAS DE SEGURIDAD (RLS)
-- Nota: Para simplificar en esta fase, permitimos acceso total a usuarios autenticados.

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total a habitaciones para autenticados" ON rooms FOR ALL TO authenticated USING (true);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total a huéspedes para autenticados" ON guests FOR ALL TO authenticated USING (true);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total a reservas para autenticados" ON reservations FOR ALL TO authenticated USING (true);

ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total a mantenimiento para autenticados" ON maintenance_tasks FOR ALL TO authenticated USING (true);

-- 6. CONFIGURACIÓN DE STORAGE (Ejecutar en el panel de Storage de Supabase)
-- Crear un bucket público llamado 'room-images'
