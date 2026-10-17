CREATE TABLE public.access_authorizations (
 user_id uuid PRIMARY KEY, active boolean NOT NULL DEFAULT true, source text NOT NULL CHECK (source IN ('legacy','key')), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.access_authorizations TO authenticated;
GRANT ALL ON public.access_authorizations TO service_role;
ALTER TABLE public.access_authorizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_authorization ON public.access_authorizations FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.user_roles (
 user_id uuid NOT NULL, role text NOT NULL CHECK (role = 'admin'), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_role ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_app_access() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS(SELECT 1 FROM public.access_authorizations WHERE user_id = auth.uid() AND active);
$$;
REVOKE ALL ON FUNCTION public.has_app_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_app_access() TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.is_key_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.has_app_access() AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role='admin');
$$;
REVOKE ALL ON FUNCTION public.is_key_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_key_admin() TO authenticated, service_role;

CREATE TABLE public.access_keys (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key_hash text NOT NULL UNIQUE CHECK(length(key_hash)=64), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','used','revoked')),
 bound_user_id uuid UNIQUE, registration_email text, generated_at timestamptz NOT NULL DEFAULT now(), generated_by uuid NOT NULL, used_at timestamptz, revoked_at timestamptz,
 CHECK ((status='used' AND bound_user_id IS NOT NULL AND registration_email IS NOT NULL AND used_at IS NOT NULL) OR (status IN ('active','revoked') AND bound_user_id IS NULL AND registration_email IS NULL AND used_at IS NULL))
);
GRANT SELECT ON public.access_keys TO authenticated;
GRANT ALL ON public.access_keys TO service_role;
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_keys ON public.access_keys FOR SELECT TO authenticated USING (public.is_key_admin());

CREATE TABLE public.access_key_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key_id uuid, actor_id uuid, action text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.access_key_audit TO authenticated;
GRANT ALL ON public.access_key_audit TO service_role;
ALTER TABLE public.access_key_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_key_audit ON public.access_key_audit FOR SELECT TO authenticated USING (public.is_key_admin());

CREATE TABLE public.access_key_tickets (
 ticket_hash text PRIMARY KEY, key_id uuid NOT NULL REFERENCES public.access_keys(id), expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.access_key_tickets TO service_role;
ALTER TABLE public.access_key_tickets ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.access_attempt_limits (
 bucket text PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(), attempts integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.access_attempt_limits TO service_role;
ALTER TABLE public.access_attempt_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.access_rate_allowed(p_bucket text, p_limit integer, p_seconds integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 INSERT INTO public.access_attempt_limits(bucket,window_start,attempts) VALUES(p_bucket,clock_timestamp(),1)
 ON CONFLICT(bucket) DO UPDATE SET
 attempts=CASE WHEN public.access_attempt_limits.window_start < clock_timestamp()-make_interval(secs=>p_seconds) THEN 1 ELSE public.access_attempt_limits.attempts+1 END,
 window_start=CASE WHEN public.access_attempt_limits.window_start < clock_timestamp()-make_interval(secs=>p_seconds) THEN clock_timestamp() ELSE public.access_attempt_limits.window_start END
 RETURNING attempts INTO n;
 RETURN n <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.access_rate_allowed(text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.access_rate_allowed(text,integer,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.validate_access_key(p_key text, p_intent text DEFAULT 'signup', p_email text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE k public.access_keys%ROWTYPE; ticket text; h text;
BEGIN
 IF p_intent NOT IN ('signup','login') OR p_key IS NULL OR length(p_key)>128 OR length(p_email)>254 THEN RETURN jsonb_build_object('ok',false,'code','invalid'); END IF;
 IF NOT public.access_rate_allowed('global:'||p_intent,300,900) THEN RETURN jsonb_build_object('ok',false,'code','limited'); END IF;
 h:=encode(extensions.digest(trim(p_key),'sha256'),'hex');
 IF NOT public.access_rate_allowed('key:'||p_intent||':'||h,10,900) THEN RETURN jsonb_build_object('ok',false,'code','limited'); END IF;
 SELECT * INTO k FROM public.access_keys WHERE key_hash=h;
 INSERT INTO public.access_key_audit(key_id,action) VALUES(k.id,'validate_'||p_intent);
 IF p_intent='login' THEN
  IF k.status='used' AND lower(k.registration_email)=lower(trim(p_email)) AND EXISTS(SELECT 1 FROM public.access_authorizations a JOIN auth.users u ON u.id=a.user_id WHERE a.user_id=k.bound_user_id AND a.active AND lower(u.email)=lower(trim(p_email)) AND u.email_confirmed_at IS NOT NULL AND (u.banned_until IS NULL OR u.banned_until<now())) THEN
   RETURN jsonb_build_object('ok',true,'code','email_confirmation_required');
  END IF;
  RETURN jsonb_build_object('ok',false,'code','login_invalid');
 END IF;
 IF k.id IS NULL THEN RETURN jsonb_build_object('ok',false,'code','invalid'); END IF;
 IF k.status='used' THEN RETURN jsonb_build_object('ok',false,'code','used'); END IF;
 IF k.status='revoked' THEN RETURN jsonb_build_object('ok',false,'code','revoked'); END IF;
 ticket:=encode(extensions.gen_random_bytes(32),'hex');
 INSERT INTO public.access_key_tickets(ticket_hash,key_id,expires_at) VALUES(encode(extensions.digest(ticket,'sha256'),'hex'),k.id,now()+interval '10 minutes');
 RETURN jsonb_build_object('ok',true,'code','valid','ticket',ticket);
END;
$$;
REVOKE ALL ON FUNCTION public.validate_access_key(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_access_key(text,text,text) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.consume_signup_key() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE k public.access_keys%ROWTYPE; ticket text;
BEGIN
 ticket:=NEW.raw_user_meta_data->>'access_ticket';
 IF ticket IS NULL OR length(ticket)<>64 THEN RAISE EXCEPTION 'ACCESS_KEY_REQUIRED'; END IF;
 SELECT ak.* INTO k FROM public.access_keys ak JOIN public.access_key_tickets t ON t.key_id=ak.id
 WHERE t.ticket_hash=encode(extensions.digest(ticket,'sha256'),'hex') AND t.expires_at>now() FOR UPDATE OF ak;
 IF k.id IS NULL THEN RAISE EXCEPTION 'ACCESS_KEY_INVALID'; END IF;
 IF k.status='used' THEN RAISE EXCEPTION 'ACCESS_KEY_USED'; END IF;
 IF k.status='revoked' THEN RAISE EXCEPTION 'ACCESS_KEY_REVOKED'; END IF;
 IF NEW.email IS NULL THEN RAISE EXCEPTION 'ACCESS_KEY_EMAIL_REQUIRED'; END IF;
 UPDATE public.access_keys SET status='used',bound_user_id=NEW.id,registration_email=NEW.email,used_at=now() WHERE id=k.id;
 INSERT INTO public.access_authorizations(user_id,source) VALUES(NEW.id,'key');
 INSERT INTO public.access_key_audit(key_id,actor_id,action) VALUES(k.id,NEW.id,'consumed');
 NEW.raw_user_meta_data:=NEW.raw_user_meta_data-'access_ticket';
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_signup_key() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER basefy_require_signup_key BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.consume_signup_key();

CREATE OR REPLACE FUNCTION public.protect_consumed_key() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'ACCESS_KEY_RETENTION_REQUIRED'; END IF;
 IF OLD.status='used' AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'ACCESS_KEY_IMMUTABLE'; END IF;
 IF NEW.key_hash IS DISTINCT FROM OLD.key_hash OR NEW.generated_by IS DISTINCT FROM OLD.generated_by OR NEW.generated_at IS DISTINCT FROM OLD.generated_at THEN RAISE EXCEPTION 'ACCESS_KEY_IMMUTABLE'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER protect_access_key BEFORE UPDATE OR DELETE ON public.access_keys FOR EACH ROW EXECUTE FUNCTION public.protect_consumed_key();

CREATE OR REPLACE FUNCTION public.generate_access_keys(p_count integer DEFAULT 1) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE result jsonb:='[]'::jsonb; plain text; kid uuid; i integer;
BEGIN
 IF NOT public.is_key_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
 IF p_count IS NULL OR p_count<1 OR p_count>100 THEN RAISE EXCEPTION 'INVALID_BATCH_SIZE'; END IF;
 FOR i IN 1..p_count LOOP
  plain:='BF-'||encode(extensions.gen_random_bytes(32),'hex');
  INSERT INTO public.access_keys(key_hash,generated_by) VALUES(encode(extensions.digest(plain,'sha256'),'hex'),auth.uid()) RETURNING id INTO kid;
  INSERT INTO public.access_key_audit(key_id,actor_id,action) VALUES(kid,auth.uid(),'generated');
  result:=result||jsonb_build_array(jsonb_build_object('id',kid,'key',plain));
 END LOOP;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_access_keys(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.generate_access_keys(integer) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.revoke_access_key(p_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.is_key_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
 UPDATE public.access_keys SET status='revoked',revoked_at=now() WHERE id=p_id AND status='active';
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.access_key_audit(key_id,actor_id,action) VALUES(p_id,auth.uid(),'revoked');
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_access_key(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.revoke_access_key(uuid) TO authenticated,service_role;

INSERT INTO public.access_authorizations(user_id,source)
 SELECT id,'legacy' FROM auth.users WHERE id IN ('c01ea866-7b07-4824-aae1-76271a59aa27','3d02e2a9-361e-42f2-aaec-8da73c03113e','4ff73487-2749-4a74-96b4-81341ed63e56','72094982-f30a-4770-81b2-0c08b0d897c3','940f8f73-39a6-4ca4-9614-8eeaaf0af9b9','0eb260d7-89d4-4d71-8ec2-1c705522160d','6da032c7-e114-49bb-a61c-63ac0103d6dc');
INSERT INTO public.user_roles(user_id,role) SELECT id,'admin' FROM auth.users WHERE id='72094982-f30a-4770-81b2-0c08b0d897c3' AND lower(email)='rlucaiix@gmail.com';

CREATE POLICY authorized_products ON public.products AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());
CREATE POLICY authorized_sales ON public.sales AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());
CREATE POLICY authorized_goals ON public.monthly_goals AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());
CREATE POLICY authorized_settings ON public.settings AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());
COMMENT ON TABLE public.access_keys IS 'Permanent single-use key audit; no auth.users FK so account deletion never releases a key.';