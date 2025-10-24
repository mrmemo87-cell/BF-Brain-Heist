import type { APStatus, BattleResult, Job, PvETier, Profile, RaidTarget, UpgradeState, UpgradeTrack, UserJob } from './types'


export interface DataAPI {
whoAmI(): Promise<Profile | null>
login(identifier: string, password?: string): Promise<{ token?: string; magicLinkSent?: boolean }>
logout(): Promise<void>


apStatus(): Promise<APStatus>


jobsCatalog(): Promise<Job[]>
jobStart(jobId: string, autoqueue: boolean): Promise<UserJob>
jobClaim(): Promise<{ coins: number; xp: number; bondNotes?: number }>


upgrades(): Promise<UpgradeState[]>
upgrade(track: UpgradeTrack): Promise<UpgradeState>


pveRun(tier: PvETier): Promise<{ xp: number; coins: number; outcome: 'success'|'fail' }>


raidTargets(): Promise<RaidTarget[]>
raidAttack(targetId: string): Promise<BattleResult>
}