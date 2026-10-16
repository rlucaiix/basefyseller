import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, CloudOff, Loader2, AlertTriangle, RefreshCw, GitCompare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { parseMoney, toInput } from "@/lib/pricing";
import { useSyncState, retry, discardFailed } from "@/lib/sync";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass p-4 md:p-5", className)}>{children}</div>;
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode | undefined; tone?: "good" | "bad" | undefined }) {
  return (
    <div className="glass p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold tabular md:text-2xl", tone === "good" && "text-success", tone === "bad" && "text-destructive")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Empty({ title, text, to, cta }: { title: string; text: string; to?: string; cta?: string }) {
  return (
    <div className="glass flex flex-col items-center gap-3 p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      {to && cta && <Button asChild variant="hero"><Link to={to}>{cta}</Link></Button>}
    </div>
  );
}

/** Campo de dinheiro: aceita vírgula, valida sem apagar o que foi digitado. */
export function MoneyField({ label, value, onChange, allowEmpty = true, placeholder = "0,00", id, suffix }: {
  label: string; value: number | null | undefined; onChange: (v: number | null) => void; allowEmpty?: boolean; placeholder?: string; id?: string; suffix?: string;
}) {
  const [text, setText] = useState(toInput(value));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const parsed = parseMoney(text);
    if (parsed !== (value ?? null)) setText(toInput(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const fid = id ?? label.replace(/\W/g, "");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fid} className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        {!suffix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>}
        <Input
          id={fid}
          inputMode="decimal"
          className={cn(!suffix && "pl-9", "h-11 tabular", err && "border-destructive")}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            const t = e.target.value;
            setText(t);
            if (!t.trim()) { if (allowEmpty) { setErr(null); onChange(null); } else setErr("Obrigatório"); return; }
            const n = parseMoney(t);
            if (n == null) return setErr("Valor inválido");
            if (n < 0) return setErr("Não pode ser negativo");
            setErr(null); onChange(n);
          }}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

export function SaveIndicator() {
  const s = useSyncState();
  const map = {
    idle: null,
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Salvando…", cls: "text-muted-foreground" },
    saved: { icon: <Check className="size-3.5" />, text: "Salvo", cls: "text-success" },
    pending: { icon: <CloudOff className="size-3.5" />, text: `Pendente de sincronização (${s.pending})`, cls: "text-warning" },
    error: { icon: <AlertTriangle className="size-3.5" />, text: "Erro ao salvar", cls: "text-destructive" },
    conflict: { icon: <GitCompare className="size-3.5" />, text: "Conflito de edição", cls: "text-warning" },
  } as const;
  const m = map[s.status];
  if (!m) return null;
  return (
    <div className={cn("flex items-center gap-1.5 text-xs", m.cls)} role="status" aria-live="polite" title={s.error}>
      {m.icon}<span>{m.text}</span>
      {s.status === "error" && (
        <>
          <button onClick={retry} className="ml-1 inline-flex items-center gap-1 underline"><RefreshCw className="size-3" />Tentar de novo</button>
          <button onClick={discardFailed} className="ml-1 underline">Descartar</button>
        </>
      )}
    </div>
  );
}
