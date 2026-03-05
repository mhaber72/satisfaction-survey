
-- Contract Managers lookup table
CREATE TABLE public.contract_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage contract_managers" ON public.contract_managers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view contract_managers" ON public.contract_managers FOR SELECT TO authenticated USING (true);

-- Regional Managers lookup table
CREATE TABLE public.regional_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.regional_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage regional_managers" ON public.regional_managers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view regional_managers" ON public.regional_managers FOR SELECT TO authenticated USING (true);

-- Directories (Diretoria) lookup table
CREATE TABLE public.directories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.directories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage directories" ON public.directories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view directories" ON public.directories FOR SELECT TO authenticated USING (true);

-- Action Statuses lookup table with date requirement flags
CREATE TABLE public.action_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  requires_start_date BOOLEAN NOT NULL DEFAULT false,
  requires_end_date BOOLEAN NOT NULL DEFAULT false,
  requires_new_end_date BOOLEAN NOT NULL DEFAULT false,
  requires_completion_date BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.action_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage action_statuses" ON public.action_statuses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view action_statuses" ON public.action_statuses FOR SELECT TO authenticated USING (true);

-- Action Plans table
CREATE TABLE public.action_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id BIGINT REFERENCES public.pesquisa_satisfacao(id) ON DELETE CASCADE NOT NULL,
  survey_year INTEGER,
  client_name TEXT,
  theme TEXT,
  theme_comment TEXT,
  question_comment TEXT,
  contract_manager_id UUID REFERENCES public.contract_managers(id) NOT NULL,
  regional_manager_id UUID REFERENCES public.regional_managers(id) NOT NULL,
  directory_id UUID REFERENCES public.directories(id) NOT NULL,
  action_name TEXT NOT NULL,
  action_description TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  new_end_date DATE,
  completion_date DATE,
  status_id UUID REFERENCES public.action_statuses(id) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view action_plans" ON public.action_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert action_plans" ON public.action_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update action_plans" ON public.action_plans FOR UPDATE TO authenticated USING (true);

-- Updated_at triggers
CREATE TRIGGER update_contract_managers_updated_at BEFORE UPDATE ON public.contract_managers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regional_managers_updated_at BEFORE UPDATE ON public.regional_managers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_directories_updated_at BEFORE UPDATE ON public.directories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_action_statuses_updated_at BEFORE UPDATE ON public.action_statuses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_action_plans_updated_at BEFORE UPDATE ON public.action_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
