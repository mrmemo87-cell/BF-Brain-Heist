import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supa } from '@/SupabaseClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { usePresence } from '@/hooks/usePresence';

type PlayerRow = {
  user_id: string;
  username: string | null;
  batch: string | null;
  level: number | null;
  xp: number | null;
  coins: number | null;
  avatar_url: string | null;
  last_seen: string | null;
  presence: 'online' | 'idle' | 'away' | null;
  presence_color: 'green' | 'yellow' | 'red' | null;
  rank: number;
};

type ClanRow = {
  clan_id: string;
  clan_name: string;
  member_count: number;
  total_xp: number;
  avg_level: number;
  rank: number;
};

type Mode = 'players' | 'clans';
type Batch = 'GLOBAL' | '8A' | '8B' | '8C';

function timeAgo(iso?: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(diff / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export default function LeaderboardPanel() {
  const qc = useQueryClient();
  const [uid, setUid] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<Mode>('players');
  const [batch, setBatch] = React.useState<Batch>('GLOBAL');

  // keep presence + session warm
  usePresence(60_000);

  React.useEffect(() => {
    let alive = true;
    supa.auth.getUser().then(({ data }) => {
      if (alive) setUid(data.user?.id ?? null);
    }).catch(() => {});
    supa.rpc('session_start').catch(() => {});
    return () => { alive = false; };
  }, []);

  // AP (only needed in players mode)
  const { data: ap = { ap_now: 0, ap_max: 0 } } = useQuery({
    queryKey: ['ap-status'],
    queryFn: async () => {
      const r = await supa.rpc('ap_status');
      if (r.error) throw r.error;
      return r.data ?? { ap_now: 0, ap_max: 0 };
    },
    enabled: mode === 'players',
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Fetch function depending on mode
  const fetchKey = ['leaderboard', mode, batch];
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: fetchKey,
    queryFn: async () => {
      const payload: any = { limit_count: 50 };
      if (batch !== 'GLOBAL') payload.p_batch = batch;

      if (mode === 'players') {
        const r = await supa.rpc('leaderboard_players', payload);
        if (r.error) throw r.error;
        return (r.data as PlayerRow[]) ?? [];
      } else {
        const r = await supa.rpc('leaderboard_clans', payload);
        if (r.error) throw r.error;
        return (r.data as ClanRow[]) ?? [];
      }
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  const attack = useMutation({
    mutationFn: async (defenderId: string) => {
      const r = await supa.rpc('raid_attack', { defender_id: defenderId });
      if (r.error) throw r.error;
      return r.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['ap-status'] });
      await qc.invalidateQueries({ queryKey: fetchKey as any });
    },
  });

  // Focus refresh
  React.useEffect(() => {
    const cb = () => {
      if (document.visibilityState === 'visible') {
        supa.rpc('session_start').finally(() => refetch());
      }
    };
    document.addEventListener('visibilitychange', cb);
    return () => document.removeEventListener('visibilitychange', cb);
  }, [refetch]);

  const gradient =
    mode === 'players'
      ? 'from-cyan-500/10 via-fuchsia-500/10 to-amber-500/10'
      : 'from-emerald-500/10 via-sky-500/10 to-violet-500/10';

  return (
    <div className="p-4 space-y-4">
      {/* Top bar: mode + batch */}
      <div className={`rounded-2xl border border-white/10 bg-gradient-to-r ${gradient} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-white/80">
            <div className="text-lg font-semibold">
              {mode === 'players' ? 'Agents Leaderboard' : 'Clans Leaderboard'}
            </div>
            {mode === 'players' && (
              <div className="text-sm text-white/60">AP: {ap.ap_now ?? 0} / {ap.ap_max ?? 0}</div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Mode toggle */}
            <div className="bg-white/10 rounded-xl p-1 flex">
              {(['players','clans'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-lg text-sm transition
                    ${mode === m ? 'bg-white/80 text-black' : 'text-white hover:bg-white/20'}`}
                >
                  {m === 'players' ? 'Players' : 'Clans'}
                </button>
              ))}
            </div>

            {/* Batch chips */}
            <div className="bg-white/10 rounded-xl p-1 flex">
              {(['GLOBAL','8A','8B','8C'] as Batch[]).map(b => (
                <button
                  key={b}
                  onClick={() => setBatch(b)}
                  className={`px-3 py-1 rounded-lg text-sm transition
                    ${batch === b ? 'bg-white/80 text-black' : 'text-white hover:bg-white/20'}`}
                >
                  {b === 'GLOBAL' ? 'Global' : b}
                </button>
              ))}
            </div>

            <button
              className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20"
              onClick={() => refetch()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {isLoading && <div className="p-6 text-white/70">Loading leaderboard…</div>}
      {!isLoading && error && <div className="p-6 text-rose-400">Failed to load leaderboard.</div>}

      {!isLoading && !error && Array.isArray(data) && data.length === 0 && (
        <div className="text-white/60 p-6">No entries yet.</div>
      )}

      {!isLoading && !error && mode === 'players' && Array.isArray(data) && data.length > 0 && (
        <div className="space-y-3">
          {(data as PlayerRow[]).map((r) => {
            const displayName = (r.username && r.username.trim().length ? r.username : 'agent');
            const canAttack = !!uid && uid !== r.user_id && ((ap.ap_now ?? 0) >= 2);
            const isMe = uid === r.user_id;
            const dotColor =
              r.presence_color === 'green' ? 'bg-emerald-400' :
              r.presence_color === 'yellow' ? 'bg-amber-300' :
              'bg-rose-400';

            return (
              <div key={r.user_id} className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center text-white/60 font-mono">#{r.rank}</div>

                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-1 ring-white/20">
                      <AvatarImage src={r.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-white/10 text-white">
                        {displayName.slice(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -right-1 -bottom-1 h-3 w-3 rounded-full ring-2 ring-black/40 ${dotColor}`}
                      title={r.presence ?? 'away'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`truncate ${isMe ? 'text-teal-300' : 'text-white'}`}>
                        {displayName}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/80">
                        {r.batch || '—'}
                      </span>
                    </div>
                    <div className="text-sm text-white/60">
                      L{r.level ?? 1} • {r.xp ?? 0} XP • {r.coins ?? 0} coins
                      <span className="mx-2">•</span>
                      <span title={r.last_seen || ''}>seen {timeAgo(r.last_seen)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => attack.mutate(r.user_id)}
                    disabled={!canAttack || attack.isPending}
                    className={`px-3 py-1 rounded-lg text-black transition
                      ${canAttack ? 'bg-teal-400 hover:bg-teal-300' : 'bg-white/15 text-white/60 cursor-not-allowed'}`}
                    title={
                      isMe ? 'That’s you' :
                      (ap.ap_now ?? 0) < 2 ? 'Not enough AP (need 2)' :
                      'Attack!'
                    }
                  >
                    {attack.isPending ? 'Attacking…' : isMe ? 'You' : 'Attack'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && mode === 'clans' && Array.isArray(data) && data.length > 0 && (
        <div className="space-y-3">
          {(data as ClanRow[]).map((r) => (
            <div key={r.clan_id} className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 text-center text-white/60 font-mono">#{r.rank}</div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-white font-medium">{r.clan_name}</div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/80">
                      {r.member_count} members
                    </span>
                  </div>
                  <div className="text-sm text-white/60">
                    Total XP {r.total_xp ?? 0} • Avg L{Number(r.avg_level ?? 1).toFixed(1)}
                  </div>
                </div>

                {/* No attack in clan view */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
