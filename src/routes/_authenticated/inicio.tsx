import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ArrowRight, ArrowLeft, SkipForward, Package, Calculator, Receipt, Target, ClipboardCheck, Table2, Settings } from "lucide-react";
import { useState } from "react";
import { appHead } from "@/lib/head";
import { useGoals, useProducts, useSales, useSettings, currentMonth, monthLabel, salesInMonth } from "@/lib/data";
import { nextStepFlow, pickStep } from "@/lib/next-step";
import { summarize, fmtBRL, fmtPct } from "@/lib/pricing";
import { PageHeader, Card, Stat } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: appHead("Início", "Seu próximo passo, o resumo do mês e o progresso da meta."),
  component: Home,
});

const SHORTCUTS = [
  { to: "/produtos", label: "Produtos", detail: "Seu catálogo", icon: Package },
  { to: "/calculadora", label: "Calculadora", detail: "Preço e lucro", icon: Calculator },
  { to: "/vendas", label: "Vendas", detail: "Seus registros", icon: Receipt },
  { to: "/meta", label: "Meta do mês", detail: "Seu objetivo", icon: Target },
  { to: "/fechamento", label: "Fechamento", detail: "Resultado do mês", icon: ClipboardCheck },
  { to: "/tabelas", label: "Tabelas", detail: "Taxas e preços", icon: Table2 },
  { to: "/conteudo", label: "Conteúdo", detail: "Guias Basefy", icon: BookOpen },
  { to: "/configuracoes", label: "Sua conta", detail: "Perfil e preferências", icon: Settings },
] as const;

function Home() {
  const month = currentMonth();
  const { data: products, isLoading: lp } = useProducts();
  const { data: sales, isLoading: ls } = useSales();
  const { data: goals } = useGoals();
  const { data: settings } = useSettings();
  const [skip, setSkip] = useState(0);
  if (lp || ls) return <div className="space-y-3"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>;

  const goal = goals?.find((g) => g.month === month);
  const monthSales = salesInMonth(sales ?? [], month);
  const sum = summarize(monthSales);
  const noPrice = (products ?? []).filter((p) => p.price == null);

  const flow = nextStepFlow({
    hasProducts: !!products?.length,
    unpriced: noPrice[0] ? { id: noPrice[0].id, name: noPrice[0].name } : null,
    hasGoal: !!goal && goal.profit_goal > 0,
    hasMonthSales: monthSales.length > 0,
  });
  const { step, index, canSkip } = pickStep(flow, skip);

  const progress = goal && goal.profit_goal > 0 ? Math.max(0, Math.min(100, (sum.profit / goal.profit_goal) * 100)) : null;

  return (
    <>
      <PageHeader title={`Olá${settings?.display_name ? `, ${settings.display_name}` : ""}`} subtitle={`Resumo de ${monthLabel(month)}`} />
      <section className="mb-6 border-y border-border bg-secondary/50 px-2 py-6 md:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase text-primary">Seu próximo passo</div>
          {flow.length > 1 && <span className="text-xs tabular text-muted-foreground">Passo {index + 1} de {flow.length}</span>}
        </div>
        <h2 className="mt-2 text-xl font-bold md:text-2xl">{step.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild variant="hero"><Link to={step.to} search={("search" in step ? step.search : {}) as never}>{step.cta}<ArrowRight /></Link></Button>
          {canSkip && <Button variant="ghost" aria-label="Pular para o próximo passo" onClick={() => setSkip(index + 1)}><SkipForward />Pular</Button>}
          {index > 0 && <Button variant="ghost" onClick={() => setSkip(index - 1)}><ArrowLeft />Voltar</Button>}
        </div>
      </section>

      <section aria-label="Acessos rápidos" className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Tudo à mão</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SHORTCUTS.map((s) => <Link key={s.to} to={s.to} className="card-lilac flex min-w-0 items-center gap-3 p-3 transition-transform hover:-translate-y-0.5 md:p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-card/80 text-primary"><s.icon className="size-5" /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold">{s.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{s.detail}</span></span>
          </Link>)}
        </div>
      </section>

      {monthSales.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Stat label="Faturamento" value={fmtBRL(sum.revenue)} hint={`${sum.count} vendas · ticket ${fmtBRL(sum.ticket)}`} />
          <Stat label="Taxas" value={fmtBRL(sum.commissions)} />
          <Stat label="Custos" value={fmtBRL(sum.costs)} />
          <Stat label="Lucro" value={fmtBRL(sum.profit)} hint={`margem ${fmtPct(sum.margin)}`} tone={sum.profit < 0 ? "bad" : "good"} />
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">Ainda não há vendas neste mês — os números aparecem aqui quando você registrar a primeira.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Meta do mês</span>
            <span className="tabular text-muted-foreground">{goal && goal.profit_goal > 0 ? `${fmtBRL(sum.profit)} de ${fmtBRL(goal.profit_goal)}` : "não definida"}</span></div>
          {progress != null ? <Progress value={progress} /> : <Link to="/meta" className="text-sm text-primary">Definir meta →</Link>}
        </Card>
        <Card>
          <div className="mb-2 text-sm font-semibold">Últimas vendas</div>
          {!(sales ?? []).length ? <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p> :
            (sales ?? []).slice(0, 4).map((s) => (
              <div key={s.id} className="flex justify-between py-1 text-sm"><span className="truncate">{s.product_name}</span><span className="tabular">{fmtBRL(s.price)}</span></div>
            ))}
        </Card>
      </div>

    </>
  );
}
