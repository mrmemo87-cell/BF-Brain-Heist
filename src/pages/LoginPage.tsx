import * as React from 'react';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supa } from "@/SupabaseClient";
import { useToasts } from "@/store/toastStore";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const nav = useNavigate();
  const { showError, showSuccess } = useToasts();

  const redirectTo = `${window.location.origin}/auth/callback`;

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supa.auth.signInWithPassword({
        email,
        password: pwd,
      });
      if (error) throw error;
      // For password flow we can route straight in
      nav("/");
    } catch (err: any) {
      showError("Login failed", err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loginGoogle() {
    try {
      setLoading(true);
      const { error } = await supa.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }, // absolute redirect
      });
      if (error) throw error;
      // Redirect handled by Supabase > /auth/callback
    } catch (err: any) {
      showError("Google sign-in failed", err?.message || String(err));
      setLoading(false);
    }
  }

  async function forgotPwd() {
    if (!email) return showError("Oops", "Enter your email first");
    try {
      const { error } = await supa.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      showSuccess("Email sent", "Check your inbox to reset your password.");
    } catch (err: any) {
      showError("Reset failed", err?.message || String(err));
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-xl"
      >
        <h1 className="text-2xl font-semibold font-heading mb-1">Welcome back</h1>
        <p className="text-sm opacity-70 mb-6">Log in to continue the heist.</p>

        <form onSubmit={loginPassword} className="space-y-3">
          <div>
            <label className="text-sm opacity-80">Email</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-sm opacity-80">Password</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2 font-medium border border-cyan-400/50 hover:border-cyan-400 transition shadow-[0_0_12px_rgba(59,240,255,.25)]"
          >
            {loading ? "Signing in�" : "Enter the Heist"}
          </button>
        </form>

        {/* divider */}
        <div className="relative my-5 text-center text-xs opacity-60">
          <span className="before:content-[''] before:absolute before:left-0 before:top-1/2 before:h-px before:w-1/3 before:bg-white/20 after:content-[''] after:absolute after:right-0 after:top-1/2 after:h-px after:w-1/3 after:bg-white/20">
            <span className="px-2 bg-transparent">or</span>
          </span>
        </div>

        {/* Google button */}
        <button
          onClick={loginGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 py-2 transition shadow-[0_0_10px_rgba(255,255,255,.08)]"
        >
          {/* Simple Google �G� mark */}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21.35 11.1H12v2.9h5.33a5.5 5.5 0 1 1-2.34-6.02l2.05-2.05A8 8 0 1 0 20 12c0-.3-.02-.6-.05-.9h1.4z" />
          </svg>
          <span className="font-medium">Continue with Google</span>
        </button>

        <button
          onClick={forgotPwd}
          className="mt-4 w-full text-cyan-300 hover:text-cyan-200 text-sm underline underline-offset-4"
        >
          Forgot your password?
        </button>
      </motion.div>
    </div>
  );
}

