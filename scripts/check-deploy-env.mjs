import { pathToFileURL } from "node:url";

// Public browser credentials for the existing connected project, never privileged keys.
export const PUBLIC_PROJECT_ENV = Object.freeze({
  VITE_SUPABASE_URL: "https://mbvydosuoqvmfmhrzzce.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_hrNZmmvv07jV6P6d16yZzw_kzxO7_Ng",
});

export function resolveDeployEnv(env) {
  return {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL?.trim() || PUBLIC_PROJECT_ENV.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || PUBLIC_PROJECT_ENV.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function validateDeployEnv(env) {
  const issues = [];
  const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key } = resolveDeployEnv(env);
  if (!url) issues.push("Defina VITE_SUPABASE_URL com a conexão pública do Lovable Cloud existente.");
  else {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password || /localhost|127\.0\.0\.1|id-preview--/.test(parsed.hostname)) {
        issues.push("VITE_SUPABASE_URL deve ser a conexão pública HTTPS, não a prévia nem um endereço local.");
      }
    } catch { issues.push("VITE_SUPABASE_URL deve ser uma URL HTTPS válida."); }
  }
  if (!key) issues.push("Defina VITE_SUPABASE_PUBLISHABLE_KEY com a chave pública do mesmo Lovable Cloud.");
  else if (!key.startsWith("sb_publishable_")) {
    issues.push("Use somente a chave pública sb_publishable_; nunca uma chave privada ou service-role.");
  }
  return issues;
}

export function configureDeployEnv(env, target = env) {
  const issues = validateDeployEnv(env);
  if (issues.length) throw new Error(issues.join("\n"));
  const resolved = resolveDeployEnv(env);
  Object.assign(target, resolved);
  return resolved;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const issues = validateDeployEnv(process.env);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  } else console.log("Configuração pública validada. Nenhuma chave foi exibida.");
}