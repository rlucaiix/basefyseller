import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { z } from "zod";
import { appHead } from "@/lib/head";
import { useProducts, useSettings, rateFor, type Product } from "@/lib/data";
import { profit, marginPct, commission, priceForProfit, priceForMargin, breakEvenPrice, fmtBRL, fmtPct } from "@/lib/pricing";
import { PageHeader, Card, MoneyField } from "@/components/app/ui";
import { Breakdown, Warn } from "@/components/app/Breakdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calculadora")({
  validateSearch: z.object({ product: z.string().optional() }),
  head: appHead("Calculadora", "Simule preços, compare cenários e descubra o preço para o lucro ou margem que você quer."),
  component: CalcPage,
});

function CalcPage() {
  const { data: products } = useProducts();
  const { data: settings } = useSettings();
  const { product: pid } = Route.useSearch();
  const [productId, setProductId] = useState<string>(pid ?? "");
  const [price, setPrice] = useState<number | null>(14.9);
  const [unit, setUnit] = useState<number>(5);
  const [perSale, setPerSale] = useState<number>(0);
  const [featured, setFeatured] = useState(false);
  const [wantProfit, setWantProfit] = useState<number | null>(null);
  const [wantMargin, setWantMargin] = useState<number | null>(null);
  const [compare, setCompare] = useState<(number | null)[]>([]);

  function load(p: Product | undefined) {
    if (!p) return;
    setPrice(p.price); setUnit(p.unit_cost); setPerSale(p.sale_cost);
  }
  useEffect(() => { if (pid && products) load(products.find((p) => p.id === pid)); }, [pid, products]);

  const rate = rateFor(settings, featured ? "destaque" : "padrao");
  const C = unit + perSale;
  const pProfit = wantProfit != null ? priceForProfit(C, wantProfit, rate) : null;
  const pMargin = wantMargin != null ? priceForMargin(C, wantMargin / 100, rate) : null;

  return (
    <>
      <PageHeader title="Calculadora" subtitle="Taxa = Preço × taxa · Lucro = Preço − Taxa − Custo · Mínimo = Custo ÷ (1 − taxa)" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="prod" className="text-xs text-muted-foreground">Usar dados de um produto</label>
            <select id="prod" value={productId} onChange={(e) => { setProductId(e.target.value); load(products?.find((p) => p.id === e.target.value)); }}
              className="h-11 w-full rounded-md border border-input bg-secondary/60 px-3">
              <option value="">Simulação livre</option>
              {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary/60 p-1 text-sm">
            <button onClick={() => setFeatured(false)} className={cn("rounded-md py-2", !featured && "bg-primary text-primary-foreground")}>Comum {fmtPct(rateFor(settings, "padrao") * 100, 2)}</button>
            <button onClick={() => setFeatured(true)} className={cn("rounded-md py-2", featured && "bg-primary text-primary-foreground")}>Destaque {fmtPct(rateFor(settings, "destaque") * 100, 2)}</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MoneyField label="Preço de venda" value={price} onChange={setPrice} />
            <MoneyField label="Custo por unidade" value={unit} allowEmpty={false} onChange={(v) => setUnit(v ?? 0)} />
            <MoneyField label="Custo por venda" value={perSale} allowEmpty={false} onChange={(v) => setPerSale(v ?? 0)} />
          </div>
          <p className="text-xs text-muted-foreground">Custos fixos do mês (ferramentas, anúncios) não entram aqui — eles não são divididos automaticamente por venda.</p>
          <Breakdown price={price} cost={C} rate={rate} />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="font-semibold">Qual preço cobrar?</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <MoneyField label="Lucro desejado por venda" value={wantProfit} onChange={setWantProfit} />
              <MoneyField label="Margem desejada" suffix="%" placeholder="40" value={wantMargin} onChange={setWantMargin} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Res label="Preço mínimo (lucro zero)" v={fmtBRL(breakEvenPrice(C, rate))} />
              <Res label="Para o lucro desejado" v={wantProfit == null ? "—" : fmtBRL(pProfit)} />
              <Res label="Para a margem desejada" v={wantMargin == null ? "—" : fmtBRL(pMargin)} />
            </div>
            {wantMargin != null && pMargin == null && <Warn>Margem impossível: com a taxa de {fmtPct(rate * 100, 2)}, a margem máxima é {fmtPct((1 - rate) * 100, 1)}.</Warn>}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Comparar preços</h3>
              <Button size="sm" variant="secondary" onClick={() => setCompare((c) => [...c, null])} disabled={compare.length >= 4}><Plus />Preço</Button>
            </div>
            {!compare.length && <p className="text-sm text-muted-foreground">Adicione preços para comparar lucro e margem lado a lado.</p>}
            {compare.map((cp, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] items-end gap-2">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                  <MoneyField id={`cmp${i}`} label={`Cenário ${i + 1}`} value={cp} onChange={(v) => setCompare((c) => c.map((x, j) => (j === i ? v : x)))} />
                  <div className="pb-2 text-right text-sm tabular">
                    {cp ? <>
                      <div className={profit(cp, rate, C) < 0 ? "text-destructive" : "text-success"}>{fmtBRL(profit(cp, rate, C))}</div>
                      <div className="text-xs text-muted-foreground">taxa {fmtBRL(commission(cp, rate))} · {fmtPct(marginPct(cp, rate, C))}</div>
                    </> : "—"}
                  </div>
                </div>
                <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => setCompare((c) => c.filter((_, j) => j !== i))}><X /></Button>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

function Res({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular">{v}</div>
    </div>
  );
}
