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

// opt-in exposure for console debugging (works in prod when you pass ?debug=1 or set a flag)
const shouldExpose =
  typeof window !== 'undefined' &&
  (import.meta.env.DEV ||
   new URLSearchParams(window.location.search).has('debug') ||
   localStorage.getItem('EXPOSE_SUPA') === '1');

if (shouldExpose) {
  (window as any).supabase = supa;
}

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
  // Start lib-managed refresh if present (v2)
  (supa.auth as any).startAutoRefresh?.();

  const refresh = () => supa.auth.refreshSession().catch(() => {});
  supa.auth.getSession().then(() => qc?.invalidateQueries());

  const sub = supa.auth.onAuthStateChange((event) => {
    if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'SIGNED_IN') {
      qc?.invalidateQueries();
    }
    if (event === 'SIGNED_OUT') {
      qc?.clear();
      window.location.assign('/login');
    }
  });

  const vis = () => { if (!document.hidden) refresh(); };
  document.addEventListener('visibilitychange', vis);
  const id = window.setInterval(refresh, 8 * 60 * 1000);

  return () => {
    sub.data?.subscription.unsubscribe();
    document.removeEventListener('visibilitychange', vis);
    clearInterval(id);
  };
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