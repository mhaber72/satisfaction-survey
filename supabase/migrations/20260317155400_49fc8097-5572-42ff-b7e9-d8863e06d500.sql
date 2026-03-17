
-- Drop the overly permissive UPDATE policy
DROP POLICY "Authenticated can update action_plans" ON public.action_plans;

-- Create a proper UPDATE policy: only creator, admins, or superusers can update
CREATE POLICY "Owner or privileged users can update action_plans"
  ON public.action_plans
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
  )
  WITH CHECK (
    auth.uid() = created_by
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'superuser')
  );
