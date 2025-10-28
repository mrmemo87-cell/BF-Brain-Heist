# BF-Brain-Heist Agent Guide

1. **Frontend Stack**: Vite + React 19 + TypeScript with Tailwind. Entry at `index.tsx`; shell routing in `App.tsx` using React Router 7.
2. **State & Data**: TanStack Query 5 for server state, local UI state with hooks; lightweight Zustand stores live in `store/`.
3. **Supabase Access**: Use the singleton `supa` client indirectly via the Data API layer in `services/data/`. Never call `supa` from UI components.
4. **Data API Contract**: `services/data/DataAPI.ts` defines the interface; `services/data/supa/SupaAPI.ts` implements RPC calls (all `supa.rpc`). Add new RPCs here and wire them through `services/data/index.ts` and the `useDataAPI` hook.
5. **Panel Pattern**: Feature panels in `components/` (e.g., `ClansPanel.tsx`, `QuestsPanel.tsx`) import `useDataAPI`, set up `useQuery`/`useMutation`, render loading/error/empty states, and invalidate the relevant queries (`['whoAmI']`, `['clanInfo']`, etc.) on success.
6. **One Default Export**: Each file exposes a single `export default`. Avoid duplicate helper names already used elsewhere (e.g., `upgrade`, `logout`).
7. **Tailwind Scope**: Tailwind scans `index.html`, `src/**/*`, and `components/**/*`. Keep utility-first styling; no custom PostCSS plugins beyond Tailwind.
8. **Routing**: Tabs use `TabLink` in `App.tsx`. New tabs/routes must be registered there and in `components/chrome` navs.
9. **Supabase Auth**: Auth flows expect OTP redirect configuration (`signInWithOtp({ options: { emailRedirectTo: window.location.origin } })`). Respect RLS; never write directly to tables from the client.
10. **Mutations**: Wrap writes in `useMutation`, return actionable errors, and invalidate cached queries via `useQueryClient` (`invalidateQueries({ queryKey: [...] })`).
11. **SQL Guidelines**: Postgres functions live server-side (not in repo). When documenting/adding RPCs, ensure `security definer`, explicit `auth.uid()` checks, and non-ambiguous column references (`alias.column`).
12. **Environment**: Vercel deployment uses `npm run build`. Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BACKEND` (currently `supabase`). Node 18-22 only.
13. **Error Handling**: UI components should guard against loading failures (`return <div className="text-red-400 text-sm">Failed to load.</div>`). Never let a rejected promise crash a panel.
14. **Testing**: No formal test suite yet; manual verification via `npm run dev`. Ensure type-check (`tsc --noEmit`) passes before committing.
15. **Definition of Done**: Type-safe, no console errors, queries invalidate, builds pass, and UI states are stable.。

Please flag unclear conventions or missing data flows so the guide can be updated.
