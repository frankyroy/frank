-- COPIA ÚNICAMENTE EL CÓDIGO A CONTINUACIÓN EN EL EDITOR DE SUPABASE
-- NO INCLUYAS "schema.sql" NI NINGUNA OTRA LÍNEA DE TEXTO AL INICIO

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Disponible', 'Ocupada', 'Limpieza', 'Mantenimiento')) DEFAULT 'Disponible',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  imageUrl TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  idNumber TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guestId UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  roomId UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  checkIn DATE NOT NULL,
  checkOut DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Confirmada', 'Check-in', 'Check-out', 'Cancelada')) DEFAULT 'Confirmada',
  totalPrice NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roomId UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Baja', 'Media', 'Alta')) DEFAULT 'Media',
  status TEXT NOT NULL CHECK (status IN ('Pendiente', 'En Progreso', 'Completado')) DEFAULT 'Pendiente',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total para autenticados' AND tablename = 'rooms') THEN
        CREATE POLICY "Acceso total para autenticados" ON public.rooms FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total para autenticados' AND tablename = 'guests') THEN
        CREATE POLICY "Acceso total para autenticados" ON public.guests FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total para autenticados' AND tablename = 'reservations') THEN
        CREATE POLICY "Acceso total para autenticados" ON public.reservations FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total para autenticados' AND tablename = 'maintenance_tasks') THEN
        CREATE POLICY "Acceso total para autenticados" ON public.maintenance_tasks FOR ALL TO authenticated USING (true);
    END IF;
END $$;