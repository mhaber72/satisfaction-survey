
-- =============================================
-- 1. Fix auto_update_action_plan_statuses: add role check
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_update_action_plan_statuses()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_em_curso_id uuid := '658a7e01-adb6-48a1-9743-3606229b7bcf';
  v_atrasado_id uuid := 'f6da77cb-96a9-4693-8cb3-4f61a4d38489';
  v_postergado_id uuid := '0d95c723-cb64-469c-a69c-7ee5c48ce73e';
  v_today date := CURRENT_DATE;
BEGIN
  -- Only admins and superusers can trigger this
  IF NOT public.has_role(auth.uid(), 'admin') AND NOT public.has_role(auth.uid(), 'superuser') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  UPDATE action_plans
  SET status_id = v_atrasado_id, updated_at = now()
  WHERE status_id = v_em_curso_id
    AND start_date IS NOT NULL
    AND end_date IS NOT NULL
    AND end_date < v_today
    AND new_end_date IS NULL;

  UPDATE action_plans
  SET status_id = v_atrasado_id, updated_at = now()
  WHERE status_id IN (v_em_curso_id, v_postergado_id)
    AND start_date IS NOT NULL
    AND end_date IS NOT NULL
    AND end_date < v_today
    AND new_end_date IS NOT NULL
    AND new_end_date < v_today;

  UPDATE action_plans
  SET status_id = v_postergado_id, updated_at = now()
  WHERE status_id IN (v_em_curso_id, v_atrasado_id)
    AND start_date IS NOT NULL
    AND end_date IS NOT NULL
    AND end_date < v_today
    AND new_end_date IS NOT NULL
    AND new_end_date >= v_today;
END;
$function$;

-- =============================================
-- 2. Fix has_role: revoke direct RPC access, create safe version
-- =============================================

-- Create a safe RPC version that only checks the caller's own role
CREATE OR REPLACE FUNCTION public.has_own_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = _role
  )
$$;

-- Grant has_own_role only to authenticated
REVOKE EXECUTE ON FUNCTION public.has_own_role(app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_own_role(app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_own_role(app_role) TO authenticated;

-- Ensure has_role(uuid, app_role) is not callable via RPC by authenticated users directly
-- (keep it available for RLS policy evaluation which runs in security context)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
