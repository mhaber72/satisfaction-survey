
-- Allow authenticated users to call it (internal role check prevents abuse)
GRANT EXECUTE ON FUNCTION public.auto_update_action_plan_statuses() TO authenticated;
