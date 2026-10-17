import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import module0 from "@/assets/module-banners/Modulo-00-Por-que-a-Basefy.webp.asset.json";
import module1 from "@/assets/module-banners/Modulo-01-Sua-conta-e-seu-perfil.webp.asset.json";
import module2 from "@/assets/module-banners/Modulo-02-O-produto-certo.webp.asset.json";
import module3 from "@/assets/module-banners/Modulo-03-O-anuncio-que-vende.webp.asset.json";
import module4 from "@/assets/module-banners/Modulo-04-Preco-e-lucro.webp.asset.json";
import module5 from "@/assets/module-banners/Modulo-05-Vender-sem-anuncio-pago.webp.asset.json";
import module6 from "@/assets/module-banners/Modulo-06-Depois-da-venda.webp.asset.json";

const modules = [
  { asset: module0, title: "Por que a Basefy" },
  { asset: module1, title: "Sua conta e seu perfil" },
  { asset: module2, title: "O produto certo" },
  { asset: module3, title: "O anúncio que vende" },
  { asset: module4, title: "Preço e lucro" },
  { asset: module5, title: "Vender sem anúncio pago" },
  { asset: module6, title: "Depois da venda" },
];

export function ModuleBanner({ signed = false }: { signed?: boolean }) {
  return <section aria-label="Módulos Basefy" className="border-b border-border bg-secondary/60">
    <div className="frosted-chrome flex items-center justify-between gap-3 px-4 py-3 md:px-8">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 shrink-0 text-primary" /><span>Aprenda com a Basefy</span></div>
      <Button asChild size="sm" variant="hero" className="shrink-0"><Link to={signed ? "/conteudo" : "/auth"}>Conteúdo<ArrowUpRight className="size-4" /></Link></Button>
    </div>
    <div className="module-banner overflow-hidden py-3"><div className="module-banner-track flex w-max">
      {[0, 1].map(copy => <div key={copy} className="module-banner-group flex shrink-0 gap-3 pr-3" aria-hidden={copy === 1 ? true : undefined}>
        {modules.map(({ asset, title }, index) => <Link key={title} to={signed ? "/conteudo" : "/auth"} tabIndex={copy === 1 ? -1 : 0} className="block shrink-0 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={title}>
          <img src={asset.url} alt={copy === 0 ? title : ""} width={1080} height={1620} loading="eager" decoding="async" fetchPriority={copy === 0 && index === 0 ? "high" : "low"} className="h-44 w-auto object-contain sm:h-52" />
        </Link>)}
      </div>)}
    </div></div>
  </section>;
}