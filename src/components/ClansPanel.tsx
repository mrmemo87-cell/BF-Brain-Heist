import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supa } from '@/SupabaseClient'
import { SkeletonRow } from './ui/Skeleton'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

export default function ClansPanel() {
  const qc = useQueryClient()
  const [name, setName] = React.useState('')
  const [don, setDon] = React.useState(100)
  const [noticeDraft, setNoticeDraft] = React.useState('')

  const mine = useQuery({
    queryKey: ['clanInfo'],
    queryFn: async () => {
      const { data, error } = await supa.rpc('clan_info')
      if (error) throw error
      return data as any
    }
  })

  const list = useQuery({
    queryKey: ['clansList'],
    queryFn: async () => {
      const { data, error } = await supa.rpc('clans_list')
      if (error) throw error
      return (data ?? []) as any[]
    }
  })

  const useSupabase = (import.meta as any).env.VITE_BACKEND === 'supabase'
  const board = useQuery({
    queryKey: ['clansBoard'],
    enabled: useSupabase,
    queryFn: async () => {
      if (!useSupabase) return [] as any[]
      const r = await supa.rpc('clans_leaderboard', { limit_count: 20 })
      if (r.error) {
        console.warn('clans_leaderboard missing/failing, falling back:', r.error)
        return []
      }
      return (r.data ?? []) as any[]
    }
  })

  React.useEffect(() => {
    if (mine.data?.clan?.notice !== undefined) setNoticeDraft(mine.data.clan.notice ?? '')
  }, [mine.data?.clan?.notice])

  const refetchAll = async () => {
    await qc.invalidateQueries({ queryKey: ['whoAmI'] })
    await qc.invalidateQueries({ queryKey: ['clanInfo'] })
    await qc.invalidateQueries({ queryKey: ['clansList'] })
    await qc.invalidateQueries({ queryKey: ['clansBoard'] })
  }

  const createClan = useMutation({
    mutationFn: async () => {
      const { data, error } = await supa.rpc('clan_create', { p_name: name.trim() })
      if (error) throw error
      return data
    },
    onSuccess: async () => { setName(''); await refetchAll() },
    onError: (e:any)=> alert(e.message ?? 'Create failed')
  })

  const joinClan = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supa.rpc('clan_join', { p_clan_id: id })
      if (error) throw error
      return data
    },
    onSuccess: refetchAll,
    onError: (e:any)=> alert(e.message ?? 'Join failed')
  })

  const leaveClan = useMutation({
    mutationFn: async () => {
      const { data, error } = await supa.rpc('clan_leave')
      if (error) throw error
      return data
    },
    onSuccess: refetchAll,
    onError: (e:any)=> alert(e.message ?? 'Leave failed')
  })

  const donate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supa.rpc('clan_donate', { p_amount: don })
      if (error) throw error
      return data
    },
    onSuccess: refetchAll,
    onError: (e:any)=> alert(e.message ?? 'Donate failed')
  })

  const upgrade = useMutation({
    mutationFn: async (track: 'ap_aura'|'pve_boost'|'shield_boost') => {
      const { data, error } = await supa.rpc('clan_upgrade', { p_track: track })
      if (error) throw error
      return data
    },
    onSuccess: refetchAll,
    onError: (e:any)=> alert(e.message ?? 'Upgrade failed')
  })

  const setNotice = useMutation({
    mutationFn: async () => {
      const { data, error } = await supa.rpc('clan_set_notice', { p_notice: noticeDraft })
      if (error) throw error
      return data
    },
    onSuccess: refetchAll,
    onError: (e:any)=> alert(e.message ?? 'Update notice failed')
  })

  const setRole = useMutation({
    mutationFn: async (args: { userId: string; role: 'member'|'officer' }) => {
      const { data, error } = await supa.rpc('clan_set_role', {
        p_user_id: args.userId, p_role: args.role
      })
      if (error) throw error
      return data
    },
    onSuccess: refetchAll,
    onError: (e:any)=> alert(e.message ?? 'Role change failed')
  })

  const transferLead = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supa.rpc('clan_transfer_lead', { p_user_id: userId })
      if (error) throw error
      return data
    },
    onSuccess: refetchAll,
    onError: (e:any)=> alert(e.message ?? 'Transfer failed')
  })

  const clan = mine.data?.clan
  const myRole = mine.data?.myRole as 'leader'|'officer'|'member'|null
  const myId = mine.data?.myUserId as string | undefined
  const isLeader = myRole === 'leader'
  const canManage = myRole === 'leader' || myRole === 'officer'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* My clan */}
      <section className="card-glass shimmer p-4">
        <h3 className="font-heading mb-2">My Clan</h3>
        {!clan ? (
          <div className="space-y-3">
            <div className="opacity-70 text-sm">Not in a clan.</div>
            <div className="flex gap-2">
              <input className="border rounded-lg px-3 py-2 bg-transparent"
                     placeholder="Clan name"
                     value={name}
                     onChange={e=>setName(e.target.value)} />
              <button className="border rounded-lg px-3"
                      onClick={()=>createClan.mutate()}
                      disabled={!name.trim()}>
                Create
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2">
              <div className="font-heading text-lg">{clan.name}</div>
              <div className="text-sm opacity-70">
                Vault: {clan.vault} • Leader: {clan.leaderName ?? String(clan.leaderId).slice(0,8) + '…'}
              </div>
              {!canManage ? (
                <div className="text-sm">{clan.notice ?? 'No notice'}</div>
              ) : (
                <div className="mt-2">
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 bg-transparent"
                    rows={3}
                    value={noticeDraft}
                    onChange={e=>setNoticeDraft(e.target.value)}
                    placeholder="Clan notice…"
                  />
                  <button className="mt-2 border rounded-lg px-3 py-1 text-sm"
                          onClick={()=>setNotice.mutate()}
                          disabled={setNotice.isPending}>
                    {setNotice.isPending ? 'Saving…' : 'Save Notice'}
                  </button>
                </div>
              )}
            </div>

            <div className="mb-3">
              <h4 className="font-heading">Upgrades</h4>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['ap_aura','pve_boost','shield_boost'].map(t=>{
                  const level = mine.data?.upgrades?.find((u:any)=>u.track===t)?.level ?? 0
                  return (
                    <motion.button key={t}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      className="border rounded-lg px-3 py-2 text-left disabled:opacity-50"
                      onClick={()=>upgrade.mutate(t as any)}
                      disabled={!canManage || upgrade.isPending}>
                      <div className="font-heading text-sm">{t}</div>
                      <div className="text-xs opacity-70">Level {level}</div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="mb-3">
              <h4 className="font-heading">Donate</h4>
              <div className="flex gap-2 mt-1">
                <input className="border rounded-lg px-3 py-2 w-28 bg-transparent"
                       type="number" value={don} min={1}
                       onChange={e=>setDon(parseInt(e.target.value||'0'))}/>
                <button className="border rounded-lg px-3 btn-neon"
                        onClick={()=>donate.mutate()}>
                  Donate
                </button>
              </div>
            </div>

            <div className="mb-2">
              <h4 className="font-heading">Members</h4>
              <ul className="mt-2 space-y-1">
                {(mine.data?.members ?? []).map((m:any)=>(
                  <li key={m.userId} className="text-sm opacity-90 flex items-center justify-between">
                    <span>{(m.username ?? m.userId.slice(0,8))} • {m.role}</span>
                    {isLeader && m.userId !== myId && (
                      <div className="flex gap-2">
                        {m.role === 'member' && (
                          <button className="border rounded-lg px-2 py-1 text-xs"
                                  onClick={()=>setRole.mutate({ userId: m.userId, role: 'officer' })}>
                            Promote
                          </button>
                        )}
                        {m.role === 'officer' && (
                          <button className="border rounded-lg px-2 py-1 text-xs"
                                  onClick={()=>setRole.mutate({ userId: m.userId, role: 'member' })}>
                            Demote
                          </button>
                        )}
                        <button className="border rounded-lg px-2 py-1 text-xs"
                                onClick={()=>transferLead.mutate(m.userId)}>
                          Transfer Lead
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <button className="mt-3 border rounded-lg px-3 py-2"
                    onClick={()=>leaveClan.mutate()}>
              Leave Clan
            </button>
          </>
        )}
      </section>

      {/* Discover + Top Clans */}
      <section className="card-glass shimmer p-4">
        <h3 className="font-heading mb-2">Discover Clans</h3>
        {list.isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <SkeletonRow />
              </div>
            ))}
          </div>
        ) : list.error ? (
          <div className="text-red-400 text-sm">Failed to load clans.</div>
        ) : list.data?.length === 0 ? (
          <div className="opacity-70 text-sm">No clans to discover.</div>
        ) : (
          <div className="space-y-2">
            {list.data!.map((c, i) => (
              <motion.div
                key={c.id}
                className="rounded-xl border p-3 flex items-center justify-between"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut', delay: Math.min(0.02 * i, 0.25) }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div>
                  <div className="font-heading">{c.name}</div>
                  <div className="text-xs opacity-70">{c.members} members • Vault {c.vault}</div>
                  <div className="text-xs opacity-70">{c.notice ?? 'No notice'}</div>
                </div>
                {!mine.data?.clan && (
                  <button className="border rounded-lg px-3 py-1 text-sm" onClick={() => joinClan.mutate(c.id)}>
                    Join
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Top Clans */}
        <h3 className="font-heading mt-6 mb-2">Top Clans</h3>
        {useSupabase && board.isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <SkeletonRow />
              </div>
            ))}
          </div>
        ) : useSupabase && board.error ? (
          <div className="text-red-400 text-sm">Failed to load leaderboard.</div>
        ) : useSupabase && board.data && board.data.length > 0 ? (
          <ol className="space-y-2">
            {board.data!.map((c: any, i: number) => (
              <motion.li
                key={c.id}
                className="rounded-xl border p-3 flex items-center justify-between"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut', delay: Math.min(0.02 * i, 0.25) }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right opacity-60">#{i + 1}</span>
                  <div>
                    <div className="font-heading">{c.name}</div>
                    <div className="text-xs opacity-70">
                      {c.members} members • avg L{c.avgLevel}{c.leaderName ? ` • Lead ${c.leaderName}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-sm opacity-80">{c.totalXp} XP</div>
              </motion.li>
            ))}
          </ol>
        ) : (
          <div className="opacity-70 text-sm">{useSupabase ? 'No top clans yet.' : 'Top Clans unavailable in mock mode.'}</div>
        )}
      </section>

      <ClanChatPanel />
    </div>
  )
}

function ClanChatPanel() {
  const qc = useQueryClient()
  const [msg, setMsg] = React.useState('')

  const chat = useQuery({
    queryKey: ['clanChat'],
    queryFn: async () => {
      const { data, error } = await supa.rpc('clan_chat_recent')
      if (error) throw error
      return data as any[]
    },
    refetchInterval: 10000,
  })

  const send = useMutation({
    mutationFn: async (m: string) => {
      const { data, error } = await supa.rpc('clan_chat_post', { p_message: m })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setMsg('')
      qc.invalidateQueries({ queryKey: ['clanChat'] })
    },
  })

  return (
    <section className="card-glass p-4 lg:col-span-2">
      <div className="font-heading mb-2">Clan Chat</div>

      <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
        {chat.isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <SkeletonRow />
              </div>
            ))}
          </div>
        )}
        {chat.error && <div className="text-red-400 text-sm">Failed to load chat.</div>}
        {chat.data?.map((r: any) => (
          <div key={r.id} className="border rounded-xl px-3 py-2">
            <div className="text-sm"><b>{r.username}</b> <span className="opacity-60 text-xs">· {dayjs(r.created_at).fromNow()}</span></div>
            <div className="opacity-90">{r.message}</div>
          </div>
        ))}
        {chat.data?.length === 0 && !chat.isLoading && <div className="opacity-70 text-sm">No messages yet.</div>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (!msg.trim()) return; send.mutate(msg.trim()) }}
        className="flex gap-2"
      >
        <input
          className="flex-1 bg-transparent border rounded-xl px-3 py-2"
          placeholder="Type a message…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button
          type="submit"
          className="btn-neon px-4 py-2 rounded-xl"
          disabled={send.isPending || !msg.trim()}
        >
          Send
        </button>
      </form>
    </section>
  )
}
