import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, PartyPopper, Sparkles, Wrench } from "lucide-react";
import { appHead } from "@/lib/head";
import { useMutations, useSettings } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: appHead("Boas-vindas", "Conte um pouco sobre você para personalizar sua experiência."),
  component: Onboarding,
});

const LEVELS = [
  { id: "iniciante", label: "Iniciante", desc: "Estou começando agora" },
  { id: "intermediario", label: "Intermediário", desc: "Já vendi algumas vezes" },
  { id: "avancado", label: "Avançado", desc: "Vendo com frequência" },
] as const;

function Onboarding() {
  const nav = useNavigate();
  const { data: s } = useSettings();
  const m = useMutations();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [nick, setNick] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const total = 6; // nome, apelido, idade, objetivo, nível, final
  const canNext =
    step === 0 ? name.trim().length >= 2 :
    step === 1 ? true :
    step === 2 ? !age || (+age >= 10 && +age <= 100) :
    step === 3 ? goal.trim().length >= 3 :
    step === 4 ? !!level :
    true;

  async function finish() {
    setSaving(true);
    await m.updateSettings({
      display_name: name.trim(),
      nickname: nick.trim() || null,
      age: age ? +age : null,
      goal: goal.trim(),
      level,
      onboarded: true,
    });
    nav({ to: "/inicio" });
  }

  const inputCls = "h-12 text-base";

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center">
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Passo {Math.min(step + 1, total)} de {total}</span>
        </div>
        <Progress value={((step + 1) / total) * 100} />
      </div>

      <div key={step} className="glass animate-in fade-in slide-in-from-bottom-2 p-6 duration-200 md:p-8">
        {step === 0 && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Como você se chama?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Seu nome completo ou como prefere.</p>
            <Input autoFocus className={cn(inputCls, "mt-5")} value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" onKeyDown={(e) => e.key === "Enter" && canNext && setStep(1)} />
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Tem um apelido?</h1>
            <p className="mt-1 text-sm text-muted-foreground">É como vamos te chamar no dia a dia. Opcional.</p>
            <Input autoFocus className={cn(inputCls, "mt-5")} value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Apelido" onKeyDown={(e) => e.key === "Enter" && setStep(2)} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Qual sua idade?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Opcional — ajuda a ajustar as dicas.</p>
            <Input autoFocus type="number" inputMode="numeric" min={10} max={100} className={cn(inputCls, "mt-5")} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ex.: 25" onKeyDown={(e) => e.key === "Enter" && canNext && setStep(3)} />
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Qual é o seu objetivo?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ex.: renda extra, viver de vendas, quitar dívidas…</p>
            <Input autoFocus className={cn(inputCls, "mt-5")} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Meu objetivo" onKeyDown={(e) => e.key === "Enter" && canNext && setStep(4)} />
          </>
        )}
        {step === 4 && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Como você se considera?</h1>
            <div className="mt-5 grid gap-2">
              {LEVELS.map((l) => (
                <button key={l.id} onClick={() => { setLevel(l.id); setTimeout(() => setStep(5), 150); }}
                  className={cn("rounded-xl border border-border bg-card p-4 text-left transition-all active:scale-[0.98]",
                    level === l.id && "border-primary bg-primary/5 ring-1 ring-primary")}>
                  <div className="font-semibold">{l.label}</div>
                  <div className="text-sm text-muted-foreground">{l.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 5 && (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"><PartyPopper className="size-7" /></span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">E aí{nick.trim() || name.trim() ? `, ${(nick.trim() || name.trim()).split(" ")[0]}` : ""}! Pronto para começar?</h1>
            <div className="mt-5 space-y-3 text-left">
              <div className="flex gap-3 rounded-xl bg-accent/60 p-4">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm">Você vai entender <strong>como vender sem anúncio pago</strong>, com o conteúdo passo a passo dentro do app.</p>
              </div>
              <div className="flex gap-3 rounded-xl bg-accent/60 p-4">
                <Wrench className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm">E ter <strong>ferramentas de apoio</strong> para te auxiliar: calculadora de lucro, tabelas rápidas, meta do mês e fechamento.</p>
              </div>
            </div>
            <Button variant="hero" size="lg" className="mt-6 w-full" onClick={finish} disabled={saving}>
              {saving ? "Preparando…" : "Começar agora"}<ArrowRight />
            </Button>
          </div>
        )}

        {step < 5 && (
          <div className="mt-6 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft />Voltar</Button>
            ) : <span />}
            <Button variant="hero" onClick={() => setStep(step + 1)} disabled={!canNext}>Continuar<ArrowRight /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
