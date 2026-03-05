
CREATE TABLE public.verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage verticals" ON public.verticals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view verticals" ON public.verticals FOR SELECT TO authenticated USING (true);

ALTER TABLE public.clients ADD COLUMN vertical_id uuid REFERENCES public.verticals(id);
