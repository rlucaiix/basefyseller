import { useEffect, useRef } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { enqueue, rememberVersion } from "./sync";
import { DEFAULT_RATES, type Modality, type SaleStatus } from "./pricing";

export type Settings = { user_id: string; display_name: string | null; rate_standard: number; rate_featured: number; buyer_fee: number; version: number };
export type Product = { id: string; user_id: string; name: string; kind: "produto" | "dinamico" | "servico"; supplier: string | null; unit_cost: number; sale_cost: number; competitor_price: number | null; price: number | null; notes: string | null; version: number; created_at: string; updated_at: string };
export type Sale = { id: string; user_id: string; client_id: string; product_id: string | null; product_name: string; order_ref: string | null; sale_date: string; price: number; modality: Modality; rate: number; cost: number; commission: number; profit: number; status: SaleStatus; version: number; created_at: string };
export type Goal = { id: string; user_id: string; month: string; profit_goal: number; main_product_id: string | null; plan: string | null; weeks: { videos?: number | undefined }[]; champion: string | null; worked: string | null; change_next: string | null; version: number };

const num = <T extends Record<string, any>>(r: T, keys: string[]): T => {
  const o: any = { ...r };
  for (const k of keys) if (o[k] != null) o[k] = Number(o[k]);
  return o;
};

export async function getUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Sessão expirada");
  return id;
}

export const qk = { settings: ["settings"], products: ["products"], sales: ["sales"], goals: ["goals"] } as const;

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: async (): Promise<Settings> => {
      const uid = await getUserId();
      const { data, error } = await supabase.from("settings").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      if (data) { rememberVersion(uid, data.version); return num(data as any, ["rate_standard", "rate_featured", "buyer_fee"]); }
      const def = { user_id: uid, display_name: null, rate_standard: DEFAULT_RATES.padrao, rate_featured: DEFAULT_RATES.destaque, buyer_fee: 1, version: 1 };
      enqueue({ table: "settings", kind: "insert", row: { user_id: uid }, onConflict: "user_id" });
      return def;
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: qk.products,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p: any) => { rememberVersion(p.id, p.version); return num(p, ["unit_cost", "sale_cost", "competitor_price", "price"]); });
    },
  });
}

export function useSales() {
  return useQuery({
    queryKey: qk.sales,
    queryFn: async (): Promise<Sale[]> => {
      const { data, error } = await supabase.from("sales").select("*").order("sale_date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((s: any) => { rememberVersion(s.id, s.version); return num(s, ["price", "rate", "cost", "commission", "profit"]); });
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: qk.goals,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase.from("monthly_goals").select("*").order("month", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((g: any) => { rememberVersion(g.id, g.version); return num(g, ["profit_goal"]); });
    },
  });
}

/** Atualiza o cache imediatamente e envia para a fila de sincronização. */
export function localUpdate<T extends { id: string }>(qc: QueryClient, key: readonly string[], id: string, patch: Partial<T>) {
  qc.setQueryData<T[]>(key, (old) => old?.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function useMutations() {
  const qc = useQueryClient();
  return {
    async createProduct(): Promise<string> {
      const uid = await getUserId();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const row: Product = { id, user_id: uid, name: "Novo produto", kind: "produto", supplier: null, unit_cost: 0, sale_cost: 0, competitor_price: null, price: null, notes: null, version: 1, created_at: now, updated_at: now };
      qc.setQueryData<Product[]>(qk.products, (o) => [row, ...(o ?? [])]);
      rememberVersion(id, 1);
      enqueue({ table: "products", kind: "insert", row: { id, user_id: uid, name: row.name } });
      return id;
    },
    updateProduct(id: string, patch: Partial<Product>) {
      localUpdate<Product>(qc, qk.products, id, patch);
      enqueue({ table: "products", kind: "update", id, row: patch });
    },
    deleteProduct(id: string) {
      qc.setQueryData<Product[]>(qk.products, (o) => o?.filter((p) => p.id !== id));
      enqueue({ table: "products", kind: "delete", id });
    },
    async createSale(s: Omit<Sale, "id" | "user_id" | "client_id" | "version" | "created_at">) {
      const uid = await getUserId();
      const id = crypto.randomUUID();
      const row = { ...s, id, user_id: uid, client_id: id };
      qc.setQueryData<Sale[]>(qk.sales, (o) => [{ ...row, version: 1, created_at: new Date().toISOString() }, ...(o ?? [])]);
      rememberVersion(id, 1);
      enqueue({ table: "sales", kind: "insert", row, onConflict: "user_id,client_id" });
    },
    updateSale(id: string, patch: Partial<Sale>) {
      localUpdate<Sale>(qc, qk.sales, id, patch);
      enqueue({ table: "sales", kind: "update", id, row: patch });
    },
    deleteSale(id: string) {
      qc.setQueryData<Sale[]>(qk.sales, (o) => o?.filter((p) => p.id !== id));
      enqueue({ table: "sales", kind: "delete", id });
    },
    async ensureGoal(month: string): Promise<Goal> {
      const existing = qc.getQueryData<Goal[]>(qk.goals)?.find((g) => g.month === month);
      if (existing) return existing;
      const uid = await getUserId();
      const g: Goal = { id: crypto.randomUUID(), user_id: uid, month, profit_goal: 0, main_product_id: null, plan: null, weeks: [{}, {}, {}, {}], champion: null, worked: null, change_next: null, version: 1 };
      qc.setQueryData<Goal[]>(qk.goals, (o) => [g, ...(o ?? [])]);
      rememberVersion(g.id, 1);
      enqueue({ table: "monthly_goals", kind: "insert", row: { id: g.id, user_id: uid, month }, onConflict: "user_id,month" });
      return g;
    },
    updateGoal(id: string, patch: Partial<Goal>) {
      localUpdate<Goal>(qc, qk.goals, id, patch);
      enqueue({ table: "monthly_goals", kind: "update", id, row: patch });
    },
    async updateSettings(patch: Partial<Settings>) {
      const uid = await getUserId();
      qc.setQueryData<Settings>(qk.settings, (o) => (o ? { ...o, ...patch } : o));
      enqueue({ table: "settings", kind: "upsert", row: { user_id: uid, ...patch }, onConflict: "user_id" });
    },
  };
}

/** Salva automaticamente com atraso após a digitação. */
export function useDebounced(fn: () => void, deps: unknown[], delay = 700) {
  const first = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => fnRef.current(), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export const rateFor = (s: Settings | undefined, m: Modality) =>
  m === "destaque" ? s?.rate_featured ?? DEFAULT_RATES.destaque : s?.rate_standard ?? DEFAULT_RATES.padrao;

export const currentMonth = () => new Date().toISOString().slice(0, 7);
export const monthLabel = (m: string) => {
  const [y = 2000, mo = 1] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};
export const salesInMonth = (sales: Sale[], m: string) => sales.filter((s) => s.sale_date.startsWith(m));
