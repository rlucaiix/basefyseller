import { createFileRoute, redirect, Outlet, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, LogOut, Home, Package, Calculator, Table2, Receipt, Target, ClipboardCheck, Settings, MoreHorizontal, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SaveIndicator } from "@/components/app/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useGoals, useProducts, useSales, useSettings } from "@/lib/data";
import { cn } from "@/lib/utils";
import { navigationUser, navigationProfile } from "@/lib/navigation-cache";
import { ModuleBanner } from "@/components/app/ModuleBanner";
import { Button } from "@/components/ui/button";

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
      <img src="/assets/basefy-seller-logo.png" alt="" width={180} height={180} className="size-8 object-contain" />
      <span className="md:hidden lg:inline">Basefy <span className="text-primary">Seller</span></span>
    </Link>
  );
}

// Keep background query subscriptions out of the navigation and moving banner.
function DataWarmup() {
  useProducts();
  useSales();
  useGoals();
  useSettings();
  return null;
}

function AppLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [more, setMore] = useState(false);
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.rpc("is_key_admin").then(({ data }) => { if (active) setAdmin(data === true); });
    return () => { active = false; };
  }, [user.id]);
  const isPending = useRouterState({ select: s => s.status === "pending" });
  useEffect(() => {
    let cancelled = false;
    const warmRoutes = async () => {
      for (const n of NAV) {
        if (cancelled) return;
        await router.preloadRoute({ to: n.to }).catch(() => {});
      }
    };
    // Let the current screen paint before downloading other screens.
    if (typeof window.requestIdleCallback === "function") {
      const idle = window.requestIdleCallback(() => { void warmRoutes(); }, { timeout: 1500 });
      return () => { cancelled = true; window.cancelIdleCallback(idle); };
    }
    const timer = window.setTimeout(() => { void warmRoutes(); }, 200);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [router]);
  const mobileMain = NAV.slice(0, 4);
  return (
    <div className="min-h-screen md:flex">
      <DataWarmup />
      <aside className="frosted-chrome sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col gap-1 border-r border-sidebar-border p-3 lg:w-60 lg:p-4 md:flex">
        <div className="mb-6 px-1 lg:px-2"><Brand /></div>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} title={n.label} className={cn("flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm lg:justify-start text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground", (path === n.to || path.startsWith(n.to + "/")) && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground")}>
            <n.icon className="size-5 lg:size-4" /><span className="hidden lg:inline">{n.label}</span>
          </Link>
        ))}
        {admin && <Link to="/chaves" title="Chaves de acesso" className="flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent lg:justify-start"><KeyRound className="size-5 lg:size-4" /><span className="hidden lg:inline">Chaves de acesso</span></Link>}
        <div className="mt-auto space-y-3 px-1 lg:px-2">
          <div className="hidden lg:block"><SaveIndicator /></div>
          <div className="flex items-center gap-2">
            {user.user_metadata?.['avatar_url']
              ? <img src={user.user_metadata['avatar_url']} alt="" className="size-8 shrink-0 rounded-full" referrerPolicy="no-referrer" />
              : <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs">{(user.email ?? "?")[0]?.toUpperCase()}</span>}
            <div className="hidden min-w-0 flex-1 lg:block">
              <div className="truncate text-sm">{user.user_metadata?.['full_name'] ?? user.email}</div>
              <Button variant="link" size="sm" onClick={() => supabase.auth.signOut()} className="h-auto gap-1 p-0 text-xs text-muted-foreground"><LogOut className="size-3" />Sair</Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="frosted-chrome sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
          <Brand />
          <div className="flex items-center gap-2"><SaveIndicator /><Button variant="ghost" size="icon" title="Sair da conta" aria-label="Sair da conta" onClick={() => supabase.auth.signOut()}><LogOut /></Button></div>
        </header>
        <ModuleBanner signed />
        <main aria-busy={isPending} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Menu principal" className="frosted-chrome fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border shadow-[var(--shadow-card)] pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileMain.map((n) => (
          <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground", (path === n.to || path.startsWith(n.to + "/")) && "font-semibold text-primary")}>
            <n.icon className="size-5" />{n.label}
          </Link>
        ))}
        <Button variant="ghost" onClick={() => setMore(true)} className="h-auto flex-col gap-1 rounded-none py-2.5 text-[11px] font-normal text-muted-foreground">
          <MoreHorizontal className="size-5" />Mais
        </Button>
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
            {admin && <Link to="/chaves" onClick={() => setMore(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-accent"><KeyRound className="size-5 text-primary" />Chaves de acesso</Link>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
