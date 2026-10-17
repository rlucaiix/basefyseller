import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const modules = [
  { src: "/assets/Modulo-00-Por-que-a-Basefy.webp", title: "Por que a Basefy" },
  { src: "/assets/Modulo-01-Sua-conta-e-seu-perfil.webp", title: "Sua conta e seu perfil" },
  { src: "/assets/Modulo-02-O-produto-certo.webp", title: "O produto certo" },
  { src: "/assets/Modulo-03-O-anuncio-que-vende.webp", title: "O anúncio que vende" },
  { src: "/assets/Modulo-04-Preco-e-lucro.webp", title: "Preço e lucro" },
  { src: "/assets/Modulo-05-Vender-sem-anuncio-pago.webp", title: "Vender sem anúncio pago" },
  { src: "/assets/Modulo-06-Depois-da-venda.webp", title: "Depois da venda" },
];

export function ModuleBanner({ signed = false }: { signed?: boolean }) {
  return <section aria-label="Módulos Basefy" className="border-b border-border bg-secondary/60">
    <div className="frosted-chrome flex items-center justify-between gap-3 px-4 py-3 md:px-8">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 shrink-0 text-primary" /><span>Aprenda com a Basefy</span></div>
      {signed && <Button asChild size="sm" variant="hero" className="shrink-0"><Link to="/conteudo">Conteúdo<ArrowUpRight className="size-4" /></Link></Button>}
    </div>
    <div className="module-banner overflow-hidden py-3"><div className="module-banner-track flex w-max">
      {[0, 1].map(copy => <div key={copy} className="module-banner-group flex shrink-0 gap-3 pr-3" aria-hidden={copy === 1 ? true : undefined}>
        {modules.map(({ src, title }, index) => <Link key={title} to={signed ? "/conteudo" : "/auth"} tabIndex={copy === 1 ? -1 : 0} className="block shrink-0 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={title}>
          <img src={src} alt={copy === 0 ? title : ""} width={1080} height={1620} loading="eager" decoding="async" fetchPriority={copy === 0 && index === 0 ? "high" : "low"} className={signed ? "h-24 w-auto object-contain sm:h-32 lg:h-36" : "h-44 w-auto object-contain sm:h-52"} />
        </Link>)}
      </div>)}
    </div></div>
  </section>;
}