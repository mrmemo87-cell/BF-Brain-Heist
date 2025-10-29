import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supa } from '@/SupabaseClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

type Row = {
  user_id: string;
  name: string;
  batch: string;
  level: number;
  xp: number;
  coins: number;
  avatar_url?: string | null;
  rank: number;
};

export default function LeaderboardPanel() {
  const qc = useQueryClient();
  const [uid, setUid] = React.useState<string | null>(null);

  // who am I (just uid for disabling self-attack)
  React.useEffect(() => {
    let alive = true;
    supa.auth.getUser().then(({ data }) => {
      if (alive) setUid(data.user?.id ?? null);
    }).catch(() => {});
    // keep AP alive quietly
    supa.rpc('session_start').catch(() => {});
    return () => { alive = false; };
  }, []);

  // AP status (to disable attack if no AP)
  const { data: ap = { ap_now: 0, ap_max: 0 } } = useQuery({
    queryKey: ['ap-status'],
    queryFn: async () => {
      const r = await supa.rpc('ap_status');
      if (r.error) throw r.error;
      return r.data ?? { ap_now: 0, ap_max: 0 };
    },
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Leaderboard data
  const { data: rows = [], isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard', 50],
    queryFn: async () => {
      const r = await supa.rpc('clans_leaderboard', { limit_count: 50 });
      if (r.error) throw r.error;
      return (r.data as Row[]) ?? [];
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  // Attack action
  const attack = useMutation({
    mutationFn: async (defenderId: string) => {
      const r = await supa.rpc('raid_attack', { defender_id: defenderId });
      if (r.error) throw r.error;
      return r.data;
    },
    onSuccess: async () => {
      // refresh AP + board after a fight
      await qc.invalidateQueries({ queryKey: ['ap-status'] });
      await qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  // On tab focus, do a quick refresh (cheap)
  React.useEffect(() => {
    const cb = () => {
      if (document.visibilityState === 'visible') {
        supa.rpc('session_start').finally(() => refetch());
      }
    };
    document.addEventListener('visibilitychange', cb);
    return () => document.removeEventListener('visibilitychange', cb);
  }, [refetch]);

  if (isLoading) return <div className="p-6 text-white/70">Loading leaderboard…</div>;
  if (error)     return <div className="p-6 text-rose-400">Failed to load leaderboard.</div>;

  return (
    <div className="p-4 space-y-3">
      {/* header card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-amber-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="text-white/80">
            <div className="text-lg font-semibold">Global Leaderboard</div>
            <div className="text-sm text-white/60">AP: {ap.ap_now ?? 0} / {ap.ap_max ?? 0}</div>
          </div>
          <button
            className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </div>
      </div>

      {rows.map((r) => {
        const canAttack = !!uid && uid !== r.user_id && (ap.ap_now ?? 0) >= 2;
        const isMe = uid === r.user_id;

        return (
          <div
            key={r.user_id}
            className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 text-center text-white/60 font-mono">#{r.rank}</div>

              <Avatar className="h-12 w-12 ring-1 ring-white/20">
                <AvatarImage src={r.avatar_url ?? undefined} />
                <AvatarFallback className="bg-white/10 text-white">
                  {r.name?.slice(0,2)?.toUpperCase() || 'AG'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className={`truncate ${isMe ? 'text-teal-300' : 'text-white'}`}>
                    {r.name || 'agent'}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/80">
                    {r.batch || '—'}
                  </span>
                </div>
                <div className="text-sm text-white/60">
                  L{r.level ?? 1} • {r.xp ?? 0} XP • {r.coins ?? 0} coins
                </div>
              </div>

              <button
                onClick={() => attack.mutate(r.user_id)}
                disabled={!canAttack || attack.isPending}
                className={`px-3 py-1 rounded-lg text-black transition
                  ${canAttack
                    ? 'bg-teal-400 hover:bg-teal-300'
                    : 'bg-white/15 text-white/60 cursor-not-allowed'
                  }`}
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

      {rows.length === 0 && (
        <div className="text-white/60 p-6">No agents yet. Invite some friends 👀</div>
      )}
    </div>
  );
}
