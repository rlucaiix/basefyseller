import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

// Standalone build without editor-specific plugins or output overrides.
export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({ server: { entry: "server" } }),
    nitro({ preset: "vercel" }),
    react(),
  ],
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router"] },
});