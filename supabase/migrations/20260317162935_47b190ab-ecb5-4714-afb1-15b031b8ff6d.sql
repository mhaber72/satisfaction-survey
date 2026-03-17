
-- 1. action_plans: Tighten UPDATE to also scope client_name for non-admin users
DROP POLICY "Owner or privileged users can update action_plans" ON public.action_plans;

CREATE POLICY "Owner or privileged users can update scoped action_plans"
  ON public.action_plans
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
  )
  WITH CHECK (
    (auth.uid() = created_by OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superuser'))
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'superuser')
      OR client_name IN (
        SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
      )
    )
  );

-- 2. clients: Scope SELECT to user's assigned clients (admins see all)
DROP POLICY "Authenticated can view clients" ON public.clients;

CREATE POLICY "Users can view scoped clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
    OR name IN (
      SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
    )
  );
