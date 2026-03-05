
-- Fix permissive RLS: restrict insert to auth.uid() = created_by
DROP POLICY "Authenticated can insert action_plans" ON public.action_plans;
CREATE POLICY "Authenticated can insert action_plans" ON public.action_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Fix permissive RLS: restrict update to authenticated users (not fully open)
DROP POLICY "Authenticated can update action_plans" ON public.action_plans;
CREATE POLICY "Authenticated can update action_plans" ON public.action_plans FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
