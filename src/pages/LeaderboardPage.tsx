import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supa } from '@/SupabaseClient';
import RaidResultModal from '@/components/RaidResultModal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

type PlayerRow = {
  user_id: string;
  username: string | null;
  batch: string | null;
  level: number | null;
  xp: number | null;
  coins: number | null;
  avatar_url: string | null;
  last_seen: string | null;
  presence_color: 'green' | 'yellow' | 'red' | null;
  rank: number;
};

type RaidResult = {
  win: boolean;
  coins_moved: number;
  xp: number;
  pwin?: number;
  steal_pct?: number;
  attacker_id?: string;
  defender_id?: string;
};

function timeAgo(iso?: string | null) {
  if (!iso) return '—';
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(d / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export default function LeaderboardPanel() {
  const qc = useQueryClient();
  const [uid, setUid] = React.useState<string | null>(null);
  const [batch, setBatch] = React.useState<'GLOBAL'|'8A'|'8B'|'8C'>('GLOBAL');

  // Confirm + Result state
  const [toAttack, setToAttack] = React.useState<PlayerRow | null>(null);
  const [resultOpen, setResultOpen] = React.useState(false);
  const [result, setResult] = React.useState<RaidResult | null>(null);
  const [attackerName, setAttackerName] = React.useState<string>('you');
  const [attackerAvatar, setAttackerAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    supa.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUid(data.user?.id ?? null);
    });
    supa.rpc('session_start').catch(()=>{});
    return () => { alive = false; };
  }, []);

  const { data: ap = { ap_now: 0, ap_max: 0 } } = useQuery({
    queryKey: ['ap-status'],
    queryFn: async () => {
      const r = await supa.rpc('ap_status');
      if (r.error) throw r.error;
      return r.data ?? { ap_now: 0, ap_max: 0 };
    },
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['lb', batch],
    queryFn: async () => {
      const payload: any = { limit_count: 50 };
      if (batch !== 'GLOBAL') payload.p_batch = batch;
      const r = await supa.rpc('leaderboard_players', payload);
      if (r.error) throw r.error;
      return (r.data as PlayerRow[]) ?? [];
    },
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  // Load attacker display from current profile (best effort)
  React.useEffect(() => {
    (async () => {
      if (!uid) return;
      const r = await supa
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', uid)
        .single();
      if (!r.error && r.data) {
        setAttackerName(r.data.username || 'you');
        setAttackerAvatar(r.data.avatar_url || null);
      }
    })();
  }, [uid]);

  const mutateAttack = useMutation({
    mutationFn: async (defenderId: string) => {
      const r = await supa.rpc('raid_attack', { defender_id: defenderId });
      if (r.error) throw r.error;
      return r.data as any;
    },
    onSuccess: async (data) => {
      // Map backend fields → modal props
      const mapped: RaidResult = {
        win: !!(data.win ?? data.attacker_won ?? data.success),
        coins_moved: Math.abs(Number(data.coins_delta ?? data.coins_moved ?? 0)),
        xp: Number(data.xp_delta ?? data.xp ?? 0),
        pwin: typeof data.pwin === 'number' ? data.pwin : undefined,
        steal_pct: typeof data.steal_pct === 'number' ? data.steal_pct : undefined,
        attacker_id: data.attacker_id,
        defender_id: data.defender_id
      };
      setResult(mapped);
      setResultOpen(true);

      await qc.invalidateQueries({ queryKey: ['ap-status'] });
      await qc.invalidateQueries({ queryKey: ['lb'] });
    },
    onError: (e: any) => {
      const m = (e?.message || '').toLowerCase();
      if (m.includes('not enough ap')) alert('Not enough AP (need 2).');
      else alert(e?.message || 'Attack failed.');
    }
  });

  async function resolveDisplayName(userId?: string | null) {
    if (!userId) return { name: 'agent', avatar: null };
    const inList = rows.find(r => r.user_id === userId);
    if (inList) return { name: inList.username || 'agent', avatar: inList.avatar_url || null };
    const r = await supa.from('profiles').select('username, avatar_url').eq('id', userId).single();
    if (!r.error && r.data) return { name: r.data.username || 'agent', avatar: r.data.avatar_url || null };
    return { name: 'agent', avatar: null };
  }

  const batches: Array<'GLOBAL'|'8A'|'8B'|'8C'> = ['GLOBAL','8A','8B','8C'];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white/80">
          <div className="text-lg font-semibold">Agents Leaderboard</div>
          <div className="text-sm text-white/60">AP: {ap.ap_now ?? 0} / {ap.ap_max ?? 0}</div>
        </div>

        <div className="flex gap-2 bg-white/10 rounded-xl p-1">
          {batches.map(b => (
            <button
              key={b}
              onClick={() => setBatch(b)}
              className={`px-3 py-1 rounded-lg text-sm ${batch===b?'bg-white/90 text-black':'text-white hover:bg-white/20'}`}
            >
              {b==='GLOBAL'?'Global':b}
            </button>
          ))}
          <button onClick={() => refetch()} className="px-3 py-1 rounded-lg text-sm text-white hover:bg-white/20">
            Refresh
          </button>
        </div>
      </div>

      {isLoading && <div className="text-white/70">Loading…</div>}
      {!isLoading && rows.length === 0 && <div className="text-white/60">No players yet.</div>}

      <div className="space-y-3">
        {rows.map(r => {
          const me = uid === r.user_id;
          const canAttack = !!uid && !me && (ap.ap_now ?? 0) >= 2;
          const dot =
            r.presence_color === 'green' ? 'bg-emerald-400' :
            r.presence_color === 'yellow' ? 'bg-amber-300' : 'bg-rose-400';
          const name = r.username?.trim() || 'agent';

          return (
            <div key={r.user_id} className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 text-center text-white/60 font-mono">#{r.rank}</div>

                <div className="relative">
                  <Avatar className="h-12 w-12 ring-1 ring-white/20">
                    <AvatarImage src={r.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-white/10 text-white">
                      {name.slice(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute -right-1 -bottom-1 h-3 w-3 rounded-full ring-2 ring-black/40 ${dot}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`truncate ${me?'text-teal-300':'text-white'}`}>{name}</div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/80">{r.batch || '—'}</span>
                  </div>
                  <div className="text-sm text-white/60">
                    L{r.level ?? 1} • {r.xp ?? 0} XP • {r.coins ?? 0} coins
                    <span className="mx-2">•</span>
                    seen {timeAgo(r.last_seen)}
                  </div>
                </div>

                <button
                  disabled={!canAttack || mutateAttack.isPending}
                  onClick={() => setToAttack(r)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
                    ${canAttack ? 'bg-teal-500 hover:bg-teal-400 text-white' : 'bg-white/15 text-white/60 cursor-not-allowed'}`}
                >
                  {me ? 'You' : 'Attack'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm simple dialog */}
      {toAttack && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-5 text-white">
            <div className="text-lg font-semibold mb-1">Confirm attack?</div>
            <div className="text-white/70 text-sm mb-4">
              Yo Agent, attacking <span className="text-white font-medium">{toAttack.username || 'agent'}</span> costs <b>2 AP</b>.
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15" onClick={()=>setToAttack(null)}>Cancel</button>
              <button
                className="px-3 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium"
                onClick={async () => {
                  const target = toAttack;
                  setToAttack(null);
                  if (!target) return;
                  try {
                    const data = await mutateAttack.mutateAsync(target.user_id);
                    // Map data → show modal
                    const mapped: RaidResult = {
                      win: !!(data.win ?? data.attacker_won ?? data.success),
                      coins_moved: Math.abs(Number(data.coins_delta ?? data.coins_moved ?? 0)),
                      xp: Number(data.xp_delta ?? data.xp ?? 0),
                      pwin: typeof data.pwin === 'number' ? data.pwin : undefined,
                      steal_pct: typeof data.steal_pct === 'number' ? data.steal_pct : undefined,
                      attacker_id: data.attacker_id,
                      defender_id: data.defender_id
                    };
                    setResult(mapped);
                    setResultOpen(true);
                  } catch {/* handled in onError */}
                }}
              >
                Send it 💥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {resultOpen && result && (
        <RaidResultWrapper
          open={resultOpen}
          result={result}
          attacker={{ id: uid, fallbackName: attackerName, fallbackAvatar: attackerAvatar }}
          onClose={() => setResultOpen(false)}
          resolveDisplay={resolveDisplayName}
        />
      )}
    </div>
  );
}

function RaidResultWrapper({
  open, result, attacker, onClose, resolveDisplay
}: {
  open: boolean;
  result: RaidResult;
  attacker: { id: string|null; fallbackName: string; fallbackAvatar: string|null };
  onClose: () => void;
  resolveDisplay: (uid?: string|null) => Promise<{name:string; avatar:string|null}>;
}) {
  const [names, setNames] = React.useState<{aName:string; aAvatar:string|null; dName:string; dAvatar:string|null} | null>(null);

  React.useEffect(() => {
    (async () => {
      const atk = attacker.id ? await resolveDisplay(attacker.id) : { name: attacker.fallbackName, avatar: attacker.fallbackAvatar };
      const def = await resolveDisplay(result.defender_id);
      setNames({ aName: atk.name || attacker.fallbackName, aAvatar: atk.avatar ?? attacker.fallbackAvatar, dName: def.name, dAvatar: def.avatar });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!names) return null;

  return (
    <RaidResultModal
      open={open}
      onClose={onClose}
      attacker={{ name: names.aName, avatar: names.aAvatar }}
      defender={{ name: names.dName, avatar: names.dAvatar }}
      win={!!result.win}
      coinsMoved={result.coins_moved ?? 0}
      xp={result.xp ?? 0}
      pwin={result.pwin ?? 0}
      stealPct={result.steal_pct ?? 0}
    />
  );
}
