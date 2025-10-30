// src/SupabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL!
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supa = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    multiTab: false,              // <- stops weird tab-switch deadlocks
  },
})

/** optional: invalidate queries on auth change (non-blocking) */
export function installAuthLifecycle(qc?: { invalidateQueries: Function }) {
  const { data: sub } = supa.auth.onAuthStateChange(() => {
    setTimeout(() => qc?.invalidateQueries?.(), 0) // never block the callback
  })
  return () => sub?.subscription.unsubscribe()
}
