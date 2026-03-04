
-- Fix INSERT policy to be admin-only (data import is admin function)
DROP POLICY IF EXISTS "Authenticated users can insert survey data" ON public.pesquisa_satisfacao;

CREATE POLICY "Admins can insert survey data"
  ON public.pesquisa_satisfacao
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
