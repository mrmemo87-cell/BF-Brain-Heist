// App.tsx
import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

/** use the singleton client from src */
import { supa, installAuthLifecycle } from "@/SupabaseClient";

/** data layer (lives in src) */
import { DataAPIProvider, useDataAPI } from '@/services/data';
import type { APStatus, Profile } from "@/services/data/types";

/** pages (in src/pages) */
import AuthCallback from "@/pages/AuthCallback";
import LoginPage from "@/pages/LoginPage";

/** UI panels/components (in src/components) */
import LeaderboardPanel from "@/components/LeaderboardPanel";
import QuestsPanel from "@/components/QuestsPanel";
import GearPanel from "@/components/GearPanel";
import ClansPanel from "@/components/ClansPanel";
import SettingsPanel from "@/components/SettingsPanel";
import NewsPanel from "@/components/NewsPanel";
import IntroCinematic from "@/components/IntroCinematic";
import HelpQuickstart from "@/components/HelpQuickstart";
import FirstRunSetup from "@/components/FirstRunSetup"; // ✅ wired back

/** UI atoms/utils (in src/...) */
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { toast, Toasts } from "@/lib/toast";

/** hooks (in src/hooks) */
import { useSfx } from "@/hooks/useSfx";
import { useHeartbeat } from "@/hooks/useHeartbeat";

/** new: extracted logout */
import LogoutButton from "@/components/LogoutButton";

// ---- providers ----
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // stop auto refetch when tab gets focus
      retry: (failureCount, err: unknown) =>
        // retry up to 2 times unless the error looks like an HTTP 404
        ((err as any)?.status !== 404 && failureCount < 2),
    },
  },
});


export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <DataAPIProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </DataAPIProvider>
    </QueryClientProvider>
  );
}

