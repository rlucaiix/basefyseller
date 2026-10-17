import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { configureDeployEnv, PUBLIC_PROJECT_ENV, resolveDeployEnv, validateDeployEnv } from "./check-deploy-env.mjs";

describe("Vercel public connection validation", () => {
  const valid = { VITE_SUPABASE_URL: "https://backend.example.org", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" };
  it("uses the connected project's public fallback when both values are missing", () => {
    expect(resolveDeployEnv({})).toEqual({
      VITE_SUPABASE_URL: "https://mbvydosuoqvmfmhrzzce.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_hrNZmmvv07jV6P6d16yZzw_kzxO7_Ng",
    });
    expect(validateDeployEnv({})).toEqual([]);
  });
  it("preserves explicitly configured public values", () => expect(resolveDeployEnv(valid)).toEqual(valid));
  it("fills only missing or blank values", () => {
    expect(resolveDeployEnv({ VITE_SUPABASE_URL: valid.VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: "  " })).toEqual({ ...PUBLIC_PROJECT_ENV, VITE_SUPABASE_URL: valid.VITE_SUPABASE_URL });
    expect(resolveDeployEnv({ VITE_SUPABASE_PUBLISHABLE_KEY: valid.VITE_SUPABASE_PUBLISHABLE_KEY })).toEqual({ ...PUBLIC_PROJECT_ENV, VITE_SUPABASE_PUBLISHABLE_KEY: valid.VITE_SUPABASE_PUBLISHABLE_KEY });
  });
  it("passes fallback values to the environment consumed by Vite", () => {
    const target = { OTHER: "unchanged" };
    configureDeployEnv({}, target);
    expect(target).toEqual({ OTHER: "unchanged", ...PUBLIC_PROJECT_ENV });
  });
  it("passes the standalone preflight with no Vercel variables", () => {
    const env = { ...process.env };
    delete env.VITE_SUPABASE_URL;
    delete env.VITE_SUPABASE_PUBLISHABLE_KEY;
    expect(execFileSync(process.execPath, ["scripts/check-deploy-env.mjs"], { env, encoding: "utf8" })).toContain("Configuração pública validada");
  });
  it("does not replace a supplied private key with the fallback", () => {
    expect(() => configureDeployEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test" })).toThrow("nunca uma chave privada");
  });
  it("rejects a service-role JWT in browser configuration", () => {
    const key = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.test`;
    expect(validateDeployEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: key })).toHaveLength(1);
  });
  it("accepts the existing backend public connection", () => expect(validateDeployEnv(valid)).toEqual([]));
  it("rejects private keys in browser configuration", () => expect(validateDeployEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test" })).toHaveLength(1));
  it("rejects localhost for deployment", () => expect(validateDeployEnv({ ...valid, VITE_SUPABASE_URL: "http://localhost:54321" })).toHaveLength(1));
  it("rejects authenticated preview connections", () => expect(validateDeployEnv({ ...valid, VITE_SUPABASE_URL: "https://id-preview--example.lovable.app" })).toHaveLength(1));
});