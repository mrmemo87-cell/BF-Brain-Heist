import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supa } from '@/SupabaseClient';

export default function LeaderboardPanel() {
  const qc = useQueryClient();

  // load leaderboard
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['leaderboard', 50],
    queryFn: async () => {
      const r = await supa.rpc('clans_leaderboard', { limit_count: 50 });
      if (r.error) throw r.error;
      return r.data ?? [];
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,             // gentle keep-alive
    refetchIntervalInBackground: true,
  });

  // start session (non-fatal, keeps AP flowing)
  React.useEffect(() => {
    supa.rpc('session_start').catch(() => {});
  }, []);

  // attack mutation
  const attack = useMutation({
    mutationFn: async (defenderId: string) => {
      const r = await supa.rpc('raid_attack', { defender_id: defenderId });
      if (r.error) throw r.error;
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaderboard'] }),
  });

  if (isLoading) return <div className="p-4 text-white/70">Loading…</div>;
  if (error)     return <div className="p-4 text-rose-400">Failed to load leaderboard.</div>;

  return (
    <div className="p-4 space-y-3">
      {rows.map((r: any) => (
        <div key={r.clan_id} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
          <div className="text-white">{r.name ?? '—'}</div>
          <button
            className="px-3 py-1 rounded-lg bg-teal-500/80 hover:bg-teal-500 text-black"
            onClick={() => attack.mutate(r.clan_id)}
            disabled={attack.isPending}
          >
            {attack.isPending ? 'Attacking…' : 'Attack'}
          </button>
        </div>
      ))}
    </div>
  );
}
