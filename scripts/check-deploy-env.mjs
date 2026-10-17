import { pathToFileURL } from "node:url";

export function validateDeployEnv(env) {
  const issues = [];
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const issues = validateDeployEnv(process.env);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  } else console.log("Configuração pública validada. Nenhuma chave foi exibida.");
}