ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;

-- Funciones internas: nadie más que service_role debe poder ejecutarlas
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.generate_poliza_number() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.auto_expire_warranty() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.warranties_validate() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.warranties_audit() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.dealers_protect_fields() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.get_dealer_id_for_user(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.active_dealer_id(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_active_dealer(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_poliza_number() TO service_role;

-- Necesarias para evaluar las políticas de acceso de usuarios autenticados
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.active_dealer_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_active_dealer(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dealer_id_for_user(uuid) TO authenticated, service_role;