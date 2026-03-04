
-- Drop existing overly permissive policies on pesquisa_satisfacao
DROP POLICY IF EXISTS "Allow public read access" ON public.pesquisa_satisfacao;
DROP POLICY IF EXISTS "Allow public insert access" ON public.pesquisa_satisfacao;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON public.pesquisa_satisfacao;

-- Restrict SELECT to authenticated users only
CREATE POLICY "Authenticated users can read survey data"
  ON public.pesquisa_satisfacao
  FOR SELECT
  TO authenticated
  USING (true);

-- Restrict INSERT to authenticated users only
CREATE POLICY "Authenticated users can insert survey data"
  ON public.pesquisa_satisfacao
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Restrict DELETE to admin users only
CREATE POLICY "Admins can delete survey data"
  ON public.pesquisa_satisfacao
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
