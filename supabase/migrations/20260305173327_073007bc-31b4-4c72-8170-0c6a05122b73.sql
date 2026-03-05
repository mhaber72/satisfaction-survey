
-- Create clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view clients" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage clients" ON public.clients
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for client logos
INSERT INTO storage.buckets (id, name, public) VALUES ('client-logos', 'client-logos', true);

-- Storage policies
CREATE POLICY "Anyone can view client logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-logos');

CREATE POLICY "Admins can upload client logos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update client logos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'client-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete client logos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'client-logos' AND has_role(auth.uid(), 'admin'));
