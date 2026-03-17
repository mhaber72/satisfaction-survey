
-- Restrict RPC access to auto_update_action_plan_statuses
REVOKE EXECUTE ON FUNCTION public.auto_update_action_plan_statuses() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_update_action_plan_statuses() FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_update_action_plan_statuses() FROM authenticated;
