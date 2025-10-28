export type Batch = '8A' | '8B' | '8C';

export interface Profile {
  id: string;
  username: string;
  batch: Batch;
  xp: number;
  coins: number;
  level: number;
  streak: number;
  shieldActiveUntil?: string | null;
  avatarUrl?: string;
}

export interface APStatus {
  apNow: number;
  apMax: number;
  regenMs: number;
  nextInMs: number;
}

export interface WhoAmI {
  id: string
  username: string
  level: number
  xp: number
  coins: number
  ap: number
  apMax: number
  nextApIn: number
  streak: number
  lastCompletedDailyAt: string | null
  shield: string | null
  clanId: string | null
  avatarUrl: string | null
}

export interface LeaderboardRow {
  id: string
  username: string
  name: string
  level: number
  xp: number
  total_xp: number
  elo_rating: number
  avg_elo: number
  last_seen: string
  avatar_url: string
  member_count: number
}

export interface Job {
  id: string;
  name: string;
  durationMin: number;
  coinReward: number;
  xpReward: number;
}

export interface UserJob {
  jobId: string;
  startedAt: string;
  endsAt: string;
  claimed: boolean;
  autoqueue: boolean;
}

export type UpgradeTrack = 'locker' | 'firewall' | 'sprint_path' | 'war_chest' | 'heist_codex' | 'sentinel';

export interface UpgradeInfo {
    name: string;
    description: (level: number) => string;
}

export interface UpgradeState {
  track: UpgradeTrack;
  level: number;
}

export type PvETier = 'easy' | 'standard' | 'hard';

export interface RaidTarget {
  id: string;
  username: string;
  level: number;
  batch: Batch;
  power: number;
  raidsToday: number;
  raidsCap: number;
}

export interface BattleResult {
  win: boolean;
  xp: number;
  coins: number;
  defenderCoinLoss?: number;
  message: string;
}

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

