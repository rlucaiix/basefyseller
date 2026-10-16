import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Calculator, Receipt } from "lucide-react";
import { z } from "zod";
import { appHead } from "@/lib/head";
import { useProducts, useSettings, useMutations, useDebounced, rateFor, type Product } from "@/lib/data";
import { profit, fmtBRL } from "@/lib/pricing";
import { PageHeader, Card, Empty, MoneyField } from "@/components/app/ui";
import { Breakdown } from "@/components/app/Breakdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/produtos")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: appHead("Produtos", "Cadastre seus produtos e preencha a ficha de precificação de cada um."),
  component: ProductsPage,
});

const KINDS = [
  { v: "produto", l: "Produto" },
  { v: "dinamico", l: "Dinâmico" },
  { v: "servico", l: "Serviço" },
] as const;

function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { data: settings } = useSettings();
  const m = useMutations();
  const { id } = Route.useSearch();
  const nav = Route.useNavigate();
  const selected = products?.find((p) => p.id === id) ?? products?.[0];

  async function add() {
    const nid = await m.createProduct();
    nav({ search: { id: nid } });
  }

  return (
    <>
      <PageHeader title="Produtos" subtitle="Uma ficha de precificação para cada produto." action={<Button variant="hero" onClick={add}><Plus />Novo produto</Button>} />
      {isLoading ? <Skeleton className="h-64 w-full rounded-2xl" /> : !products?.length ? (
        <Empty title="Nenhum produto ainda" text="Cadastre seu primeiro produto para calcular taxa, lucro e preço mínimo." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {products.map((p) => {
              const pr = p.price != null ? profit(p.price, rateFor(settings, "padrao"), p.unit_cost + p.sale_cost) : null;
              return (
                <button key={p.id} onClick={() => nav({ search: { id: p.id } })}
                  className={cn("glass min-w-[180px] p-3 text-left transition-colors lg:min-w-0", selected?.id === p.id && "border-primary/60 bg-primary/10")}>
                  <div className="truncate font-medium">{p.name || "Sem nome"}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground tabular">
                    {p.price != null ? `${fmtBRL(p.price)} · lucro ${fmtBRL(pr)}` : "Sem preço"}
                  </div>
                </button>
              );
            })}
          </div>
          {selected && <ProductEditor key={selected.id} product={selected} />}
        </div>
      )}
    </>
  );
}

function ProductEditor({ product }: { product: Product }) {
  const { data: settings } = useSettings();
  const m = useMutations();
  const [f, setF] = useState(product);
  const [featured, setFeatured] = useState(false);
  useEffect(() => { setF((cur) => (cur.version < product.version ? product : cur)); }, [product]);

  const patch = (p: Partial<Product>) => setF((o) => ({ ...o, ...p }));
  useDebounced(() => {
    const { name, kind, supplier, unit_cost, sale_cost, competitor_price, price, notes } = f;
    m.updateProduct(product.id, { name: name.trim() || "Sem nome", kind, supplier, unit_cost, sale_cost, competitor_price, price, notes });
  }, [f.name, f.kind, f.supplier, f.unit_cost, f.sale_cost, f.competitor_price, f.price, f.notes]);

  const rate = rateFor(settings, featured ? "destaque" : "padrao");
  return (
    <Card className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="pname" className="text-xs text-muted-foreground">Nome do produto</Label>
          <Input id="pname" className="h-11 text-base font-medium" value={f.name} onChange={(e) => patch({ name: e.target.value })} />
          {!f.name.trim() && <p className="text-xs text-destructive">Dê um nome ao produto.</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary/60 p-1">
            {KINDS.map((k) => (
              <button key={k.v} onClick={() => patch({ kind: k.v })} className={cn("rounded-md py-2 text-sm", f.kind === k.v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{k.l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sup" className="text-xs text-muted-foreground">Fornecedor</Label>
          <Input id="sup" className="h-11" value={f.supplier ?? ""} onChange={(e) => patch({ supplier: e.target.value || null })} placeholder="Opcional" />
        </div>
        <MoneyField label="Custo por unidade (A)" value={f.unit_cost} allowEmpty={false} onChange={(v) => patch({ unit_cost: v ?? 0 })} />
        <MoneyField label="Custo por venda (entrega, extras)" value={f.sale_cost} allowEmpty={false} onChange={(v) => patch({ sale_cost: v ?? 0 })} />
        <MoneyField label="Preço da concorrência" value={f.competitor_price} onChange={(v) => patch({ competitor_price: v })} />
        <MoneyField label="Meu preço (B)" value={f.price} onChange={(v) => patch({ price: v })} />
      </div>
      <p className="text-xs text-muted-foreground">Produto próprio ou serviço: custo = 0. A tarifa de {fmtBRL(settings?.buyer_fee ?? 1)} por compra é paga pelo comprador e não entra no seu lucro.</p>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Resultado</h3>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary/60 p-1 text-xs">
          <button onClick={() => setFeatured(false)} className={cn("rounded-md px-3 py-1.5", !featured && "bg-primary text-primary-foreground")}>Comum</button>
          <button onClick={() => setFeatured(true)} className={cn("rounded-md px-3 py-1.5", featured && "bg-primary text-primary-foreground")}>Destaque</button>
        </div>
      </div>
      <Breakdown price={f.price} cost={f.unit_cost + f.sale_cost} rate={rate} competitor={f.competitor_price} />

      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs text-muted-foreground">Observações</Label>
        <Textarea id="notes" value={f.notes ?? ""} onChange={(e) => patch({ notes: e.target.value || null })} placeholder="Pacotes, variações, ideias de preço…" />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button asChild variant="secondary"><Link to="/calculadora" search={{ product: product.id }}><Calculator />Simular preços</Link></Button>
        <Button asChild variant="secondary"><Link to="/vendas" search={{ product: product.id }}><Receipt />Registrar venda</Link></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" className="ml-auto text-destructive"><Trash2 />Excluir</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir “{f.name}”?</AlertDialogTitle>
              <AlertDialogDescription>As vendas já registradas continuam no histórico com o nome e os valores da época.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => m.deleteProduct(product.id)}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
