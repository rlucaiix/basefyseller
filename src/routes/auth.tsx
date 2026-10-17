import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authError, signInWithEmail, signUpWithEmail, requestPasswordReset } from "@/lib/email-auth";
import { hasAuthorizedAccess, KEY_MESSAGES, requestKeyLogin, validateAccessKey } from "@/lib/access-keys";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Basefy Seller" },
      { name: "description", content: "Entre ou crie sua conta com e-mail e senha para acessar seus produtos, vendas e metas." },
      { property: "og:title", content: "Entrar · Basefy Seller" },
      { property: "og:description", content: "Acesse seu planner de precificação Basefy com e-mail e senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [validatedKey, setValidatedKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.has("error")) setError("O link de confirmação é inválido ou expirou. Tente criar sua conta novamente para receber outro e-mail.");
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (data.user) {
        const authorized = await hasAuthorizedAccess();
        if (!active) return;
        if (authorized) void nav({ to: "/inicio", replace: true });
        else { await supabase.auth.signOut(); setError("Esta conta não possui autorização de acesso. Fale com o administrador."); }
      }
    }).catch(() => { if (active) setError("Não foi possível verificar seu acesso. Confira sua internet."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [nav]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "keylogin") {
        const result = await requestKeyLogin(accessKey, email, window.location.origin);
        if (result.error) setError(authError(result.error));
        else setNotice("Abra o link enviado ao seu e-mail para confirmar sua identidade e entrar. Confira também o spam.");
      } else if (mode === "reset") {
        const result = await requestPasswordReset(email, window.location.origin);
        if (result.error) setError(authError(result.error));
        else setNotice("Se este e-mail estiver cadastrado, você receberá um link para definir uma nova senha. Confira também o spam.");
      } else if (mode === "signup") {
        if (validatedKey !== accessKey.trim()) throw new Error(KEY_MESSAGES.invalid);
        const result = await signUpWithEmail(email, password, window.location.origin, accessKey, confirmPassword);
        if (result.error) setError(authError(result.error));
        else if (result.data.user?.identities?.length === 0) setError("E-mail já cadastrado. Entre na sua conta ou use ‘Esqueci minha senha’.");
        else { setPassword(""); setConfirmPassword(""); setAccessKey(""); setValidatedKey(""); setNotice("Confira seu e-mail e clique no link de confirmação para ativar sua conta. Sua chave ficou vinculada a ela. Confira também o spam."); }
      } else {
        const result = await signInWithEmail(email, password);
        if (result.error) setError(authError(result.error));
        else if (result.data.session) await nav({ to: "/inicio", replace: true });
      }
    } catch (err) { setError(authError(err instanceof Error ? err : {})); }
    finally { setBusy(false); }
  }

  async function validateKey() {
    if (busy) return;
    setBusy(true); setError(""); setNotice(""); setValidatedKey("");
    try { await validateAccessKey(accessKey); setValidatedKey(accessKey.trim()); setNotice("Chave validada. Você pode concluir seu cadastro."); }
    catch (err) { setError(err instanceof Error && Object.values(KEY_MESSAGES).includes(err.message as typeof KEY_MESSAGES[keyof typeof KEY_MESSAGES]) ? err.message : KEY_MESSAGES.temporary); }
    finally { setBusy(false); }
  }

  function changeMode(value: string) { setMode(value); setPassword(""); setConfirmPassword(""); setAccessKey(""); setValidatedKey(""); setError(""); setNotice(""); }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm p-7 text-center sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2 font-extrabold">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">B</span>
          Basefy <span className="text-primary">Seller</span>
        </Link>
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Bem-vindo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Seus produtos, vendas e metas em uma só conta.</p>
        <Tabs value={mode === "reset" || mode === "keylogin" ? "signin" : mode} onValueChange={changeMode} className="mt-6">
          <TabsList className="w-full" aria-label="Acesso à conta">
            <TabsTrigger value="signin" className="flex-1" disabled={busy}>Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1" disabled={busy}>Criar conta</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={submit} className="mt-5 space-y-4 text-left">
          {mode === "reset" && <h2 className="font-semibold">Recuperar senha</h2>}
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></div>
          {mode !== "reset" && mode !== "keylogin" && <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" minLength={8} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /><p className="text-xs text-muted-foreground">No mínimo 8 caracteres.</p></div>}
          {mode === "signup" && <div className="space-y-2"><Label htmlFor="confirm-password">Confirmar senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" required maxLength={128} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={busy} /></div>}
          {(mode === "signup" || mode === "keylogin") && <div className="space-y-2"><Label htmlFor="access-key">Chave de acesso</Label><Input id="access-key" autoComplete="off" type="password" required maxLength={128} value={accessKey} onChange={e => { setAccessKey(e.target.value); setValidatedKey(""); setNotice(""); }} disabled={busy} />{mode === "signup" && <Button type="button" variant="outline" className="w-full" disabled={busy || !accessKey.trim()} onClick={validateKey}>Validar chave</Button>}</div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="text-sm text-success">{notice}</p>}
          <Button type="submit" className="w-full" disabled={busy || checking || (mode === "signup" && (!validatedKey || validatedKey !== accessKey.trim()))}>{(busy || checking) && <Loader2 className="animate-spin" />}{busy ? "Aguarde…" : checking ? "Verificando acesso…" : mode === "signup" ? "Criar conta" : mode === "reset" ? "Enviar link de recuperação" : mode === "keylogin" ? "Confirmar acesso por e-mail" : "Entrar"}</Button>
          <Button type="button" variant="link" className="h-auto p-0" disabled={busy} onClick={() => changeMode(mode === "reset" ? "signin" : "reset")}>{mode === "reset" ? "Voltar para entrar" : "Esqueci minha senha"}</Button>
          {(mode === "signin" || mode === "keylogin") && <Button type="button" variant="link" className="h-auto p-0" disabled={busy} onClick={() => changeMode(mode === "keylogin" ? "signin" : "keylogin")}>{mode === "keylogin" ? "Entrar com senha" : "Entrar com chave"}</Button>}
        </form>
        <p className="mt-6 flex items-start justify-center gap-2 text-left text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Esta senha é só do Basefy Seller. Nunca pedimos a senha da sua conta na Basefy.
        </p>
      </div>
    </div>
  );
}
