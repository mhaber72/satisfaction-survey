
-- 1. Add observations column to action_plans
ALTER TABLE public.action_plans ADD COLUMN observations text;

-- 2. Create action_plan_history table
CREATE TABLE public.action_plan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id uuid NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  changed_by uuid,
  change_type text NOT NULL DEFAULT 'update',
  changes jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.action_plan_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Authenticated can view action_plan_history"
  ON public.action_plan_history FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert action_plan_history"
  ON public.action_plan_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Trigger function to auto-log changes
CREATE OR REPLACE FUNCTION public.log_action_plan_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_changes jsonb := '{}';
  v_change_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_change_type := 'created';
    v_changes := jsonb_build_object(
      'action_name', NEW.action_name,
      'status_id', NEW.status_id,
      'observations', NEW.observations
    );
    INSERT INTO public.action_plan_history (action_plan_id, changed_by, change_type, changes)
    VALUES (NEW.id, NEW.created_by, v_change_type, v_changes);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_change_type := 'updated';
    
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
      v_changes := v_changes || jsonb_build_object('status_id', jsonb_build_object('old', OLD.status_id, 'new', NEW.status_id));
    END IF;
    IF OLD.action_name IS DISTINCT FROM NEW.action_name THEN
      v_changes := v_changes || jsonb_build_object('action_name', jsonb_build_object('old', OLD.action_name, 'new', NEW.action_name));
    END IF;
    IF OLD.action_description IS DISTINCT FROM NEW.action_description THEN
      v_changes := v_changes || jsonb_build_object('action_description', jsonb_build_object('old', OLD.action_description, 'new', NEW.action_description));
    END IF;
    IF OLD.observations IS DISTINCT FROM NEW.observations THEN
      v_changes := v_changes || jsonb_build_object('observations', jsonb_build_object('old', OLD.observations, 'new', NEW.observations));
    END IF;
    IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
      v_changes := v_changes || jsonb_build_object('start_date', jsonb_build_object('old', OLD.start_date, 'new', NEW.start_date));
    END IF;
    IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
      v_changes := v_changes || jsonb_build_object('end_date', jsonb_build_object('old', OLD.end_date, 'new', NEW.end_date));
    END IF;
    IF OLD.new_end_date IS DISTINCT FROM NEW.new_end_date THEN
      v_changes := v_changes || jsonb_build_object('new_end_date', jsonb_build_object('old', OLD.new_end_date, 'new', NEW.new_end_date));
    END IF;
    IF OLD.completion_date IS DISTINCT FROM NEW.completion_date THEN
      v_changes := v_changes || jsonb_build_object('completion_date', jsonb_build_object('old', OLD.completion_date, 'new', NEW.completion_date));
    END IF;
    IF OLD.responsible_id IS DISTINCT FROM NEW.responsible_id THEN
      v_changes := v_changes || jsonb_build_object('responsible_id', jsonb_build_object('old', OLD.responsible_id, 'new', NEW.responsible_id));
    END IF;
    IF OLD.contract_manager_id IS DISTINCT FROM NEW.contract_manager_id THEN
      v_changes := v_changes || jsonb_build_object('contract_manager_id', jsonb_build_object('old', OLD.contract_manager_id, 'new', NEW.contract_manager_id));
    END IF;
    IF OLD.regional_manager_id IS DISTINCT FROM NEW.regional_manager_id THEN
      v_changes := v_changes || jsonb_build_object('regional_manager_id', jsonb_build_object('old', OLD.regional_manager_id, 'new', NEW.regional_manager_id));
    END IF;
    IF OLD.directory_id IS DISTINCT FROM NEW.directory_id THEN
      v_changes := v_changes || jsonb_build_object('directory_id', jsonb_build_object('old', OLD.directory_id, 'new', NEW.directory_id));
    END IF;

    IF v_changes != '{}' THEN
      INSERT INTO public.action_plan_history (action_plan_id, changed_by, change_type, changes)
      VALUES (NEW.id, COALESCE(auth.uid(), NEW.created_by), v_change_type, v_changes);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- 6. Create trigger
CREATE TRIGGER trg_action_plan_history
  AFTER INSERT OR UPDATE ON public.action_plans
  FOR EACH ROW EXECUTE FUNCTION public.log_action_plan_changes();
