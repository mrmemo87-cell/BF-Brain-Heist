import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataAPI } from '@/services/data'
import { toast } from '@/lib/toast'
import { useSfx } from '@/hooks/useSfx'
import { confettiBurst } from '@/lib/fx'

type Target = {
  id: string
  username: string
  avatarUrl?: string | null
  level?: number
  batch?: string
  power?: number
}
const QUIPS = [
  'Spinning up proxiesвЂ¦','Bribing the firewallвЂ¦','Decrypting memesвЂ¦',
  'Spoofing MAC & cheeseвЂ¦','Engaging stealth socksвЂ¦','Feeding the AI pizzaвЂ¦',
  'Minions are arguingвЂ¦','Tuning packet vibesвЂ¦','Hacking the planetвЂ¦'
]

function Avatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <div className="avatar-ring">
      {url ? (
        <img src={url} alt={name} className="w-[72px] h-[72px] rounded-full object-cover" />
      ) : (
        <div className="w-[72px] h-[72px] rounded-full grid place-items-center"
             style={{background:'linear-gradient(135deg,#1de5ff33,#ff35e533)'}}>
          <span className="font-heading text-xl">{name?.[0]?.toUpperCase() ?? 'A'}</span>
        </div>
      )}
    </div>
  )
}

export default function RaidDuelModal({
  open, onClose, me, target
}: {
  open: boolean
  onClose: () => void
  me: { username: string; avatarUrl?: string | null }
  target: Target
}) {
  const api = useDataAPI()
  const qc = useQueryClient()
  const sfx = useSfx()
  const [stage, setStage] = React.useState<'intro'|'loading'|'result'>('intro')
  const [quip, setQuip] = React.useState(QUIPS[0])
  const [res, setRes] = React.useState<null | { win:boolean; xp:number; coins:number }>(null)

  React.useEffect(() => { if (open){ setStage('intro'); setRes(null) } }, [open])

  React.useEffect(() => {
    if (stage !== 'loading') return
    let i = 0
    const iv = setInterval(() => setQuip(QUIPS[i++ % QUIPS.length]), 900)
    return () => clearInterval(iv)
  }, [stage])

  const attack = useMutation({
    mutationFn: () => api.raidAttack(target.id),
    onSuccess: (r: any) => {
      setRes({ win: r.win, xp: r.xp, coins: r.coins })
      setStage('result')
      if (r.win) {
        sfx.play('win')
        confettiBurst()
        toast.success('You won the raid!', `+${r.xp} XP В· +${r.coins} coins`)
      } else {
        sfx.play('wrong')
        toast.warn('You lost the raid', `+${r.xp} XP В· +${r.coins} coins`)
      }
      qc.invalidateQueries({ queryKey: ['newsFeed'] })
      qc.invalidateQueries({ queryKey: ['whoAmI'] })
    },
    onError: (e: any) => {
      toast.error('Raid failed', e.message ?? 'Unknown error')
      setStage('intro')
    }
  })

  const start = () => { setStage('loading'); attack.mutate() }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" onClick={onClose}
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div
            onClick={(e)=>e.stopPropagation()}
            className="mx-auto mt-10 w-[94vw] max-w-[640px] card-glass rounded-3xl p-5 shimmer2"
            initial={{y:40,opacity:0,scale:.98}}
            animate={{y:0,opacity:1,scale:1}}
            exit={{y:20,opacity:0,scale:.98}}
          >
            {/* avatars + VS */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <Avatar name={me.username} url={me.avatarUrl}/>
                <div className="mt-2 badge badge-win">YOU</div>
              </div>

              <div className="vs-orb grid place-items-center font-heading text-lg text-black/80">VS</div>

              <div className="text-center">
                <Avatar name={target.username} url={target.avatarUrl}/>
                <div className="mt-2 badge badge-lose">TARGET</div>
              </div>
            </div>

            {stage === 'intro' && (
              <div className="mt-6 text-center">
                <div className="font-heading text-xl gradient-text">Can you defeat {target.username}?</div>
                <div className="opacity-80 text-sm mt-1">
                  L{target.level ?? '?'} вЂў {target.batch ?? '8B'} вЂў Power {target.power ?? 'вЂ”'}
                </div>
                <button className="btn-neon rounded-xl px-5 py-2 mt-5 w-full" onClick={start}>
                  Begin Raid
                </button>
              </div>
            )}

            {stage === 'loading' && (
              <div className="mt-6 text-center">
                <div className="font-heading text-lg neon-head">{quip}</div>
                <div className="progress-neo mt-5"><span className="bar"></span></div>
                <div className="opacity-70 text-xs mt-2">no guarantees. only vibes.</div>
              </div>
            )}

            {stage === 'result' && res && (
              <div className="mt-6">
                <div className="text-center font-heading text-2xl mb-2 gradient-text">
                  {res.win ? 'Victory!' : 'DefeatedвЂ¦'}
                </div>
                <div className="text-center opacity-90">+{res.xp} XP В· +{res.coins} coins</div>
                <button className="btn-neon rounded-xl px-5 py-2 mt-5 w-full" onClick={onClose}>
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


