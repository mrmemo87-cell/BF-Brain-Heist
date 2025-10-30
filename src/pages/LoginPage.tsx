import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supa, ensureProfile } from '@/SupabaseClient';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function goDashboard() {
    await ensureProfile();
    // Tiny delay so UI can repaint
    await new Promise(r => setTimeout(r, 60));
    nav('/dashboard', { replace: true });
  }

  async function handleEmailPassword() {
    setBusy(true); setMsg(null);
    try {
      // 1) Try normal sign-in
      let { data, error } = await supa.auth.signInWithPassword({ email, password });
      if (!error && data?.session) return goDashboard();

      // 2) If bad creds → create the account then sign-in
      const bad = error?.message?.toLowerCase() || '';
      const looksNew = bad.includes('invalid') || bad.includes('not allowed') || bad.includes('no user');

      if (looksNew) {
        const signUp = await supa.auth.signUp({
          email,
          password,
          options: {
            // hash/PKCE callback is handled in App.tsx already
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        // If confirmations are disabled, we get a session instantly
        if (signUp.data.session) return goDashboard();

        // If confirmations are ON, at least don’t hang
        setMsg('We created your account. Check your inbox to confirm then sign in.');
        return;
      }

      setMsg(error?.message || 'Could not sign in. Try again.');
    } catch (e: any) {
      setMsg(e?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) setMsg(error.message);
      // Redirect handled by Supabase
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supa.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) setMsg(error.message);
      else setMsg('Magic link sent. Check your inbox 📩');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(80%_120%_at_50%_-20%,#0ea5e9_0%,transparent_60%),radial-gradient(80%_120%_at_90%_20%,#a855f7_0%,#0b1220_60%)]">
      <div className="w-[92vw] max-w-[560px] rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6 text-white">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email & Password */}
          <div>
            <div className="text-sm mb-2 text-white/70">Email & Password</div>
            <input
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 mb-2 outline-none focus:border-white/20"
              placeholder="Email"
              type="email"
              autoComplete="email"
              value={email} onChange={e=>setEmail(e.target.value)}
            />
            <input
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 mb-3 outline-none focus:border-white/20"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              value={password} onChange={e=>setPassword(e.target.value)}
            />
            <button
              onClick={handleEmailPassword}
              disabled={busy || !email || !password}
              className="w-full rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium py-2"
            >
              {busy ? 'Working…' : 'Sign in / Create account'}
            </button>
          </div>

          {/* Magic link */}
          <div>
            <div className="text-sm mb-2 text-white/70">Magic Link</div>
            <input
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 mb-3 outline-none focus:border-white/20"
              placeholder="Email"
              type="email"
              value={email} onChange={e=>setEmail(e.target.value)}
            />
            <button
              onClick={handleMagicLink}
              disabled={busy || !email}
              className="w-full rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-50 py-2"
            >
              {busy ? 'Sending…' : 'Send magic link'}
            </button>

            <div className="my-4 h-px bg-white/10" />
            <button
              onClick={handleGoogle}
              disabled={busy}
              className="w-full rounded-lg bg-white text-black font-medium py-2 hover:bg-white/90 disabled:opacity-50"
            >
              Continue with Google
            </button>
          </div>
        </div>

        {msg && <div className="mt-4 text-sm text-white/80">{msg}</div>}
      </div>
    </div>
  );
}
