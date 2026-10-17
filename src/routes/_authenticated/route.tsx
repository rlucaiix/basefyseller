import { createFileRoute, redirect, Outlet, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, LogOut, Home, Package, Calculator, Table2, Receipt, Target, ClipboardCheck, Settings, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SaveIndicator } from "@/components/app/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useGoals, useProducts, useSales, useSettings } from "@/lib/data";
import { cn } from "@/lib/utils";
import { navigationUser, navigationProfile } from "@/lib/navigation-cache";
import { ModuleBanner } from "@/components/app/ModuleBanner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location, context }) => {
    const user = await navigationUser(context.queryClient).catch(() => null);
    if (!user) throw redirect({ to: "/auth" });
    // Cada conta tem uma ficha permanente; quem nunca fez o
    // quiz de boas-vindas é levado a ele antes de qualquer página.
    const st = await navigationProfile(context.queryClient, user.id);
    const done = st?.onboarded === true;
    if (!done && location.pathname !== "/onboarding") throw redirect({ to: "/onboarding" });
    if (done && location.pathname === "/onboarding") throw redirect({ to: "/inicio" });
    return { user };
  },
  component: AppLayout,
});

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/vendas", label: "Vendas", icon: Receipt },
  { to: "/conteudo", label: "Conteúdo", icon: BookOpen },
  { to: "/meta", label: "Meta do mês", icon: Target },
  { to: "/fechamento", label: "Fechamento", icon: ClipboardCheck },
  { to: "/tabelas", label: "Tabelas rápidas", icon: Table2 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function Brand() {
  return (
    <Link to="/inicio" className="flex items-center gap-2 font-extrabold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-primary text-sm text-primary-foreground shadow-glow">B</span>
      <span className="md:hidden lg:inline">Basefy <span className="text-primary">Seller</span></span>
    </Link>
  );
}

function AppLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [more, setMore] = useState(false);
  const isPending = useRouterState({ select: s => s.status === "pending" });
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) NAV.forEach(n => { void router.preloadRoute({ to: n.to }).catch(() => {}); });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [router]);
  const mobileMain = NAV.slice(0, 4);
  // Pré-carrega os dados principais logo no login: cada página abre instantânea.
  useProducts();
  useSales();
  useGoals();
  useSettings();
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar p-3 lg:w-60 lg:p-4 md:flex">
        <div className="mb-6 px-1 lg:px-2"><Brand /></div>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} title={n.label} className={cn("flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm lg:justify-start text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground", (path === n.to || path.startsWith(n.to + "/")) && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground")}>
            <n.icon className="size-5 lg:size-4" /><span className="hidden lg:inline">{n.label}</span>
          </Link>
        ))}
        <div className="mt-auto space-y-3 px-1 lg:px-2">
          <div className="hidden lg:block"><SaveIndicator /></div>
          <div className="flex items-center gap-2">
            {user.user_metadata?.['avatar_url']
              ? <img src={user.user_metadata['avatar_url']} alt="" className="size-8 shrink-0 rounded-full" referrerPolicy="no-referrer" />
              : <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs">{(user.email ?? "?")[0]?.toUpperCase()}</span>}
            <div className="hidden min-w-0 flex-1 lg:block">
              <div className="truncate text-sm">{user.user_metadata?.['full_name'] ?? user.email}</div>
              <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><LogOut className="size-3" />Sair</button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 md:hidden">
          <Brand />
          <SaveIndicator />
        </header>
        <ModuleBanner signed />
        <main aria-busy={isPending} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 shadow-[var(--shadow-card)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {mobileMain.map((n) => (
          <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground", (path === n.to || path.startsWith(n.to + "/")) && "font-semibold text-primary")}>
            <n.icon className="size-5" />{n.label}
          </Link>
        ))}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground">
          <MoreHorizontal className="size-5" />Mais
        </button>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>Mais ferramentas</SheetTitle></SheetHeader>
          <div className="grid gap-1 p-4 pt-0">
            {NAV.slice(4).map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMore(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-accent">
                <n.icon className="size-5 text-primary" />{n.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
