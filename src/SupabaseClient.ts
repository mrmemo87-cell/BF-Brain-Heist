// src/SupabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { focusManager, type QueryClient } from '@tanstack/react-query';

export const supa = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      multiTab: false,
    },
  }
);

/**
 * 🔧 Thenable patch: PostgREST builders implement `.then` but may not implement `.catch`/`.finally`.
 * Some code (or libs) will do `supa.rpc(...).catch(...)` which throws "catch is not a function".
 * We probe a builder instance and patch its prototype once so every future builder gains `.catch`/`.finally`.
 * This does NOT make any network requests.
 */
try {
  // create a builder without executing it
  // (no await/then => no network; it's just a builder object)
  // @ts-expect-error - we just need a PostgREST builder instance
  const probe = supa.rpc('__bh_proto_probe__');
  const proto = Object.getPrototypeOf(probe);

  if (proto && typeof proto.then === 'function') {
    if (typeof proto.catch !== 'function') {
      Object.defineProperty(proto, 'catch', {
        configurable: true,
        writable: true,
        value: function (onRejected: (reason?: any) => any) {
          return Promise.resolve(this).catch(onRejected);
        },
      });
    }
    if (typeof proto.finally !== 'function') {
      Object.defineProperty(proto, 'finally', {
        configurable: true,
        writable: true,
        value: function (onFinally: () => any) {
          return Promise.resolve(this).finally(onFinally);
        },
      });
    }
  }
} catch {
  // ignore – worst case the patch didn't apply, but app still runs
}

/**
 * Call ONCE from App root; returns a cleanup fn.
 * Example:
 *   const qc = new QueryClient({...});
 *   React.useEffect(() => installAuthLifecycle(qc), [qc]);
 */
export function installAuthLifecycle(qc?: QueryClient) {
  // keep tokens fresh in the background (best-effort)
  (supa.auth as any).startAutoRefresh?.();

  const refresh = async () => {
    try {
      await supa.auth.refreshSession();
    } catch {
      // swallow refresh blips
    }
  };

  const requery = () => qc?.invalidateQueries();

  // ⚠️ Non-blocking auth callback (NO Supabase calls directly inside)
  const { data: { subscription } } = supa.auth.onAuthStateChange((event) => {
    // Defer to next tick to avoid browser deadlocks on tab focus
    setTimeout(() => {
      if (event === 'SIGNED_OUT') {
        qc?.clear();
        if (location.pathname !== '/login') {
          // soft redirect without blocking the event loop
          location.href = '/login';
        }
        return;
      }
      // Any other auth event -> let React Query refire
      requery();
    }, 0);
  });

  // Focus/visibility resume: refresh token + tell React Query we’re focused
  const onFocus = async () => {
    if (document.hidden) return;
    await refresh();                  // run outside the auth callback
    focusManager.setFocused(true);    // enables refetchOnWindowFocus behavior
    requery();
  };

  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onFocus);
  window.addEventListener('online', onFocus);

  // Safety refresh every 8 minutes (keeps session warm)
  const id = window.setInterval(() => { void refresh(); }, 8 * 60 * 1000);

  return () => {
    subscription.unsubscribe();
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onFocus);
    window.removeEventListener('online', onFocus);
    clearInterval(id);
  };
}

/**
 * Optional helper: use this wrapper if you prefer `await rpc('name', args)`
 * everywhere (it throws on RPC error and returns data on success).
 */
export async function rpc<T = unknown>(fn: string, args?: Record<string, any>): Promise<T> {
  const { data, error } = await supa.rpc<T>(fn, args as any);
  if (error) throw error;
  return data as T;
}
