import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { configureDeployEnv } from "./scripts/check-deploy-env.mjs";

// Standalone build without editor-specific plugins or output overrides.
export default defineConfig(({ mode }) => {
  // The preflight is a separate process; resolve again here so Vite embeds the values.
  configureDeployEnv({ ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env }, process.env);
  return {
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({ server: { entry: "server" } }),
    nitro({ preset: "vercel" }),
    react(),
  ],
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router"] },
  };
});