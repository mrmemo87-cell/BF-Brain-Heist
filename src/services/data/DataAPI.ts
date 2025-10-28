import type {
	APStatus,
	BattleResult,
	ClanChatMessage,
	Job,
	MCQ,
	NewsItem,
	PvETier,
	Profile,
	RaidTarget,
	UpgradeState,
	UpgradeTrack,
	UserJob,
} from './types'


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

clanChatRecent(limit?: number): Promise<ClanChatMessage[]>
clanChatPost(message: string): Promise<any>

profileUpdate(username?: string, avatarUrl?: string): Promise<any>

// MCQ (quiz)
mcqNext(subjectId?: number | null): Promise<MCQ | null>
mcqSubmit(id: number, choice: 1|2|3|4): Promise<{ correct: boolean; message?: string }>

// News
newsFeed(limit?: number): Promise<NewsItem[]>
newsFeedRich(limit?: number): Promise<any[]>

// Leaderboard
leaderboardRows(limit?: number): Promise<any[]>

// User status
ping(): Promise<void>
}
