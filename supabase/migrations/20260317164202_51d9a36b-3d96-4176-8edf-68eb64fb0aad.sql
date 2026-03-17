
-- Fix action_plans UPDATE: add client scope to USING clause
DROP POLICY "Owner or privileged users can update scoped action_plans" ON public.action_plans;

CREATE POLICY "Owner or privileged users can update scoped action_plans"
  ON public.action_plans
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
    OR (
      auth.uid() = created_by
      AND client_name IN (
        SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
    OR (
      auth.uid() = created_by
      AND client_name IN (
        SELECT client_name FROM public.user_clients WHERE user_id = auth.uid()
      )
    )
  );
