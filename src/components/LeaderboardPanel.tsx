import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supa } from '@/SupabaseClient'
import { Button } from './ui/Button'
import RaidResultModal from '@/components/RaidResultModal'
import { useDataAPI } from '@/services/data'


function useMe() {
  const q = useQuery({
    queryKey:['me'],
    queryFn: async () => (await supa.auth.getUser()).data.user
  });
  return q.data;
}

export default function LeaderboardPanel() {
  const me = useMe();
  const dataAPI = useDataAPI();
  const [raidModal, setRaidModal] = React.useState({
    open: false,
    attacker: { name: '', avatar: null },
    defender: { name: '', avatar: null },
    win: false,
    coinsMoved: 0,
    xp: 0,
    pwin: 0,
    stealPct: 0
  });

  const rowsQ = useQuery({
    queryKey: ['leaderboardRows'],
    queryFn: async () => {
      const r = await supa.rpc('clans_leaderboard', { limit_count: 50 })
      if (r.error) throw r.error
      return r.data ?? []
    },
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  // clan rank map
  const clansQ = useQuery({
    queryKey:['clansMap'],
    queryFn: async () => {
      const r = await supa.rpc('clans_leaderboard', { limit_count: 50 });
      if (r.error) throw r.error;
      const list = r.data ?? [];
      return Object.fromEntries(list.map((c:any)=>[c.id, c.rank]));
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const attack = async (defenderId:string, defenderData: any) => {
    try {
      const result = await dataAPI.raidAttack(defenderId);

      setRaidModal({
        open: true,
        attacker: { name: me?.user_metadata?.full_name || 'You', avatar: null },
        defender: { name: defenderData.username, avatar: defenderData.avatar_url },
        win: result.win,
        coinsMoved: result.defenderCoinLoss || result.coins || 0,
        xp: result.xp,
        pwin: parseFloat((result.message?.match(/P\(win\)=([0-9.]+)/)?.[1] ?? '0.5')),
        stealPct: (parseFloat((result.message?.match(/В· ([0-9]+)% swing/)?.[1] ?? '0'))/100)
      });

      // refetch data
      rowsQ.refetch();
    } catch (error) {
      console.error('Attack failed:', error);
      alert(`Attack failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (rowsQ.isLoading)
    return (
      <div className="space-y-3">
        <div className="h-5 bg-white/10 rounded animate-pulse w-2/3" />
        <div className="h-5 bg-white/10 rounded animate-pulse w-5/6" />
        <div className="h-5 bg-white/10 rounded animate-pulse w-4/6" />
      </div>
    )

  if (rowsQ.isError)
    return (
      <div className="text-red-400 text-sm p-3 border border-red-500/30 rounded-xl">
        Failed to load leaderboard. {(rowsQ.error as any)?.message ?? 'RPC/network error'}
      </div>
    )

  const rows = Array.isArray(rowsQ.data) ? rowsQ.data : []

  return (
    <>
      <ul className="divide-y divide-white/10">
        {rows.map((r: any, i: number) => {
          const last = r?.last_seen ? new Date(r.last_seen) : null
          const dot =
            !last
              ? '#666'
              : Date.now() - last.getTime() <= 20 * 60 * 1000
              ? '#22c55e'
              : Date.now() - last.getTime() <= 60 * 60 * 1000
              ? '#f59e0b'
              : '#ef4444'

          const mine = me?.id === r.user_id;
          const myBatch = (me as any)?.user_metadata?.batch || (me as any)?.batch;
          const canAttack = !mine && r.batch && r.batch !== myBatch; // Can't attack users in same batch

          const rank = r.clan_id ? (clansQ.data?.[r.clan_id] ?? 'вЂ”') : null;

          return (
            <li key={r?.user_id ?? i} className="py-3 flex items-center gap-3">
              <img
                src={r?.avatar_url || '/avatar-placeholder.png'}
                onError={(e: any) => {
                  e.currentTarget.src = '/avatar-placeholder.png'
                }}
                className="w-8 h-8 rounded-lg object-cover"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r?.username ?? 'agent'}</span>
                  {r?.clan_name && <span className="text-xs opacity-70">вЂў {r.clan_name}{rank ? ` (#${rank})` : ''}</span>}
                </div>
                <div className="text-xs opacity-70 truncate">
                  L{Number(r?.level ?? 1)} В· {Number(r?.xp ?? 0)} XP В· {Number(r?.coins ?? 0)} coins
                </div>
              </div>

              {canAttack ? (
                <Button className="px-3 py-1 rounded-xl" onClick={()=>attack(r.user_id, r)}>Attack</Button>
              ) : (
                <span className="text-[11px] opacity-50">No PvP</span>
              )}

              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: dot }}
                title={last ? last.toLocaleString() : 'unknown'}
              />
            </li>
          )
        })}
      </ul>
      <RaidResultModal
        {...raidModal}
        onClose={() => setRaidModal(m => ({...m, open: false}))}
      />
    </>
  )
}



