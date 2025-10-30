import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { supa } from '@/SupabaseClient'
import AnimatedBackground from '@/components/common/AnimatedBackground'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [pass, setPass]   = React.useState('')
  const [batch, setBatch] = React.useState<'8A'|'8B'|'8C'>('8A')
  const [busy, setBusy]   = React.useState(false)

  React.useEffect(() => {
    // already signed in? go in
    supa.auth.getSession().then(s => {
      if (s.data.session) navigate('/leaderboard', { replace: true })
    })
  }, [navigate])

  async function waitForSession(maxMs = 3000) {
    const t0 = Date.now()
    while (Date.now() - t0 < maxMs) {
      const s = await supa.auth.getSession()
      if (s.data.session) return s.data.session
      await new Promise(r => setTimeout(r, 120))
    }
    return null
  }

  async function bootstrapProfile(chosen: '8A'|'8B'|'8C' | null) {
    const s = await supa.auth.getSession()
    const uid = s.data.session?.user?.id
    if (!uid) return
    await supa.rpc('profile_bootstrap_with_uid', {
      p_user_id: uid,
      p_username: null,
      p_batch: chosen,   // sets once, locked by trigger
      p_avatar_url: null
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      // 1) try sign-in first (existing users)
      let r = await supa.auth.signInWithPassword({ email, password: pass })

      if (r.error) {
        // 2) not signed up yet? create account
        const looksLikeNoAccount =
          r.error.status === 400 || /invalid|not.*found/i.test(r.error.message)
        if (!looksLikeNoAccount) throw r.error

        const up = await supa.auth.signUp({ email, password: pass })
        if (up.error) {
          // surface the real 422 reason (password policy, signup disabled, etc.)
          throw up.error
        }
        await waitForSession() // some projects need a beat here
        // first time: set batch now
        await bootstrapProfile(batch)
      } else {
        // existing account: ensure profile exists; DO NOT change batch
        await bootstrapProfile(null)
      }

      // go in
      navigate('/leaderboard', { replace: true })

    } catch (err: any) {
      alert(err?.message ?? 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-dvh text-white">
      <AnimatedBackground />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Brain Heist</h1>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm opacity-80">Email</label>
              <input
                type="email" required
                className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                placeholder="you@school.kg"
                value={email} onChange={e=>setEmail(e.target.value)}
              />
              <label className="text-sm opacity-80">Password</label>
              <input
                type="password" required
                className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                placeholder="••••••••"
                value={pass} onChange={e=>setPass(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm opacity-80">Choose your Batch (for new accounts)</div>
              <div className="flex gap-2">
                {(['8A','8B','8C'] as const).map(b => (
                  <button
                    key={b} type="button"
                    onClick={()=>setBatch(b)}
                    className={`px-3 py-2 rounded-lg border ${
                      batch===b ? 'bg-white text-black border-white' : 'bg-white/10 hover:bg-white/20 border-white/20'
                    }`}
                    title="This choice is permanent for new accounts"
                  >
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-xs opacity-70">
                New users: batch is set on first login and cannot be changed.
              </p>

              <button
                disabled={busy}
                className="w-full mt-3 rounded-lg py-2 bg-teal-500/90 hover:bg-teal-500 text-black font-medium transition disabled:opacity-50"
              >
                {busy ? 'Authenticating…' : 'Sign in / Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
