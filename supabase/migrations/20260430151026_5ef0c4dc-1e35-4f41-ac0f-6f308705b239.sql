
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'dealer');
CREATE TYPE public.warranty_modality AS ENUM ('PLUS', 'BASIC');
CREATE TYPE public.warranty_status AS ENUM ('activa', 'expirada', 'cancelada');

-- ===== TABLE: dealers =====
CREATE TABLE public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  nombre_empresa TEXT NOT NULL,
  cif TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== TABLE: user_roles =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ===== TABLE: warranties =====
CREATE TABLE public.warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_poliza TEXT NOT NULL UNIQUE,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE RESTRICT,

  -- Comprador
  comprador_nombre TEXT NOT NULL,
  comprador_dni TEXT NOT NULL,
  comprador_telefono TEXT,
  comprador_email TEXT,
  comprador_direccion TEXT,
  comprador_cp TEXT,
  comprador_poblacion TEXT,
  comprador_provincia TEXT,

  -- Vehículo
  vehiculo_marca TEXT NOT NULL,
  vehiculo_modelo TEXT NOT NULL,
  matricula TEXT NOT NULL,
  bastidor TEXT,
  fecha_matriculacion DATE,
  km_venta INTEGER,
  precio_venta NUMERIC(10,2),
  combustible TEXT,
  tipo_cambio TEXT,
  traccion_4x4 BOOLEAN NOT NULL DEFAULT false,

  -- Garantía
  modalidad public.warranty_modality NOT NULL,
  limite_averia NUMERIC(10,2) NOT NULL,
  fecha_venta DATE NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado public.warranty_status NOT NULL DEFAULT 'activa',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warranties_dealer ON public.warranties(dealer_id);
CREATE INDEX idx_warranties_matricula ON public.warranties(matricula);
CREATE INDEX idx_warranties_poliza ON public.warranties(numero_poliza);

-- ===== TABLE: contacts =====
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_poliza TEXT,
  matricula TEXT,
  nombre TEXT,
  email TEXT,
  mensaje TEXT NOT NULL,
  respondido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== FUNCTIONS =====

-- has_role: security definer, evita recursión RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- get_dealer_id_for_user: helper para RLS
CREATE OR REPLACE FUNCTION public.get_dealer_id_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.dealers WHERE user_id = _user_id LIMIT 1
$$;

-- generate_poliza_number
CREATE OR REPLACE FUNCTION public.generate_poliza_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano TEXT := TO_CHAR(NOW(), 'YYYY');
  mes TEXT := TO_CHAR(NOW(), 'MM');
  seq INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO seq FROM public.warranties
  WHERE TO_CHAR(created_at, 'YYYYMM') = ano || mes;
  RETURN 'GC-' || ano || mes || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dealers_updated
BEFORE UPDATE ON public.dealers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_warranties_updated
BEFORE UPDATE ON public.warranties
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-expire trigger: si fecha_fin < hoy, marca como expirada
CREATE OR REPLACE FUNCTION public.auto_expire_warranty()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.fecha_fin < CURRENT_DATE AND NEW.estado = 'activa' THEN
    NEW.estado = 'expirada';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_warranties_auto_expire
BEFORE INSERT OR UPDATE ON public.warranties
FOR EACH ROW EXECUTE FUNCTION public.auto_expire_warranty();

-- ===== ENABLE RLS =====
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES: dealers =====
CREATE POLICY "Dealers can view own profile"
  ON public.dealers FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Dealers can update own profile"
  ON public.dealers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert dealers"
  ON public.dealers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete dealers"
  ON public.dealers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLICIES: warranties =====
CREATE POLICY "Dealers see own warranties"
  ON public.warranties FOR SELECT
  USING (
    dealer_id = public.get_dealer_id_for_user(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Dealers insert own warranties"
  ON public.warranties FOR INSERT
  WITH CHECK (dealer_id = public.get_dealer_id_for_user(auth.uid()));

CREATE POLICY "Dealers update own warranties"
  ON public.warranties FOR UPDATE
  USING (dealer_id = public.get_dealer_id_for_user(auth.uid()));

CREATE POLICY "Dealers delete own warranties"
  ON public.warranties FOR DELETE
  USING (dealer_id = public.get_dealer_id_for_user(auth.uid()));

-- ===== POLICIES: contacts =====
CREATE POLICY "Anyone can submit contact"
  ON public.contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins read contacts"
  ON public.contacts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== POLICIES: user_roles =====
CREATE POLICY "Users see own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
