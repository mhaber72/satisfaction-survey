
CREATE TABLE public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_fr text NOT NULL,
  question_en text NOT NULL DEFAULT '',
  question_pt text NOT NULL DEFAULT '',
  question_es text NOT NULL DEFAULT '',
  theme text,
  survey_year integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(question_fr, survey_year)
);

ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view survey_questions"
  ON public.survey_questions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage survey_questions"
  ON public.survey_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_survey_questions_updated_at
  BEFORE UPDATE ON public.survey_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
