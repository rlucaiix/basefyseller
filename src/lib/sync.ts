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
  baseVersion?: number | undefined;
  onConflict?: string;
};
export type SyncStatus = "idle" | "saving" | "saved" | "pending" | "error" | "conflict";

const KEY = "basefy-sync-queue";
let queue: Op[] = [];
let ownerId: string | null = null;
let state: { status: SyncStatus; pending: number; error?: string | undefined } = { status: "idle", pending: 0 };
const listeners = new Set<() => void>();
const versions = new Map<string, number>();
let flushing = false;
let onFlushed: ((tables: Set<TableName>) => void) | null = null;
let onConflict: ((table: TableName, id: string) => void) | null = null;

class ConflictError extends Error {}

export function setSyncUser(userId: string | null) {
  if (ownerId === userId) return;
  ownerId = userId;
  versions.clear();
  queue = [];
  if (userId && typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem(`${KEY}:${userId}`) || "[]");
      queue = Array.isArray(stored) ? stored : [];
      // Adopt only legacy operations whose owner is explicit. Preserve unknown
      // legacy operations in their original storage instead of replaying them.
      const legacy = JSON.parse(localStorage.getItem(KEY) || "[]") as Op[];
      if (Array.isArray(legacy)) {
        const owned = legacy.filter(op => op.row?.['user_id'] === userId);
        queue.push(...owned);
        save();
        if (owned.length) localStorage.setItem(KEY, JSON.stringify(legacy.filter(op => op.row?.['user_id'] !== userId)));
      }
    } catch { /* Preserve the original storage on parsing/storage failures. */ }
  }
  set({ status: queue.length ? "pending" : "idle", error: undefined });
  void flush();
}
function save(items = queue, userId = ownerId) {
  if (!userId) return;
  try { localStorage.setItem(`${KEY}:${userId}`, JSON.stringify(items)); } catch { /* sem espaço */ }
}
function set(s: Partial<typeof state>) {
  state = { ...state, ...s, pending: queue.length };
  listeners.forEach((l) => l());
}

export function initSync(opts: { onFlushed: typeof onFlushed; onConflict: typeof onConflict }) {
  onFlushed = opts.onFlushed;
  onConflict = opts.onConflict;
  set({ status: queue.length ? "pending" : "idle" });
  const online = () => void flush();
  window.addEventListener("online", online);
  void flush();
  return () => window.removeEventListener("online", online);
}

export function rememberVersion(id: string, v: number) {
  const cur = versions.get(id);
  if (cur == null || v > cur) versions.set(id, v);
}

export function enqueue(op: Omit<Op, "opId">) {
  if (!ownerId) throw new Error("Sua sessão expirou. Entre novamente para salvar.");
  // Une atualizações seguidas do mesmo registro, mantendo a versão-base original.
  if (op.kind === "update" && op.id) {
    const prev = queue.find((q, i) => (!flushing || i > 0) && q.kind === "update" && q.id === op.id && q.table === op.table);
    if (prev) { prev.row = { ...prev.row, ...op.row }; save(); void flush(); return; }
  }
  queue.push({ ...op, baseVersion: op.baseVersion ?? (op.id ? versions.get(op.id) : undefined), opId: crypto.randomUUID() });
  save();
  set({ status: navigator.onLine ? "saving" : "pending" });
  void flush();
}

const isNetwork = (e: unknown) =>
  !navigator.onLine || (e instanceof Error && /fetch|network|load failed/i.test(e.message));

async function run(op: Op, userId: string, currentVersions: Map<string, number>) {
  const t = supabase.from(op.table) as any;
  if (op.kind === "insert" || op.kind === "upsert") {
    const { error } = await t.upsert(op.row, {
      onConflict: op.onConflict ?? "id",
      ignoreDuplicates: op.kind === "insert",
    });
    if (error) throw new Error(error.message);
  } else if (op.kind === "update") {
    if (!op.id) throw new Error("Registro inválido.");
    let q = t.update(op.row).eq("id", op.id).eq("user_id", userId);
    const base = currentVersions.get(op.id) ?? op.baseVersion;
    if (base != null) q = q.eq("version", base);
    const { data, error } = await q.select("id, version");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new ConflictError();
    currentVersions.set(op.id, data[0].version);
  } else if (op.kind === "delete") {
    if (!op.id) throw new Error("Registro inválido.");
    const { error } = await t.delete().eq("id", op.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
  }
}

export async function flush() {
  if (flushing || !ownerId || typeof window === "undefined") return;
  if (!queue.length) return;
  if (!navigator.onLine) return set({ status: "pending" });
  flushing = true;
  set({ status: "saving" });
  const touched = new Set<TableName>();
  const userId = ownerId;
  const items = queue;
  const currentVersions = new Map<string, number>();
  try {
    while (items.length && ownerId === userId) {
      const op = items[0];
      if (!op) break;
      try {
        await run(op, userId, currentVersions);
        touched.add(op.table);
        const nextVersion = op.id ? currentVersions.get(op.id) : undefined;
        if (nextVersion != null) items.forEach(pending => {
          if (pending.id === op.id && pending.table === op.table) pending.baseVersion = nextVersion;
        });
        items.shift(); save(items, userId);
        if (ownerId !== userId) return;
        if (op.id && currentVersions.has(op.id)) rememberVersion(op.id, currentVersions.get(op.id) ?? 0);
      } catch (e) {
        if (ownerId !== userId) return;
        if (e instanceof ConflictError) {
          items.shift(); save(items, userId);
          touched.add(op.table);
          if (op.id) versions.delete(op.id);
          set({ status: "conflict", error: "Este registro foi alterado em outro aparelho." });
          if (op.id) onConflict?.(op.table, op.id);
          continue;
        }
        if (isNetwork(e)) { set({ status: "pending" }); return; }
        set({ status: "error", error: e instanceof Error ? e.message : "Falha ao salvar" });
        return;
      }
    }
    if (ownerId === userId && state.status !== "conflict") set({ status: "saved", error: undefined });
  } finally {
    flushing = false;
    if (ownerId === userId && touched.size) onFlushed?.(touched);
    if (ownerId !== userId) void flush();
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
