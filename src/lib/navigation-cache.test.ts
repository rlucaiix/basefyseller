import { QueryClient } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser } } }));
import { navigationUser } from "./navigation-cache";
beforeEach(() => vi.clearAllMocks());
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