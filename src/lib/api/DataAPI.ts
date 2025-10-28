import type { Profile, APStatus, Job, UserJob, UpgradeState, PvETier, RaidTarget, BattleResult, UpgradeTrack } from '../types';

export interface DataAPI {
  whoAmI(): Promise<Profile | null>;
  login(username: string, password: string): Promise<{ token: string }>;
  logout(): Promise<void>;
  apStatus(): Promise<APStatus>;
  refillAP(): Promise<APStatus>;
  jobsCatalog(): Promise<Job[]>;
  // FIX: Added missing getActiveJob to API interface.
  getActiveJob(): Promise<UserJob | null>;
  jobStart(jobId: string, autoqueue: boolean): Promise<UserJob>;
  jobClaim(): Promise<{ coins: number; xp: number; bondNotes?: number }>;
  upgrades(): Promise<UpgradeState[]>;
  upgrade(track: UpgradeTrack): Promise<UpgradeState>;
  pveRun(tier: PvETier): Promise<{ xp: number; coins: number; outcome: 'success' | 'fail'; }>;
  raidTargets(): Promise<RaidTarget[]>;
  raidAttack(targetId: string): Promise<BattleResult>;
  // FIX: Added missing getLeaderboard to API interface.
  getLeaderboard(batch?: string): Promise<Profile[]>;
}
