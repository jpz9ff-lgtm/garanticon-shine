CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid()
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RETURN false;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.active_dealer_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT id FROM public.dealers WHERE user_id = _user_id AND activo IS TRUE LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_active_dealer(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.dealers WHERE user_id = _user_id AND activo IS TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dealer_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT id FROM public.dealers WHERE user_id = _user_id LIMIT 1);
END;
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.active_dealer_id(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_active_dealer(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_dealer_id_for_user(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.active_dealer_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_active_dealer(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dealer_id_for_user(uuid) TO authenticated, service_role;