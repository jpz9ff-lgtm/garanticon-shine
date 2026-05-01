-- Add username column to dealers
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS username TEXT;

-- Unique case-insensitive index on username
CREATE UNIQUE INDEX IF NOT EXISTS dealers_username_unique
  ON public.dealers (LOWER(username))
  WHERE username IS NOT NULL;

-- Allow public lookup of email by username (needed to translate username -> email at login time, before auth)
-- We expose this via a SECURITY DEFINER function rather than a permissive RLS policy,
-- so only this single field is reachable.
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.dealers WHERE LOWER(username) = LOWER(_username) LIMIT 1
$$;

-- Allow anonymous + authenticated users to call this lookup
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon, authenticated;