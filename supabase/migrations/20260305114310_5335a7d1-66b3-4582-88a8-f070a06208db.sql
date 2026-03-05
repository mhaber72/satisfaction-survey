
CREATE TABLE public.score_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score numeric NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#000000',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.score_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view score_colors" ON public.score_colors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage score_colors" ON public.score_colors
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.score_colors (score, color) VALUES
  (0, '#000000'),
  (0.5, '#000000'),
  (1, '#ef4444'),
  (1.5, '#ef4444'),
  (2, '#ef4444'),
  (2.5, '#ef4444'),
  (3, '#eab308'),
  (3.5, '#eab308'),
  (4, '#22c55e'),
  (4.5, '#22c55e'),
  (5, '#22c55e');
