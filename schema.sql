
-- ... (tablas anteriores se mantienen igual) ...

-- 6. TABLA DE STAFF (PERSONAL)
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Recepción', 'Limpieza', 'Mantenimiento', 'Administración', 'Cocina')),
  phone TEXT,
  email TEXT,
  shift TEXT NOT NULL CHECK (shift IN ('Mañana', 'Tarde', 'Noche', 'Rotativo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- HABILITAR SEGURIDAD (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO
CREATE POLICY "Acceso total staff" ON public.staff FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RECARGA DE CACHÉ DE POSTGREST
NOTIFY pgrst, 'reload schema';
