import { createFileRoute, Link, Outlet, useMatch } from "@tanstack/react-router";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { appHead } from "@/lib/head";
import { CHAPTERS } from "@/lib/content";
import { useSettings } from "@/lib/data";
import { PageHeader } from "@/components/app/ui";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/conteudo")({
  head: appHead("Conteúdo", "Guia Como vender na Basefy: capítulos para ler dentro do app."),
  component: ContentLayout,
});

function ContentLayout() {
  const child = useMatch({ from: "/_authenticated/conteudo/$slug", shouldThrow: false });
  if (child) return <Outlet />;
  return <ContentList />;
}

const SECTION_ORDER = ["Começando", "Vendendo", "Crescendo", "Revisão"];

function ContentList() {
  const { data: s } = useSettings();
  const read = new Set(s?.read_chapters ?? []);
  const done = CHAPTERS.filter((c) => read.has(c.slug)).length;
  const sections = SECTION_ORDER.map((name) => ({ name, chapters: CHAPTERS.filter((c) => c.section === name) })).filter((sec) => sec.chapters.length > 0);
  return (
    <>
      <PageHeader title="Conteúdo" subtitle="Guia “Como vender na Basefy”. Leia aqui mesmo, no seu ritmo." />
      <div className="glass mb-5 p-4">
        <div className="mb-2 flex justify-between text-sm"><span>Seu progresso</span><span className="tabular text-muted-foreground">{done} de {CHAPTERS.length} lidos</span></div>
        <Progress value={(done / CHAPTERS.length) * 100} />
      </div>
      {sections.map((sec) => (
        <section key={sec.name} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{sec.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sec.chapters.map((c) => (
              <Link key={c.slug} to="/conteudo/$slug" params={{ slug: c.slug }}
                className="glass group overflow-hidden transition-colors hover:border-primary/50">
                <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                  <img src={c.pages[0]} alt="" width={911} height={1288} loading="lazy" decoding="async" className="w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                  {read.has(c.slug) && <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-success backdrop-blur"><CheckCircle2 className="size-3.5" />Lido</span>}
                </div>
                <div className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">{c.kicker}</div>
                  <h3 className="mt-1 font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><BookOpen className="size-3.5" />{c.pages.length} páginas</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
