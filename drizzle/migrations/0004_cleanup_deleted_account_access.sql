CREATE OR REPLACE FUNCTION public.cleanup_deleted_account_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.access_authorizations WHERE user_id = OLD.id;
  DELETE FROM public.user_roles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION public.cleanup_deleted_account_access() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER basefy_cleanup_deleted_account_access
AFTER DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.cleanup_deleted_account_access();
COMMENT ON FUNCTION public.cleanup_deleted_account_access() IS 'Remove account authorization and roles on Auth deletion while retaining immutable consumed access keys and audit bindings.';