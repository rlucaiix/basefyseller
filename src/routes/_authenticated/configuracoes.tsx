import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { appHead } from "@/lib/head";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, useMutations, useDebounced, useProducts, useSales, useGoals } from "@/lib/data";
import { DEFAULT_RATES, fmtBRL } from "@/lib/pricing";
import { PageHeader, Card, MoneyField } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShareSeller, normalizeLink } from "@/components/app/ShareSeller";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: appHead("Configurações", "Taxas, perfil, exportação dos dados e exclusão da conta."),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: s } = useSettings();
  const { data: products } = useProducts();
  const { data: sales } = useSales();
  const { data: goals } = useGoals();
  const m = useMutations();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [std, setStd] = useState<number | null>(null);
  const [feat, setFeat] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!s) return;
    setName(s.display_name ?? "");
    setBio(s.bio ?? "");
    setLink(s.seller_link ?? "");
    setStd(+(s.rate_standard * 100).toFixed(2));
    setFeat(+(s.rate_featured * 100).toFixed(2));
  }, [s?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useDebounced(() => {
    if (std == null || feat == null || std >= 100 || feat >= 100) return;
    const sl = link.trim() ? normalizeLink(link) : null;
    if (link.trim() && !sl) return;
    void m.updateSettings({ display_name: name || null, bio: bio || null, seller_link: sl, rate_standard: std / 100, rate_featured: feat / 100 });
  }, [name, bio, link, std, feat]);
  const validLink = link.trim() ? normalizeLink(link) : null;

  function exportData() {
    const blob = new Blob([JSON.stringify({ exportado_em: new Date().toISOString(), configuracoes: s, produtos: products, vendas: sales, metas: goals }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `basefy-seller-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function deleteAccount() {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return toast.error("Não foi possível excluir agora. Tente de novo.");
    localStorage.removeItem("basefy-sync-queue");
    await supabase.auth.signOut();
    toast.success("Conta e dados excluídos.");
    nav({ to: "/" });
    return undefined;
  }

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="font-semibold">Perfil</h3>
          <div className="space-y-1.5"><Label htmlFor="n" className="text-xs text-muted-foreground">Como quer ser chamado</Label><Input id="n" className="h-11" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="bio" className="text-xs text-muted-foreground">Sobre você</Label><Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="O que você vende, seu diferencial…" /></div>
          <div className="space-y-1.5">
            <Label htmlFor="sl" className="text-xs text-muted-foreground">Seu link de vendedor na Basefy</Label>
            <Input id="sl" inputMode="url" className="h-11" value={link} onChange={(e) => setLink(e.target.value)} placeholder="basefy.io/seu-perfil" />
            {link.trim() && !validLink && <p className="text-xs text-destructive">Link inválido.</p>}
          </div>
          {validLink && <ShareSeller link={validLink} name={name} />}
          <p className="text-xs text-muted-foreground">Moeda: Real (R$). Nunca pedimos sua senha da Basefy, CPF ou dados bancários.</p>
        </Card>
        <Card className="space-y-4">
          <h3 className="font-semibold">Taxas da Basefy</h3>
          <div className="grid grid-cols-2 gap-3">
            <MoneyField label="Venda comum" suffix="%" value={std} allowEmpty={false} onChange={setStd} />
            <MoneyField label="Produto em destaque" suffix="%" value={feat} allowEmpty={false} onChange={setFeat} />
          </div>
          <p className="text-xs text-muted-foreground">Padrão: {DEFAULT_RATES.padrao * 100}% e {DEFAULT_RATES.destaque * 100}%. Mudar aqui não altera vendas já registradas. A tarifa de {fmtBRL(s?.buyer_fee ?? 1)} por compra é paga pelo comprador e não entra no seu lucro.</p>
        </Card>
        <Card className="space-y-3">
          <h3 className="font-semibold">Seus dados</h3>
          <Button variant="secondary" onClick={exportData}><Download />Exportar tudo (JSON)</Button>
          <Button variant="ghost" onClick={() => supabase.auth.signOut().then(() => nav({ to: "/" }))}><LogOut />Sair</Button>
        </Card>
        <Card className="space-y-3 border-destructive/30">
          <h3 className="font-semibold text-destructive">Excluir conta</h3>
          <p className="text-sm text-muted-foreground">Apaga sua conta, produtos, vendas e metas. Não dá para desfazer.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 />Excluir minha conta</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta definitivamente?</AlertDialogTitle>
                <AlertDialogDescription>Digite EXCLUIR para confirmar. Se quiser, exporte seus dados antes.</AlertDialogDescription>
              </AlertDialogHeader>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="EXCLUIR" />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction disabled={confirmText !== "EXCLUIR"} onClick={deleteAccount}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </div>
    </>
  );
}
