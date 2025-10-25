// App.tsx
import React from 'react'
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { DataAPIProvider, useDataAPI } from './services/data'
import { supa } from './supabaseClient'
import type { APStatus, Profile } from './services/data/types'
import LeaderboardPanel from './components/LeaderboardPanel'
import QuestsPanel from './components/QuestsPanel'
import GearPanel from './components/GearPanel'
import ClansPanel from './components/ClansPanel'
import SettingsPanel from './components/SettingsPanel'
import QuestsMCQPanel from './components/QuestsMCQPanel'
import NewsPanel from './components/NewsPanel'
import AnimatedBackground from './components/common/AnimatedBackground'
import { AnimatePresence, motion } from 'framer-motion'
import { Audio } from './lib/audio'
import { confettiBurst } from './lib/confetti'
import { toast, Toasts } from './lib/toast'
import RaidDuelModal from './components/RaidDuelModal'

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
  const dataAPI = useDataAPI();                 // <-- define first (renamed)
  const qc = useQueryClient();
  const location = useLocation();
  const [sfxOn, setSfxOn] = React.useState<boolean>(() => (localStorage.getItem('bh.sfx') ?? 'on') === 'on');
  const [bgmOn, setBgmOn] = React.useState<boolean>(() => (localStorage.getItem('bh.bgm') ?? 'off') === 'on');

  React.useEffect(() => { supa.auth.getSession().finally(() => {}) }, []);

  // Audio: init on mount/first click, play click on button taps
  React.useEffect(() => {
    // Attach a global click listener for lightweight SFX on button taps
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      const isBtn = t.tagName === 'BUTTON' || t.closest('button') || t.getAttribute('role') === 'button'
      Audio.init()
      if (isBtn) Audio.play('click')
    }
    document.addEventListener('click', onDocClick, { capture: true })
    return () => document.removeEventListener('click', onDocClick, { capture: true } as any)
  }, [])

  // Stable wrappers so we never touch dataAPI before it's set
  const whoAmI = React.useCallback(() => dataAPI.whoAmI(), [dataAPI]);
  const apStatus = React.useCallback(() => dataAPI.apStatus(), [dataAPI]);

  const { data: me, refetch: refetchMe } = useQuery<Profile | null>({
    queryKey: ['whoAmI'],
    queryFn: whoAmI,
  });

  const { data: ap, refetch: refetchAP, isFetching: apLoading } = useQuery<APStatus>({
    queryKey: ['ap'],
    queryFn: apStatus,
    enabled: !!me,
  });

  // --- auth form ---
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const login = useMutation({
    mutationFn: async () => dataAPI.login(email.trim(), password.trim() || undefined),
    onSuccess: async (res) => {
      if (res.magicLinkSent) alert('Magic link sent — check your email ✉️');
      await refetchMe(); await refetchAP();
    },
    onError: (e: any) => alert(e?.message ?? 'Login failed'),
  });

  const logout = useMutation({
    mutationFn: dataAPI.logout,
    onSuccess: async () => {
      qc.clear();
      await supa.auth.getSession();
      window.location.href = '/';
    },
    onError: (e: any) => alert(e?.message ?? 'Logout failed'),
  });

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <AnimatedBackground />
        <div className="glassmorphism rounded-2xl p-6 w-full max-w-sm">
          <h1 className="font-heading text-2xl mb-4">Brain Heist</h1>
          <p className="text-sm opacity-80 mb-4">Email + password, or leave password empty for a magic link.</p>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full mb-3 rounded-lg bg-transparent border px-3 py-2"
                 type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          <label className="block text-sm mb-1">Password (optional)</label>
          <input className="w-full mb-4 rounded-lg bg-transparent border px-3 py-2"
                 type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          <button className="w-full rounded-xl px-4 py-2 font-medium"
                  style={{ boxShadow: 'var(--glow-primary)', background: 'hsl(var(--primary))', color: '#0A0A0A' }}
                  onClick={() => login.mutate()} disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Enter the Heist'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <AnimatedBackground />
        <div className="container-phone p-4 space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="font-heading neon-head gradient-text text-3xl md:text-4xl">
                Welcome, {me.username}
              </h1>
              <p className="opacity-70 text-sm">Batch {me.batch} • L{me.level} • {me.xp} XP • {me.coins} coins</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-xl px-3 py-2 border mr-2"
                      onClick={()=>{ Audio.init(); const on = Audio.toggleBgm(); alert(on?'BGM ON':'BGM OFF') }}>
                🔊
              </button>
              <button className="rounded-xl px-3 py-2 border mr-2"
                      onClick={()=>{ const on = Audio.toggleSfx(); alert(on?'SFX ON':'SFX OFF') }}>
                �
              </button>
              <button className="rounded-xl px-3 py-2 border" onClick={() => logout.mutate()}>
                Logout
              </button>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            <TabLink to="/">Dashboard</TabLink>
            <TabLink to="/pvp">PvP</TabLink>
            <TabLink to="/leaderboard">Leaderboard</TabLink>
            <TabLink to="/quests">Quests</TabLink>
            <TabLink to="/quests/mcq">MCQ</TabLink>
            <TabLink to="/gear">Gear</TabLink>
            <TabLink to="/clans">Clans</TabLink>
            <TabLink to="/news">News</TabLink>
            <TabLink to="/settings">Settings</TabLink>
          </nav>
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<Page><Dashboard ap={ap} apLoading={apLoading} refetchAP={refetchAP} /></Page>} />
              <Route path="/pvp" element={<Page><PvPPanelFixed /></Page>} />
              <Route path="/leaderboard" element={<Page><LeaderboardPanel /></Page>} />
              <Route path="/quests" element={<Page><QuestsMCQPanel /></Page>} />
              <Route path="/quests/mcq" element={<Page><QuestsMCQPanel /></Page>} />
              <Route path="/gear" element={<Page><GearPanel /></Page>} />
              <Route path="/clans" element={<Page><ClansPanel /></Page>} />
              <Route path="/news" element={<Page><NewsPanel /></Page>} />
              <Route path="/settings" element={<Page><SettingsPanel /></Page>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
      <Toasts />
    </>
  );
}

