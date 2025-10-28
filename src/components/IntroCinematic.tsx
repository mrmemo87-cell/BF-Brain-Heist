import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function IntroCinematic({ open, onClose }:{
  open: boolean, onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(0,255,255,.12), transparent), #0b0f17' }}
        >
          <motion.div
            initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .95, opacity: 0 }}
            className="w-[92vw] max-w-md rounded-3xl p-6 card-glass text-center"
          >
            <div className="font-heading text-2xl mb-2 gradient-text">Brain Heist</div>
            <p className="opacity-90 mb-3">Pick quests. Crack MCQs. Raid rivals. Upgrade your base. Earn XP and coins.</p>
            <ul className="text-left text-sm opacity-90 space-y-2 mb-4">
              <li>вЂў Tap <b>Quests в†’ MCQ</b> to start learning battles</li>
              <li>вЂў Open <b>Leaderboard</b> to view players, clans & attack</li>
              <li>вЂў Check <b>News</b> for wins, buys, equips, and more</li>
            </ul>
            <button
              className="btn-neon px-4 py-2 rounded-xl w-full"
              onClick={() => { localStorage.setItem('intro:v1','1'); onClose(); }}>
              IвЂ™m ready вљЎ
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

