-- 1. Concesionario activo (SECURITY DEFINER, search_path fijo)
CREATE OR REPLACE FUNCTION public.active_dealer_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.dealers WHERE user_id = _user_id AND activo IS TRUE LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_active_dealer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.dealers WHERE user_id = _user_id AND activo IS TRUE)
$$;

-- 2. Grants mínimos
REVOKE ALL ON public.warranties FROM anon;
REVOKE ALL ON public.dealers FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranties TO authenticated;
GRANT ALL ON public.warranties TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dealers TO authenticated;
GRANT ALL ON public.dealers TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 3. Políticas de warranties: solo concesionario activo propietario, o admin
DROP POLICY IF EXISTS "Dealers see own warranties" ON public.warranties;
DROP POLICY IF EXISTS "Dealers insert own warranties" ON public.warranties;
DROP POLICY IF EXISTS "Dealers update own warranties" ON public.warranties;
DROP POLICY IF EXISTS "Dealers delete own warranties" ON public.warranties;

CREATE POLICY "warranties_select_own_or_admin" ON public.warranties
FOR SELECT TO authenticated
USING (dealer_id = public.active_dealer_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "warranties_insert_own" ON public.warranties
FOR INSERT TO authenticated
WITH CHECK (dealer_id = public.active_dealer_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "warranties_update_own" ON public.warranties
FOR UPDATE TO authenticated
USING (dealer_id = public.active_dealer_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (dealer_id = public.active_dealer_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "warranties_delete_own" ON public.warranties
FOR DELETE TO authenticated
USING (dealer_id = public.active_dealer_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- 4. Políticas de dealers
DROP POLICY IF EXISTS "Dealers can view own profile" ON public.dealers;
DROP POLICY IF EXISTS "Dealers can update own profile" ON public.dealers;
DROP POLICY IF EXISTS "Admins can insert dealers" ON public.dealers;
DROP POLICY IF EXISTS "Admins can delete dealers" ON public.dealers;

CREATE POLICY "dealers_select_own_or_admin" ON public.dealers
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "dealers_update_own_or_admin" ON public.dealers
FOR UPDATE TO authenticated
USING ((user_id = auth.uid() AND activo IS TRUE) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK ((user_id = auth.uid() AND activo IS TRUE) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "dealers_insert_admin" ON public.dealers
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "dealers_delete_admin" ON public.dealers
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Roles: solo lectura propia; gestión reservada a admin/service_role
DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_admin_write" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Campos protegidos en dealers
CREATE OR REPLACE FUNCTION public.dealers_protect_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.activo IS DISTINCT FROM OLD.activo
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.cif IS DISTINCT FROM OLD.cif THEN
    RAISE EXCEPTION 'No autorizado a modificar campos protegidos del concesionario';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dealers_protect_fields ON public.dealers;
CREATE TRIGGER trg_dealers_protect_fields
BEFORE UPDATE ON public.dealers
FOR EACH ROW EXECUTE FUNCTION public.dealers_protect_fields();

-- 7. Reglas del contrato y campos protegidos en warranties
CREATE OR REPLACE FUNCTION public.warranties_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected numeric;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.dealer_id IS DISTINCT FROM OLD.dealer_id
       OR NEW.numero_poliza IS DISTINCT FROM OLD.numero_poliza THEN
      IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'No autorizado a reasignar la garantía ni a cambiar el número de póliza';
      END IF;
    END IF;
  END IF;

  IF NEW.fecha_fin <= NEW.fecha_inicio THEN
    RAISE EXCEPTION 'La fecha de fin debe ser posterior a la fecha de inicio';
  END IF;
  IF NEW.fecha_inicio < NEW.fecha_venta - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'La fecha de inicio no es coherente con la fecha de venta';
  END IF;
  IF NEW.limite_averia IS NULL OR NEW.limite_averia <= 0 THEN
    RAISE EXCEPTION 'Límite de avería inválido';
  END IF;
  IF NEW.precio_venta IS NOT NULL AND NEW.precio_venta < 0 THEN
    RAISE EXCEPTION 'Precio de venta inválido';
  END IF;

  -- Límite económico canónico por modalidad, solo para garantías nuevas
  IF TG_OP = 'INSERT' THEN
    expected := CASE NEW.modalidad
      WHEN 'ELITE' THEN 4500
      WHEN 'PLUS' THEN 3500
      WHEN 'ESENCIAL' THEN 2500
      WHEN 'BASIC' THEN 2500
    END;
    IF expected IS NOT NULL AND NEW.limite_averia <> expected THEN
      RAISE EXCEPTION 'El límite económico no corresponde a la modalidad %', NEW.modalidad;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_warranties_validate ON public.warranties;
CREATE TRIGGER trg_warranties_validate
BEFORE INSERT OR UPDATE ON public.warranties
FOR EACH ROW EXECUTE FUNCTION public.warranties_validate();

-- 8. Trazabilidad sin datos personales
CREATE TABLE IF NOT EXISTS public.warranty_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id uuid NOT NULL,
  actor_user_id uuid,
  operation text NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.warranty_audit TO service_role;
GRANT SELECT ON public.warranty_audit TO authenticated;
ALTER TABLE public.warranty_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "warranty_audit_admin_read" ON public.warranty_audit;
CREATE POLICY "warranty_audit_admin_read" ON public.warranty_audit
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.warranties_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fields text[] := '{}';
  k text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    FOR k IN
      SELECT key FROM jsonb_each(to_jsonb(NEW))
      WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
    LOOP
      fields := array_append(fields, k);
    END LOOP;
  END IF;

  INSERT INTO public.warranty_audit (warranty_id, actor_user_id, operation, changed_fields)
  VALUES (COALESCE(NEW.id, OLD.id), auth.uid(), TG_OP, fields);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_warranties_audit ON public.warranties;
CREATE TRIGGER trg_warranties_audit
AFTER INSERT OR UPDATE OR DELETE ON public.warranties
FOR EACH ROW EXECUTE FUNCTION public.warranties_audit();