import { Copy, Share2, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function shareText(name: string | null | undefined) {
  return `Confira minha loja na Basefy${name ? ` — ${name}` : ""}:`;
}

/** Botões de compartilhamento rápido do link de vendedor. */
export function ShareSeller({ link, name, compact }: { link: string; name?: string | null | undefined; compact?: boolean }) {
  const text = shareText(name);
  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title: "Minha loja na Basefy", text, url: link }); } catch { /* cancelado */ }
    } else copy();
  }
  async function copy() {
    try { await navigator.clipboard.writeText(link); toast.success("Link copiado"); }
    catch { toast.error("Não foi possível copiar. Selecione e copie o link."); }
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`;
  return (
    <div className={compact ? "flex gap-1" : "grid grid-cols-2 gap-2 sm:grid-cols-4"}>
      <Button variant="hero" size={compact ? "icon" : "default"} onClick={nativeShare} aria-label="Compartilhar"><Share2 />{!compact && "Compartilhar"}</Button>
      <Button variant="secondary" size={compact ? "icon" : "default"} onClick={copy} aria-label="Copiar link"><Copy />{!compact && "Copiar"}</Button>
      <Button asChild variant="secondary" size={compact ? "icon" : "default"}><a href={wa} target="_blank" rel="noreferrer" aria-label="Enviar no WhatsApp"><MessageCircle />{!compact && "WhatsApp"}</a></Button>
      {!compact && <Button asChild variant="ghost"><a href={link} target="_blank" rel="noreferrer"><ExternalLink />Abrir</a></Button>}
    </div>
  );
}

export function normalizeLink(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch { return null; }
}
