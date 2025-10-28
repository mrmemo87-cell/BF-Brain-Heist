
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { LeaderboardRow } from '@/services/data/types'

interface ClanCardProps {
  clan: LeaderboardRow
  isOpen: boolean
  onClose: () => void
}

const ClanCard = ({ clan, isOpen, onClose }: ClanCardProps) => {
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
                <Avatar className="h-24 w-24 rounded-lg border-4 border-p-400/30">
                  <AvatarImage src={clan.avatar_url} className="rounded-md" />
                  <AvatarFallback className="rounded-md">{clan.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="avatar-ring" />
              </div>

              <h2 className="mb-1 text-2xl font-bold text-p-50">{clan.name}</h2>
              <p className="mb-4 text-sm text-p-300">{clan.motto}</p>

              <div className="grid w-full grid-cols-2 gap-4 text-center">
                <div className="card-glass rounded-lg p-3">
                  <p className="text-xs text-p-400">Total XP</p>
                  <p className="text-lg font-semibold text-p-100">{clan.total_xp.toLocaleString()}</p>
                </div>
                <div className="card-glass rounded-lg p-3">
                  <p className="text-xs text-p-400">Avg Elo</p>
                  <p className="text-lg font-semibold text-p-100">{Math.round(clan.avg_elo)}</p>
                </div>
                <div className="card-glass rounded-lg p-3">
                  <p className="text-xs text-p-400">Members</p>
                  <p className="text-lg font-semibold text-p-100">{clan.member_count}</p>
                </div>
                <div className="card-glass rounded-lg p-3">
                  <p className="text-xs text-p-400">Rank</p>
                  <p className="text-lg font-semibold text-p-100">#{clan.rank}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ClanCard

