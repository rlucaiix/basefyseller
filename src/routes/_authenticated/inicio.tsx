import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Package, Calculator, Receipt, Target, ClipboardCheck, Table2 } from "lucide-react";
import { appHead } from "@/lib/head";
import { useGoals, useProducts, useSales, useSettings, currentMonth, monthLabel, salesInMonth } from "@/lib/data";
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
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/vendas", label: "Vendas", icon: Receipt },
  { to: "/meta", label: "Meta", icon: Target },
  { to: "/fechamento", label: "Fechamento", icon: ClipboardCheck },
  { to: "/tabelas", label: "Tabelas", icon: Table2 },
] as const;

function Home() {
  const month = currentMonth();
  const { data: products, isLoading: lp } = useProducts();
  const { data: sales, isLoading: ls } = useSales();
  const { data: goals } = useGoals();
  const { data: settings } = useSettings();
  if (lp || ls) return <div className="space-y-3"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>;

  const goal = goals?.find((g) => g.month === month);
  const monthSales = salesInMonth(sales ?? [], month);
  const sum = summarize(monthSales);
  const noPrice = (products ?? []).filter((p) => p.price == null);

  const next = !products?.length
    ? { title: "Cadastre seu primeiro produto", text: "Comece pela ficha de precificação: custo, preço e lucro.", to: "/produtos", cta: "Cadastrar produto" }
    : noPrice.length
    ? { title: `Defina o preço de “${noPrice[0].name}”`, text: "Sem preço não dá para saber o lucro nem a meta.", to: "/produtos", cta: "Abrir ficha", search: { id: noPrice[0].id } }
    : !goal || goal.profit_goal <= 0
    ? { title: "Defina a meta de lucro do mês", text: "Descubra quantas vendas por dia você precisa.", to: "/meta", cta: "Definir meta" }
    : !monthSales.length
    ? { title: "Registre sua primeira venda do mês", text: "Cada venda alimenta a meta e o fechamento.", to: "/vendas", cta: "Registrar venda" }
    : { title: "Acompanhe o fechamento", text: "Veja o que está funcionando e o produto campeão.", to: "/fechamento", cta: "Ver fechamento" };

  const progress = goal && goal.profit_goal > 0 ? Math.max(0, Math.min(100, (sum.profit / goal.profit_goal) * 100)) : null;

  return (
    <>
      <PageHeader title={`Olá${settings?.display_name ? `, ${settings.display_name}` : ""}`} subtitle={`Resumo de ${monthLabel(month)}`} />
      <div className="glass relative mb-4 overflow-hidden p-5 md:p-6">
        <div className="absolute inset-0 -z-10 bg-gradient-primary opacity-20" />
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Seu próximo passo</div>
        <h2 className="mt-2 text-xl font-bold md:text-2xl">{next.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{next.text}</p>
        <Button asChild variant="hero" className="mt-4"><Link to={next.to} search={"search" in next ? next.search : undefined}>{next.cta}<ArrowRight /></Link></Button>
      </div>

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

      <div className="mt-6 grid grid-cols-3 gap-2 md:grid-cols-6">
        {SHORTCUTS.map((s) => (
          <Link key={s.to} to={s.to} className="glass flex flex-col items-center gap-2 p-4 text-xs transition-colors hover:border-primary/50">
            <s.icon className="size-5 text-primary" />{s.label}
          </Link>
        ))}
      </div>
    </>
  );
}
