export type Batch = '8A'|'8B'|'8C'
export type UpgradeTrack = 'locker'|'firewall'|'sprint_path'|'war_chest'|'heist_codex'|'sentinel'
export type PvETier = 'easy'|'standard'|'hard'


export type Profile = {
id: string;
username: string;
email?: string;
batch: Batch;
xp: number;
coins: number;
level: number;
streak: number;
shieldActiveUntil?: string | null;
avatarUrl?: string | null;
}


export type APStatus = { apNow: number; apMax: number; regenMs: number; nextInMs: number }
export type Job = { id: string; name: string; durationMin: number; coinReward: number; xpReward: number }
export type UserJob = { jobId: string; startedAt: string; endsAt: string; claimed: boolean; autoqueue: boolean }
export type UpgradeState = { track: UpgradeTrack; level: number }
export type RaidTarget = { id: string; username: string; level: number; batch: Batch; power: number; raidsToday: number; raidsCap: number }
export type BattleResult = { win: boolean; xp: number; coins: number; defenderCoinLoss?: number; message: string }
export type MCQ = {
	id: number
	subjectId?: number | null
	body: string
	options: [string,string,string,string]
	difficulty?: number
}

export type NewsItem = {
	id: string
	kind: string
	title: string
	body: string
	actorName?: string | null
	actorAvatar?: string | null
	clanName?: string | null
	createdAt: string
}
export type ClanChatMessage = {
	id: number
	userId: string
	username: string | null
	message: string
	createdAt: string
}
