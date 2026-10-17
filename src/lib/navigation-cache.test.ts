import { QueryClient } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn() }));
const access = vi.hoisted(() => ({ hasAuthorizedAccess: vi.fn() }));
vi.mock("./access-keys", () => access);
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser } } }));
import { navigationUser } from "./navigation-cache";
beforeEach(() => { vi.clearAllMocks(); access.hasAuthorizedAccess.mockResolvedValue(true); });
it("reuses only an Auth-server-validated identity across quick navigations", async () => {
  const qc = new QueryClient();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
  expect(await navigationUser(qc)).toEqual({ id: "owner" });
  expect(await navigationUser(qc)).toEqual({ id: "owner" });
  expect(mocks.getUser).toHaveBeenCalledTimes(1);
  qc.clear();
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  expect(await navigationUser(qc)).toBeNull();
  expect(mocks.getUser).toHaveBeenCalledTimes(2);
  qc.clear();
});
it("returns signed out for a confirmed missing session", async () => {
  const qc = new QueryClient();
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { name: "AuthSessionMissingError" } });
  expect(await navigationUser(qc)).toBeNull();
  qc.clear();
});
it("never returns an identity without database authorization", async () => {
  const qc = new QueryClient();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "unauthorized" } }, error: null });
  access.hasAuthorizedAccess.mockResolvedValue(false);
  expect(await navigationUser(qc)).toBeNull();
  qc.clear();
});
it("does not treat a connection failure as a confirmed missing identity", async () => {
  const qc = new QueryClient();
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Network failure") });
  await expect(navigationUser(qc)).rejects.toThrow("Network failure");
  qc.clear();
});