import { useQuery } from '@tanstack/react-query'
import { useDataAPI } from '../services/data'
import { motion } from 'framer-motion'
import Avatar from './ui/Avatar'

export default function LeaderboardPanel() {
  const api = useDataAPI()
  const top = useQuery({ queryKey: ['leaderboardRows'], queryFn: () => api.leaderboardRows() })

  return (
    <section className="card-glass p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading">Leaderboard</h3>
        <button className="rounded-xl px-3 py-1 border text-sm" onClick={() => top.refetch()}>
          Refresh
        </button>
      </div>

      {top.isLoading && <div className="opacity-70 text-sm">Loading…</div>}
      {top.error && <div className="text-red-400 text-sm">Failed to load leaderboard</div>}

      {!top.isLoading && top.data && top.data.length === 0 && (
        <div className="opacity-70 text-sm">No players yet.</div>
      )}

      {!top.isLoading && top.data && top.data.length > 0 && (
        <ul className="space-y-2">
          {top.data?.map((row) => (
            <li key={row.user_id} className="card-glass p-3 rounded-2xl flex items-center gap-3">
              <div className="w-7 text-right font-heading">
                {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : row.rank}
              </div>
              <Avatar src={row.avatar_url} name={row.username} size={32} ring={row.rank <= 3} />
              <div className="flex-1 overflow-hidden">
                <div className="font-heading">{row.username}</div>
                <div className="opacity-70 text-xs">
                  Batch {row.batch} • L{row.level} • {row.xp} XP
                </div>
              </div>
              <div className="text-right text-sm">{row.coins}c</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
