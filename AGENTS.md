<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Basefy Seller
- All financial formulas live in `src/lib/pricing.ts` (tested in `pricing.test.ts`); never recompute fees/profit inline — keeps calculator, sales and dashboards consistent.
- Writes go through the queue in `src/lib/sync.ts` (`useMutations` in `src/lib/data.ts`): optimistic cache update + localStorage fallback + version check for conflicts; the cloud DB stays the source of truth.
- Sales store a snapshot (price, rate, cost, commission, profit) at creation; product/rate changes never rewrite history.
- Private pages live under `src/routes/_authenticated/` (client-only gate); data is read with the browser client under per-user RLS.
- Email authentication operations and redirect paths live in `src/lib/email-auth.ts`; public auth pages reuse them to keep multi-domain confirmation and recovery consistent without editing generated clients.
- Navigation caches only Auth-server-validated identities and per-user onboarding checks briefly in React Query; identity changes clear/invalidate that cache, and database RLS remains authoritative.
- Static visual assets and guide PDFs are tracked byte-for-byte in `public/assets` and referenced by local paths; the asset integrity preflight prevents missing files in independent deployments. Historical CDN pointers are provenance only, never runtime dependencies.
- Shared surface and navigation effects use semantic CSS utilities; keep blur static and animate only the banner transform to preserve click responsiveness.
- Independent deployments use `vite.vercel.config.ts` and Nitro's Vercel preset via `build:vercel`; keep the Lovable preview configuration separate to avoid editor-specific output overrides.
- Deployment preflight and the standalone Vite config share public project fallbacks for missing browser credentials; explicit environment values take precedence and invalid URLs or private keys must stop deployment before bundling. Resolve in Vite too because preflight child-process changes cannot reach the build.
- Offline queues and version maps are scoped to the signed-in user, and identity transitions clear the query cache; this prevents stale data or queued writes from crossing accounts.
