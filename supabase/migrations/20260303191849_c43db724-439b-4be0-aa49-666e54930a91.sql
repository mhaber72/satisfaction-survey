
CREATE TABLE public.pesquisa_satisfacao (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country TEXT,
  contact TEXT,
  client_name TEXT,
  firstname TEXT,
  lastname TEXT,
  type TEXT,
  activity TEXT,
  context TEXT,
  answered INTEGER,
  progress INTEGER,
  answer_delay TEXT,
  theme TEXT,
  theme_comment TEXT,
  question TEXT,
  applicability INTEGER,
  importance INTEGER,
  score NUMERIC,
  question_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pesquisa_satisfacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON public.pesquisa_satisfacao
FOR SELECT
USING (true);
