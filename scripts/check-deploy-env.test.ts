import { describe, expect, it } from "vitest";
import { validateDeployEnv } from "./check-deploy-env.mjs";

describe("Vercel public connection validation", () => {
  const valid = { VITE_SUPABASE_URL: "https://backend.example.org", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" };
  it("requires both public values", () => expect(validateDeployEnv({})).toHaveLength(2));
  it("accepts the existing backend public connection", () => expect(validateDeployEnv(valid)).toEqual([]));
  it("rejects private keys in browser configuration", () => expect(validateDeployEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test" })).toHaveLength(1));
  it("rejects localhost for deployment", () => expect(validateDeployEnv({ ...valid, VITE_SUPABASE_URL: "http://localhost:54321" })).toHaveLength(1));
  it("rejects authenticated preview connections", () => expect(validateDeployEnv({ ...valid, VITE_SUPABASE_URL: "https://id-preview--example.lovable.app" })).toHaveLength(1));
});