
CREATE OR REPLACE FUNCTION public.auto_update_action_plan_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_em_curso_id uuid := '658a7e01-adb6-48a1-9743-3606229b7bcf';
  v_atrasado_id uuid := 'f6da77cb-96a9-4693-8cb3-4f61a4d38489';
  v_postergado_id uuid := '0d95c723-cb64-469c-a69c-7ee5c48ce73e';
  v_today date := CURRENT_DATE;
BEGIN
  -- Rule 1: Em Curso + start_date + end_date < today + new_end_date NULL → Atrasado
  UPDATE action_plans
  SET status_id = v_atrasado_id, updated_at = now()
  WHERE status_id = v_em_curso_id
    AND start_date IS NOT NULL
    AND end_date IS NOT NULL
    AND end_date < v_today
    AND new_end_date IS NULL;

  -- Rule 2: (Em Curso or Postergado) + end_date < today + new_end_date < today → Atrasado
  UPDATE action_plans
  SET status_id = v_atrasado_id, updated_at = now()
  WHERE status_id IN (v_em_curso_id, v_postergado_id)
    AND start_date IS NOT NULL
    AND end_date IS NOT NULL
    AND end_date < v_today
    AND new_end_date IS NOT NULL
    AND new_end_date < v_today;

  -- Rule 3: Em Curso + end_date < today + new_end_date >= today → Postergado
  UPDATE action_plans
  SET status_id = v_postergado_id, updated_at = now()
  WHERE status_id = v_em_curso_id
    AND start_date IS NOT NULL
    AND end_date IS NOT NULL
    AND end_date < v_today
    AND new_end_date IS NOT NULL
    AND new_end_date >= v_today;
END;
$$;
