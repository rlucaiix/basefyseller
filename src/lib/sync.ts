// Fila de persistência: a nuvem é a fonte oficial; o armazenamento local guarda
// apenas alterações ainda não confirmadas (contingência offline).
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TableName = "products" | "sales" | "monthly_goals" | "settings";
export type Op = {
  opId: string;
  table: TableName;
  kind: "insert" | "update" | "delete" | "upsert";
  id?: string;
  row?: Record<string, unknown>;
  baseVersion?: number;
  onConflict?: string;
};
export type SyncStatus = "idle" | "saving" | "saved" | "pending" | "error" | "conflict";

const KEY = "basefy-sync-queue";
let queue: Op[] = [];
let state: { status: SyncStatus; pending: number; error?: string } = { status: "idle", pending: 0 };
const listeners = new Set<() => void>();
const versions = new Map<string, number>();
let flushing = false;
let onFlushed: ((tables: Set<TableName>) => void) | null = null;
let onConflict: ((table: TableName, id: string) => void) | null = null;

class ConflictError extends Error {}

function load() {
  if (typeof window === "undefined") return;
  try { queue = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { queue = []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(queue)); } catch { /* sem espaço */ }
}
function set(s: Partial<typeof state>) {
  state = { ...state, ...s, pending: queue.length };
  listeners.forEach((l) => l());
}

export function initSync(opts: { onFlushed: typeof onFlushed; onConflict: typeof onConflict }) {
  onFlushed = opts.onFlushed;
  onConflict = opts.onConflict;
  load();
  set({ status: queue.length ? "pending" : "idle" });
  window.addEventListener("online", () => void flush());
  void flush();
}

export function rememberVersion(id: string, v: number) {
  const cur = versions.get(id);
  if (cur == null || v > cur) versions.set(id, v);
}

export function enqueue(op: Omit<Op, "opId">) {
  // Une atualizações seguidas do mesmo registro, mantendo a versão-base original.
  if (op.kind === "update" && op.id) {
    const prev = queue.find((q, i) => i > 0 && q.kind === "update" && q.id === op.id && q.table === op.table);
    if (prev) { prev.row = { ...prev.row, ...op.row }; save(); void flush(); return; }
  }
  queue.push({ ...op, opId: crypto.randomUUID() });
  save();
  set({ status: navigator.onLine ? "saving" : "pending" });
  void flush();
}

const isNetwork = (e: unknown) =>
  !navigator.onLine || (e instanceof Error && /fetch|network|load failed/i.test(e.message));

async function run(op: Op) {
  const t = supabase.from(op.table) as any;
  if (op.kind === "insert" || op.kind === "upsert") {
    const { error } = await t.upsert(op.row, {
      onConflict: op.onConflict ?? "id",
      ignoreDuplicates: op.kind === "insert",
    });
    if (error) throw new Error(error.message);
  } else if (op.kind === "update") {
    let q = t.update(op.row).eq("id", op.id);
    const base = versions.get(op.id!) ?? op.baseVersion;
    if (base != null) q = q.eq("version", base);
    const { data, error } = await q.select("id, version");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new ConflictError();
    versions.set(op.id!, data[0].version);
  } else if (op.kind === "delete") {
    const { error } = await t.delete().eq("id", op.id);
    if (error) throw new Error(error.message);
  }
}

export async function flush() {
  if (flushing || typeof window === "undefined") return;
  if (!queue.length) return;
  if (!navigator.onLine) return set({ status: "pending" });
  flushing = true;
  set({ status: "saving" });
  const touched = new Set<TableName>();
  try {
    while (queue.length) {
      const op = queue[0];
      try {
        await run(op);
        touched.add(op.table);
        queue.shift(); save();
      } catch (e) {
        if (e instanceof ConflictError) {
          queue.shift(); save();
          touched.add(op.table);
          if (op.id) versions.delete(op.id);
          set({ status: "conflict", error: "Este registro foi alterado em outro aparelho." });
          onConflict?.(op.table, op.id!);
          continue;
        }
        if (isNetwork(e)) { set({ status: "pending" }); return; }
        set({ status: "error", error: e instanceof Error ? e.message : "Falha ao salvar" });
        return;
      }
    }
    if (state.status !== "conflict") set({ status: "saved", error: undefined });
  } finally {
    flushing = false;
    if (touched.size) onFlushed?.(touched);
  }
}

export function retry() { set({ status: "saving" }); void flush(); }
export function discardFailed() { queue.shift(); save(); set({ status: queue.length ? "pending" : "idle", error: undefined }); void flush(); }

export function useSyncState() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
}
