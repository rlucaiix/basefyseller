import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha · Basefy Seller" },
      { name: "description", content: "Crie uma nova senha para sua conta do Basefy Seller." },
      { property: "og:title", content: "Nova senha · Basefy Seller" },
      { property: "og:description", content: "Redefina sua senha do Basefy Seller." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error("O link expirou ou é inválido. Peça um novo.");
    toast.success("Senha atualizada.");
    nav({ to: "/inicio" });
    return undefined;
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="glass grid w-full max-w-sm gap-4 p-6">
        <h1 className="text-2xl font-bold">Criar nova senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Nova senha</Label>
          <Input id="pw" type="password" minLength={6} required className="h-11" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button type="submit" variant="hero" size="lg" disabled={busy}>Salvar senha</Button>
      </form>
    </div>
  );
}
