import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { initSync, setSyncUser } from "@/lib/sync";
import { RECOVERY_STORAGE_KEY } from "@/lib/email-auth";
import { ModuleBanner } from "@/components/app/ModuleBanner";
import { shouldClearIdentityCache } from "@/lib/auth-identity";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">A página que você procura não existe ou foi movida.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo deu errado. Tente novamente ou volte ao início.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Tentar de novo
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "application-name", content: "Basefy Seller" },
      { name: "apple-mobile-web-app-title", content: "Basefy Seller" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "theme-color", content: "#15111d" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/assets/basefy-seller-icon-64.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/assets/basefy-seller-apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const publicPage = ["/", "/auth", "/reset-password"].includes(pathname);

  useEffect(() => {
    const stopSync = initSync({
      onFlushed: (tables) => tables.forEach((t) => {
        queryClient.invalidateQueries({ queryKey: [t === "monthly_goals" ? "goals" : t] });
        if (t === "settings") queryClient.invalidateQueries({ queryKey: ["navigation-profile"] });
      }),
      onConflict: (table) => {
        toast.warning("Este registro foi alterado em outro aparelho", {
          description: "Carregamos a versão mais recente da nuvem. Revise e edite de novo se precisar.",
        });
        queryClient.invalidateQueries({ queryKey: [table === "monthly_goals" ? "goals" : table] });
      },
    });
    let previousUserId: string | null | undefined;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user.id ?? null;
      if (previousUserId !== userId) {
        // INITIAL_SESSION must not cancel the guard's first in-flight validation.
        if (shouldClearIdentityCache(previousUserId, userId)) queryClient.clear();
        previousUserId = userId;
        setSyncUser(userId);
      }
      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem(RECOVERY_STORAGE_KEY, String(Date.now()));
        return;
      }
      if (event === "SIGNED_OUT") sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (event === "SIGNED_OUT") queryClient.clear();
      else queryClient.invalidateQueries();
      router.invalidate();
    });
    // Atualiza ao voltar para a aba (alterações feitas em outro aparelho).
    const onFocus = () => queryClient.invalidateQueries();
    window.addEventListener("focus", onFocus);
    return () => { stopSync(); data.subscription.unsubscribe(); window.removeEventListener("focus", onFocus); };
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {publicPage && <ModuleBanner />}
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
