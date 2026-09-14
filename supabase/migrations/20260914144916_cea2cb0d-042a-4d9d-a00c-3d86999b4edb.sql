CREATE TABLE IF NOT EXISTS public.rate_limits (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_lookup ON public.rate_limits (bucket, subject, created_at DESC);
GRANT ALL ON public.rate_limits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rate_limits_id_seq TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.policy_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id uuid NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS policy_access_codes_warranty ON public.policy_access_codes (warranty_id, created_at DESC);
GRANT ALL ON public.policy_access_codes TO service_role;
ALTER TABLE public.policy_access_codes ENABLE ROW LEVEL SECURITY;

-- El navegador ya no inserta directamente en contactos
DROP POLICY IF EXISTS "Anyone can submit valid contact" ON public.contacts;
REVOKE ALL ON public.contacts FROM anon;
GRANT ALL ON public.contacts TO service_role;

DROP POLICY IF EXISTS "Admins read contacts" ON public.contacts;
CREATE POLICY "contacts_admin_read" ON public.contacts
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));