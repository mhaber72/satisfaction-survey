
CREATE POLICY "Allow public insert access"
ON public.pesquisa_satisfacao
FOR INSERT
WITH CHECK (true);
