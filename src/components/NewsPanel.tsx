import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useDataAPI } from '@/services/data'
import { SkeletonRow } from './ui/Skeleton'
import NewsCard from '@/components/news/NewsCard'


export default function NewsPanel() {
  const api = useDataAPI()
  const feed = useQuery({
    queryKey: ['newsFeedRich'],
    queryFn: () => api.newsFeedRich(20),
    refetchInterval: 15000,
  })

  function hueFor(row: any) { // 5..80% -> green to red
    const s = Math.min(0.8, Math.max(0.05, Number(row.steal_pct||0)));
    return s < 0.2 ? 'border-emerald-400/50'
         : s < 0.4 ? 'border-lime-400/50'
         : s < 0.6 ? 'border-amber-400/50'
         : 'border-fuchsia-400/50';
  }

  return (
    <div className="max-w-md mx-auto">
      {feed.isLoading && (
        <div className="space-y-3">
          <SkeletonRow w="65%" />
          <SkeletonRow w="90%" />
          <SkeletonRow w="75%" />
        </div>
      )}
      {feed.error && <div className="text-red-400 text-sm">Failed to load. Pull to refresh.</div>}
      {!feed.isLoading && !feed.error && feed.data?.length === 0 && (
        <div className="opacity-70 text-sm">Nothing yet вЂ” do a quest or attack to see updates.</div>
      )}
      {feed.data?.map((row: any) => (
        <motion.div
          key={row.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="mb-3">
          <div className={`rounded-2xl border ${hueFor(row)} bg-white/5 p-3`}>
            {row.kind==='pvp' ? (
              <div className="flex items-center gap-3">
                <img className="size-10 rounded-xl" src={row.attacker_avatar || 'https://i.pravatar.cc/80?u=a'} />
                <div className="text-sm">
                  <span className="font-semibold">{row.attacker_name}</span>
                  <span className="opacity-70"> raided </span>
                  <span className="font-semibold">{row.defender_name}</span>
                  <span className="opacity-70"> for </span>
                  <span className="font-semibold">{row.coins_moved} coins</span>
                  <span className="opacity-70"> ({Math.round((row.steal_pct||0)*100)}%)</span>
                  <div className="text-xs opacity-60">
                    {row.title} вЂ” {row.body}
                  </div>
                </div>
                <img className="size-10 rounded-xl ml-auto" src={row.defender_avatar || 'https://i.pravatar.cc/80?u=d'} />
              </div>
            ) : (
              <div className="text-sm">{row.title} <span className="opacity-70">вЂ” {row.body}</span></div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}


