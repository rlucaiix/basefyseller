import { AlertTriangle } from "lucide-react";
import { commission, netAfterCommission, profit, marginPct, breakEvenPrice, fmtBRL, fmtPct } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Resultado da ficha de precificação (mesmas fórmulas do Planner). */
export function Breakdown({ price, cost, rate, competitor }: { price: number | null; cost: number; rate: number; competitor?: number | null }) {
  const min = breakEvenPrice(cost, rate);
  if (price == null || price <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Informe o seu preço para ver taxa, valor recebido e lucro. Preço mínimo sem prejuízo: <b className="text-foreground">{fmtBRL(min)}</b>
      </div>
    );
  }
  const p = profit(price, rate, cost);
  const m = marginPct(price, rate, cost);
  const rows: [string, string, string?][] = [
    [`Taxa (${fmtPct(rate * 100, 2)})`, fmtBRL(commission(price, rate))],
    ["Você recebe", fmtBRL(netAfterCommission(price, rate))],
    ["Custo", fmtBRL(cost)],
    ["Preço mínimo", fmtBRL(min)],
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map(([l, v]) => (
          <div key={l} className="rounded-xl bg-secondary/60 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</div>
            <div className="mt-0.5 font-semibold tabular">{v}</div>
          </div>
        ))}
      </div>
      <div className={cn("flex items-center justify-between rounded-xl p-4", p < 0 ? "bg-destructive/15" : "bg-primary/15")}>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Lucro por venda</div>
          <div className={cn("text-2xl font-bold tabular", p < 0 ? "text-destructive" : "text-success")}>{fmtBRL(p)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Margem</div>
          <div className="text-2xl font-bold tabular">{fmtPct(m)}</div>
        </div>
      </div>
      {p < 0 && <Warn>Prejuízo: o preço está abaixo do mínimo de {fmtBRL(min)}.</Warn>}
      {competitor != null && competitor > 0 && min != null && competitor < min && (
        <Warn>A concorrência vende abaixo do seu preço mínimo. Não copie o preço — destaque entrega automática e bom atendimento.</Warn>
      )}
    </div>
  );
}

export function Warn({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />{children}
    </p>
  );
}
