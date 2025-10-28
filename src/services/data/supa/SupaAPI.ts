// services/data/supa/SupaAPI.ts
import { z } from "zod";
import { supa } from "@/SupabaseClient";
import type { DataAPI } from "../DataAPI";
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
} from "../types";

// Validate the RPC payload for AP status
const APStatusZ = z.object({
  ap_now: z.number(),
  ap_max: z.number(),
  regen_ms: z.number(),
  next_in_ms: z.number(),
});

export const supaAPI: DataAPI = {
  // ---- Auth / Profile ----
  async whoAmI(): Promise<Profile | null> {
    const {
      data: { session },
    } = await supa.auth.getSession();
    if (!session) return null;

    const { data, error } = await supa
      .from("profiles")
      .select("id, username, batch, xp, coins, level, streak, avatar_url")
      .eq("id", session.user.id)
      .single();

    if (error) {
      // PGRST116 == no rows
      if ((error as any).code === "PGRST116") return null;
      throw error;
    }

    // map avatar_url -> avatarUrl for the client
    return { ...(data as any), avatarUrl: (data as any).avatar_url };
  },

  // Email+password or magic-link (when password omitted)
  async login(identifier: string, password?: string) {
    if (password && password.length > 0) {
      const { data, error } = await supa.auth.signInWithPassword({
        email: identifier,
        password,
      });
      if (error) throw error;
      return { token: data.session?.access_token };
    }

    // passwordless (magic link) — redirect back to /auth/callback
    const { error } = await supa.auth.signInWithOtp({
      email: identifier,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    return { magicLinkSent: true };
  },

  async logout() {
    // Try global sign-out first, fall back to local to clear tokens offline
    try {
      await supa.auth.signOut({ scope: "global" as const });
    } catch {
      await supa.auth.signOut({ scope: "local" as const });
    }
  },

  // ---- Core game RPCs ----
  async apStatus(): Promise<APStatus> {
    const { data, error } = await supa.rpc("ap_status");
    if (error) throw error;
    const v = APStatusZ.parse(data);
    return {
      apNow: v.ap_now,
      apMax: v.ap_max,
      regenMs: v.regen_ms,
      nextInMs: v.next_in_ms,
    };
  },

  async jobsCatalog(): Promise<Job[]> {
    const { data, error } = await supa
      .from("heist_jobs")
      .select("id, name, duration_min, coin_reward, xp_reward")
      .order("duration_min", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: String(r.id),
      name: r.name,
      durationMin: r.duration_min,
      coinReward: r.coin_reward,
      xpReward: r.xp_reward,
    }));
  },

  async jobStart(jobId: string, autoqueue: boolean): Promise<UserJob> {
    const { data, error } = await supa.rpc("job_start", {
      job_id: jobId,
      autoqueue,
    });
    if (error) throw error;
    return {
      jobId: data.job_id,
      startedAt: data.started_at,
      endsAt: data.ends_at,
      claimed: false,
      autoqueue: !!data.autoqueue,
    };
  },

  async jobClaim() {
    const { data, error } = await supa.rpc("job_claim");
    if (error) throw error;
    return { coins: data.coins, xp: data.xp, bondNotes: data.bond_notes ?? 0 };
  },

  async upgrades(): Promise<UpgradeState[]> {
    const { data, error } = await supa
      .from("user_base_upgrades")
      .select("track, level");
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      track: r.track as UpgradeTrack,
      level: r.level,
    }));
  },

  async upgrade(track: UpgradeTrack): Promise<UpgradeState> {
    const { data, error } = await supa.rpc("base_upgrade", { track });
    if (error) throw error;
    return { track: data.track as UpgradeTrack, level: data.level };
  },

  async pveRun(tier: PvETier) {
    const { data, error } = await supa.rpc("pve_run", { tier });
    if (error) throw error;
    return { xp: data.xp, coins: data.coins, outcome: data.outcome };
  },

  async raidTargets(): Promise<RaidTarget[]> {
    const { data, error } = await supa.rpc("raid_targets");
    if (error) throw error;
    return (data ?? []) as RaidTarget[];
  },

  async raidAttack(defenderId: string): Promise<BattleResult> {
    const { data, error } = await supa.rpc("raid_attack", {
      defender_id: defenderId,
    });
    if (error) throw error;

    // fire-and-forget: log to news (kind 'pvp')
    const title = data.win ? "PvP Victory!" : "PvP Loss";
    const body = `+${data.xp} XP · +${data.coins} coins · vs ${defenderId.slice(
      0,
      6
    )}...`;
    const news = await supa.rpc("news_add", {
      p_kind: "pvp",
      p_title: title,
      p_body: body,
      p_target: defenderId,
    });
    if (news.error) {
      // don't break the attack result if news logging fails
      console.warn("news_add failed:", news.error);
    }

    return {
      win: data.win,
      xp: data.xp,
      coins: data.coins,
      defenderCoinLoss: data.defender_coin_loss ?? 0,
      message: data.message,
    } as any;
  },

  // ---- Clans / Chat ----
  async clanChatRecent(): Promise<ClanChatMessage[]> {
    const { data, error } = await supa.rpc("clan_chat_recent");
    if (error) throw error;
    return (data ?? []) as ClanChatMessage[];
  },

  async clanChatPost(message: string) {
    const { error } = await supa.rpc("clan_chat_post", { p_message: message });
    if (error) throw error;
  },

  // ---- Profile updates ----
  async profileUpdate(username?: string, avatarUrl?: string) {
    const { data, error } = await supa.rpc("profile_update", {
      p_username: username ?? null,
      p_avatar_url: avatarUrl ?? null,
    });
    if (error) throw error;
    return data;
  },

  // ---- Quests (MCQ) ----
  async mcqNext(subjectId?: number) {
    const { data, error } = await supa.rpc("mcq_next", {
      p_subject_id: subjectId ?? null,
    });
    if (error) throw error;
    if (!data) return null;
    const options = [data.opt1, data.opt2, data.opt3, data.opt4].map((opt: any) =>
      String(opt ?? "")
    ) as [string, string, string, string];
    return {
      id: data.id,
      subjectId: data.subject_id ?? null,
      body: data.body ?? "",
      options,
      difficulty: data.difficulty ?? undefined,
    };
  },

  async mcqSubmit(questionId: number, choice: 1 | 2 | 3 | 4) {
    const { data, error } = await supa.rpc("mcq_submit", {
      p_question_id: questionId,
      p_choice: choice,
    });
    if (error) throw error;
    return data;
  },

  // ---- News / Leaderboard ----
  async newsFeed(limit: number = 50) {
    const { data, error } = await supa.rpc("news_feed", { p_limit: limit });
    if (error) throw error;
    return (data ?? []) as Array<{
      id: string;
      kind: string;
      title: string;
      body: string;
      actorName?: string | null;
      actorAvatar?: string | null;
      clanName?: string | null;
      createdAt: string;
    }>;
  },

  async newsFeedRich(limit: number = 20) {
    const { data, error } = await supa.rpc("news_feed_rich", { p_limit: limit });
    if (error) throw error;
    return (data ?? []) as any[];
  },

  async leaderboardRows(limit = 100) {
    // Prefer RPC if present; otherwise, fall back to querying profiles.
    const r = await supa.rpc("leaderboard_rows", { p_limit: limit });
    const rows = !r.error && Array.isArray(r.data) ? r.data : null;

    const base =
      rows ??
      (
        await supa
          .from("profiles")
          .select(
            "id, username, avatar_url, batch, level, xp, coins, last_seen"
          )
          .order("xp", { ascending: false })
          .order("level", { ascending: false })
          .order("coins", { ascending: false })
          .limit(Number(limit))
      ).data ??
      [];

    return (base as any[]).map((p: any, i: number) => ({
      user_id: p.user_id ?? p.id,
      username: p.username ?? "agent",
      avatar_url: p.avatar_url ?? null,
      batch: p.batch ?? "8A",
      level: Number(p.level ?? 1),
      xp: Number(p.xp ?? 0),
      coins: Number(p.coins ?? 0),
      last_seen: p.last_seen ?? null,
      clan_id: p.clan_id ?? null,
      clan_name: p.clan_name ?? null,
      rank: Number(p.rank ?? i + 1),
    }));
  },

  // ---- Utils ----
  async ping() {
    const { error } = await supa.rpc("ping");
    if (error) {
      console.error("Error pinging user status:", error);
      throw error;
    }
  },
};

// Factory for DI / testing parity
export function createSupaAPI() {
  return supaAPI;
}
