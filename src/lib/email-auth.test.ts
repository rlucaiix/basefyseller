import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signUp: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { authRedirects, passwordIsValid, requestPasswordReset, signInWithEmail, signUpWithEmail, updateRecoveredPassword } from "./email-auth";

describe("Email authentication", () => {
  beforeEach(() => vi.clearAllMocks());
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
    await signUpWithEmail("user@example.com", "12345678", "https://basefyseller.vercel.app");
    expect(auth.signUp).toHaveBeenCalledWith({ email: "user@example.com", password: "12345678", options: { emailRedirectTo: "https://basefyseller.vercel.app/auth" } });
  });
  it("does not send a weak password to signup", async () => {
    await expect(signUpWithEmail("user@example.com", "1234567", "https://basefyseller.vercel.app")).rejects.toThrow();
    expect(auth.signUp).not.toHaveBeenCalled();
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