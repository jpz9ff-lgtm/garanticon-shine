ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS es_electrico BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS autonomia_wltp INTEGER;
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS capacidad_kwh NUMERIC;
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS tipo_conector TEXT;
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS soh_declarado NUMERIC;