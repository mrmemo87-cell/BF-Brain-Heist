
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'

import { Icons } from '@/components/icons/Icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useDataAPI } from '@/hooks/useDataAPI'
import RaidDuelModal from '@/components/RaidDuelModal'
import { LeaderboardRow } from '@/services/data/types'

interface PlayerCardProps {
  player: LeaderboardRow
  me: LeaderboardRow
  isOpen: boolean
  onClose: () => void
}

const PlayerCard = ({ player, me, isOpen, onClose }: PlayerCardProps) => {
  const [isRaidModalOpen, setRaidModalOpen] = useState(false)
  const dataAPI = useDataAPI()
  const queryClient = useQueryClient()

  const handleAttack = () => {
    setRaidModalOpen(true)
  }

  const handleRaidComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    onClose()
  }

  const canAttack = me && player && me.id !== player.id

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={onClose}>
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="card-glass w-11/12 max-w-sm rounded-2xl border-2 border-p-400/20 bg-p-900/50 p-6 text-p-50 shadow-lg shadow-p-500/10"
            onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-p-400/30">
                  <AvatarImage src={player.avatar_url} />
                  <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="avatar-ring" />
              </div>

              <h2 className="mb-1 text-2xl font-bold text-p-50">{player.username}</h2>
              <p className="mb-4 text-sm text-p-300">Level {player.level}</p>

              <div className="grid w-full grid-cols-2 gap-4 text-center">
                <div className="card-glass rounded-lg p-3">
                  <p className="text-xs text-p-400">XP</p>
                  <p className="text-lg font-semibold text-p-100">{player.xp.toLocaleString()}</p>
                </div>
                <div className="card-glass rounded-lg p-3">
                  <p className="text-xs text-p-400">Elo</p>
                  <p className="text-lg font-semibold text-p-100">{player.elo_rating}</p>
                </div>
                <div className="card-glass rounded-lg p-3">
                  <p className="text-xs text-p-400">Wins</p>
                  <p className="text-lg font-semibold text-p-100">{player.wins}</p>
                </div>
                <div className="card-glass rounded-lg p-3">
                  <p className="text-xs text-p-400">Losses</p>
                  <p className="text-lg font-semibold text-p-100">{player.losses}</p>
                </div>
              </div>

              {canAttack && (
                <Button
                  className="btn-neon mt-6 w-full bg-red-500/80 text-white hover:bg-red-500"
                  onClick={handleAttack}>
                  <Icons.Swords className="mr-2 h-5 w-5" />
                  Attack
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      {isRaidModalOpen && me && player && (
        <RaidDuelModal
          attacker={me}
          defender={player}
          onClose={() => setRaidModalOpen(false)}
          onRaidComplete={handleRaidComplete}
        />
      )}
    </AnimatePresence>
  )
}

export default PlayerCard

