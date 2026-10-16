// Fonte única das regras financeiras do Basefy Seller.
// Calculadora, vendas, metas e painel usam somente estas funções.

export const DEFAULT_RATES = { padrao: 0.0499, destaque: 0.0749 } as const;
export type Modality = "padrao" | "destaque";
export type SaleStatus = "registrada" | "concluida" | "cancelada" | "reembolsada";

const EPS = 1e-9;
/** Arredonda ao centavo (meio para cima). */
export const round2 = (x: number) => Math.round((x + Math.sign(x) * EPS) * 100) / 100;
/** Arredonda para cima ao centavo — usado em preços mínimos para não gerar prejuízo. */
export const ceil2 = (x: number) => Math.ceil(x * 100 - EPS) / 100;

export const commission = (P: number, r: number) => round2(P * r);
export const netAfterCommission = (P: number, r: number) => round2(P - commission(P, r));
export const profit = (P: number, r: number, C: number) => round2(P - commission(P, r) - C);
export const marginPct = (P: number, r: number, C: number) =>
  P > 0 ? (profit(P, r, C) / P) * 100 : null;

/** Menor preço sem prejuízo: C ÷ (1 − r), arredondado para cima e conferido. */
export function breakEvenPrice(C: number, r: number): number | null {
  if (r >= 1 || C < 0) return null;
  let p = ceil2(C / (1 - r));
  while (profit(p, r, C) < 0) p = round2(p + 0.01);
  return p;
}

/** Preço para lucro desejado: (C + L) ÷ (1 − r). */
export function priceForProfit(C: number, L: number, r: number): number | null {
  if (r >= 1) return null;
  let p = ceil2((C + L) / (1 - r));
  while (profit(p, r, C) < round2(L)) p = round2(p + 0.01);
  return p;
}

/** Preço para margem desejada: C ÷ (1 − r − m). Retorna null quando a margem é impossível. */
export function priceForMargin(C: number, m: number, r: number): number | null {
  const d = 1 - r - m;
  if (d <= 0) return null;
  return ceil2(C / d);
}

/** Vendas necessárias para a meta: ⌈meta ÷ lucro por venda⌉, só com lucro positivo. */
export function salesForGoal(goal: number, profitPerSale: number): number | null {
  if (!(profitPerSale > 0) || goal < 0) return null;
  return Math.ceil(goal / profitPerSale - EPS);
}

export function snapshotSale(price: number, rate: number, cost: number) {
  return { price: round2(price), rate, cost: round2(cost), commission: commission(price, rate), profit: profit(price, rate, cost) };
}

export interface SaleLike {
  price: number;
  commission: number;
  cost: number;
  profit: number;
  status: SaleStatus;
  modality: Modality;
  product_name: string;
}

/**
 * Regras de status:
 * - registrada e concluída contam como receita efetiva.
 * - cancelada não entra em nenhum total.
 * - reembolsada: sem receita; por padrão a comissão e o custo são tratados
 *   como perdidos (não presumimos que voltam), gerando lucro negativo.
 */
export function summarize(sales: SaleLike[]) {
  let revenue = 0, commStd = 0, commFeat = 0, costs = 0, profitSum = 0, count = 0, refunded = 0;
  const byProduct = new Map<string, { name: string; revenue: number; profit: number; count: number }>();
  for (const s of sales) {
    if (s.status === "cancelada") continue;
    const comm = Number(s.commission), cost = Number(s.cost);
    if (s.modality === "destaque") commFeat += comm; else commStd += comm;
    costs += cost;
    let p: number, rev: number;
    if (s.status === "reembolsada") { refunded++; rev = 0; p = -(comm + cost); }
    else { count++; rev = Number(s.price); p = Number(s.profit); }
    revenue += rev; profitSum += p;
    const e = byProduct.get(s.product_name) ?? { name: s.product_name, revenue: 0, profit: 0, count: 0 };
    e.revenue += rev; e.profit += p; if (s.status !== "reembolsada") e.count++;
    byProduct.set(s.product_name, e);
  }
  const commissions = round2(commStd + commFeat);
  const products = [...byProduct.values()].map((e) => ({ ...e, revenue: round2(e.revenue), profit: round2(e.profit) }));
  return {
    revenue: round2(revenue),
    commissionStd: round2(commStd),
    commissionFeat: round2(commFeat),
    commissions,
    costs: round2(costs),
    profit: round2(profitSum),
    count,
    refunded,
    ticket: count > 0 ? round2(revenue / count) : null,
    margin: revenue > 0 ? (profitSum / revenue) * 100 : null,
    products: products.sort((a, b) => b.profit - a.profit),
  };
}

/** Aceita "14,90", "1.234,56", "14.90" e "R$ 5". Retorna null quando inválido. */
export function parseMoney(input: string): number | null {
  const t = input.replace(/R\$|\s/g, "").trim();
  if (!t) return null;
  let n = t;
  if (n.includes(",")) n = n.replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(n)) return null;
  return Number(n);
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const fmtBRL = (n: number | null | undefined) => (n == null || isNaN(n) ? "—" : brl.format(n));
export const fmtPct = (n: number | null | undefined, d = 0) =>
  n == null || isNaN(n) ? "—" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d })}%`;
export const toInput = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));
