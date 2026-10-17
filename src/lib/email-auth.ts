import { supabase } from "@/integrations/supabase/client";
import { hasAuthorizedAccess, KEY_MESSAGES, signupSchema, validateAccessKey } from "./access-keys";

export const MIN_PASSWORD_LENGTH = 8;
export const RECOVERY_STORAGE_KEY = "basefy-password-recovery";

export function authRedirects(origin: string) {
  return { confirmation: `${origin}/auth`, recovery: `${origin}/reset-password` };
}

export function passwordIsValid(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function authError(error: { code?: string | undefined; message?: string | undefined }) {
  const code = error.code;
  const message = error.message?.toLowerCase() ?? "";
  if (Object.values(KEY_MESSAGES).some(value => value.toLowerCase() === message) || message === "as senhas não coincidem.") return error.message ?? KEY_MESSAGES.temporary;
  if (message.includes("access_key_used")) return KEY_MESSAGES.used;
  if (message.includes("access_key_revoked")) return KEY_MESSAGES.revoked;
  if (message.includes("access_key_")) return KEY_MESSAGES.invalid;
  if (message.includes("não possui autorização")) return "Esta conta não possui autorização de acesso. Fale com o administrador.";
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) return "E-mail não confirmado. Abra o link enviado para o seu e-mail antes de entrar.";
  if (["user_already_exists", "email_exists"].includes(code ?? "") || message.includes("already registered")) return "E-mail já cadastrado. Entre na sua conta ou use ‘Esqueci minha senha’.";
  if (code === "weak_password" || message.includes("password")) return "Use uma senha com pelo menos 8 caracteres, combinando letras, números e símbolos.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || message.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (code === "otp_expired" || message.includes("expired")) return "Este link é inválido ou expirou. Solicite um novo e-mail.";
  if (message.includes("fetch") || message.includes("network")) return "Não foi possível conectar. Confira sua internet e tente novamente.";
  return "Não foi possível concluir. Tente novamente em alguns instantes.";
}

export async function signInWithEmail(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (result.data.session && !(await hasAuthorizedAccess())) {
    await supabase.auth.signOut();
    throw new Error("Esta conta não possui autorização de acesso. Fale com o administrador.");
  }
  return result;
}

export async function signUpWithEmail(email: string, password: string, origin: string, key: string, confirmPassword: string) {
  const parsed = signupSchema.safeParse({ email, password, key, confirmPassword });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? KEY_MESSAGES.invalid);
  const validation = await validateAccessKey(parsed.data.key);
  if (!validation.ticket) throw new Error(KEY_MESSAGES.temporary);
  const result = await supabase.auth.signUp({ email: parsed.data.email, password, options: { emailRedirectTo: authRedirects(origin).confirmation, data: { access_ticket: validation.ticket } } });
  // Auth hides trigger errors. Re-read the actual backend state after a failed signup.
  if (result.error) await validateAccessKey(parsed.data.key);
  return result;
}

export async function requestPasswordReset(email: string, origin: string) {
  return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirects(origin).recovery });
}

export async function updateRecoveredPassword(password: string) {
  if (!passwordIsValid(password)) throw new Error("Use uma senha com pelo menos 8 caracteres.");
  return supabase.auth.updateUser({ password });
}