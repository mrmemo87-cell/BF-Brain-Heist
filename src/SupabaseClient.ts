// src/SupabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supa = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    multiTab: false, // avoids weird tab-switch auth events
  },
});

declare global {
  interface Window {
    supabase?: typeof supa;
    __bh_auth_lifecycle?: boolean;
  }
}

/** One-time wiring: auth listeners, presence heartbeat, tab-resume. */
export function installAuthLifecycle() {
  if (window.__bh_auth_lifecycle) return;
  window.__bh_auth_lifecycle = true;

  // handy for console debugging
  window.supabase = supa;

  // Avoid deadlocks: wrap any Supabase calls inside onAuthStateChange with setTimeout
  supa.auth.onAuthStateChange((_evt, _session) => {
    setTimeout(async () => {
      try { await supa.rpc("touch_presence"); } catch {}
    }, 0);
  });

  // Keep “online” when tab returns to foreground
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    setTimeout(async () => {
      try { await supa.rpc("session_start"); } catch {}
      try { await supa.rpc("touch_presence"); } catch {}
    }, 0);
  });

  // Gentle heartbeat (60s)
  setInterval(async () => {
    try { await supa.rpc("touch_presence"); } catch {}
  }, 60_000);
}

/** Ensure a row exists in public.profiles for the logged-in user. */
export async function ensureProfile(opts?: {
  batch?: "8A" | "8B" | "8C" | null;
  username?: string | null;
  avatar_url?: string | null;
}) {
  const {
    data: { user },
    error: userErr,
  } = await supa.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("Not signed in");

  // already there?
  const { data: existing, error: selErr } = await supa
    .from("profiles")
    .select("id, username, batch")
    .eq("id", user.id)
    .maybeSingle();
  if (selErr && selErr.code !== "PGRST116") throw selErr;
  if (existing) return existing;

  const username =
    opts?.username ??
    (user.user_metadata as any)?.username ??
    (user.email ? user.email.split("@")[0] : "agent");

  const avatar_url =
    opts?.avatar_url ?? (user.user_metadata as any)?.avatar_url ?? null;

  const batch =
    opts?.batch ??
    (user.user_metadata as any)?.batch ??
    (localStorage.getItem("bh.signupBatch") as "8A" | "8B" | "8C" | null) ??
    null;

  // Try your available bootstrap RPCs, tolerate unique-violation
  let r = await supa.rpc("profile_bootstrap", {
    p_username: username,
    p_avatar_url: avatar_url,
    p_batch: batch,
  });
  if (r.error) {
    r = await supa.rpc("profile_bootstrap_with_uid", {
      p_uid: user.id,
      p_username: username,
      p_avatar_url: avatar_url,
      p_batch: batch,
    });
  }
  if (r.error) {
    r = await supa.rpc("profile_bootstrap_simple", {
      p_username: username,
      p_avatar_url: avatar_url,
      p_batch: batch,
    });
  }
  if (r.error && r.error.code !== "23505") throw r.error;

  const { data: prof, error: finalErr } = await supa
    .from("profiles")
    .select("id, username, batch")
    .eq("id", user.id)
    .maybeSingle();
  if (finalErr) throw finalErr;

  try { localStorage.removeItem("bh.signupBatch"); } catch {}
  return prof ?? { id: user.id, username, batch };
}