// ---- auth callback hook (single source of truth) ----
function useAuthCallback() {
  const qc = useQueryClient();
  const [authReady, setAuthReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const err =
        url.searchParams.get("error") ||
        url.searchParams.get("error_description");

      try {
        if (err) throw new Error(err);

        if (code) {
          // Prefer supabase-js v2 method
          try {
            await (supa.auth as any).exchangeCodeForSession?.(code);
          } catch {
            // Fallback for older builds
            if ((supa.auth as any).getSessionFromUrl) {
              await (supa.auth as any).getSessionFromUrl({ storeSession: true });
            } else {
              throw new Error(
                "No exchange method available on this supabase-js version"
              );
            }
          }
        }
      } catch (e) {
        console.error("Auth callback failed:", e);
      } finally {
        // Clean URL either way
        ["code", "state", "error", "error_description"].forEach((k) =>
          url.searchParams.delete(k)
        );
        window.history.replaceState({}, "", url.toString());

        if (!mounted) return;
        setAuthReady(true);
        qc.invalidateQueries({ queryKey: ["whoAmI"] });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [qc]);

  return authReady;
}

// ---- app shell ----
function Shell() {
  const dataAPI = useDataAPI();
  const qc = useQueryClient();
  const location = useLocation();
  const sfx = useSfx();

  const [showIntro, setShowIntro] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  // ✅ moved from top-level: hooks must run inside a component
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).supabase = supa;
    }
  }, []);

  // Single source of truth for OAuth callback readiness
  const authReady = useAuthCallback();

  // keep session presence pulsing (no-op if disabled)
  useHeartbeat(authReady ? 60_000 : null);

  // use the cleanup from installAuthLifecycle 
  React.useEffect(() => {
  const off = installAuthLifecycle(qc);
  return off;
}, [qc]);


  // 🔥 Start session + refresh AP once auth is ready
  React.useEffect(() => {
    if (!authReady) return;
    let dead = false;
    (async () => {
      try { await supa.rpc('session_start'); } catch {}
      try { await supa.rpc('ap_status'); } catch {}
      if (!dead) {
        // invalidate ap/leaderboard queries etc.
        qc.invalidateQueries({ queryKey: ['ap'] });
        qc.invalidateQueries({ queryKey: ['leaderboardRows'] });
        qc.invalidateQueries({ queryKey: ['clansBoard'] });
        qc.invalidateQueries({ queryKey: ['clansMap'] });
      }
    })();
    return () => { dead = true; };
  }, [authReady, qc]);

  // Refresh profile when auth changes (only after auth is ready)
  React.useEffect(() => {
    if (!authReady) return;
    const { data: sub } = supa.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        try {
          await dataAPI.whoAmI();
          qc.invalidateQueries({ queryKey: ["whoAmI"] });
        } catch {}
      }
    });
    return () => sub?.subscription?.unsubscribe();
  }, [authReady, dataAPI, qc]);

  // Optional dev helper (only after auth is ready)
  React.useEffect(() => {
    if (!authReady) return;
    (window as any).smokeLB = async () => {
      const r = await supa.rpc("leaderboard_rows", { p_limit: 5 });
      console.log("leaderboard_rows:", r.error ?? r.data);
      return r;
    };
    return () => {
      try {
        delete (window as any).smokeLB;
      } catch {}
    };
  }, [authReady]);

  // Audio: init on mount/first click, play click on button taps
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const isBtn =
        t.tagName === "BUTTON" ||
        (t as any).closest?.("button") ||
        t.getAttribute("role") === "button";
      if (isBtn) sfx.play("click");
    };
    document.addEventListener("click", onDocClick, { capture: true } as any);
    return () =>
      document.removeEventListener("click", onDocClick, true as any);
  }, [sfx]);

  const whoAmI = React.useCallback(() => dataAPI.whoAmI(), [dataAPI]);
  const apStatus = React.useCallback(() => dataAPI.apStatus(), [dataAPI]);

  const { data: me } = useQuery<Profile | null>({
    queryKey: ["whoAmI"],
    queryFn: whoAmI,
    enabled: authReady,
  });

  // ✅ detect if we should show FirstRunSetup
  const hasAvatar = !!(me?.avatarUrl || (me as any)?.avatar_url);
  const hasBatch =
    !!(me?.batch && ["8A", "8B", "8C"].includes(String(me.batch).toUpperCase()));
  const hasName = !!(me?.username && String(me.username).trim());
  const needsSetup = !!me && (!hasBatch || !hasAvatar || !hasName);

  const {
    data: ap,
    refetch: refetchAP,
    isFetching: apLoading,
  } = useQuery<APStatus>({
    queryKey: ["ap"],
    queryFn: apStatus,
    enabled: !!me,
  });

  // Ping server periodically to keep user status fresh
  React.useEffect(() => {
    if (!authReady) return;
    const tick = async () => {
      try {
        await supa.rpc("ping");
      } catch {
        /* swallow */
      }
    };
    tick();
    const id = setInterval(() => {
      void tick();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [authReady]);

  // —— First Run Setup modal state —— //
  const [showSetup, setShowSetup] = React.useState(false);

  React.useEffect(() => {
    if (!authReady) return;
    // Open once when we have the profile loaded and it's incomplete
    if (needsSetup) setShowSetup(true);
  }, [authReady, needsSetup]);

  // Save handler for FirstRunSetup
  const handleSetupSave = React.useCallback(
    async (payload: { username?: string; avatarUrl?: string; batch?: "8A" | "8B" | "8C" }) => {
      try {
        // Primary: use the bootstrap RPC (recommended)
        const r = await supa.rpc("profile_bootstrap", {
          p_avatar_url: payload.avatarUrl ?? null,
          p_batch: payload.batch ?? null,
          p_username: payload.username ?? null,
        });
        if (r.error) throw r.error;

        toast.success("Profile saved. Welcome to the heist 🎭");
        setShowSetup(false);
        await qc.invalidateQueries({ queryKey: ["whoAmI"] });
      } catch (e: any) {
        console.warn("profile_bootstrap failed, trying fallback:", e?.message || e);
        try {
          // Fallback: update username + avatar, then attempt batch direct (if your RLS allows)
          await dataAPI.profileUpdate(payload.username, payload.avatarUrl);
          if (payload.batch) {
            const u = await supa.auth.getUser();
            const uid = u.data.user?.id;
            if (uid) {
              await supa.from("profiles").update({ batch: payload.batch }).eq("id", uid);
            }
          }
          toast.success("Profile updated.");
          setShowSetup(false);
          await qc.invalidateQueries({ queryKey: ["whoAmI"] });
        } catch (e2: any) {
          toast.error(e2?.message || "Setup failed");
        }
      }
    },
    [dataAPI, qc]
  );

  if (!authReady) {
    return (
      <div className="w-full h-screen grid place-items-center text-white">
        Signing you in…
      </div>
    );
  }

  if (!me) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container-phone p-4 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 justify-center">
            <Avatar>
              <AvatarImage src={(me as any)?.avatarUrl || (me as any)?.avatar_url} />
              <AvatarFallback>{me?.username?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="font-heading gradient-text text-xl">
                {me?.username}
              </div>
              <div className="opacity-80 text-xs">
                Batch {me?.batch ?? "—"} • L{me?.level} • {me?.xp} XP • {me?.coins} coins
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-lg" onClick={() => sfx.toggle()}>
              {sfx.enabled ? "🔉" : "🔇"}
            </button>
            <button className="text-lg" onClick={() => setShowHelp(true)}>
              ❓
            </button>
            <LogoutButton />
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          <TabLink to="/">Dashboard</TabLink>
          <TabLink to="/leaderboard">Leaderboard</TabLink>
          <TabLink to="/quests">Quests</TabLink>
          <TabLink to="/gear">Gear</TabLink>
          <TabLink to="/clans">Clans</TabLink>
          <TabLink to="/news">News</TabLink>
          <TabLink to="/settings">Settings</TabLink>
        </nav>

        <main>
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route
                path="/"
                element={
                  <PanelWrapper>
                    <Dashboard
                      ap={ap}
                      apLoading={apLoading}
                      refetchAP={refetchAP}
                    />
                  </PanelWrapper>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <PanelWrapper>
                    <LeaderboardPanel />
                  </PanelWrapper>
                }
              />
              <Route
                path="/quests"
                element={
                  <PanelWrapper>
                    <QuestsPanel />
                  </PanelWrapper>
                }
              />
              <Route
                path="/gear"
                element={
                  <PanelWrapper>
                    <GearPanel />
                  </PanelWrapper>
                }
              />
              <Route
                path="/clans"
                element={
                  <PanelWrapper>
                    <ClansPanel />
                  </PanelWrapper>
                }
              />
              <Route
                path="/news"
                element={
                  <PanelWrapper>
                    <NewsPanel />
                  </PanelWrapper>
                }
              />
              <Route
                path="/settings"
                element={
                  <PanelWrapper>
                    <SettingsPanel />
                  </PanelWrapper>
                }
              />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      <Toasts />
      <IntroCinematic open={showIntro} onClose={() => setShowIntro(false)} />
      {showHelp && <HelpQuickstart onClose={() => setShowHelp(false)} />}

      {/* ✅ First Run Setup modal — opens when profile incomplete */}
      {showSetup && (
        <FirstRunSetup
          open={showSetup}
          defaultName={me?.username ?? ""}
          defaultAvatarUrl={(me as any)?.avatarUrl || (me as any)?.avatar_url || ""}
          defaultBatch={
            hasBatch ? (String(me?.batch).toUpperCase() as "8A" | "8B" | "8C") : undefined
          }
          onSave={handleSetupSave}
          onCancel={() => setShowSetup(false)}
        />
      )}
    </div>
  );
}

/* -------- Dashboard -------- */
function Dashboard({
  ap,
  apLoading,
  refetchAP,
}: {
  ap:
    | { apNow: number; apMax: number; nextInMs: number; regenMs: number }
    | undefined;
  apLoading: boolean;
  refetchAP: () => any;
}) {
  const dataAPI = useDataAPI();
  const qc = useQueryClient();

  const pve = useMutation({
    mutationFn: (tier: "easy" | "standard" | "hard") => dataAPI.pveRun(tier),
    onSuccess: async (res: any) => {
      toast.success(`PvE ${res.outcome}: +${res.xp} XP, +${res.coins} coins`);
      await qc.invalidateQueries({ queryKey: ["ap"] });
      await qc.invalidateQueries({ queryKey: ["whoAmI"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "PvE failed"),
  });

  const jobStart = useMutation({
    mutationFn: (jobId: string) => dataAPI.jobStart(jobId, false),
    onSuccess: (j: any) =>
      toast.success(`Job started → ends at ${new Date(j.endsAt).toLocaleTimeString()}`),
    onError: (e: any) => toast.error(e?.message ?? "Job failed"),
  });

  const jobClaim = useMutation({
    mutationFn: () => dataAPI.jobClaim(),
    onSuccess: async (r: any) => {
      toast.success(`Claimed: +${r.xp} XP, +${r.coins} coins`);
      await qc.invalidateQueries({ queryKey: ["whoAmI"] });
    },
  });

  const upgrade = useMutation({
    mutationFn: (track: any) => dataAPI.upgrade(track),
    onSuccess: async (u: any) => {
      toast.success(`Upgraded ${u.track} → level ${u.level}`);
      await qc.invalidateQueries({ queryKey: ["ap"] });
      await qc.invalidateQueries({ queryKey: ["whoAmI"] });
      await qc.invalidateQueries({ queryKey: ["upgrades"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Upgrade failed"),
  });

  return (
    <div className="space-y-6">
      <section className="card-glass shimmer2 p-4">
        <h3 className="font-heading mb-2">Action Points</h3>
        {apLoading ? (
          <div className="opacity-70 text-sm">Loading…</div>
        ) : ap ? (
          <>
            <APAnimatedBar apNow={ap.apNow} apMax={ap.apMax} />
            <div className="text-sm opacity-80 mb-2">
              {ap.apNow} / {ap.apMax} • +1 in ~{Math.ceil((ap.nextInMs || 0) / 1000)}s
            </div>
            <button
              className="rounded-xl px-3 py-2 border text-sm"
              onClick={() => refetchAP()}
            >
              Refresh AP
            </button>
          </>
        ) : (
          <div className="opacity-70 text-sm">AP unavailable</div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          className="card-glass shimmer2 p-4 text-left btn-neon"
          onClick={() => pve.mutate("easy")}
        >
          <h4 className="font-heading mb-1">Run PvE (Easy)</h4>
          <p className="text-sm opacity-70">2 AP • ~10 XP • ~50 coins</p>
        </button>
        <button
          className="card-glass shimmer2 p-4 text-left btn-neon"
          onClick={() => jobStart.mutate("2h")}
        >
          <h4 className="font-heading mb-1">Start Job (2h)</h4>
          <p className="text-sm opacity-70">+150 coins • +15 XP</p>
        </button>
        <button
          className="card-glass shimmer2 p-4 text-left btn-neon"
          onClick={() => jobClaim.mutate()}
        >
          <h4 className="font-heading mb-1">Claim Job</h4>
          <p className="text-sm opacity-70">Collect when ready</p>
        </button>
        <button
          className="card-glass shimmer2 p-4 text-left btn-neon md:col-span-3"
          onClick={() => upgrade.mutate("sprint_path" as any)}
        >
          <h4 className="font-heading mb-1">Upgrade: Sprint Path</h4>
          <p className="text-sm opacity-70">+1 AP max</p>
        </button>
      </section>
    </div>
  );
}

function APAnimatedBar({ apNow, apMax }: { apNow: number; apMax: number }) {
  const pct = Math.min(100, (apNow / Math.max(1, apMax)) * 100);
  const [showSpark, setShowSpark] = React.useState(false);
  const prev = React.useRef(apNow);

  React.useEffect(() => {
    if (apNow > prev.current) {
      setShowSpark(true);
      const t = setTimeout(() => setShowSpark(false), 650);
      return () => clearTimeout(t);
    }
    prev.current = apNow;
  }, [apNow]);

  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2 relative">
      <motion.div
        className="h-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ boxShadow: "var(--glow-accent)", background: "hsl(var(--accent))" }}
      />
      {/* sparkle */}
      {showSpark ? <Sparkle leftPct={pct} /> : null}
    </div>
  );
}

function Sparkle({ leftPct }: { leftPct: number }) {
  const left = `${Math.max(0, Math.min(100, leftPct))}%`;
  return (
    <motion.div
      className="absolute top-0 -translate-x-1/2"
      style={{ left }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: -8 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="h-3 w-3 rounded-full bg-white/90"
        style={{ boxShadow: "var(--glow-gold)" }}
      />
    </motion.div>
  );
}

function TabLink(props: React.ComponentProps<typeof NavLink>) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        `px-3 py-2 rounded-xl border text-sm transition-transform active:scale-95 ${
          isActive ? "bg_white/10" : "hover:bg-white/5"
        }`.replace("bg_white", "bg-white")
      }
    />
  );
}

// Shared page transition wrapper
function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  );
}
