import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useDataAPI } from '../services/data'

dayjs.extend(relativeTime)

export default function NewsPanel() {
  const api = useDataAPI()
  const feed = useQuery({
    queryKey: ['newsFeed'],
    queryFn: () => api.newsFeed(50),
    refetchInterval: 6000, // from 15s -> 6s
  })

  if (feed.isLoading) return <div className="opacity-70 text-sm">Loading feed…</div>
  if (feed.error) return <div className="text-red-400 text-sm">Failed to load news.</div>

  return (
    <ul className="max-w-md mx-auto">
      {feed.data!.length === 0 && <div className="opacity-70 text-sm">No news yet.</div>}
      {feed.data!.map((n: any, i: number) => (
        <motion.li
          key={n.id}
          initial={{opacity:0, y:10}}
          animate={{opacity:1, y:0}}
          transition={{delay: i*0.02}}
          className="card-glass rounded-2xl p-4 mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl grid place-items-center"
                 style={{background:'linear-gradient(135deg,hsl(var(--accent)),hsl(var(--primary)))',
                         boxShadow:'0 0 16px hsl(var(--primary))'}}>
              {n.kind === 'pvp' ? '⚔️' : n.kind === 'shop_buy' ? '🛒' : n.kind === 'equip' ? '🧰' : '🛰️'}
            </div>
            <div className="flex-1">
              <div className="font-heading text-lg">{n.title}</div>
              <div className="opacity-85 text-sm">{n.body}</div>
              <div className="opacity-60 text-xs mt-1">{n.actorName ?? ''} • {dayjs(n.createdAt).fromNow()}</div>
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}
