import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, Receipt, Target, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/app/GoogleButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Basefy Seller · Precificação e controle de vendas" },
      { name: "description", content: "Calcule custo, taxa e lucro, descubra quantas vendas faltam para a meta e controle o mês inteiro na Basefy." },
      { property: "og:title", content: "Basefy Seller · Precificação e controle de vendas" },
      { property: "og:description", content: "Planner de precificação da Basefy: taxa, lucro, meta do mês e fechamento salvos na nuvem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: Calculator, title: "Fichas de precificação", text: "Custo, taxa de 4,99% ou 7,49%, lucro, margem e preço mínimo." },
  { icon: Target, title: "Meta do mês", text: "Quantas vendas você precisa para chegar no lucro que quer." },
  { icon: Receipt, title: "Controle de vendas", text: "Cada venda guarda o cálculo do dia em que foi feita." },
  { icon: ClipboardCheck, title: "Fechamento", text: "Faturamento, taxas, custos e lucro calculados das suas vendas." },
];

function Index() {
  const [signed, setSigned] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSigned(!!data.session)); }, []);
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-5 py-6 md:py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">B</span>
          Basefy <span className="text-primary">Seller</span>
        </div>
        {signed && <Button asChild variant="ghost"><Link to="/inicio">Abrir app</Link></Button>}
      </header>

      <section className="flex flex-1 flex-col justify-center py-12 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Planner de precificação</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
          Saiba quanto sobra <span className="bg-gradient-primary bg-clip-text text-transparent">antes de vender.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
          Três contas decidem seu lucro: a taxa da Basefy, o lucro por venda e o preço mínimo. Aqui elas ficam prontas, salvas e sincronizadas em todos os seus aparelhos.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {signed
            ? <Button asChild size="lg" variant="hero" className="w-full sm:w-auto"><Link to="/inicio">Abrir meu painel</Link></Button>
            : <GoogleButton label="Começar com Google" />}
        </div>
      </section>

      <section className="grid gap-3 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass p-5">
            <f.icon className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
      <footer className="text-xs text-muted-foreground">
        Ferramenta pessoal, sem ligação automática com a Basefy. Confira sempre as taxas atuais no seu painel.
      </footer>
    </div>
  );
}