/* -------- Dashboard (unchanged) -------- */
function Dashboard({
  ap,
  apLoading,
  refetchAP,
}: {
  ap: { apNow: number; apMax: number; nextInMs: number; regenMs: number } | undefined
  apLoading: boolean
  refetchAP: () => any
}) {
  const dataAPI = useDataAPI()
  const qc = useQueryClient()

  const pve = useMutation({
    mutationFn: (tier: 'easy' | 'standard' | 'hard') => dataAPI.pveRun(tier),
    onSuccess: async (res: any) => {
      alert(`PvE ${res.outcome}: +${res.xp} XP, +${res.coins} coins`)
      await qc.invalidateQueries({ queryKey: ['ap'] })
      await qc.invalidateQueries({ queryKey: ['whoAmI'] })
    },
    onError: (e: any) => alert(e?.message ?? 'PvE failed')
  })

  const jobStart = useMutation({
    mutationFn: (jobId: string) => dataAPI.jobStart(jobId, false),
    onSuccess: (j: any) => alert(`Job started → ends at ${new Date(j.endsAt).toLocaleTimeString()}`),
    onError: (e: any) => alert(e?.message ?? 'Job failed'),
  })

  const jobClaim = useMutation({
    mutationFn: () => dataAPI.jobClaim(),
    onSuccess: async (r: any) => {
      alert(`Claimed: +${r.xp} XP, +${r.coins} coins`)
      await qc.invalidateQueries({ queryKey: ['whoAmI'] })
    },
  })

  const upgrade = useMutation({
    mutationFn: (track: any) => dataAPI.upgrade(track),
    onSuccess: async (u: any) => {
      alert(`Upgraded ${u.track} → level ${u.level}`)
      await qc.invalidateQueries({ queryKey: ['ap'] })
      await qc.invalidateQueries({ queryKey: ['whoAmI'] })
      await qc.invalidateQueries({ queryKey: ['upgrades'] })
    },
    onError: (e: any) => alert(e?.message ?? 'Upgrade failed'),
  })

  return (
    <div className="space-y-6">
      <section className="card-glass shimmer2 p-4">
        <h3 className="font-heading mb-2">Action Points</h3>
        {apLoading ? (
          <div className="opacity-70 text-sm">Loading…</div>
        ) : ap ? (
          <>
            <APAnimatedBar apNow={ap.apNow} apMax={ap.apMax} />
            <div className="text-sm opacity-80 mb-2">{ap.apNow} / {ap.apMax} • +1 in ~{Math.ceil((ap.nextInMs || 0)/1000)}s</div>
            <button className="rounded-xl px-3 py-2 border text-sm" onClick={() => refetchAP()}>
              Refresh AP
            </button>
          </>
        ) : (
          <div className="opacity-70 text-sm">AP unavailable</div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="card-glass shimmer2 p-4 text-left btn-neon" onClick={() => pve.mutate('easy')}>
          <h4 className="font-heading mb-1">Run PvE (Easy)</h4>
          <p className="text-sm opacity-70">2 AP • ~10 XP • ~50 coins</p>
        </button>
        <button className="card-glass shimmer2 p-4 text-left btn-neon" onClick={() => jobStart.mutate('2h')}>
          <h4 className="font-heading mb-1">Start Job (2h)</h4>
          <p className="text-sm opacity-70">+150 coins • +15 XP</p>
        </button>
        <button className="card-glass shimmer2 p-4 text-left btn-neon" onClick={() => jobClaim.mutate()}>
          <h4 className="font-heading mb-1">Claim Job</h4>
          <p className="text-sm opacity-70">Collect when ready</p>
        </button>
        <button
          className="card-glass shimmer2 p-4 text-left btn-neon md:col-span-3"
          onClick={() => upgrade.mutate('sprint_path' as any)}
        >
          <h4 className="font-heading mb-1">Upgrade: Sprint Path</h4>
          <p className="text-sm opacity-70">+1 AP max</p>
        </button>
      </section>
    </div>
  )
}

function APAnimatedBar({ apNow, apMax }: { apNow: number; apMax: number }) {
  const pct = Math.min(100, (apNow / Math.max(1, apMax)) * 100)
  const [showSpark, setShowSpark] = React.useState(false)
  const prev = React.useRef(apNow)

  React.useEffect(() => {
    if (apNow > prev.current) {
      setShowSpark(true)
      const t = setTimeout(() => setShowSpark(false), 650)
      return () => clearTimeout(t)
    }
    prev.current = apNow
  }, [apNow])

  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2 relative">
      <motion.div
        className="h-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ boxShadow: 'var(--glow-accent)', background: 'hsl(var(--accent))' }}
      />
      {/* sparkle */}
  {showSpark ? <Sparkle leftPct={pct} /> : null}
    </div>
  )
}

function Sparkle({ leftPct }: { leftPct: number }) {
  const left = `${Math.max(0, Math.min(100, leftPct))}%`
  return (
    <motion.div
      className="absolute top-0 -translate-x-1/2"
      style={{ left }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: -8 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="h-3 w-3 rounded-full bg-white/90" style={{ boxShadow: 'var(--glow-gold)' }} />
    </motion.div>
  )
}

/* -------- PvP Panel (uses its own dataAPI) -------- */
function PvPPanelFixed() {
  const dataAPI = useDataAPI()
  const { data: me } = useQuery({ queryKey:['whoAmI'], queryFn: () => dataAPI.whoAmI() })
  const [duel, setDuel] = React.useState<any|null>(null)

  const { data: targets, isLoading, error } = useQuery({
    queryKey: ['raidTargets'],
    queryFn: () => dataAPI.raidTargets(),
  })

  return (
    <>
      <section className="card-glass shimmer2 p-4">
        <h3 className="font-heading mb-2">Targets</h3>
        {isLoading && <div className="opacity-70 text-sm">Loading…</div>}
        {error && <div className="text-red-400 text-sm">Failed to load targets</div>}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(targets ?? []).map((t: any) => (
              <div key={t.id} className="rounded-xl border p-3 flex items-center justify-between">
                <div>
                  <div className="font-heading">{t.username}</div>
                  <div className="text-xs opacity-70">Batch {t.batch} • L{t.level} • Power {t.power}</div>
                </div>
                <button
                  className="rounded-xl px-4 py-2 btn-neon"
                  onClick={() => setDuel(t)}
                >
                  Attack
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <RaidDuelModal
        open={!!duel}
        onClose={()=> setDuel(null)}
        me={{ username: me?.username ?? 'you', avatarUrl: me?.avatarUrl ?? null }}
        target={duel ?? { id:'', username:'' }}
      />
    </>
  )
}

/* -------- QuickActions (if you use it on Dashboard) -------- */
function QuickActions() {
  const dataAPI = useDataAPI();
  const qc = useQueryClient();

  const pve = useMutation({
    mutationFn: (tier: 'easy' | 'standard' | 'hard') => dataAPI.pveRun(tier),
    onSuccess: (res: any) => alert(`PvE ${res.outcome}: +${res.xp} XP, +${res.coins} coins`),
    onError: (e: any) => alert(e?.message ?? 'PvE failed'),
  });

  const jobStart = useMutation({
    mutationFn: (jobId: string) => dataAPI.jobStart(jobId, false),
    onSuccess: (j: any) => alert(`Job started → ends at ${new Date(j.endsAt).toLocaleTimeString()}`),
    onError: (e: any) => alert(e?.message ?? 'Job failed'),
  });

  const jobClaim = useMutation({
    mutationFn: () => dataAPI.jobClaim(),
    onSuccess: (r: any) => alert(`Claimed: +${r.xp} XP, +${r.coins} coins`),
  });

  const upgrade = useMutation({
    mutationFn: (track: any) => dataAPI.upgrade(track),
    onSuccess: async (u: any) => {
      alert(`Upgraded ${u.track} → level ${u.level}`);
      await qc.invalidateQueries({ queryKey: ['ap'] });
      await qc.invalidateQueries({ queryKey: ['whoAmI'] });
      await qc.invalidateQueries({ queryKey: ['upgrades'] });
    },
    onError: (e: any) => alert(e?.message ?? 'Upgrade failed'),
  });

  // ... render your buttons ...
  return null as any; // replace with your QuickActions JSX
}


function TabLink(props: React.ComponentProps<typeof NavLink>) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        `px-3 py-2 rounded-xl border text-sm transition-transform active:scale-95 ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
      }
    />
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

// Shared page transition wrapper
function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="space-y-6"
    >
      {children}
    </motion.div>
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
    onSuccess: async (res: any) => {
      alert(`${res.win ? 'WIN' : 'LOSS'} — ${res.message} (+${res.xp} XP, +${res.coins} coins)`)
      await refetch()
      await qc.invalidateQueries({ queryKey: ['ap'] })
    },
    onError: (e: any) => alert(e?.message ?? 'Raid failed'),
  })

  return (
    <section className="card-glass shimmer2 p-4">
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
