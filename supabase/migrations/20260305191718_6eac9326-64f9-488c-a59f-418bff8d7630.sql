
CREATE TABLE public.action_responsibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  directory_id uuid NOT NULL REFERENCES public.directories(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.action_responsibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage action_responsibles" ON public.action_responsibles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view action_responsibles" ON public.action_responsibles FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_action_responsibles_updated_at BEFORE UPDATE ON public.action_responsibles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
