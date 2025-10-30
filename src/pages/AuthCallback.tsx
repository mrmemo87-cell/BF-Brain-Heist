import React, { useEffect, useState } from "react";
import { supa, ensureProfile } from "@/SupabaseClient";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Finishing sign-in…");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Make sure Supabase consumes the URL (PKCE)
        // detectSessionInUrl=true handles most cases, but we can still sanity-check:
        const { data: sess } = await supa.auth.getSession();
        if (!sess.session) {
          setMsg("Validating session…");
          // give the SDK one microtask to finalize
          await new Promise((r) => setTimeout(r, 0));
        }

        // Ensure a profile row exists (and pass the batch hint if we saved one)
        const batchHint =
          (localStorage.getItem("bh.signupBatch") as "8A" | "8B" | "8C" | null) ??
          null;

        setMsg("Setting up your profile…");
        await ensureProfile({ batch: batchHint });

        setMsg("All set. Redirecting…");
        if (!alive) return;
        nav("/leaderboard", { replace: true });
      } catch (e: any) {
        console.error("Auth callback failed:", e);
        setMsg(e?.message || "Sign-in failed. Try again.");
        setTimeout(() => nav("/login", { replace: true }), 1000);
      }
    })();
    return () => {
      alive = false;
    };
  }, [nav]);

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 w-[min(92vw,420px)] text-center">
        <div className="text-lg font-semibold mb-2">Brain Heist</div>
        <div className="opacity-80">{msg}</div>
      </div>
    </div>
  );
}
