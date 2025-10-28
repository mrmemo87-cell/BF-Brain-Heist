export default function HelpQuickstart({ onClose }:{ onClose:()=>void }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60" onClick={onClose}>
      <div className="card-glass rounded-2xl p-5 w-[92vw] max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="font-heading text-xl mb-2">Quickstart</div>
        <ol className="list-decimal ml-4 space-y-2 text-sm opacity-90">
          <li>Go to <b>Quests в†’ MCQ</b>, pick subjects, answer to earn XP/coins.</li>
          <li>Open <b>Leaderboard</b>, tap a player to view & <b>Attack</b>.</li>
          <li>Visit <b>Shop</b> to buy & equip items.</li>
          <li>Join or create a <b>Clan</b>, chat, and compete.</li>
          <li>Watch <b>News</b> for raid results & upgrades.</li>
        </ol>
        <button className="btn-neon mt-4 w-full rounded-xl px-4 py-2" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}

