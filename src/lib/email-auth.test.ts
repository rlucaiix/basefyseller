import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signUp: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(), signOut: vi.fn() }));
const access = vi.hoisted(() => ({ validateAccessKey: vi.fn(), hasAuthorizedAccess: vi.fn() }));
vi.mock("./access-keys", async importOriginal => ({ ...await importOriginal<typeof import("./access-keys")>(), ...access }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { authRedirects, passwordIsValid, requestPasswordReset, signInWithEmail, signUpWithEmail, updateRecoveredPassword } from "./email-auth";

describe("Email authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    access.validateAccessKey.mockResolvedValue({ ok: true, code: "valid", ticket: "validated-ticket" });
    access.hasAuthorizedAccess.mockResolvedValue(true);
    auth.signInWithPassword.mockResolvedValue({ data: { session: { user: { id: "owner" } } }, error: null });
    auth.signUp.mockResolvedValue({ data: { user: { id: "new-owner" } }, error: null });
  });
  it("requires at least eight password characters", () => {
    expect(passwordIsValid("1234567")).toBe(false);
    expect(passwordIsValid("12345678")).toBe(true);
  });
  it.each(["https://basefyseller.vercel.app", "https://basefyseller.lovable.app"])("keeps email links on %s", (origin) => {
    expect(authRedirects(origin)).toEqual({ confirmation: `${origin}/auth`, recovery: `${origin}/reset-password` });
  });
  it("signs in with email and password", async () => {
    await signInWithEmail(" user@example.com ", "12345678");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "user@example.com", password: "12345678" });
  });
  it("signs up with confirmation on the current domain", async () => {
    await signUpWithEmail("user@example.com", "12345678", "https://basefyseller.vercel.app", "BF-key", "12345678");
    expect(auth.signUp).toHaveBeenCalledWith({ email: "user@example.com", password: "12345678", options: { emailRedirectTo: "https://basefyseller.vercel.app/auth", data: { access_ticket: "validated-ticket" } } });
  });
  it("does not send a weak password to signup", async () => {
    await expect(signUpWithEmail("user@example.com", "1234567", "https://basefyseller.vercel.app", "BF-key", "1234567")).rejects.toThrow();
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it("rejects mismatched passwords before any signup", async () => {
    await expect(signUpWithEmail("user@example.com", "12345678", "https://basefyseller.vercel.app", "BF-key", "different")).rejects.toThrow("As senhas não coincidem.");
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(access.validateAccessKey).not.toHaveBeenCalled();
  });
  it("rejects unauthorized password login and ends its session", async () => {
    access.hasAuthorizedAccess.mockResolvedValue(false);
    await expect(signInWithEmail("user@example.com", "12345678")).rejects.toThrow("não possui autorização");
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
  it("rechecks backend state after an Auth signup failure", async () => {
    auth.signUp.mockResolvedValue({ error: { message: "Database error saving new user" } });
    access.validateAccessKey.mockResolvedValueOnce({ ticket: "validated-ticket" }).mockRejectedValueOnce(new Error("Pô, seu acesso foi bloqueado, pois você tentou reutilizar uma chave já existente."));
    await expect(signUpWithEmail("user@example.com", "12345678", "https://basefyseller.vercel.app", "BF-key", "12345678")).rejects.toThrow("Pô, seu acesso foi bloqueado, pois você tentou reutilizar uma chave já existente.");
  });
  it("requests reset on the public password recovery page", async () => {
    await requestPasswordReset("user@example.com", "https://basefyseller.vercel.app");
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", { redirectTo: "https://basefyseller.vercel.app/reset-password" });
  });
  it("sets a recovery password without current_password", async () => {
    await updateRecoveredPassword("12345678");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "12345678" });
  });
  it("does not update a password shorter than eight characters", async () => {
    await expect(updateRecoveredPassword("1234567")).rejects.toThrow();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});