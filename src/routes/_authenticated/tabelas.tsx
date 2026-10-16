import { createFileRoute } from "@tanstack/react-router";
import { appHead } from "@/lib/head";
import { useSettings, rateFor } from "@/lib/data";
import { commission, netAfterCommission, breakEvenPrice, profit, fmtBRL, fmtPct } from "@/lib/pricing";
import { PageHeader } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/tabelas")({
  head: appHead("Tabelas rápidas", "Tabela de taxas e de preço mínimo para consultar sem calculadora."),
  component: TablesPage,
});

const PRICES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100, 120, 150, 200];
const COSTS = [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100];

function T({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="glass overflow-hidden">
      <table className="w-full text-xs sm:text-sm">
        <thead><tr className="border-b border-border bg-primary/10 text-left text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
          {head.map((h) => <th key={h} className="px-2 py-3 font-medium sm:px-4">{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} className="border-b border-border/40 last:border-0">
            {r.map((c, j) => <td key={j} className={`px-2 py-2.5 tabular sm:px-4 ${j === 0 ? "font-semibold" : ""}`}>{c}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function TablesPage() {
  const { data: s } = useSettings();
  const rs = rateFor(s, "padrao"), rf = rateFor(s, "destaque");
  return (
    <>
      <PageHeader title="Tabelas rápidas" subtitle="Geradas pelas mesmas fórmulas da calculadora e com as taxas das suas configurações." />
      <h2 className="mb-2 text-lg font-semibold">Tabela de taxas</h2>
      <T head={["Preço", `Taxa ${fmtPct(rs * 100, 2)}`, "Recebe", `Destaque ${fmtPct(rf * 100, 2)}`, "Recebe"]}
        rows={PRICES.map((p) => [fmtBRL(p), fmtBRL(commission(p, rs)), fmtBRL(netAfterCommission(p, rs)), fmtBRL(commission(p, rf)), fmtBRL(netAfterCommission(p, rf))])} />
      <p className="mb-8 mt-2 text-xs text-muted-foreground">Depois de achar o “recebe”, subtraia o custo do produto para chegar no lucro.</p>
      <h2 className="mb-2 text-lg font-semibold">Tabela de preço mínimo</h2>
      <T head={["Seu custo", "Preço mínimo", "Pelo dobro", "Lucro no dobro"]}
        rows={COSTS.map((c) => [fmtBRL(c), fmtBRL(breakEvenPrice(c, rs)), fmtBRL(c * 2), fmtBRL(profit(c * 2, rs, c))])} />
      <p className="mt-2 text-xs text-muted-foreground">Preço mínimo arredondado para cima. Compare sempre com a concorrência antes de decidir.</p>
    </>
  );
}
