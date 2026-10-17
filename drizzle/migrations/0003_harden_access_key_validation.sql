CREATE OR REPLACE FUNCTION public.validate_access_key(p_key text, p_intent text DEFAULT 'signup', p_email text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE k public.access_keys%ROWTYPE; ticket text; h text; bucket text;
BEGIN
 IF p_intent NOT IN ('signup','login') OR p_key IS NULL OR length(p_key)>128 OR length(p_email)>254 THEN RETURN jsonb_build_object('ok',false,'code','invalid'); END IF;
 DELETE FROM public.access_key_tickets WHERE expires_at < now();
 DELETE FROM public.access_attempt_limits WHERE window_start < now()-interval '1 day';
 h:=encode(extensions.digest(trim(p_key),'sha256'),'hex');
 SELECT * INTO k FROM public.access_keys WHERE key_hash=h;
 bucket:=CASE WHEN k.id IS NULL THEN 'unknown:'||p_intent||':'||left(h,2) ELSE 'key:'||p_intent||':'||h END;
 IF NOT public.access_rate_allowed(bucket,CASE WHEN k.id IS NULL THEN 30 ELSE 10 END,900) THEN RETURN jsonb_build_object('ok',false,'code','limited'); END IF;
 IF k.id IS NOT NULL THEN INSERT INTO public.access_key_audit(key_id,action) VALUES(k.id,'validate_'||p_intent); END IF;
 IF p_intent='login' THEN
  IF k.status='used' AND EXISTS(SELECT 1 FROM public.access_authorizations a JOIN auth.users u ON u.id=a.user_id WHERE a.user_id=k.bound_user_id AND a.active AND lower(u.email)=lower(trim(p_email)) AND u.email_confirmed_at IS NOT NULL AND (u.banned_until IS NULL OR u.banned_until<now())) THEN
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
COMMENT ON FUNCTION public.validate_access_key(text,text,text) IS 'Bounded 256 unknown-key buckets per intent; valid-key limits; expired ticket cleanup; login follows current verified email, not audit email.';