import { createClient } from '@supabase/supabase-js'


const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string


export const supa = createClient(url, anon, {
auth: { persistSession: true, autoRefreshToken: true },
})

// Expose in browser for quick RPC poking in DevTools
// @ts-ignore
if (typeof window !== 'undefined') (window as any).supa = supa