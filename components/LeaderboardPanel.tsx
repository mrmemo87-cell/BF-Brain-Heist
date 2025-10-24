import { useQuery } from '@tanstack/react-query'
import { supa } from '../supabaseClient' // <- root → components → back to root

type Leader = {
  id: string
  username: string
  batch: string
  level: number
  xp: number
  coins: number
}

export default function LeaderboardPanel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supa.rpc('leaderboard', { limit_count: 25 })
      if (error) throw error
      return (data ?? []) as Leader[]
    },
  })

  return (
    <section className="glassmorphism rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading">Leaderboard</h3>
        <button className="rounded-xl px-3 py-1 border text-sm" onClick={() => refetch()}>
          Refresh
        </button>
      </div>

      {isLoading && <div className="opacity-70 text-sm">Loading…</div>}
      {error && <div className="text-red-400 text-sm">Failed to load leaderboard</div>}

      {!isLoading && data && data.length === 0 && (
        <div className="opacity-70 text-sm">No players yet.</div>
      )}

      {!isLoading && data && data.length > 0 && (
        <ol className="space-y-2">
          {data.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between rounded-xl border p-2">
              <div className="flex items-center gap-3">
                <span className="w-6 text-right opacity-70">#{i + 1}</span>
                <div>
                  <div className="font-heading">{p.username}</div>
                  <div className="text-xs opacity-70">Batch {p.batch} • L{p.level}</div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="opacity-80">{p.xp} XP</div>
                <div className="opacity-60">{p.coins} coins</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
