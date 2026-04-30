
-- Fijar search_path en funciones que faltaban
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_expire_warranty()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.fecha_fin < CURRENT_DATE AND NEW.estado = 'activa' THEN
    NEW.estado = 'expirada';
  END IF;
  RETURN NEW;
END;
$$;

-- Revocar EXECUTE público de funciones SECURITY DEFINER que no deben ser llamadas por la API
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dealer_id_for_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_poliza_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_poliza_number() TO authenticated;

-- Endurecer política de contacts (con validación mínima en lugar de true)
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contacts;
CREATE POLICY "Anyone can submit valid contact"
  ON public.contacts FOR INSERT
  WITH CHECK (
    char_length(mensaje) BETWEEN 1 AND 2000
    AND (email IS NULL OR char_length(email) <= 255)
    AND (nombre IS NULL OR char_length(nombre) <= 200)
    AND (numero_poliza IS NULL OR char_length(numero_poliza) <= 50)
    AND (matricula IS NULL OR char_length(matricula) <= 20)
  );
