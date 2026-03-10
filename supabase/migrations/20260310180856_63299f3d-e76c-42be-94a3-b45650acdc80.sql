
-- Add 'superuser' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superuser';

-- Create user_themes table
CREATE TABLE public.user_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  theme_key text NOT NULL,
  UNIQUE (user_id, theme_key)
);

ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_themes" ON public.user_themes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own themes" ON public.user_themes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Create user_clients table
CREATE TABLE public.user_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_name text NOT NULL,
  UNIQUE (user_id, client_name)
);

ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_clients" ON public.user_clients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own clients" ON public.user_clients
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add cargo column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo text DEFAULT '';
