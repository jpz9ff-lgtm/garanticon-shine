REVOKE ALL ON public.policy_access_codes FROM anon, authenticated;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
REVOKE ALL ON public.warranty_audit FROM anon, authenticated;
GRANT ALL ON public.policy_access_codes TO service_role;
GRANT ALL ON public.rate_limits TO service_role;
GRANT ALL ON public.warranty_audit TO service_role;