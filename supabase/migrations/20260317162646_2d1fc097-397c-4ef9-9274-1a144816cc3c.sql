
-- 1. action_plans: Tighten INSERT to scope by user's assigned clients (admins/superusers exempt)
DROP POLICY "Authenticated can insert action_plans" ON public.action_plans;

CREATE POLICY "Users can insert scoped action_plans"
  ON public.action_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'superuser')
      OR client_name IN (
        SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
      )
    )
  );

-- 2. action_plan_history: Tighten INSERT to scope by accessible action plans
DROP POLICY "Users can insert own history entries" ON public.action_plan_history;

CREATE POLICY "Users can insert scoped history entries"
  ON public.action_plan_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'superuser')
      OR action_plan_id IN (
        SELECT id FROM public.action_plans
        WHERE client_name IN (
          SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
        )
      )
    )
  );
