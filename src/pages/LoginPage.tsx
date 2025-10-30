import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supa } from "@/SupabaseClient";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batch, setBatch] = useState<"8A" | "8B" | "8C">("8B");
  const [loading, setLoading] = useState(false);

  async function ensureProfile(username: string, batchSel: string) {
    // Try the bootstrap RPC (ignore if it already exists)
    try {
      await supa.rpc("profile_bootstrap", {
        p_username: username,
        p_batch: batchSel,
        p_avatar_url: null,
      });
    } catch (e: any) {
      // If the function name/signature differs in your DB, no stress—just continue.
      console.debug("profile_bootstrap skipped:", e?.message ?? e);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const emailLower = email.trim().toLowerCase();
      const username = emailLower.split("@")[0];

      // 1) Try SIGN UP first (so new students get in immediately)
      const { data: up, error: upErr } = await supa.auth.signUp({
        email: emailLower,
        password,
        options: {
          data: { batch, username }, // saved to auth user metadata
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (upErr) {
        // If the account already exists, do a normal sign-in
        const already =
          upErr.status === 400 &&
          /already registered|user exists/i.test(upErr.message || "");
        if (!already) throw upErr;

        const { error: inErr } = await supa.auth.signInWithPassword({
          email: emailLower,
          password,
        });
        if (inErr) throw inErr;
      }

      // 2) We’re authenticated at this point. Create/lock the profile on first login.
      await ensureProfile(username, batch);

      // 3) Optional: kick the day’s session economy
      try {
        await supa.rpc("session_start");
      } catch {}

      // 4) Done → go in
      nav("/leaderboard", { replace: true });
    } catch (err: any) {
      alert(err?.message ?? "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    try {
      await supa.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
    } catch (e: any) {
      alert(e?.message ?? "Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(1200px_600px_at_70%_-10%,rgba(168,85,247,.25),transparent)_radial-gradient(900px_500px_at_10%_20%,rgba(34,211,238,.18),transparent)_#0b1220] p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-2xl"
      >
        <h1 className="text-2xl font-bold mb-6">Brain Heist</h1>

        <label className="block text-sm opacity-80 mb-1">Email</label>
        <input
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 mb-4 outline-none focus:border-cyan-400/60"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-sm opacity-80 mb-1">Password</label>
        <input
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 mb-4 outline-none focus:border-cyan-400/60"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <div className="mb-2 text-sm opacity-80">Choose your Batch (for new accounts)</div>
        <div className="flex gap-2 mb-4">
          {(["8A", "8B", "8C"] as const).map((b) => (
            <button
              type="button"
              key={b}
              onClick={() => setBatch(b)}
              className={`px-3 py-1.5 rounded-md border ${
                batch === b
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <p className="text-xs opacity-60 mb-4">
          New users: batch is set on first login and cannot be changed.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 font-medium bg-cyan-500/80 hover:bg-cyan-500 disabled:opacity-60 transition"
        >
          {loading ? "Authenticating..." : "Sign in / Create account"}
        </button>

        <div className="flex items-center gap-3 my-6 opacity-60">
          <div className="h-px flex-1 bg-white/10" />
          <div className="text-xs">or</div>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full rounded-lg py-3 font-medium border border-white/10 hover:border-white/20 bg-white/5 transition"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
