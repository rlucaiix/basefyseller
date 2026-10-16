import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Basefy Seller" },
      { name: "description", content: "Entre ou crie sua conta no Basefy Seller para salvar seus produtos, vendas e metas." },
      { property: "og:title", content: "Entrar · Basefy Seller" },
      { property: "og:description", content: "Acesse seu planner de precificação Basefy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/inicio" }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) nav({ to: "/inicio" }); });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/inicio` } });
        if (error) throw error;
        if (!data.session) setMsg("Enviamos um link de confirmação para o seu e-mail.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMsg("Se o e-mail existir, você receberá um link para criar uma nova senha.");
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "Erro";
      toast.error(/Invalid login/i.test(m) ? "E-mail ou senha incorretos." : m);
    } finally { setBusy(false); }
  }

  async function oauth(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar agora.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-sm p-6">
        <Link to="/" className="flex items-center gap-2 font-extrabold">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">B</span>
          Basefy <span className="text-primary">Seller</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold">
          {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Nunca pedimos a sua senha da Basefy.</p>

        {mode !== "forgot" && (
          <div className="mt-5 grid gap-2">
            <Button variant="outline" className="h-11" onClick={() => oauth("google")}>Continuar com Google</Button>
            <button type="button" className="lovable-auth-button" onClick={() => oauth("lovable")}>Continue with Lovable</button>
            <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
          </div>
        )}

        <form onSubmit={submit} className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required autoComplete="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="pw">Senha</Label>
              <Input id="pw" type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          {msg && <p className="rounded-lg bg-accent p-3 text-sm">{msg}</p>}
          <Button type="submit" variant="hero" size="lg" disabled={busy}>
            {busy ? "Aguarde…" : mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          {mode === "signin" && <>
            <button className="text-muted-foreground hover:text-foreground" onClick={() => setMode("forgot")}>Esqueci minha senha</button>
            <button className="text-primary" onClick={() => setMode("signup")}>Não tem conta? Criar agora</button>
          </>}
          {mode !== "signin" && <button className="text-primary" onClick={() => setMode("signin")}>Já tenho conta</button>}
        </div>
      </div>
    </div>
  );
}
