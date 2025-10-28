// src/SupabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';

export const supa: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Dev-only: expose for console debugging (window.supabase)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).supabase = supa;
}

let _installed = false;
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _visHandler: (() => void) | null = null;
let _authUnsub: { subscription?: { unsubscribe: () => void } } | null = null;

export function installAuthLifecycle(qc?: QueryClient) {
  if (_installed) return;           // idempotent (StrictMode-safe)
  _installed = true;

  const tick = () => supa.auth.refreshSession().catch(() => {});
  supa.auth.getSession().then(() => qc?.invalidateQueries());
  _authUnsub = supa.auth.onAuthStateChange(() => qc?.invalidateQueries());

  _intervalId = setInterval(tick, 9 * 60 * 1000);
  _visHandler = () => { if (!document.hidden) tick(); };
  document.addEventListener('visibilitychange', _visHandler);
}

// optional: for tests/dev to tear down
export function __cleanupAuthLifecycle() {
  if (_intervalId) clearInterval(_intervalId);
  if (_visHandler) document.removeEventListener('visibilitychange', _visHandler);
  _authUnsub?.subscription?.unsubscribe?.();
  _installed = false;
}

