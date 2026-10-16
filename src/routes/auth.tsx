import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GoogleButton } from "@/components/app/GoogleButton";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Basefy Seller" },
      { name: "description", content: "Entre com sua conta Google para acessar seus produtos, vendas e metas." },
      { property: "og:title", content: "Entrar · Basefy Seller" },
      { property: "og:description", content: "Acesse seu planner de precificação Basefy com o Google." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/inicio" }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) nav({ to: "/inicio" }); });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm p-7 text-center sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2 font-extrabold">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">B</span>
          Basefy <span className="text-primary">Seller</span>
        </Link>
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Bem-vindo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Entre com sua conta Google. Se for a primeira vez, sua conta é criada na hora.</p>
        <div className="mt-7 [&_button]:w-full"><GoogleButton label="Continuar com Google" /></div>
        <p className="mt-6 flex items-start justify-center gap-2 text-left text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Usamos só seu nome e e-mail. Nunca pedimos a senha da Basefy.
        </p>
      </div>
    </div>
  );
}
