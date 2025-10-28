import type { DataAPI } from '../DataAPI'
import type {
	APStatus,
	BattleResult,
	ClanChatMessage,
	Job,
	NewsItem,
	PvETier,
	Profile,
	RaidTarget,
	UpgradeState,
	UpgradeTrack,
	UserJob,
} from '../types'


let profile: Profile | null = { id: 'demo', username: 'demo', email: 'demo@demo.com', batch: '8A', xp: 120, coins: 350, level: 3, streak: 2, avatarUrl: '' }
let ap = { now: 12, max: 12, regenMs: 18*60000, nextInMs: 60000 }


export const mockAPI: DataAPI = {
async whoAmI() { return profile },
async login(identifier: string) { profile = { ...profile!, username: identifier }; return { token: 'mock' } },
async logout() { profile = null },
async apStatus() { return { apNow: ap.now, apMax: ap.max, regenMs: ap.regenMs, nextInMs: ap.nextInMs } },
async jobsCatalog() { return [
{ id: '1', name: 'Recon Sweep', durationMin: 60, coinReward: 70, xpReward: 10 },
{ id: '2', name: 'Night Watch', durationMin: 120, coinReward: 150, xpReward: 15 },
{ id: '3', name: 'Deep Stakeout', durationMin: 240, coinReward: 340, xpReward: 25 },
{ id: '4', name: 'Full Cover', durationMin: 480, coinReward: 700, xpReward: 40 },
] },
async jobStart(jobId: string, autoqueue: boolean) { return { jobId, startedAt: new Date().toISOString(), endsAt: new Date(Date.now()+3600000).toISOString(), claimed: false, autoqueue } },
async jobClaim() { return { coins: 100, xp: 20 } },
async upgrades() { return [
{ track: 'locker', level: 1 }, { track: 'firewall', level: 1 }, { track: 'sprint_path', level: 1 },
{ track: 'war_chest', level: 1 }, { track: 'heist_codex', level: 1 }, { track: 'sentinel', level: 1 },
] },
async upgrade(track: UpgradeTrack) { return { track, level: 2 } },
async pveRun(tier: PvETier) { return { xp: tier==='easy'?10: tier==='standard'?16:26, coins: tier==='easy'?50: tier==='standard'?80:130, outcome: 'success' } },
async raidTargets(): Promise<RaidTarget[]> { return [
{ id: 'u1', username: 'wolf-1', level: 3, batch: '8B', power: 42, raidsToday: 0, raidsCap: 5 },
{ id: 'u2', username: 'wolf-2', level: 4, batch: '8C', power: 55, raidsToday: 1, raidsCap: 5 },
] },
async raidAttack() { return { win: true, xp: 30, coins: 50, defenderCoinLoss: 25, message: 'Clean hit.' } as BattleResult },
async clanChatRecent(): Promise<ClanChatMessage[]> {
	return [
		{ id: 2, userId: 'u2', username: 'AgentFox', message: 'Ready for tonight?', createdAt: new Date(Date.now() - 120000).toISOString() },
		{ id: 1, userId: 'u1', username: 'AgentWolf', message: 'Keep grinding vault donations.', createdAt: new Date(Date.now() - 300000).toISOString() },
	]
},
async clanChatPost() { return { ok: true } },
async profileUpdate(username?: string, avatarUrl?: string) {
	if (profile) {
		profile = { ...profile, username: username ?? profile.username, avatarUrl: avatarUrl ?? profile.avatarUrl }
	}
	return profile
},
async mcqNext(subjectId?: number | null) {
	return {
		id: 1,
		subjectId: subjectId ?? null,
		body: 'What is 2 + 2?',
		options: ['1','2','4','3'],
		difficulty: 1,
	}
},
async mcqSubmit(id?: number, choice?: number) {
	// correct option is 3 for mock
	const correct = choice === 3
	return { correct, message: correct ? 'Nice!' : 'Wrong' }
},
async newsFeed(limit?: number): Promise<NewsItem[]> {
	return [
		{ id: '3', kind: 'system', title: 'Welcome', body: 'Welcome to Brain Heist!', createdAt: new Date().toISOString(), actorName: 'System', actorAvatar: null },
		{ id: '2', kind: 'pvp', title: 'PvP Victory', body: '+25 XP, +50 coins', createdAt: new Date(Date.now()-600000).toISOString(), actorName: 'demo', actorAvatar: null },
		{ id: '1', kind: 'quest', title: 'Quest Complete', body: 'History 101 done', createdAt: new Date(Date.now()-900000).toISOString(), actorName: 'demo', actorAvatar: null },
	]
},
async newsFeedRich(limit?: number) {
	return (await Promise.resolve([
		{ id: '3', kind: 'system', title: 'Welcome', body: 'Welcome to Brain Heist!', createdAt: new Date().toISOString(), actorName: 'System', actorAvatar: null },
		{ id: '2', kind: 'pvp', title: 'PvP Victory', body: '+25 XP, +50 coins', createdAt: new Date(Date.now()-600000).toISOString(), actorName: 'demo', actorAvatar: null },
		{ id: '1', kind: 'quest', title: 'Quest Complete', body: 'History 101 done', createdAt: new Date(Date.now()-900000).toISOString(), actorName: 'demo', actorAvatar: null },
	]))
},
async leaderboardRows(limit = 100) {
	return [
		{ user_id: 'u1', username: 'leader-x', avatar_url: null, batch: '8A', level: 5, xp: 550, coins: 1200, rank: 1, elo_rating: 1200, wins: 10, losses: 2, last_seen: new Date().toISOString(), clan_id: null, clan_name: null },
		{ user_id: 'u2', username: 'demo', avatar_url: null, batch: '8A', level: 3, xp: 120, coins: 350, rank: 2, elo_rating: 1050, wins: 5, losses: 1, last_seen: new Date(Date.now() - 10 * 60 * 1000).toISOString(), clan_id: null, clan_name: null },
		{ user_id: 'u3', username: 'noob-y', avatar_url: null, batch: '8B', level: 1, xp: 20, coins: 50, rank: 3, elo_rating: 900, wins: 1, losses: 5, last_seen: new Date(Date.now() - 120 * 60 * 1000).toISOString(), clan_id: null, clan_name: null },
	]
},
async ping() {
	console.log('Mock ping: user is active.')
	return Promise.resolve()
},
}

export function createMockAPI() {
	return mockAPI
}
