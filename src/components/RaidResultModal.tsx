import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  open: boolean;
  onClose: () => void;
  attacker: { name: string; avatar?: string|null };
  defender: { name: string; avatar?: string|null };
  win: boolean;
  coinsMoved: number;
  xp: number;
  pwin: number;        // 0..1
  stealPct: number;    // 0..1
};

export default function RaidResultModal({
  open, onClose, attacker, defender, win, coinsMoved, xp, pwin, stealPct
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const zingersWin = [
    "Clean heist. They never saw it coming.",
    "Pocket lint? NahвЂ”pocket GOLD.",
    "Certified pickpocket. Try again, defender."
  ];
  const zingersLoss = [
    "Ouch. You got firewall'd into next week.",
    "They parried your vibe and your wallet.",
    "Skill issue? OrвЂ¦ luck tax."
  ];
  const line = win
    ? zingersWin[Math.floor(Math.random()*zingersWin.length)]
    : zingersLoss[Math.floor(Math.random()*zingersLoss.length)];

  async function shareShot() {
    // native share first
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Brain Heist вЂ” Raid Result',
          text: `${attacker.name} vs ${defender.name} вЂ” ${win ? 'WIN' : 'LOSS'} (${Math.round(stealPct*100)}% raid, ${coinsMoved} coins)`,
          url: window.location.origin
        });
        return;
      }
    } catch {}
    // fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${attacker.name} vs ${defender.name} вЂ” ${win ? 'WIN' : 'LOSS'} (${Math.round(stealPct*100)}% raid, ${coinsMoved} coins) вЂ” ${window.location.origin}`);
      // could show a toast here
    } catch {
      // noop
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={cardRef}
            onClick={(e)=>e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`w-[92vw] max-w-[480px] rounded-2xl border p-5 relative overflow-hidden
              ${win ? 'border-emerald-400/50 shadow-[0_0_60px_rgba(16,185,129,.25)]'
                    : 'border-fuchsia-400/50 shadow-[0_0_60px_rgba(232,121,249,.25)]'}
              bg-gradient-to-b from-white/10 to-transparent`}
          >
            {/* watermark / brand */}
            <div className="absolute top-3 right-4 text-xs tracking-widest opacity-60">BRAINвЂ†HEIST</div>

            {/* suspense pulse */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.2 }}
              className={`absolute -inset-8 blur-3xl opacity-30 ${win ? 'bg-emerald-500/20' : 'bg-fuchsia-500/20'}`}
            />

            {/* vs row */}
            <div className="relative z-10 flex items-center justify-between">
              <SideCard name={attacker.name} avatar={attacker.avatar} align="left" crown={win} />
              <div className="text-center">
                <motion.div
                  initial={{ scale: 1 }} animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-xl font-semibold opacity-80"
                >VS</motion.div>
                <div className="text-xs opacity-60">P(win) {Math.round(pwin*100)}%</div>
              </div>
              <SideCard name={defender.name} avatar={defender.avatar} align="right" crown={!win} dimWinner={!win}/>
            </div>

            {/* result */}
            <div className="relative z-10 mt-5 text-center">
              <div className={`text-2xl font-bold font-heading drop-shadow-md ${win ? 'text-emerald-400' : 'text-fuchsia-400'}`}>
                {win ? 'HEIST SUCCESS' : 'HEIST FOILED'}
              </div>
              <div className="mt-2 text-sm opacity-80">
                {win
                  ? <>Looted <span className="text-emerald-300 font-semibold">{coinsMoved}</span> coins В· <span className="opacity-70">{Math.round(stealPct*100)}%</span> raid вЂў +{xp} XP</>
                  : <>Lost <span className="text-fuchsia-300 font-semibold">{coinsMoved}</span> coins В· <span className="opacity-70">{Math.round(stealPct*100)}%</span> counter вЂў +{xp} XP</>}
              </div>
              <div className="mt-2 text-[13px] italic opacity-70">{line}</div>
            </div>

            {/* actions */}
            <div className="relative z-10 mt-5 flex gap-3">
              <button onClick={shareShot}
                className="flex-1 rounded-xl border border-white/15 bg-white/10 py-2 hover:bg-white/15 transition">
                Share
              </button>
              <button onClick={onClose}
                className="flex-1 rounded-xl border border-cyan-400/50 hover:border-cyan-400 py-2 transition">
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SideCard({
  name, avatar, align, crown, dimWinner
}: { name:string; avatar?:string|null; align:'left'|'right'; crown?:boolean; dimWinner?:boolean }) {
  return (
    <div className={`flex items-center gap-3 ${align==='right' ? 'flex-row-reverse text-right' : ''}`}>
      <div className={`relative size-16 rounded-2xl overflow-hidden border ${dimWinner ? 'opacity-70' : ''}`}>
        <img src={avatar || 'https://i.pravatar.cc/100?u=bh'} className="w-full h-full object-cover" />
        {crown && (
          <div className="absolute -top-1 -left-1 text-[18px]">рџ‘‘</div>
        )}
      </div>
      <div>
        <div className="font-semibold leading-tight">{name}</div>
        {/* small glow bar */}
        <div className="mt-1 h-1 rounded-full bg-gradient-to-r from-cyan-400/60 to-transparent w-16" />
      </div>
    </div>
  );
}
