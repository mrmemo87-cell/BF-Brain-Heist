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
let _interval: any = null;
let _focusHandler: (() => void) | null = null;
let _onlineHandler: (() => void) | null = null;
let _visHandler: (() => void) | null = null;
let _authUnsub: { subscription?: { unsubscribe: () => void } } | null = null;

export function installAuthLifecycle(qc?: QueryClient) {
  if (_installed) return; // idempotent (StrictMode-safe)
  _installed = true;

  const refresh = () =>
    supa.auth.refreshSession().finally(() => qc?.invalidateQueries());

  // kick once on mount
  supa.auth.getSession().finally(() => qc?.invalidateQueries());

  // refresh every 9 min
  _interval = setInterval(refresh, 9 * 60 * 1000);

  // more aggressive on focus / coming online / visible again
  _focusHandler = () => refresh();
  _onlineHandler = () => refresh();
  _visHandler = () => {
    if (!document.hidden) refresh();
  };

  window.addEventListener('focus', _focusHandler);
  window.addEventListener('online', _onlineHandler);
  document.addEventListener('visibilitychange', _visHandler);

  // react-query cache bust when auth changes
  _authUnsub = supa.auth.onAuthStateChange(() => qc?.invalidateQueries());
}

// optional: for tests/dev to tear down
export function __cleanupAuthLifecycle() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  if (_focusHandler) {
    window.removeEventListener('focus', _focusHandler);
    _focusHandler = null;
  }
  if (_onlineHandler) {
    window.removeEventListener('online', _onlineHandler);
    _onlineHandler = null;
  }
  if (_visHandler) {
    document.removeEventListener('visibilitychange', _visHandler);
    _visHandler = null;
  }
  _authUnsub?.subscription?.unsubscribe?.();
  _installed = false;
}