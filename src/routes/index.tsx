import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, Receipt, Target, ClipboardCheck, Package, Table2, BookOpen, ShieldCheck, Cloud, ArrowRight, Check } from "lucide-react";
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
  { icon: Calculator, title: "Fichas de precificação", text: "Custo, taxa de 4,99% ou 7,49%, lucro, margem e preço mínimo — tudo calculado na hora, sem planilha." },
  { icon: Target, title: "Meta do mês", text: "Diga quanto quer lucrar e descubra quantas vendas por dia separam você da meta." },
  { icon: Receipt, title: "Controle de vendas", text: "Cada venda guarda o cálculo do dia em que foi feita. Mudou a taxa? O histórico não muda." },
  { icon: ClipboardCheck, title: "Fechamento", text: "Faturamento, taxas, custos, lucro e produto campeão, calculados das suas vendas reais." },
  { icon: Package, title: "Produtos", text: "Um cadastro único com fornecedor, custos e preço da concorrência, usado por todo o app." },
  { icon: Table2, title: "Tabelas rápidas", text: "Tabela de taxas e de preço mínimo sempre à mão para consultar antes de anunciar." },
  { icon: BookOpen, title: "Conteúdo guiado", text: "Capítulos do guia Basefy para ler dentro do app, com progresso salvo na sua conta." },
  { icon: Cloud, title: "Salvo na nuvem", text: "Tudo sincronizado entre celular e computador. Sem internet, salva no aparelho e envia depois." },
];

const STEPS = [
  { n: "1", title: "Entre com o Google", text: "Um toque e sua conta está criada. Sem senha para decorar." },
  { n: "2", title: "Conte quem você é", text: "Um quiz rapidinho de boas-vindas personaliza o app para o seu momento." },
  { n: "3", title: "Cadastre e venda", text: "Monte a ficha do produto, veja o lucro real e acompanhe a meta do mês." },
];

const POINTS = [
  "Feito para vender sem anúncio pago",
  "Taxas da Basefy já vêm configuradas",
  "Funciona no celular e no computador",
  "Seus dados ficam só na sua conta",
];

function Index() {
  const [signed, setSigned] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSigned(!!data.session)); }, []);
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-5 py-6 md:py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">B</span>
          Basefy <span className="text-primary">Seller</span>
        </div>
        {signed && <Button asChild variant="ghost"><Link to="/inicio">Abrir app</Link></Button>}
      </header>

      <section className="flex flex-1 flex-col items-center py-14 text-center md:py-24">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
          Saiba quanto sobra <span className="bg-gradient-primary bg-clip-text text-transparent">antes de vender.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
          Três contas decidem seu lucro: a taxa da Basefy, o lucro por venda e o preço mínimo. Aqui elas ficam prontas, salvas e sincronizadas em todos os seus aparelhos.
        </p>
        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          {signed
            ? <Button asChild size="lg" variant="hero" className="w-full sm:w-auto"><Link to="/inicio">Abrir meu painel<ArrowRight /></Link></Button>
            : <GoogleButton label="Começar com Google" />}
        </div>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {POINTS.map((p) => (
            <li key={p} className="flex items-center gap-1.5"><Check className="size-4 text-success" />{p}</li>
          ))}
        </ul>
      </section>

      <section className="pb-12">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">Tudo que você precisa, em um lugar</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">Do primeiro cadastro ao fechamento do mês, cada ferramenta conversa com a outra.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-lilac p-5 transition-transform duration-150 hover:-translate-y-1">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow"><f.icon className="size-5" /></span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-12">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">Começar leva menos de um minuto</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="glass flex items-start gap-4 p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground shadow-glow">{s.n}</span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-lilac mb-12 flex flex-col items-center gap-4 p-8 text-center md:p-12">
        <ShieldCheck className="size-8 text-primary" />
        <h2 className="max-w-xl text-2xl font-bold tracking-tight md:text-3xl">Seu negócio, seus números, sua conta.</h2>
        <p className="max-w-md text-sm text-muted-foreground">Entre com o Google e comece agora. Seus dados ficam protegidos e visíveis só para você.</p>
        {signed
          ? <Button asChild size="lg" variant="hero"><Link to="/inicio">Abrir meu painel<ArrowRight /></Link></Button>
          : <GoogleButton label="Começar com Google" />}
      </section>

      <footer className="text-center text-xs text-muted-foreground">
        Ferramenta pessoal, sem ligação automática com a Basefy. Confira sempre as taxas atuais no seu painel.
      </footer>
    </div>
  );
}
