
-- ==========================================
-- SCRIPT DE CONFIGURACIÓN HOSTALAI CLOUD (VERSIÓN ESTABLE)
-- ==========================================

-- 1. LIMPIEZA TOTAL
DROP TABLE IF EXISTS public.maintenance_tasks CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.guests CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;

-- 2. TABLA DE HABITACIONES
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Disponible', 'Ocupada', 'Limpieza', 'Mantenimiento')) DEFAULT 'Disponible',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TABLA DE HUÉSPEDES
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TABLA DE RESERVAS
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Confirmada', 'Check-in', 'Check-out', 'Cancelada')) DEFAULT 'Confirmada',
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TABLA DE MANTENIMIENTO
CREATE TABLE public.maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Baja', 'Media', 'Alta')) DEFAULT 'Media',
  status TEXT NOT NULL CHECK (status IN ('Pendiente', 'En Progreso', 'Completado')) DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. SEGURIDAD DE FILA (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE ACCESO
CREATE POLICY "Full access rooms" ON public.rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access guests" ON public.guests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access reservations" ON public.reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access maintenance" ON public.maintenance_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. RECARGA DE CACHÉ
NOTIFY pgrst, 'reload schema';
