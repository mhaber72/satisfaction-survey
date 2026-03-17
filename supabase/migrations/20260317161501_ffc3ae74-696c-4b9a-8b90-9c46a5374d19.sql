
-- =============================================
-- 1. pesquisa_satisfacao: Scope SELECT to user's clients
-- =============================================
DROP POLICY "Authenticated users can read survey data" ON public.pesquisa_satisfacao;

CREATE POLICY "Users can read scoped survey data"
  ON public.pesquisa_satisfacao
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
    OR client_name IN (
      SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 2. action_plans: Scope SELECT to user's clients
-- =============================================
DROP POLICY "Authenticated can view action_plans" ON public.action_plans;

CREATE POLICY "Users can view scoped action_plans"
  ON public.action_plans
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
    OR client_name IN (
      SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 3. action_plan_history: Fix INSERT + scope SELECT
-- =============================================
DROP POLICY "Authenticated can insert action_plan_history" ON public.action_plan_history;

CREATE POLICY "Users can insert own history entries"
  ON public.action_plan_history
  FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

DROP POLICY "Authenticated can view action_plan_history" ON public.action_plan_history;

CREATE POLICY "Users can view scoped action_plan_history"
  ON public.action_plan_history
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
    OR action_plan_id IN (
      SELECT id FROM public.action_plans
      WHERE client_name IN (
        SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================
-- 4. action_responsibles: Scope SELECT  
-- =============================================
DROP POLICY "Authenticated can view action_responsibles" ON public.action_responsibles;

CREATE POLICY "Users can view scoped action_responsibles"
  ON public.action_responsibles
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
    OR directory_id IN (
      SELECT DISTINCT directory_id FROM public.action_plans
      WHERE client_name IN (
        SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
      )
    )
  );
