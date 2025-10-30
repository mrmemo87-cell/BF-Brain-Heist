// src/pages/LoginPage.tsx
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supa } from '@/SupabaseClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

type Mode = 'password' | 'magic';

export default function LoginPage() {
  const nav = useNavigate();

  // UI state
  const [mode, setMode] = React.useState<Mode>('password');
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  // If already signed in, bounce home
  React.useEffect(() => {
    let alive = true;
    supa.auth
      .getSession()
      .then(({ data }) => {
        if (alive && data.session) nav('/');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // NOTE: do not add `supa` as a dependency (prevents tab-switch deadlocks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  // --- Handlers -------------------------------------------------------------

  async function onSubmitPassword(e: React.FormEvent) {
  e.preventDefault();
  if (loading) return;
  setMsg(null);
  setLoading(true);

  try {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !pwd) {
      setMsg('Email and password are required.');
      return;
    }

    // 1) Try normal login
    const { data: siData, error: siErr } = await supa.auth.signInWithPassword({
      email: emailNorm,
      password: pwd,
    });
    if (!siErr && siData.session) {
      window.location.replace('/'); // you’re in
      return;
    }

    // 2) If creds wrong or user not found → create account
    const { data: suData, error: suErr } = await supa.auth.signUp({
      email: emailNorm,
      password: pwd,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (suErr) throw suErr;

    // With "Confirm email" OFF, Supabase returns a session immediately.
    if (suData.session) {
      window.location.replace('/');
      return;
    }

    // (safety) If no session returned for any reason, force a login now
    const { data: si2, error: si2Err } = await supa.auth.signInWithPassword({
      email: emailNorm,
      password: pwd,
    });
    if (si2Err || !si2.session) throw si2Err || new Error('Could not start session.');
    window.location.replace('/');
  } catch (err: any) {
    setMsg(err?.message || 'Login failed. Try again.');
  } finally {
    setLoading(false);
  }
}


  async function onSubmitMagic(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    setLoading(true);
    try {
      const emailNorm = email.trim().toLowerCase();
      if (!emailNorm) {
        setMsg('Enter your email first.');
        return;
      }
      // Always sends an email (and creates the user if needed)
      const { error } = await supa.auth.signInWithOtp({
        email: emailNorm,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMsg('Magic link sent. Check your inbox ✉️');
    } catch (err: any) {
      setMsg(err?.message || 'Could not send magic link.');
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    if (loading) return;
    setMsg(null);
    setLoading(true);
    try {
      const { error } = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      // Redirect happens automatically
    } catch (err: any) {
      setMsg(err?.message || 'Google sign-in failed.');
      setLoading(false);
    }
  }

  async function onForgot(e: React.MouseEvent) {
    e.preventDefault();
    if (loading) return;
    setMsg(null);
    try {
      const emailNorm = email.trim().toLowerCase();
      if (!emailNorm) {
        setMsg('Enter your email first, then click “Forgot password”.');
        return;
      }
      const { error } = await supa.auth.resetPasswordForEmail(emailNorm, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      setMsg('Password reset link sent. Check your email.');
    } catch (err: any) {
      setMsg(err?.message || 'Could not send reset email.');
    }
  }

  // --- UI -------------------------------------------------------------------

  return (
    <div className="min-h-screen w-full grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Sign in</h1>

        {/* Mode Switch */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === 'password' ? 'default' : 'secondary'}
            onClick={() => setMode('password')}
          >
            Email & Password
          </Button>
          <Button
            type="button"
            variant={mode === 'magic' ? 'default' : 'secondary'}
            onClick={() => setMode('magic')}
          >
            Magic Link
          </Button>
        </div>

        {/* Shared Email Field */}
        <div className="space-y-2 mb-4">
          <Label className="text-white/80">Email</Label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password mode */}
        {mode === 'password' && (
          <form onSubmit={onSubmitPassword} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">Password</Label>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={onForgot}
                  className="text-sm text-teal-300 hover:text-teal-200"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {msg && <div className="text-sm text-amber-300">{msg}</div>}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Working…' : 'Sign in / Create account'}
            </Button>
          </form>
        )}

        {/* Magic link mode */}
        {mode === 'magic' && (
          <form onSubmit={onSubmitMagic} className="space-y-4">
            {msg && <div className="text-sm text-amber-300">{msg}</div>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send magic link'}
            </Button>
          </form>
        )}

        {/* Divider */}
        <div className="my-4 flex items-center gap-3 text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google */}
        <Button className="w-full" variant="secondary" onClick={onGoogle} disabled={loading}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
