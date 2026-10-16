import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appHead } from "@/lib/head";
import { useGoals, useProducts, useSales, useSettings, useMutations, useDebounced, rateFor, currentMonth, monthLabel, salesInMonth, type Goal } from "@/lib/data";
import { profit, salesForGoal, summarize, fmtBRL, fmtPct } from "@/lib/pricing";
import { PageHeader, Card, MoneyField, Stat } from "@/components/app/ui";
import { Warn } from "@/components/app/Breakdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/meta")({
  head: appHead("Meta do mês", "Defina quanto quer lucrar e descubra quantas vendas por dia você precisa."),
  component: GoalPage,
});

export function weekOf(date: string) {
  const d = Number(date.slice(8, 10));
  return Math.min(3, Math.floor((d - 1) / 7));
}

function GoalPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data: goals, isLoading } = useGoals();
  const m = useMutations();
  const goal = goals?.find((g) => g.month === month);
  useEffect(() => { if (goals && !goal) void m.ensureGoal(month); }, [goals, goal, month]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader title="Quanto você quer lucrar este mês?" subtitle="Vendas necessárias = meta ÷ lucro por venda"
        action={<Input type="month" aria-label="Mês" className="h-11 w-44" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />} />
      {isLoading || !goal ? <Skeleton className="h-72 rounded-2xl" /> : <GoalEditor key={goal.id} goal={goal} />}
      <History goals={goals ?? []} current={month} onPick={setMonth} />
    </>
  );
}

function GoalEditor({ goal }: { goal: Goal }) {
  const { data: products = [] } = useProducts();
  const { data: sales = [] } = useSales();
  const { data: settings } = useSettings();
  const m = useMutations();
  const [g, setG] = useState(goal);
  useDebounced(() => {
    m.updateGoal(goal.id, { profit_goal: g.profit_goal, main_product_id: g.main_product_id, plan: g.plan, weeks: g.weeks });
  }, [g.profit_goal, g.main_product_id, g.plan, JSON.stringify(g.weeks)]);

  const main = products.find((p) => p.id === g.main_product_id);
  const perSale = main?.price != null ? profit(main.price, rateFor(settings, "padrao"), main.unit_cost + main.sale_cost) : null;
  const needed = perSale != null ? salesForGoal(g.profit_goal, perSale) : null;
  const monthSales = salesInMonth(sales, goal.month);
  const sum = summarize(monthSales);
  const progress = g.profit_goal > 0 ? Math.max(0, Math.min(100, (sum.profit / g.profit_goal) * 100)) : 0;

  const weekly = [0, 1, 2, 3].map((w) => summarize(monthSales.filter((s) => weekOf(s.sale_date) === w)));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <MoneyField label="Meta de lucro do mês (A)" value={g.profit_goal} allowEmpty={false} onChange={(v) => setG({ ...g, profit_goal: v ?? 0 })} />
          <div className="space-y-1.5">
            <Label htmlFor="mp" className="text-xs text-muted-foreground">Produto principal</Label>
            <select id="mp" className="h-11 w-full rounded-md border border-input bg-secondary/60 px-3" value={g.main_product_id ?? ""} onChange={(e) => setG({ ...g, main_product_id: e.target.value || null })}>
              <option value="">Escolha um produto</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {main && main.price == null && <Warn>Este produto ainda não tem preço. Preencha a ficha dele em Produtos.</Warn>}
          {perSale != null && perSale <= 0 && <Warn>O lucro por venda deste produto não é positivo — não dá para chegar na meta com ele.</Warn>}
        </Card>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Lucro por venda (B)" value={fmtBRL(perSale)} />
          <Stat label="Vendas no mês = A ÷ B" value={needed ?? "—"} />
          <Stat label="Vendas por dia (÷ 30)" value={needed != null ? (needed / 30).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—"} />
          <Stat label="Lucro real até agora" value={fmtBRL(sum.profit)} hint={`${sum.count} vendas`} tone={sum.profit < 0 ? "bad" : undefined} />
        </div>
      </div>

      <Card>
        <div className="mb-2 flex justify-between text-sm"><span>Progresso da meta</span><span className="tabular">{fmtPct(progress)}</span></div>
        <Progress value={progress} />
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">Acompanhamento semanal</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {weekly.map((w, i) => (
            <div key={i} className="rounded-xl bg-secondary/60 p-3 text-sm">
              <div className="font-medium">Semana {i + 1}</div>
              <div className="mt-2 flex justify-between text-muted-foreground"><span>Vendas</span><span className="tabular text-foreground">{w.count}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Lucro</span><span className="tabular text-foreground">{fmtBRL(w.profit)}</span></div>
              <label className="mt-2 flex items-center justify-between gap-2 text-muted-foreground">Vídeos
                <Input inputMode="numeric" className="h-9 w-16 text-right" value={g.weeks[i]?.videos ?? ""}
                  onChange={(e) => {
                    const n = e.target.value.replace(/\D/g, "");
                    const weeks = [0, 1, 2, 3].map((j) => (j === i ? { videos: n ? Number(n) : undefined } : g.weeks[j] ?? {}));
                    setG({ ...g, weeks });
                  }} />
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-1.5">
        <Label htmlFor="plan" className="font-semibold">O que vou fazer para chegar lá</Label>
        <Textarea id="plan" rows={4} value={g.plan ?? ""} onChange={(e) => setG({ ...g, plan: e.target.value })} placeholder="Ex.: postar 1 vídeo por dia, criar pacote maior…" />
      </Card>
    </div>
  );
}

function History({ goals, current, onPick }: { goals: Goal[]; current: string; onPick: (m: string) => void }) {
  const { data: sales = [] } = useSales();
  const past = goals.filter((g) => g.month !== current && g.profit_goal > 0);
  if (!past.length) return null;
  return (
    <Card className="mt-4">
      <h3 className="mb-3 font-semibold">Metas anteriores</h3>
      <div className="grid gap-2">
        {past.map((g) => {
          const p = summarize(salesInMonth(sales, g.month)).profit;
          return (
            <button key={g.id} onClick={() => onPick(g.month)} className="flex items-center justify-between rounded-lg bg-secondary/60 p-3 text-left text-sm">
              <span className="capitalize">{monthLabel(g.month)}</span>
              <span className="tabular">{fmtBRL(p)} / {fmtBRL(g.profit_goal)} {p >= g.profit_goal ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
