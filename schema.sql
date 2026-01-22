
-- ... (tablas anteriores se mantienen igual) ...

-- ACTUALIZACIÓN TABLA RESERVACIONES
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS advance_payment NUMERIC DEFAULT 0;

-- RECARGA DE CACHÉ DE POSTGREST
NOTIFY pgrst, 'reload schema';
