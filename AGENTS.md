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
- Updates and deletions both guard the observed row version, and debounced edits flush on page exit through `src/lib/use-debounced.ts`; product forms enqueue only dirty edits and clear dirty state before deletion — avoids stale-device deletions, lost final edits, and false writes after deleting a product.
- Sales store a snapshot (price, rate, cost, commission, profit) at creation; product/rate changes never rewrite history.
- Private pages live under `src/routes/_authenticated/` (client-only gate); data is read with the browser client under per-user RLS.
- Email authentication operations and redirect paths live in `src/lib/email-auth.ts`; public auth pages reuse them to keep multi-domain confirmation and recovery consistent without editing generated clients.
- Navigation caches only Auth-server-validated identities and per-user onboarding checks briefly in React Query; identity changes clear/invalidate that cache, and database RLS remains authoritative.
- Static visual assets and guide PDFs are tracked byte-for-byte in `public/assets` and referenced by local paths; the asset integrity preflight prevents missing files in independent deployments. Historical CDN pointers are provenance only, never runtime dependencies.
- Browser favicon, Apple touch icon and web manifest icons derive from the uploaded page logo and are served locally; keep the original logo bytes and include derivatives in the asset integrity inventory.
- Shared surface and navigation effects use semantic CSS utilities; keep blur static and animate only the banner transform to preserve click responsiveness.
- Keep background data subscriptions isolated from the app navigation, warm unused routes sequentially when idle, and prioritize the reader's first page over offscreen banner images — prevents background work from competing with clicks and visible content.
- Independent deployments use `vite.vercel.config.ts` and Nitro's Vercel preset via `build:vercel`; keep the Lovable preview configuration separate to avoid editor-specific output overrides.
- Deployment preflight and the standalone Vite config share public project fallbacks for missing browser credentials; explicit environment values take precedence and invalid URLs or private keys must stop deployment before bundling. Resolve in Vite too because preflight child-process changes cannot reach the build.
- Offline queues and version maps are scoped to the signed-in user, and identity transitions clear the query cache; this prevents stale data or queued writes from crossing accounts.
- Access-key signup uses short-lived hashed validation tickets and an auth.users BEFORE INSERT trigger to consume a key and grant authorization atomically; failures roll back the account and redemption together. Never grant authorization from editable metadata.
- Key hashes and immutable consumed bindings are retained without auth-user foreign keys; restrictive authorization policies supplement existing owner RLS. Admin privileges come only from protected user_roles, checked inside every admin RPC.
- Auth account deletion cleans authorization and role rows through an app-owned lifecycle trigger, never the immutable consumed keys — prevents orphaned access permissions without allowing key reuse.
- Signup diagnoses hidden database failures only; preserve original provider errors when the diagnostic request fails — avoids masking email limits or connection problems as key errors.
- Key login requires the submitted current email and a provider-issued email confirmation with shouldCreateUser:false; keys never issue sessions or reset passwords. Persistent database rate buckets protect public key validation, independent of frontend controls.
