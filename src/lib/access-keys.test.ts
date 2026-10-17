import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), signInWithOtp: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc, auth: { signInWithOtp: mocks.signInWithOtp } } }));
import { KEY_MESSAGES, requestKeyLogin, signupSchema, validateAccessKey } from "./access-keys";
describe("Individual access rules", () => {
  beforeEach(() => vi.clearAllMocks());
  it("accepts exactly the four signup fields, without a name", () => {
    expect(signupSchema.parse({ email: "user@example.org", password: "12345678", confirmPassword: "12345678", key: "BF-key" })).toEqual({ email: "user@example.org", password: "12345678", confirmPassword: "12345678", key: "BF-key" });
    expect(signupSchema.safeParse({ email: "user@example.org", password: "12345678", confirmPassword: "12345678", key: "BF-key", name: "Extra" }).success).toBe(false);
  });
  it.each([
    ["invalid", "Chave de acesso inválida. Confira o código e tente novamente."],
    ["revoked", "Esta chave de acesso não está mais disponível."],
    ["used", "Pô, seu acesso foi bloqueado, pois você tentou reutilizar uma chave já existente."],
  ])("uses confirmed backend state %s", async (code, message) => {
    mocks.rpc.mockResolvedValue({ data: { ok: false, code }, error: null });
    await expect(validateAccessKey("BF-key")).rejects.toThrow(message);
    expect(mocks.rpc).toHaveBeenCalledWith("validate_access_key", { p_key: "BF-key", p_intent: "signup", p_email: "" });
  });
  it("never claims reuse when the backend is unavailable", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    await expect(validateAccessKey("BF-key")).rejects.toThrow(KEY_MESSAGES.temporary);
  });
  it("key login requires provider email confirmation and cannot create accounts", async () => {
    mocks.rpc.mockResolvedValue({ data: { ok: true, code: "email_confirmation_required" }, error: null });
    await requestKeyLogin("BF-key", "user@example.org", "https://basefyseller.vercel.app");
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({ email: "user@example.org", options: { shouldCreateUser: false, emailRedirectTo: "https://basefyseller.vercel.app/auth" } });
  });
  it("cannot send login mail after a rejected key", async () => {
    mocks.rpc.mockResolvedValue({ data: { ok: false, code: "login_invalid" }, error: null });
    await expect(requestKeyLogin("BF-key", "user@example.org", "https://basefyseller.vercel.app")).rejects.toThrow();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });
});