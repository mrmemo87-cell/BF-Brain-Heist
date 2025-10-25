// services/data/supa/SupaAPI.ts
import { z } from 'zod'
import { supa } from '../../../supabaseClient'
import type { DataAPI } from '../DataAPI'
import type {
  APStatus,
  BattleResult,
  ClanChatMessage,
  Job,
  PvETier,
  Profile,
  RaidTarget,
  UpgradeState,
  UpgradeTrack,
  UserJob,
} from '../types'

// We only validate the AP payload with Zod here.
const APStatusZ = z.object({
  ap_now: z.number(),
  ap_max: z.number(),
  regen_ms: z.number(),
  next_in_ms: z.number(),
})

export const supaAPI: DataAPI = {
  // Load (or bootstrap) the user's profile
  async whoAmI(): Promise<Profile | null> {
    const { data: { user }, error: uErr } = await supa.auth.getUser()
    if (uErr) throw uErr
    if (!user) return null

    // Try to fetch profile row
    const { data: prof, error: pErr } = await supa
      .from('profiles')
      .select('id, username, batch, xp, coins, level, streak, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    if (pErr) throw pErr

    // helper: DB row -> frontend type
    const toProfile = (row: any): Profile => ({
      id: row.id,
      username: row.username,
      email: user.email ?? undefined,
      batch: row.batch,
      xp: row.xp,
      coins: row.coins,
      level: row.level,
      streak: row.streak,
      shieldActiveUntil: null,
      avatarUrl: row.avatar_url ?? null,
    })

    // If no row yet, create a default
    if (!prof) {
      const defaultRow = {
        id: user.id,
        username: (user.email ?? 'agent').split('@')[0],
        batch: '8A', // default; change if you want different starter batch
        // xp/coins/level/streak will use table defaults
      }
      const { data: inserted, error: iErr } = await supa
        .from('profiles')
        .insert(defaultRow)
        .select('id, username, batch, xp, coins, level, streak, avatar_url')
        .single()
      if (iErr) throw iErr
      return toProfile(inserted)
    }

    return toProfile(prof)
  },

  // Email+password or magic-link (when password omitted)
  async login(identifier: string, password?: string) {
    if (password && password.length > 0) {
      const { data, error } = await supa.auth.signInWithPassword({ email: identifier, password })
      if (error) throw error
      return { token: data.session?.access_token }
    }
    const { error } = await supa.auth.signInWithOtp({
      email: identifier,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
    return { magicLinkSent: true }
  },

  async logout() { await supa.auth.signOut() },

  async apStatus(): Promise<APStatus> {
    const { data, error } = await supa.rpc('ap_status')
    if (error) throw error
    const v = APStatusZ.parse(data)
    return { apNow: v.ap_now, apMax: v.ap_max, regenMs: v.regen_ms, nextInMs: v.next_in_ms }
  },

  async jobsCatalog(): Promise<Job[]> {
    const { data, error } = await supa
      .from('heist_jobs')
      .select('id, name, duration_min, coin_reward, xp_reward')
      .order('duration_min')
    if (error) throw error
    return (data ?? []).map((r: any) => ({
      id: String(r.id),
      name: r.name,
      durationMin: r.duration_min,
      coinReward: r.coin_reward,
      xpReward: r.xp_reward,
    }))
  },

  async jobStart(jobId: string, autoqueue: boolean): Promise<UserJob> {
    const { data, error } = await supa.rpc('job_start', { job_id: jobId, autoqueue })
    if (error) throw error
    return {
      jobId: data.job_id,
      startedAt: data.started_at,
      endsAt: data.ends_at,
      claimed: false,
      autoqueue: !!data.autoqueue,
    }
  },

  async jobClaim() {
    const { data, error } = await supa.rpc('job_claim')
    if (error) throw error
    return { coins: data.coins, xp: data.xp, bondNotes: data.bond_notes ?? 0 }
  },

  async upgrades(): Promise<UpgradeState[]> {
    const { data, error } = await supa
      .from('user_base_upgrades')
      .select('track, level')
    if (error) throw error
    return (data ?? []).map((r: any) => ({ track: r.track as UpgradeTrack, level: r.level }))
  },

  async upgrade(track: UpgradeTrack): Promise<UpgradeState> {
    const { data, error } = await supa.rpc('base_upgrade', { track })
    if (error) throw error
    return { track: data.track as UpgradeTrack, level: data.level }
  },

  async pveRun(tier: PvETier) {
    const { data, error } = await supa.rpc('pve_run', { tier })
    if (error) throw error
    return { xp: data.xp, coins: data.coins, outcome: data.outcome }
  },

  async raidTargets(): Promise<RaidTarget[]> {
    const { data, error } = await supa.rpc('raid_targets')
    if (error) throw error
    return (data ?? []) as RaidTarget[]
  },

  async raidAttack(defenderId: string): Promise<BattleResult> {
    const { data, error } = await supa.rpc('raid_attack', { defender_id: defenderId })
    if (error) throw error

    // log to news immediately (kind 'pvp')
    const title = data.win ? 'PvP Victory!' : 'PvP Loss'
    const body  = `+${data.xp} XP · +${data.coins} coins · vs ${defenderId.slice(0,6)}…`
    const { data: newsData, error: newsError } = await supa.rpc('news_add', { p_kind: 'pvp', p_title: title, p_body: body, p_target: defenderId })

    return {
      win: data.win,
      xp: data.xp,
      coins: data.coins,
      defenderCoinLoss: data.defender_coin_loss ?? 0,
      message: data.message,
      // For debugging:
      _newsAddResult: newsError ? { error: newsError.message } : newsData,
    }
  },

  async clanChatRecent(): Promise<ClanChatMessage[]> {
    const { data, error } = await supa.rpc('clan_chat_recent')
    if (error) throw error
    return (data ?? []) as ClanChatMessage[]
  },

  async clanChatPost(message: string) {
    const { error } = await supa.rpc('clan_chat_post', { p_message: message })
    if (error) throw error
  },

  async profileUpdate(username?: string, avatarUrl?: string) {
    const { data, error } = await supa.rpc('profile_update', {
      p_username: username ?? null,
      p_avatar_url: avatarUrl ?? null,
    })
    if (error) throw error
    return data
  },

  // ===== Quests (MCQ) =====
  async mcqNext(subjectId?: number) {
    const { data, error } = await supa.rpc('mcq_next', { p_subject_id: subjectId ?? null })
    if (error) throw error
    if (!data) return null
    const options = [data.opt1, data.opt2, data.opt3, data.opt4].map((opt: any) => String(opt ?? '')) as [string,string,string,string]
    return {
      id: data.id,
      subjectId: data.subject_id ?? null,
      body: data.body ?? '',
      options,
      difficulty: data.difficulty ?? undefined,
    }
  },

  async mcqSubmit(questionId: number, choice: 1|2|3|4) {
    const { data, error } = await supa.rpc('mcq_submit', { p_question_id: questionId, p_choice: choice })
    if (error) throw error
    return data
  },

  // ===== News =====
  async newsFeed(limit: number = 50) {
    const { data, error } = await supa.rpc('news_feed', { p_limit: limit })
    if (error) throw error
    return (data ?? []) as Array<{
      id: string; kind: string; title: string; body: string;
      actorName?: string | null; actorAvatar?: string | null;
      clanName?: string | null; createdAt: string;
    }>
  },

  // Leaderboard rows with avatars
  async leaderboardRows() {
    const { data, error } = await supa.rpc('leaderboard_rows')
    if (error) throw error
    return (data ?? []) as Array<{
      user_id: string; username: string; avatar_url?: string | null;
      batch: string; level: number; xp: number; coins: number; rank: number
    }>
  },
}
