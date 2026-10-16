import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { appHead } from "@/lib/head";
import { useProducts, useSales, useSettings, useMutations, rateFor, currentMonth, type Sale } from "@/lib/data";
import { snapshotSale, summarize, fmtBRL, fmtPct, type Modality, type SaleStatus } from "@/lib/pricing";
import { PageHeader, Card, Empty, MoneyField, Stat } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/vendas")({
  validateSearch: z.object({ product: z.string().optional() }),
  head: appHead("Vendas", "Registre cada venda com taxa, custo e lucro do momento e filtre por período, produto e status."),
  component: SalesPage,
});

export const STATUS: Record<SaleStatus, string> = { registrada: "Registrada", concluida: "Concluída", cancelada: "Cancelada", reembolsada: "Reembolsada" };
const sel = "h-11 w-full rounded-md border border-input bg-secondary/60 px-3";

function SalesPage() {
  const { data: sales = [] } = useSales();
  const { data: products = [] } = useProducts();
  const { product } = Route.useSearch();
  const m = useMutations();
  const [open, setOpen] = useState(!!product);
  const nav = Route.useNavigate();
  useEffect(() => { if (product) nav({ search: {}, replace: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [editing, setEditing] = useState<Sale | null>(null);
  const [f, setF] = useState({ month: currentMonth(), product: "", modality: "", status: "" });

  const filtered = useMemo(() => sales.filter((s) =>
    (!f.month || s.sale_date.startsWith(f.month)) &&
    (!f.product || s.product_name === f.product) &&
    (!f.modality || s.modality === f.modality) &&
    (!f.status || s.status === f.status)), [sales, f]);
  const sum = summarize(filtered);
  const names = [...new Set(sales.map((s) => s.product_name))];

  return (
    <>
      <PageHeader title="Controle de vendas" subtitle="Cada venda guarda o cálculo do momento em que foi registrada."
        action={<Button variant="hero" onClick={() => { setEditing(null); setOpen(true); }}><Plus />Registrar venda</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Input type="month" aria-label="Mês" value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })} className="h-11" />
        <select aria-label="Produto" className={sel} value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })}>
          <option value="">Todos os produtos</option>{names.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select aria-label="Modalidade" className={sel} value={f.modality} onChange={(e) => setF({ ...f, modality: e.target.value })}>
          <option value="">Comum e destaque</option><option value="padrao">Comum</option><option value="destaque">Destaque</option>
        </select>
        <select aria-label="Status" className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">Todos os status</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Faturamento" value={fmtBRL(sum.revenue)} hint={`${sum.count} vendas`} />
        <Stat label="Taxas" value={fmtBRL(sum.commissions)} />
        <Stat label="Custos" value={fmtBRL(sum.costs)} />
        <Stat label="Lucro" value={fmtBRL(sum.profit)} tone={sum.profit < 0 ? "bad" : "good"} hint={`margem ${fmtPct(sum.margin)}`} />
      </div>

      {!filtered.length ? (
        <Empty title={sales.length ? "Nenhuma venda com esses filtros" : "Nenhuma venda registrada"} text={sales.length ? "Troque o mês ou limpe os filtros." : "Registre sua primeira venda para começar a acompanhar o lucro real."} />
      ) : (
        <>
          <div className="glass hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">{["Data", "Pedido", "Produto", "Valor", "Taxa", "Custo", "Lucro", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className={cn("border-b border-border/50 last:border-0", s.status === "cancelada" && "opacity-50")}>
                    <td className="px-4 py-3 tabular">{new Date(s.sale_date + "T12:00").toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.order_ref || "—"}</td>
                    <td className="px-4 py-3">{s.product_name}{s.modality === "destaque" && <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">destaque</span>}</td>
                    <td className="px-4 py-3 tabular">{fmtBRL(s.price)}</td>
                    <td className="px-4 py-3 tabular text-muted-foreground" title={`${fmtPct(s.rate * 100, 2)}`}>{fmtBRL(s.commission)}</td>
                    <td className="px-4 py-3 tabular text-muted-foreground">{fmtBRL(s.cost)}</td>
                    <td className={cn("px-4 py-3 font-medium tabular", s.profit < 0 ? "text-destructive" : "text-success")}>{fmtBRL(s.profit)}</td>
                    <td className="px-4 py-3"><StatusSelect s={s} /></td>
                    <td className="px-4 py-3"><RowActions s={s} onEdit={() => { setEditing(s); setOpen(true); }} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="font-semibold"><td className="px-4 py-3" colSpan={3}>Total</td><td className="px-4 py-3 tabular">{fmtBRL(sum.revenue)}</td><td className="px-4 py-3 tabular">{fmtBRL(sum.commissions)}</td><td className="px-4 py-3 tabular">{fmtBRL(sum.costs)}</td><td className="px-4 py-3 tabular">{fmtBRL(sum.profit)}</td><td colSpan={2} /></tr></tfoot>
            </table>
          </div>
          <div className="grid gap-2 md:hidden">
            {filtered.map((s) => (
              <div key={s.id} className={cn("glass p-4", s.status === "cancelada" && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.product_name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(s.sale_date + "T12:00").toLocaleDateString("pt-BR")}{s.order_ref && ` · ${s.order_ref}`}{s.modality === "destaque" && " · destaque"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular">{fmtBRL(s.price)}</div>
                    <div className={cn("text-xs tabular", s.profit < 0 ? "text-destructive" : "text-success")}>lucro {fmtBRL(s.profit)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2"><div className="flex-1"><StatusSelect s={s} /></div><RowActions s={s} onEdit={() => { setEditing(s); setOpen(true); }} /></div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Corrigir venda" : "Registrar venda"}</DialogTitle></DialogHeader>
          <SaleForm key={editing?.id ?? "new"} sale={editing} initialProduct={product ?? editing?.product_id ?? undefined} products={products}
            onDone={(msg) => { setOpen(false); toast.success(msg); }} create={m.createSale} update={m.updateSale} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusSelect({ s }: { s: Sale }) {
  const m = useMutations();
  return (
    <select aria-label="Status" value={s.status} onChange={(e) => m.updateSale(s.id, { status: e.target.value as SaleStatus })}
      className="h-9 w-full rounded-md border border-input bg-secondary/60 px-2 text-xs">
      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}

function RowActions({ s, onEdit }: { s: Sale; onEdit: () => void }) {
  const m = useMutations();
  return (
    <div className="flex">
      <Button size="icon" variant="ghost" aria-label="Corrigir" onClick={onEdit}><Pencil /></Button>
      <Button size="icon" variant="ghost" aria-label="Excluir" className="text-destructive"
        onClick={() => { if (confirm(`Excluir a venda de ${s.product_name}?`)) m.deleteSale(s.id); }}><Trash2 /></Button>
    </div>
  );
}

function SaleForm({ sale, initialProduct, products, onDone, create, update }: {
  sale: Sale | null; initialProduct?: string | undefined; products: ReturnType<typeof useProducts>["data"] & {}; onDone: (m: string) => void;
  create: ReturnType<typeof useMutations>["createSale"]; update: ReturnType<typeof useMutations>["updateSale"];
}) {
  const { data: settings } = useSettings();
  const [productId, setProductId] = useState(sale?.product_id ?? initialProduct ?? products[0]?.id ?? "");
  const [name, setName] = useState(sale?.product_name ?? "");
  const [date, setDate] = useState(sale?.sale_date ?? new Date().toISOString().slice(0, 10));
  const [order, setOrder] = useState(sale?.order_ref ?? "");
  const [price, setPrice] = useState<number | null>(sale?.price ?? null);
  const [cost, setCost] = useState<number>(sale?.cost ?? 0);
  const [modality, setModality] = useState<Modality>(sale?.modality ?? "padrao");
  const [status, setStatus] = useState<SaleStatus>(sale?.status ?? "concluida");

  useEffect(() => {
    if (sale) return;
    const p = products.find((x) => x.id === productId);
    if (p) { setName(p.name); setPrice(p.price); setCost(p.unit_cost + p.sale_cost); }
  }, [productId, products, sale]);

  const rate = sale && sale.modality === modality ? sale.rate : rateFor(settings, modality);
  const snap = price != null ? snapshotSale(price, rate, cost) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o produto.");
    if (price == null || price <= 0) return toast.error("Informe um valor de venda maior que zero.");
    const s = snapshotSale(price, rate, cost);
    const row = { product_id: productId || null, product_name: name.trim(), order_ref: order || null, sale_date: date, modality, status, ...s };
    if (sale) { update(sale.id, row); onDone("Venda corrigida"); }
    else { void create(row); onDone("Venda registrada"); }
    return undefined;
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="sp" className="text-xs text-muted-foreground">Produto</Label>
        <select id="sp" className={sel} value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Outro (digitar nome)</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {!productId && <Input aria-label="Nome do produto" className="h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="sd" className="text-xs text-muted-foreground">Data</Label><Input id="sd" type="date" className="h-11" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="so" className="text-xs text-muted-foreground">Pedido</Label><Input id="so" className="h-11" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Opcional" /></div>
        <MoneyField label="Valor da venda" value={price} onChange={setPrice} />
        <MoneyField label="Custo desta venda" value={cost} allowEmpty={false} onChange={(v) => setCost(v ?? 0)} />
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary/60 p-1 text-sm">
        {(["padrao", "destaque"] as const).map((k) => (
          <button type="button" key={k} onClick={() => setModality(k)} className={cn("rounded-md py-2", modality === k && "bg-primary text-primary-foreground")}>
            {k === "padrao" ? "Comum" : "Destaque"} {fmtPct(rateFor(settings, k) * 100, 2)}
          </button>
        ))}
      </div>
      <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value as SaleStatus)}>
        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {snap && (
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary/60 p-3 text-center text-sm tabular">
          <div><div className="text-[11px] text-muted-foreground">Taxa</div>{fmtBRL(snap.commission)}</div>
          <div><div className="text-[11px] text-muted-foreground">Recebe</div>{fmtBRL(snap.price - snap.commission)}</div>
          <div><div className="text-[11px] text-muted-foreground">Lucro</div><span className={snap.profit < 0 ? "text-destructive" : "text-success"}>{fmtBRL(snap.profit)}</span></div>
        </div>
      )}
      <Button type="submit" variant="hero" size="lg">{sale ? "Salvar correção" : "Registrar"}</Button>
    </form>
  );
}
