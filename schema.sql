
-- TABLA DE TIPOS DE HABITACIÓN PARA PERSISTENCIA
CREATE TABLE IF NOT EXISTS public.room_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar valores iniciales si la tabla está vacía
INSERT INTO public.room_types (name) 
SELECT name FROM (VALUES ('Individual'), ('Doble'), ('Suite'), ('Dormitorio')) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM public.room_types);

-- ACTUALIZACIÓN TABLA RESERVACIONES (Asegurar que existe la columna de abonos)
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS advance_payment NUMERIC DEFAULT 0;

-- RECARGA DE CACHÉ DE POSTGREST
NOTIFY pgrst, 'reload schema';
