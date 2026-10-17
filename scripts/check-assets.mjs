import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export function checkAssets(root = fileURLToPath(new URL("../", import.meta.url))) {
  const entries = JSON.parse(readFileSync(join(root, "scripts/assets-manifest.json"), "utf8"));
  const registered = new Set(entries.map(entry => entry.path));
  for (const entry of entries) {
    const file = join(root, "public", entry.path);
    if (!existsSync(file)) throw new Error(`Arquivo ausente: ${entry.path}`);
    if (statSync(file).size !== entry.bytes || createHash("sha256").update(readFileSync(file)).digest("hex") !== entry.sha256) {
      throw new Error(`Arquivo alterado: ${entry.path}`);
    }
  }
  function inspect(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, item.name);
      if (item.isDirectory()) { inspect(file); continue; }
      if (!/\.(tsx?|css)$/.test(item.name)) continue;
      const text = readFileSync(file, "utf8");
      if (text.includes("/__l5e/assets-v1/")) throw new Error(`Referência de mídia não portátil: ${file}`);
      for (const match of text.matchAll(/["'`](\/assets\/[^"'`\s)]+)["'`]/g)) {
        if (!registered.has(match[1])) throw new Error(`Imagem sem registro: ${match[1]}`);
      }
    }
  }
  inspect(join(root, "src"));
  return entries.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(`${checkAssets()} arquivos locais conferidos: nomes, tamanho e SHA-256.`); }
  catch (error) { console.error(error instanceof Error ? error.message : "Falha na conferência das imagens."); process.exitCode = 1; }
}