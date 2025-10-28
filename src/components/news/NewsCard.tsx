// src/components/news/NewsCard.tsx
import React from 'react';

const palette: Record<string, {bg: string; border: string; text: string; badge: string;}> = {
  pvp_win:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text:'text-emerald-300', badge:'bg-emerald-500'},
  pvp_loss: { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text:'text-rose-300',    badge:'bg-rose-500'},
  purchase: { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  text:'text-violet-300',  badge:'bg-violet-500'},
  upgrade:  { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text:'text-amber-300',   badge:'bg-amber-500'},
  clan_join:{ bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    text:'text-cyan-300',    badge:'bg-cyan-500'},
  server_up:{ bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     text:'text-sky-300',     badge:'bg-sky-500'}
};

const zingers = {
  win: (w:string,l:string)=>[
    `${w} just cooked ${l} рџ”Ґ`,
    `${w} sent ${l} back to tutorial mode.`,
    `${w} farmed ${l} for XP like itвЂ™s 2010.`,
    `GG ${l} вЂ” ${w} says thanks for the coins.`
  ],
  loss: (w:string,l:string)=>[
    `${l} got flattened by ${w}. Ouch.`,
    `${w} ate ${l}вЂ™s lunch and the tray.`,
    `Plot twist: ${l} brought a spoon to a sword fight.`,
    `${w} speed-ran ${l}'s defenses.`
  ]
};

function pick<T>(arr:T[]){ return arr[Math.floor(Math.random()*arr.length)] }

export default function NewsCard({ ev }: { ev: any }) {
  const kind = ev.kind || 'server_up';
  const theme = palette[kind] ?? palette.server_up;

  // PvP layout with both avatars - for now, show actor as winner and parse body for context
  if (kind === 'pvp_win' || kind === 'pvp_loss' || kind === 'pvp') {
    const isWin = kind === 'pvp_win' || (ev.title && ev.title.includes('Victory'));
    const actorName = ev.actorName || 'Agent';
    const actorAvatar = ev.actorAvatar || '/avatar-placeholder.png';

    // For PvP, show the actor as the main player and a generic opponent
    const line = isWin
      ? pick(zingers.win(actorName, 'Opponent'))
      : pick(zingers.loss(actorName, 'Opponent'));

    return (
      <div className={`rounded-2xl border ${theme.border} ${theme.bg} p-4 overflow-hidden`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={actorAvatar} className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-400 shadow-[0_0_20px_#34d39966]" />
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${theme.badge}`} />
          </div>
          <div className="text-2xl font-heading tracking-wide">
            <span className={`${theme.text}`}>{actorName}</span>
            <span className="opacity-70"> vs </span>
            <span className="text-rose-300">Opponent</span>
          </div>
          <div className="relative ml-auto">
            <img src="/avatar-placeholder.png" className="w-14 h-14 rounded-xl object-cover ring-2 ring-rose-400 shadow-[0_0_20px_#f43f5e66]" />
          </div>
        </div>

        <div className="mt-3 text-sm opacity-90">{line}</div>
        <div className="mt-2 text-xs opacity-70">{ev.body || '+0 XP В· +0 coins'}</div>
        <div className="mt-2 text-[11px] opacity-50">{new Date(ev.createdAt).toLocaleString()}</div>
      </div>
    );
  }

  // default compact card
  return (
    <div className={`rounded-2xl border ${theme.border} ${theme.bg} p-4`}>
      <div className={`font-heading ${theme.text}`}>{(ev.title || ev.kind || '').toString().replace('_',' ').toUpperCase()}</div>
      {ev.body && <div className="opacity-80 text-sm mt-1">{ev.body}</div>}
      <div className="text-xs opacity-60 mt-1">{ev.actorName} вЂў {new Date(ev.createdAt).toLocaleString()}</div>
    </div>
  );
}
