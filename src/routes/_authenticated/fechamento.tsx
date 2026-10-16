import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appHead } from "@/lib/head";
import { useGoals, useSales, useMutations, useDebounced, currentMonth, monthLabel, salesInMonth, type Goal } from "@/lib/data";
import { summarize, fmtBRL, fmtPct } from "@/lib/pricing";
import { PageHeader, Card, Empty } from "@/components/app/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/fechamento")({
  head: appHead("Fechamento do mês", "Faturamento, taxas, custos e lucro do mês calculados a partir das suas vendas."),
  component: ClosingPage,
});

function ClosingPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data: sales = [] } = useSales();
  const { data: goals } = useGoals();
  const m = useMutations();
  const goal = goals?.find((g) => g.month === month);
  useEffect(() => { if (goals && !goal) void m.ensureGoal(month); }, [goals, goal, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const monthSales = salesInMonth(sales, month);
  const s = summarize(monthSales);
  const champion = s.products[0];
  const hit = goal && goal.profit_goal > 0 ? s.profit >= goal.profit_goal : null;

  const rows: [string, string, (string | undefined)?][] = [
    ["Faturamento", fmtBRL(s.revenue), "soma dos valores vendidos"],
    ["Taxas da Basefy", fmtBRL(s.commissions), `comum ${fmtBRL(s.commissionStd)} · destaque ${fmtBRL(s.commissionFeat)}`],
    ["Custos dos produtos", fmtBRL(s.costs)],
    ["Lucro do mês", fmtBRL(s.profit), `faturamento − taxas − custos · margem ${fmtPct(s.margin)}`],
    ["Número de vendas", String(s.count), s.refunded ? `${s.refunded} reembolsada(s)` : undefined],
    ["Ticket médio", fmtBRL(s.ticket)],
    ["Meta batida?", hit == null ? "Sem meta definida" : hit ? "Sim ✓" : `Não — faltaram ${fmtBRL(goal!.profit_goal - s.profit)}`],
  ];

  return (
    <>
      <PageHeader title="Como foi o seu mês" subtitle="Tudo calculado a partir das vendas registradas. Vendas canceladas não entram."
        action={<Input type="month" aria-label="Mês" className="h-11 w-44" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />} />
      {!monthSales.length ? (
        <Empty title={`Sem vendas em ${monthLabel(month)}`} text="Registre suas vendas para ver o fechamento do mês." to="/vendas" cta="Registrar venda" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="p-0 md:p-0">
            {rows.map(([l, v, h]) => (
              <div key={l} className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-0 md:px-5">
                <div><div className="font-medium">{l}</div>{h && <div className="text-xs text-muted-foreground">{h}</div>}</div>
                <div className="text-right font-semibold tabular">{v}</div>
              </div>
            ))}
          </Card>
          <div className="space-y-4">
            <Card>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Produto campeão do mês</div>
              <div className="mt-1 text-xl font-bold">{champion?.name ?? "—"}</div>
              {champion && <div className="text-sm text-muted-foreground tabular">{champion.count} vendas · lucro {fmtBRL(champion.profit)}</div>}
              <div className="mt-4 space-y-1.5">
                {s.products.slice(0, 5).map((p) => (
                  <div key={p.name} className="flex justify-between text-sm"><span className="truncate">{p.name}</span><span className="tabular">{fmtBRL(p.revenue)} · {fmtBRL(p.profit)}</span></div>
                ))}
              </div>
            </Card>
            {goal && <Reflection key={goal.id} goal={goal} />}
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Reembolsos: sem receita, e a taxa e o custo são tratados como perdidos. <Link to="/vendas" className="underline">Ver vendas</Link></p>
    </>
  );
}

function Reflection({ goal }: { goal: Goal }) {
  const m = useMutations();
  const [w, setW] = useState(goal.worked ?? "");
  const [c, setC] = useState(goal.change_next ?? "");
  useDebounced(() => m.updateGoal(goal.id, { worked: w, change_next: c }), [w, c]);
  return (
    <Card className="space-y-3">
      <div className="space-y-1.5"><Label htmlFor="w" className="font-semibold">O que funcionou</Label><Textarea id="w" value={w} onChange={(e) => setW(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="c" className="font-semibold">O que vou mudar no próximo mês</Label><Textarea id="c" value={c} onChange={(e) => setC(e.target.value)} /></div>
    </Card>
  );
}
