import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));

describe("Per-user offline persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  });
  it("never sends account A's queued changes as account B", async () => {
    const sync = await import("./sync");
    sync.setSyncUser("account-a");
    sync.enqueue({ table: "products", kind: "insert", row: { id: "product-a", user_id: "account-a" } });
    sync.setSyncUser(null);
    sync.setSyncUser("account-b");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    await sync.flush();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("basefy-sync-queue:account-a") ?? "[]")).toHaveLength(1);
  });
  it("retains the original version guard after merging edits and reloading", async () => {
    let sync = await import("./sync");
    sync.setSyncUser("account-a");
    sync.rememberVersion("product-a", 7);
    sync.enqueue({ table: "products", kind: "update", id: "product-a", row: { name: "First" } });
    sync.enqueue({ table: "products", kind: "update", id: "product-a", row: { name: "Final" } });
    const stored = JSON.parse(localStorage.getItem("basefy-sync-queue:account-a") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].baseVersion).toBe(7);
    vi.resetModules();
    sync = await import("./sync");
    const eq = vi.fn();
    const query = { eq, select: vi.fn().mockResolvedValue({ data: [{ id: "product-a", version: 8 }], error: null }) };
    eq.mockReturnValue(query);
    const update = vi.fn().mockReturnValue(query);
    mocks.from.mockReturnValue({ update });
    sync.setSyncUser("account-a");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    await sync.flush();
    expect(update).toHaveBeenCalledWith({ name: "Final" });
    expect(eq).toHaveBeenCalledWith("version", 7);
    expect(eq).toHaveBeenCalledWith("user_id", "account-a");
  });
  it("preserves unowned legacy changes without replaying them", async () => {
    localStorage.setItem("basefy-sync-queue", JSON.stringify([{ opId: "legacy", table: "products", kind: "delete", id: "unknown-owner" }]));
    const sync = await import("./sync");
    sync.setSyncUser("account-b");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    await sync.flush();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("basefy-sync-queue") ?? "[]")).toHaveLength(1);
  });
  it("rejects writes when signed out", async () => {
    const sync = await import("./sync");
    expect(() => sync.enqueue({ table: "products", kind: "delete", id: "product-a" })).toThrow("Sua sessão expirou");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("reloads the originating user's pending changes after signing back in", async () => {
    const sync = await import("./sync");
    sync.setSyncUser("account-a");
    sync.enqueue({ table: "products", kind: "insert", row: { id: "product-a", user_id: "account-a" } });
    sync.setSyncUser(null);
    sync.setSyncUser("account-a");
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ upsert });
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    await sync.flush();
    expect(upsert).toHaveBeenCalledWith({ id: "product-a", user_id: "account-a" }, { onConflict: "id", ignoreDuplicates: true });
    expect(JSON.parse(localStorage.getItem("basefy-sync-queue:account-a") ?? "[]")).toEqual([]);
  });
});