import React, { useEffect, useMemo, useState } from "react";
import { supa } from "@/SupabaseClient";
import RaidResultModal from "@/components/RaidResultModal";

type ProfileRow = {
  id: string;
  username: string | null;
  batch: string | null;
  level: number | null;
  xp: number | null;
  coins: number | null;
  avatar_url: string | null;
  last_seen: string | null;
};

type AttackResult = {
  win: boolean;
  coins_moved: number;
  xp_gain: number;
  pwin: number;
  steal_pct: number;
  attacker_name: string;
  attacker_avatar: string | null;
  defender_name: string;
  defender_avatar: string | null;
};

export default function LeaderboardPanel() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [attackingId, setAttackingId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        try { await supa.rpc("session_start"); } catch {}
        const { data, error } = await supa
          .from("profiles")
          .select("id,username,batch,level,xp,coins,avatar_url,last_seen")
          .order("xp", { ascending: false })
          .limit(50);
        if (error) throw error;
        if (alive) setRows(data ?? []);
      } catch (e) {
        console.error("load leaderboard failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function onAttack(target: ProfileRow) {
    const name = target.username ?? "agent";
    if (!confirm(`Attack ${name}? (Costs 2 AP)`)) return;

    setAttackingId(target.id);
    try {
      try { await supa.rpc("session_start"); } catch {}
      const { data, error } = await supa.rpc("raid_attack", { defender_id: target.id });
      if (error) throw error;

      const ar: AttackResult = {
        win: !!data?.win,
        coins_moved: Number(data?.coins_moved ?? 0),
        xp_gain: Number(data?.xp_gain ?? 0),
        pwin: Number(data?.pwin ?? 0),
        steal_pct: Number(data?.steal_pct ?? 0),
        attacker_name: String(data?.attacker_name ?? "You"),
        attacker_avatar: data?.attacker_avatar ?? null,
        defender_name: String(data?.defender_name ?? name),
        defender_avatar: data?.defender_avatar ?? target.avatar_url ?? null,
      };
      setAttackResult(ar);
      setOpenModal(true);
    } catch (e: any) {
      alert(`Attack failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setAttackingId(null);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      {loading ? <SkeletonList /> : (
        <ul className="space-y-3">
          {rows.map(r => (
            <li key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-3">
                <Avatar src={r.avatar_url} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.username ?? "agent"}</span>
                    <OnlineDot lastSeen={r.last_seen} />
                  </div>
                  <div className="text-xs opacity-70">
                    L{r.level ?? 1} · {r.xp ?? 0} XP · {r.coins ?? 0} coins{r.batch ? ` · ${r.batch}` : ""}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onAttack(r)}
                disabled={attackingId === r.id}
                className="rounded-lg px-4 py-1.5 border border-cyan-400/60 bg-cyan-400/10 hover:bg-cyan-400/15 disabled:opacity-50 transition"
              >
                {attackingId === r.id ? "Attacking…" : "Attack"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {attackResult && (
        <RaidResultModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          attacker={{ name: attackResult.attacker_name, avatar: attackResult.attacker_avatar }}
          defender={{ name: attackResult.defender_name, avatar: attackResult.defender_avatar }}
          win={attackResult.win}
          coinsMoved={attackResult.coins_moved}
          xp={attackResult.xp_gain}
          pwin={attackResult.pwin}
          stealPct={attackResult.steal_pct}
        />
      )}
    </div>
  );
}

function Avatar({ src }: { src: string | null | undefined }) {
  return (
    <div className="size-10 rounded-lg overflow-hidden border border-white/10 bg-black/30">
      <img alt="" src={src || "https://i.pravatar.cc/100?u=bh"} className="w-full h-full object-cover" />
    </div>
  );
}
function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}
function OnlineDot({ lastSeen }: { lastSeen: string | null }) {
  const color = useMemo(() => {
    if (!lastSeen) return "bg-red-500";
    const mins = (Date.now() - new Date(lastSeen).getTime()) / 60000;
    if (mins <= 5) return "bg-green-500";
    if (mins <= 30) return "bg-yellow-500";
    return "bg-red-500";
  }, [lastSeen]);
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}
