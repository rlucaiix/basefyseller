import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const KEY_MESSAGES = {
  used: "Pô, seu acesso foi bloqueado, pois você tentou reutilizar uma chave já existente.",
  invalid: "Chave de acesso inválida. Confira o código e tente novamente.",
  revoked: "Esta chave de acesso não está mais disponível.",
  temporary: "Não foi possível validar sua chave agora. Tente novamente.",
  limited: "Muitas tentativas. Aguarde 15 minutos e tente novamente.",
  login_invalid: "Não foi possível confirmar este acesso. Confira a chave e o e-mail da sua conta.",
} as const;

export const keySchema = z.string().trim().min(1, KEY_MESSAGES.invalid).max(128, KEY_MESSAGES.invalid);
export const signupSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string().min(8, "Use uma senha com pelo menos 8 caracteres.").max(128),
  confirmPassword: z.string(),
  key: keySchema,
}).strict().refine(value => value.password === value.confirmPassword, { message: "As senhas não coincidem.", path: ["confirmPassword"] });

const keyResult = z.object({ ok: z.boolean(), code: z.string(), ticket: z.string().optional() });
export async function validateAccessKey(key: string, intent: "signup" | "login" = "signup", email = "") {
  const value = keySchema.parse(key);
  if (intent === "login") z.string().trim().email("Informe um e-mail válido.").max(254).parse(email);
  const { data, error } = await supabase.rpc("validate_access_key", { p_key: value, p_intent: intent, p_email: email.trim() });
  if (error) throw new Error(KEY_MESSAGES.temporary);
  const result = keyResult.parse(data);
  if (!result.ok) throw new Error(KEY_MESSAGES[result.code as keyof typeof KEY_MESSAGES] ?? KEY_MESSAGES.temporary);
  return result;
}

export async function hasAuthorizedAccess() {
  const { data, error } = await supabase.rpc("has_app_access");
  if (error) throw new Error("Não foi possível verificar a autorização da sua conta.");
  return data === true;
}

export async function requestKeyLogin(key: string, email: string, origin: string) {
  await validateAccessKey(key, "login", email);
  // The key never issues tokens: the Auth provider verifies ownership through email.
  return supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth` } });
}