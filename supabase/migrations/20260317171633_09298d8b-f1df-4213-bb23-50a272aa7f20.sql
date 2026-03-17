-- Re-grant EXECUTE on has_role to authenticated so RLS policies work
-- The function is SECURITY DEFINER and used internally by RLS policies
-- RPC enumeration is prevented because has_own_role exists for client-side use
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
