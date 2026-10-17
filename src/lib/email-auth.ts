import { supabase } from "@/integrations/supabase/client";

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
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signUpWithEmail(email: string, password: string, origin: string) {
  if (!passwordIsValid(password)) throw new Error("Use uma senha com pelo menos 8 caracteres.");
  return supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: authRedirects(origin).confirmation } });
}

export async function requestPasswordReset(email: string, origin: string) {
  return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirects(origin).recovery });
}

export async function updateRecoveredPassword(password: string) {
  if (!passwordIsValid(password)) throw new Error("Use uma senha com pelo menos 8 caracteres.");
  return supabase.auth.updateUser({ password });
}