import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, KeyRound, Ban } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const adminOptions = queryOptions({
  queryKey: ["access-key-admin"],
  queryFn: async () => {
    const role = await supabase.rpc("is_key_admin");
    if (role.error) throw new Error("Não foi possível verificar sua permissão.");
    if (!role.data) return null;
    const [keys, audit] = await Promise.all([
      supabase.from("access_keys").select("id,status,generated_at,used_at,revoked_at,bound_user_id,registration_email").order("generated_at", { ascending: false }).limit(200),
      supabase.from("access_key_audit").select("id,key_id,actor_id,action,occurred_at").order("occurred_at", { ascending: false }).limit(100),
    ]);
    if (keys.error || audit.error) throw new Error("Não foi possível carregar as chaves.");
    return { keys: keys.data, audit: audit.data };
  },
});

export const Route = createFileRoute("/_authenticated/chaves")({
  head: () => ({ meta: [
    { title: "Chaves de acesso · Basefy Seller" },
    { name: "description", content: "Gestão autorizada de chaves individuais do Basefy Seller." },
    { property: "og:title", content: "Chaves de acesso · Basefy Seller" },
    { property: "og:description", content: "Gestão segura dos acessos individuais do Basefy Seller." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminOptions),
  component: KeyAdmin,
});

const generatedSchema = z.array(z.object({ id: z.string().uuid(), key: z.string() }));
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "—";
const statusLabels = { active: "Disponível", used: "Utilizada", revoked: "Revogada" };
function KeyAdmin() {
  const { data, refetch } = useSuspenseQuery(adminOptions);
  const [count, setCount] = useState(1);
  const [generated, setGenerated] = useState<z.infer<typeof generatedSchema>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function generate() {
    setBusy(true); setError(""); setNotice(""); setGenerated([]);
    try {
      const amount = z.number().int().min(1).max(100).parse(count);
      const result = await supabase.rpc("generate_access_keys", { p_count: amount });
      if (result.error) throw new Error("Não foi possível gerar as chaves.");
      setGenerated(generatedSchema.parse(result.data));
      await refetch();
    } catch (err) { setError(err instanceof z.ZodError ? "Escolha de 1 a 100 chaves." : err instanceof Error ? err.message : "Tente novamente."); }
    finally { setBusy(false); }
  }
  async function revoke(id: string) {
    if (!window.confirm("Revogar esta chave ainda não utilizada?")) return;
    setBusy(true); setError("");
    try {
      const result = await supabase.rpc("revoke_access_key", { p_id: id });
      if (result.error || !result.data) throw new Error("Esta chave não pode ser revogada. Atualize a lista.");
      await refetch();
    } catch (err) { setError(err instanceof Error ? err.message : "Tente novamente."); }
    finally { setBusy(false); }
  }
  if (!data) return <><PageHeader title="Acesso restrito" /><p>Somente administradores autorizados podem gerenciar chaves.</p></>;
  return <>
    <PageHeader title="Chaves de acesso" />
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="space-y-2"><Label htmlFor="key-count">Quantidade</Label><Input className="w-28" id="key-count" type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} disabled={busy} /></div>
      <Button onClick={generate} disabled={busy}><KeyRound />{busy ? "Aguarde…" : "Gerar chaves"}</Button>
    </div>
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="mb-4 text-sm text-success">{notice}</p>}
    {generated.length > 0 && <section className="mb-8 space-y-3"><h2 className="font-semibold">Chaves geradas</h2><p className="text-sm text-muted-foreground">Copie agora. As chaves completas não serão exibidas novamente.</p>{generated.map(item => <div key={item.id} className="glass flex items-center gap-3 p-3"><code className="min-w-0 flex-1 break-all text-sm">{item.key}</code><Button variant="ghost" size="icon" title="Copiar chave" aria-label="Copiar chave" onClick={async () => { try { await navigator.clipboard.writeText(item.key); setNotice("Chave copiada."); } catch { setError("Não foi possível copiar. Selecione a chave e copie manualmente."); } }}><Copy /></Button></div>)}<Button variant="outline" onClick={() => setGenerated([])}>Ocultar chaves</Button></section>}
    <section><h2 className="mb-4 text-lg font-semibold">Últimas 200 chaves</h2>{data.keys.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma chave gerada.</p> : <div className="grid gap-3">{data.keys.map(item => <article key={item.id} className="glass flex flex-wrap items-start justify-between gap-3 p-4"><div className="min-w-0 space-y-1 text-sm"><p className="font-semibold">{statusLabels[item.status as keyof typeof statusLabels]}</p><p className="break-all text-muted-foreground">{item.id}</p><p>Gerada: {formatDate(item.generated_at)}</p>{item.used_at && <><p>Utilizada: {formatDate(item.used_at)}</p><p className="break-all">{item.registration_email}</p><p className="break-all text-muted-foreground">Conta: {item.bound_user_id}</p></>}{item.revoked_at && <p>Revogada: {formatDate(item.revoked_at)}</p>}</div>{item.status === "active" && <Button variant="outline" disabled={busy} onClick={() => revoke(item.id)}><Ban />Revogar</Button>}</article>)}</div>}</section>
    <section className="mt-8"><h2 className="mb-4 text-lg font-semibold">Últimos 100 eventos</h2><div className="divide-y divide-border">{data.audit.map(item => <div key={item.id} className="py-3 text-sm"><p>{({ generated: "Chave gerada", consumed: "Chave vinculada", revoked: "Chave revogada", validate_signup: "Validação de cadastro", validate_login: "Validação de entrada" } as Record<string, string>)[item.action] ?? item.action} · {formatDate(item.occurred_at)}</p><p className="break-all text-xs text-muted-foreground">Chave: {item.key_id ?? "não localizada"} · Responsável: {item.actor_id ?? "visitante"}</p></div>)}</div></section>
  </>;
}