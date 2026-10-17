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
- Module covers use CDN asset pointers and a shared responsive banner so uploaded media stays outside the source repository.
