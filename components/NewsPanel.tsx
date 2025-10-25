import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useDataAPI } from '../services/data'

import Avatar from './ui/Avatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const kindStyle: Record<string,{bg:string; ring:string; icon:string; title:string}> = {
  pvp:      { bg:'from-fuchsia-500/20 to-cyan-400/15', ring:'shadow-fuchsia-400', icon:'⚔️', title:'PvP' },
  shop_buy: { bg:'from-emerald-400/20 to-cyan-400/15', ring:'shadow-emerald-400', icon:'🛒', title:'Shop' },
  equip:    { bg:'from-amber-400/20 to-pink-400/15',   ring:'shadow-amber-400',  icon:'🧰', title:'Equip' },
  quest:    { bg:'from-sky-400/20 to-violet-400/15',   ring:'shadow-sky-400',    icon:'📘', title:'Quest' },
  system:   { bg:'from-slate-300/15 to-slate-500/10',  ring:'shadow-slate-300',  icon:'🛰️', title:'System' },
  default:  { bg:'from-purple-400/20 to-cyan-400/15',  ring:'shadow-purple-400', icon:'🛰️', title:'News' },
}

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
    <div className="max-w-md mx-auto">
      {feed.data!.length === 0 && <div className="opacity-70 text-sm">No news yet.</div>}
      {feed.data?.map(n => {
        const k = kindStyle[n.kind] ?? kindStyle.default
        return (
          <motion.div key={n.id}
            initial={{opacity:0, y:10}}
            animate={{opacity:1, y:0}}
            transition={{delay: 0.02}}
            className={`rounded-2xl p-4 mb-3 card-glass bg-gradient-to-br ${k.bg}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl grid place-items-center ${k.ring}`} style={{boxShadow:'0 0 14px rgba(255,255,255,.15)'}}>
                <span>{k.icon}</span>
              </div>

              <div className="flex-1">
                <div className="font-heading text-lg">{n.title}</div>
                <div className="opacity-90 text-sm">{n.body}</div>
                <div className="flex items-center gap-2 mt-2 opacity-70 text-xs">
                  <Avatar src={n.actorAvatar} name={n.actorName ?? 'user'} size={20}/>
                  <span>{n.actorName ?? ''}</span> • <span>{dayjs(n.createdAt).fromNow()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
