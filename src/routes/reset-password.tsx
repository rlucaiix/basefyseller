import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authError, RECOVERY_STORAGE_KEY, updateRecoveredPassword } from "@/lib/email-auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Nova senha · Basefy Seller" },
    { name: "description", content: "Defina uma nova senha para acessar sua conta Basefy Seller com segurança." },
    { property: "og:title", content: "Nova senha · Basefy Seller" },
    { property: "og:description", content: "Recupere o acesso à sua conta Basefy Seller." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [state, setState] = useState<"checking" | "valid" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const recoveryLink = hash.get("type") === "recovery";
    if (hash.has("error") || query.has("error")) { setState("invalid"); return; }
    supabase.auth.getUser().then(({ data, error: failure }) => {
      if (!active) return;
      const stored = Number(sessionStorage.getItem(RECOVERY_STORAGE_KEY));
      const recentRecovery = stored > 0 && Date.now() - stored < 30 * 60 * 1000;
      const valid = !failure && Boolean(data.user) && (recoveryLink || recentRecovery);
      if (valid && recoveryLink) sessionStorage.setItem(RECOVERY_STORAGE_KEY, String(Date.now()));
      setState(valid ? "valid" : "invalid");
    }).catch(() => { if (active) setState("invalid"); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || state !== "valid") return;
    if (password !== confirmation) { setError("As senhas não coincidem."); return; }
    setBusy(true); setError("");
    try {
      const { error: failure } = await updateRecoveredPassword(password);
      if (failure) {
        if (["session_not_found", "session_expired", "refresh_token_not_found", "otp_expired"].includes(failure.code ?? "")) setState("invalid");
        else setError(authError(failure));
      } else {
        sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
        await nav({ to: "/inicio", replace: true });
      }
    } catch (err) { setError(authError(err instanceof Error ? err : {})); }
    finally { setBusy(false); }
  }

  return <div className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
    <div className="glass w-full max-w-sm p-7 sm:p-8">
      <Link to="/" className="font-extrabold">Basefy <span className="text-primary">Seller</span></Link>
      <LockKeyhole className="mt-7 size-8 text-primary" />
      <h1 className="mt-3 text-2xl font-bold">Definir nova senha</h1>
      {state === "checking" ? <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Verificando seu link…</p>
        : state === "invalid" ? <div className="mt-5 space-y-5"><p role="alert" className="text-sm text-destructive">Este link é inválido ou expirou. Volte para entrar e solicite um novo link em “Esqueci minha senha”.</p><Button asChild className="w-full"><Link to="/auth">Voltar para entrar</Link></Button></div>
        : <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /><p className="text-xs text-muted-foreground">No mínimo 8 caracteres.</p></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{busy ? "Salvando…" : "Salvar nova senha"}</Button>
        </form>}
    </div>
  </div>;
}