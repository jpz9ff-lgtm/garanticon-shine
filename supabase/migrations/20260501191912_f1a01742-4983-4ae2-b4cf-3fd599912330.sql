REVOKE EXECUTE ON FUNCTION public.get_email_by_username(text) FROM anon, authenticated, public;
DROP FUNCTION IF EXISTS public.get_email_by_username(text);