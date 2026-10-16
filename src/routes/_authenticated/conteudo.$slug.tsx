import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Download, ZoomIn, ZoomOut } from "lucide-react";
import { CHAPTERS } from "@/lib/content";
import { useSettings, useMutations } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/conteudo/$slug")({
  loader: ({ params }) => {
    const i = CHAPTERS.findIndex((c) => c.slug === params.slug);
    if (i < 0) throw notFound();
    return { index: i };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? CHAPTERS[loaderData.index] : undefined;
    const title = c ? `${c.title} · Conteúdo · Basefy Seller` : "Conteúdo · Basefy Seller";
    return { meta: [
      { title }, { name: "description", content: c?.description ?? "Capítulo do guia" },
      { property: "og:title", content: title }, { property: "og:description", content: c?.description ?? "Capítulo do guia" },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
    ] };
  },
  notFoundComponent: () => <p className="text-muted-foreground">Capítulo não encontrado. <Link to="/conteudo" className="text-primary">Voltar</Link></p>,
  component: Reader,
});

function Reader() {
  const { index } = Route.useLoaderData();
  const c = CHAPTERS[index]!;
  const prev = CHAPTERS[index - 1];
  const next = CHAPTERS[index + 1];
  const { data: s } = useSettings();
  const m = useMutations();
  const [wide, setWide] = useState(false);
  const read = (s?.read_chapters ?? []).includes(c.slug);

  function toggleRead(v = !read) {
    const cur = new Set(s?.read_chapters ?? []);
    if (v) cur.add(c.slug); else cur.delete(c.slug);
    void m.updateSettings({ read_chapters: [...cur] });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-14 z-10 -mx-4 mb-4 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-2 backdrop-blur-xl md:top-0 md:mx-0 md:rounded-xl md:border">
        <Button asChild variant="ghost" size="sm"><Link to="/conteudo"><ArrowLeft />Capítulos</Link></Button>
        <div className="min-w-0 flex-1 truncate text-sm font-medium">{c.kicker} · {c.title}</div>
        <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label={wide ? "Diminuir" : "Ampliar"} onClick={() => setWide((w) => !w)}>{wide ? <ZoomOut /> : <ZoomIn />}</Button>
        <Button asChild variant="ghost" size="icon" aria-label="Baixar PDF"><a href={c.pdf} download><Download /></a></Button>
      </div>

      <div className={cn("mx-auto space-y-3 transition-all", wide ? "max-w-3xl" : "max-w-2xl")}>
        {c.pages.map((src, i) => (
          <img key={src} src={src} alt={`${c.title} — página ${i + 1} de ${c.pages.length}`} loading={i < 2 ? "eager" : "lazy"}
            className="w-full rounded-xl border border-border bg-secondary shadow-lg" />
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-2xl space-y-3">
        <Button variant={read ? "secondary" : "hero"} size="lg" className="w-full" onClick={() => toggleRead()}>
          {read ? <><CheckCircle2 />Capítulo lido</> : <><Circle />Marcar como lido</>}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {prev ? <Button asChild variant="outline" className="h-auto justify-start py-3"><Link to="/conteudo/$slug" params={{ slug: prev.slug }}><ArrowLeft /><span className="truncate text-left"><span className="block text-[11px] text-muted-foreground">Anterior</span>{prev.title}</span></Link></Button> : <span />}
          {next && <Button asChild variant="outline" className="h-auto justify-end py-3"><Link to="/conteudo/$slug" params={{ slug: next.slug }} onClick={() => !read && toggleRead(true)}><span className="truncate text-right"><span className="block text-[11px] text-muted-foreground">Próximo</span>{next.title}</span><ArrowRight /></Link></Button>}
        </div>
      </div>
    </div>
  );
}
