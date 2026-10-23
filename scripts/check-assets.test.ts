import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { checkAssets } from "./check-assets.mjs";

describe("asset portability", () => {
  it("keeps original media and the uploaded logo with shortcut icons intact", () => {
    expect(checkAssets(process.cwd())).toBe(85);
  });
  it("rejects a missing local file", () => {
    const root = mkdtempSync(join(tmpdir(), "basefy-assets-"));
    try {
      mkdirSync(join(root, "scripts"));
      mkdirSync(join(root, "src"));
      writeFileSync(join(root, "scripts/assets-manifest.json"), JSON.stringify([{ path: "/assets/missing.webp", bytes: 1, sha256: "missing" }]));
      expect(() => checkAssets(root)).toThrow("Arquivo ausente");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("rejects Lovable-only media paths", () => {
    const root = mkdtempSync(join(tmpdir(), "basefy-assets-"));
    try {
      mkdirSync(join(root, "scripts"));
      mkdirSync(join(root, "src"));
      mkdirSync(join(root, "public"));
      writeFileSync(join(root, "public/ok.webp"), "original");
      writeFileSync(join(root, "scripts/assets-manifest.json"), JSON.stringify([{ path: "/ok.webp", bytes: 8, sha256: createHash("sha256").update("original").digest("hex") }]));
      writeFileSync(join(root, "src/image.ts"), 'export const image = "/__l5e/assets-v1/old/image.webp";');
      expect(() => checkAssets(root)).toThrow("não portátil");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});