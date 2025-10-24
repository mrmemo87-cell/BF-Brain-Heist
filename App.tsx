// App.tsx
import React from 'react'
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { DataAPIProvider, useDataAPI } from './services/data'
import { supa } from './supabaseClient'
import LeaderboardPanel from './components/LeaderboardPanel'


const qc = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <DataAPIProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </DataAPIProvider>
    </QueryClientProvider>
  )
}

function Shell() {
  const api = useDataAPI()

  React.useEffect(() => {
    supa.auth.getSession().finally(() => {})
  }, [])

  const { data: me, refetch: refetchMe } = useQuery({
    queryKey: ['whoAmI'],
    queryFn: () => api.whoAmI(),
  })

  const { data: ap, refetch: refetchAP, isFetching: apLoading } = useQuery({
    queryKey: ['ap'],
    queryFn: () => api.apStatus(),
    enabled: !!me,
  })

  // --- auth form ---
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const login = useMutation({
    mutationFn: async () => api.login(email.trim(), password.trim() || undefined),
    onSuccess: async (res) => {
      if (res.magicLinkSent) alert('Magic link sent — check your email ✉️')
      await refetchMe()
      await refetchAP()
    },
    onError: (e: any) => alert(e?.message ?? 'Login failed'),
  })

  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      await refetchMe()
    },
  })

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glassmorphism rounded-2xl p-6 w-full max-w-sm">
          <h1 className="font-heading text-2xl mb-4">Brain Heist</h1>
          <p className="text-sm opacity-80 mb-4">Email + password, or leave password empty for a magic link.</p>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full mb-3 rounded-lg bg-transparent border px-3 py-2"
            type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          />
          <label className="block text-sm mb-1">Password (optional)</label>
          <input
            className="w-full mb-4 rounded-lg bg-transparent border px-3 py-2"
            type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
          />
          <button
            className="w-full rounded-xl px-4 py-2 font-medium"
            style={{ boxShadow: 'var(--glow-primary)', background: 'hsl(var(--primary))', color: '#0A0A0A' }}
            onClick={() => login.mutate()} disabled={login.isPending}
          >
            {login.isPending ? 'Signing in…' : 'Enter the Heist'}
          </button>
          <p className="text-xs mt-3 opacity-70">Tip: set <code>VITE_BACKEND=mock</code> to demo without Supabase.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl">Welcome, {me.username}</h2>
          <p className="opacity-70 text-sm">Batch {me.batch} • L{me.level} • {me.xp} XP • {me.coins} coins</p>
        </div>
        <button className="rounded-xl px-3 py-2 border" onClick={() => logout.mutate()}>
          Logout
        </button>
      </header>

      {/* Tabs / Nav */}
      <nav className="flex gap-2">
        <TabLink to="/">Dashboard</TabLink>
        <TabLink to="/pvp">PvP</TabLink>
        <TabLink to="/leaderboard">Leaderboard</TabLink>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard ap={ap} apLoading={apLoading} refetchAP={refetchAP} />} />
        <Route path="/pvp" element={<PvPPanel />} />
        <Route path="/leaderboard" element={<LeaderboardPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function TabLink(props: React.ComponentProps<typeof NavLink>) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        `px-3 py-2 rounded-xl border text-sm ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
      }
    />
  )
}

/* ---------------- Dashboard ---------------- */

function Dashboard({ ap, apLoading, refetchAP }: {
  ap: { apNow: number; apMax: number; nextInMs: number; regenMs: number } | undefined
  apLoading: boolean
  refetchAP: () => any
}) {
  return (
    <>
      <section className="glassmorphism rounded-2xl p-4">
        <h3 className="font-heading mb-2">Action Points</h3>
        {apLoading || !ap ? (
          <div className="opacity-70 text-sm">Loading AP…</div>
        ) : (
          <APBar apNow={ap.apNow} apMax={ap.apMax} nextInMs={ap.nextInMs} />
        )}
        <div className="mt-3 text-sm opacity-70">Regen every ~{Math.round((ap?.regenMs ?? 0)/60000)} min</div>
        <button className="mt-3 rounded-xl px-3 py-2 border" onClick={() => refetchAP()}>Refresh AP</button>
      </section>

      <QuickActions />
    </>
  )
}

function APBar({ apNow, apMax, nextInMs }: { apNow: number; apMax: number; nextInMs: number }) {
  const pct = React.useMemo(() => Math.max(0, Math.min(100, (apNow / Math.max(1, apMax)) * 100)), [apNow, apMax])
  const nextSec = Math.max(0, Math.ceil(nextInMs / 1000))
  return (
    <div>
      <div className="h-3 rounded-full bg-black/40 border relative overflow-hidden">
        <div className="h-full progress-bar-glow" style={{ width: `${pct}%`, background: 'hsl(var(--accent))' }} />
      </div>
      <div className="mt-2 text-sm opacity-80">{apNow} / {apMax} • +1 in ~{nextSec}s</div>
    </div>
  )
}

/* ---------------- Quick Actions ---------------- */

function QuickActions() {
  const api = useDataAPI()

  const pve = useMutation({
    mutationFn: (tier: 'easy' | 'standard' | 'hard') => api.pveRun(tier),
    onSuccess: (res) => alert(`PvE ${res.outcome}: +${res.xp} XP, +${res.coins} coins`),
    onError: (e: any) => alert(e?.message ?? 'PvE failed'),
  })

  const jobStart = useMutation({
    mutationFn: (jobId: string) => api.jobStart(jobId, false),
    onSuccess: (j) => alert(`Job started → ends at ${new Date(j.endsAt).toLocaleTimeString()}`),
    onError: (e: any) => alert(e?.message ?? 'Job failed'),
  })

  const jobClaim = useMutation({
    mutationFn: () => api.jobClaim(),
    onSuccess: (r) => alert(`Claimed: +${r.xp} XP, +${r.coins} coins`),
  })

  const upgrade = useMutation({
    mutationFn: (track: any) => api.upgrade(track),
    onSuccess: (u) => alert(`Upgraded ${u.track} → level ${u.level}`),
  })

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button className="glassmorphism rounded-2xl p-4 text-left" onClick={() => pve.mutate('easy')}>
        <h4 className="font-heading mb-1">Run PvE (Easy)</h4>
        <p className="text-sm opacity-70">2 AP • ~10 XP • ~50 coins</p>
      </button>
      <button className="glassmorphism rounded-2xl p-4 text-left" onClick={() => jobStart.mutate('2')}>
        <h4 className="font-heading mb-1">Start Job (2h)</h4>
        <p className="text-sm opacity-70">+150 coins • +15 XP</p>
      </button>
      <button className="glassmorphism rounded-2xl p-4 text-left" onClick={() => jobClaim.mutate()}>
        <h4 className="font-heading mb-1">Claim Job</h4>
        <p className="text-sm opacity-70">Collect when ready</p>
      </button>
      <button className="glassmorphism rounded-2xl p-4 text-left" onClick={() => upgrade.mutate('sprint_path' as any)}>
        <h4 className="font-heading mb-1">Upgrade: Sprint Path</h4>
        <p className="text-sm opacity-70">+1 AP max</p>
      </button>
    </section>
  )
}

/* ---------------- PvP Panel (own route) ---------------- */

function PvPPanel() {
  const api = useDataAPI()
  const qc = useQueryClient()

  const { data: targets, isLoading, refetch } = useQuery({
    queryKey: ['raidTargets'],
    queryFn: () => api.raidTargets(),
  })

  const attack = useMutation({
    mutationFn: (id: string) => api.raidAttack(id),
    onSuccess: async (res) => {
      alert(`${res.win ? 'WIN' : 'LOSS'} — ${res.message} (+${res.xp} XP, +${res.coins} coins)`)
      await refetch()
      await qc.invalidateQueries({ queryKey: ['ap'] })
    },
    onError: (e: any) => alert(e?.message ?? 'Raid failed'),
  })

  return (
    <section className="glassmorphism rounded-2xl p-4">
      <h3 className="font-heading mb-2">PvP Targets</h3>
      {isLoading ? (
        <div className="opacity-70 text-sm">Loading…</div>
      ) : !targets || targets.length === 0 ? (
        <div className="opacity-70 text-sm">No valid targets right now (level band or batch rules).</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {targets.map((t: any) => {
            const capped = t.raidsToday >= t.raidsCap
            return (
              <div key={t.id} className="rounded-xl border p-3 flex items-center justify-between">
                <div>
                  <div className="font-heading">{t.username}</div>
                  <div className="text-sm opacity-70">L{t.level} • Batch {t.batch} • Power {t.power}</div>
                  <div className="text-xs opacity-70">{t.raidsToday}/{t.raidsCap} today</div>
                </div>
                <button
                  className="rounded-xl px-3 py-2 border"
                  disabled={capped || attack.isPending}
                  onClick={() => attack.mutate(t.id)}
                >
                  {capped ? 'Capped' : attack.isPending ? 'Attacking…' : 'Raid'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
