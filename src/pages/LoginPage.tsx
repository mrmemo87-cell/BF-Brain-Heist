// src/pages/LoginPage.tsx
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supa } from '@/SupabaseClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  // If already signed in, bounce home
  React.useEffect(() => {
    let alive = true;
    supa.auth.getSession().then(({ data }) => {
      if (alive && data.session) nav('/');
    }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      setLoading(true);
      const emailNorm = email.trim().toLowerCase();

      // 1) Try sign-in
      const { error: siErr } = await supa.auth.signInWithPassword({
        email: emailNorm,
        password: pwd,
      });
      if (!siErr) {
        // Hard reload to ensure all queries refetch “me/users” like your old flow
        window.location.replace('/');
        return;
      }

      // 2) If invalid creds → sign-up
      if (/invalid login credentials/i.test(siErr.message || '')) {
        const { data: su, error: suErr } = await supa.auth.signUp({
          email: emailNorm,
          password: pwd,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (suErr) {
          if (/already registered/i.test(suErr.message || '')) {
            throw new Error('This email already exists. Check your password or reset it.');
          }
          throw suErr;
        }
        if (!su.session) {
          setMsg('We sent a confirmation link. Check your email to finish sign up.');
          return;
        }
        window.location.replace('/');
        return;
      }

      throw siErr;
    } catch (err: any) {
      setMsg(err?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loginGoogle() {
    setMsg(null);
    try {
      setLoading(true);
      const { error } = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      // Supabase will redirect to /auth/callback
    } catch (e: any) {
      setMsg(e?.message || 'Google sign-in failed.');
      setLoading(false);
    }
  }

  async function forgotPwd(e: React.MouseEvent) {
    e.preventDefault();
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
    } catch (e: any) {
      setMsg(e?.message || 'Could not send reset email.');
    }
  }

  return (
    <div className="min-h-screen w-full grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Sign in</h1>

        <form onSubmit={loginPassword} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/80">Email</Label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

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
                onClick={forgotPwd}
                className="text-sm text-teal-300 hover:text-teal-200"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {msg && <div className="text-sm text-amber-300">{msg}</div>}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Working...' : 'Sign in / Create account'}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Button className="w-full" variant="secondary" onClick={loginGoogle} disabled={loading}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
