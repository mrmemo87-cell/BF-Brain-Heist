import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supa } from '@/SupabaseClient'
import AnimatedBackground from '@/components/common/AnimatedBackground'

async function ensureProfile() {
  const s = await supa.auth.getSession()
  const uid = s.data.session?.user?.id
  if (!uid) return
  const { data } = await supa.rpc('whoami_profile').catch(() => ({ data: null }))
  if (data && data[0]) return
  await supa.rpc('profile_bootstrap_with_uid', { p_user_id: uid }).catch(() => {})
}

export default function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = React.useState('')
  const [pass, setPass]   = React.useState('')
  const [ml, setMl]       = React.useState('')
  const [busy, setBusy]   = React.useState<'none'|'pwd'|'ml'|'google'>('none')
  const callbackUrl = `${window.location.origin}/auth/callback`

  const goIn = async () => {
    await ensureProfile()
    nav('/leaderboard', { replace: true })
  }

  const onEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('pwd')
    try {
      // 1) try sign-in
      const r1 = await supa.auth.signInWithPassword({ email, password: pass })
      if (r1.error) {
        // 2) auto-signup if not found / invalid creds
        const shouldSignup =
          /invalid|not.*found|email.*exists/i.test(r1.error.message) ||
          r1.error.status === 400

        if (!shouldSignup) throw r1.error

        const r2 = await supa.auth.signUp({
          email,
          password: pass,
          options: { emailRedirectTo: callbackUrl }
        })
        if (r2.error) throw r2.error
      }

      // wait till session is actually present
      for (let i = 0; i < 10; i++) {
        const s = await supa.auth.getSession()
        if (s.data.session) break
        await new Promise(r => setTimeout(r, 150))
      }

      await goIn()
    } catch (err: any) {
      alert(err?.message ?? 'Sign-in failed')
    } finally {
      setBusy('none')
    }
  }

  const onMagic = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('ml')
    try {
      const { error } = await supa.auth.signInWithOtp({
        email: ml,
        options: { emailRedirectTo: callbackUrl }
      })
      if (error) throw error
      alert('Magic link sent. Check your email ✉️')
    } catch (err: any) {
      alert(err?.message ?? 'Could not send magic link')
    } finally {
      setBusy('none')
    }
  }

  const onGoogle = async () => {
    setBusy('google')
    try {
      const { error } = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl }
      })
      if (error) throw error
      // redirects out; no finally path here
    } catch (err: any) {
      alert(err?.message ?? 'Google sign-in failed')
      setBusy('none')
    }
  }

  return (
    <div className="relative min-h-dvh">
      <AnimatedBackground />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
          <h1 className="text-2xl font-semibold mb-6">Sign in</h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Email & Password */}
            <form onSubmit={onEmailPassword} className="space-y-3">
              <div className="text-sm opacity-80">Email & Password</div>
              <input className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                     type="email" placeholder="you@school.kg"
                     value={email} onChange={e=>setEmail(e.target.value)} required />
              <input className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                     type="password" placeholder="••••••••"
                     value={pass} onChange={e=>setPass(e.target.value)} required />
              <button disabled={busy!=='none'} className="w-full rounded-lg py-2 bg-teal-500/80 hover:bg-teal-500 transition">
                {busy==='pwd' ? 'Working…' : 'Enter'}
              </button>
              <div className="text-right text-xs opacity-70">
                Forgot password? Use Magic Link → 
              </div>
            </form>

            {/* Magic Link + Google */}
            <form onSubmit={onMagic} className="space-y-3">
              <div className="text-sm opacity-80">Magic Link</div>
              <input className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                     type="email" placeholder="you@school.kg"
                     value={ml} onChange={e=>setMl(e.target.value)} />
              <button disabled={busy!=='none'} className="w-full rounded-lg py-2 bg-white/15 hover:bg-white/25 transition">
                {busy==='ml' ? 'Sending…' : 'Send Magic Link'}
              </button>
              <div className="relative my-3 text-center text-xs opacity-60">
                <span className="px-2 bg-black/40">or</span>
              </div>
              <button type="button" onClick={onGoogle} disabled={busy!=='none'}
                      className="w-full rounded-lg py-2 bg-white/10 hover:bg-white/20 transition">
                {busy==='google' ? 'Opening Google…' : 'Continue with Google'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
