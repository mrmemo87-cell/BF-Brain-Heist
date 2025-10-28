
import type { DataAPI } from './api';
import type { Profile, APStatus, Job, UserJob, UpgradeState, PvETier, RaidTarget, BattleResult, UpgradeTrack, Batch } from '../types';

// Mock in-memory database
let MOCK_DB = {
    profile: null as Profile | null,
    ap: { apNow: 10, apMax: 10, regenMs: 60000, nextInMs: 60000 } as APStatus,
    activeJob: null as UserJob | null,
    upgrades: [
        { track: 'locker', level: 1 },
        { track: 'firewall', level: 1 },
        { track: 'sprint_path', level: 1 },
        { track: 'war_chest', level: 1 },
        { track: 'heist_codex', level: 1 },
        { track: 'sentinel', level: 1 },
    ] as UpgradeState[],
};

const JOBS_CATALOG: Job[] = [
    { id: 'job-1', name: 'Data Skim', durationMin: 60, coinReward: 100, xpReward: 50 },
    { id: 'job-2', name: 'Network Tap', durationMin: 120, coinReward: 250, xpReward: 120 },
    { id: 'job-3', name: 'Firewall Breach', durationMin: 240, coinReward: 600, xpReward: 300 },
    { id: 'job-4', name: 'Server Heist', durationMin: 480, coinReward: 1500, xpReward: 700 },
];

const BATCHES: Batch[] = ['8A', '8B', '8C'];

const generateFakeProfile = (id: number, username: string): Profile => ({
    id: `user-${id}`,
    username,
    batch: BATCHES[id % 3],
    xp: Math.floor(Math.random() * 10000),
    coins: Math.floor(Math.random() * 50000),
    level: Math.floor(1 + Math.random() * 50),
    streak: Math.floor(Math.random() * 100),
    avatarUrl: `https://picsum.photos/seed/${username}/200`
});

const LEADERBOARD_DATA = [
    generateFakeProfile(1, 'CyberNinja'),
    generateFakeProfile(2, 'Glitch'),
    generateFakeProfile(3, 'ZeroCool'),
    generateFakeProfile(4, 'AcidBurn'),
    generateFakeProfile(5, 'PhantomPhreak'),
    generateFakeProfile(6, 'Neo'),
    generateFakeProfile(7, 'Trinity'),
    generateFakeProfile(8, 'Morpheus'),
    generateFakeProfile(9, 'Switch'),
    generateFakeProfile(10, 'Dozer'),
].sort((a, b) => b.xp - a.xp);


export class MockAPI implements DataAPI {
    constructor() {
        setInterval(() => {
            if (MOCK_DB.ap.apNow < MOCK_DB.ap.apMax) {
                MOCK_DB.ap.apNow += 1;
                MOCK_DB.ap.nextInMs = MOCK_DB.ap.regenMs;
            }
        }, MOCK_DB.ap.regenMs);
    }
    
    private async delay<T>(data: T, ms = 500): Promise<T> {
        return new Promise(res => setTimeout(() => res(data), ms));
    }
    
    async whoAmI(): Promise<Profile | null> {
        return this.delay(MOCK_DB.profile);
    }

    async login(username: string, password: string): Promise<{ token: string; }> {
        if (!username || !password) {
            throw new Error('Invalid credentials');
        }
        MOCK_DB.profile = {
            id: 'mock-user-123',
            username: username,
            batch: '8A',
            xp: 1337,
            coins: 42000,
            level: 12,
            streak: 7,
            shieldActiveUntil: null,
            avatarUrl: `https://picsum.photos/seed/${username}/200`
        };
        return this.delay({ token: 'mock-jwt-token' });
    }

    async logout(): Promise<void> {
        MOCK_DB.profile = null;
        return this.delay(undefined);
    }

    async apStatus(): Promise<APStatus> {
        return this.delay(MOCK_DB.ap);
    }

    async jobsCatalog(): Promise<Job[]> {
        return this.delay(JOBS_CATALOG);
    }
    
    async getActiveJob(): Promise<UserJob | null> {
        return this.delay(MOCK_DB.activeJob);
    }

    async jobStart(jobId: string, autoqueue: boolean): Promise<UserJob> {
        if (MOCK_DB.activeJob && new Date(MOCK_DB.activeJob.endsAt) > new Date()) {
            throw new Error('A job is already in progress.');
        }
        const job = JOBS_CATALOG.find(j => j.id === jobId);
        if (!job) {
            throw new Error('Job not found.');
        }

        const now = new Date();
        const endsAt = new Date(now.getTime() + job.durationMin * 60000);
        
        MOCK_DB.activeJob = {
            jobId,
            startedAt: now.toISOString(),
            endsAt: endsAt.toISOString(),
            claimed: false,
            autoqueue
        };

        return this.delay(MOCK_DB.activeJob);
    }

    async jobClaim(): Promise<{ coins: number; xp: number; bondNotes?: number; }> {
        if (!MOCK_DB.activeJob || new Date(MOCK_DB.activeJob.endsAt) > new Date()) {
            throw new Error('No job ready to claim.');
        }
        
        const job = JOBS_CATALOG.find(j => j.id === MOCK_DB.activeJob!.jobId);
        if (!job) {
            throw new Error('Job details not found');
        }
        
        const reward = { coins: job.coinReward, xp: job.xpReward };
        if (MOCK_DB.profile) {
            MOCK_DB.profile.coins += reward.coins;
            MOCK_DB.profile.xp += reward.xp;
        }

        MOCK_DB.activeJob = null;
        
        return this.delay(reward);
    }

    async upgrades(): Promise<UpgradeState[]> {
        return this.delay(MOCK_DB.upgrades);
    }

    async upgrade(track: UpgradeTrack): Promise<UpgradeState> {
        const upgrade = MOCK_DB.upgrades.find(u => u.track === track);
        if (!upgrade) {
            throw new Error('Upgrade track not found.');
        }
        const cost = (upgrade.level + 1) * 1000;
        if (MOCK_DB.profile && MOCK_DB.profile.coins < cost) {
            throw new Error("Not enough coins.");
        }

        if (MOCK_DB.profile) {
            MOCK_DB.profile.coins -= cost;
        }
        upgrade.level += 1;
        return this.delay({ ...upgrade });
    }

    async pveRun(tier: PvETier): Promise<{ xp: number; coins: number; outcome: 'success' | 'fail'; }> {
        const cost = { easy: 2, standard: 3, hard: 4 };
        if (MOCK_DB.ap.apNow < cost[tier]) {
            throw new Error("Not enough AP.");
        }
        MOCK_DB.ap.apNow -= cost[tier];

        const success = Math.random() > 0.1;
        if (success) {
            const rewards = {
                easy: { xp: 20, coins: 50 },
                standard: { xp: 50, coins: 150 },
                hard: { xp: 120, coins: 400 },
            };
            if(MOCK_DB.profile) {
                MOCK_DB.profile.xp += rewards[tier].xp;
                MOCK_DB.profile.coins += rewards[tier].coins;
            }
            return this.delay({ ...rewards[tier], outcome: 'success' });
        } else {
            return this.delay({ xp: 0, coins: 0, outcome: 'fail' });
        }
    }
    
    async raidTargets(): Promise<RaidTarget[]> {
        const targets: RaidTarget[] = [];
        for (let i = 0; i < 5; i++) {
            targets.push({
                id: `target-${i}`,
                username: `Rival${i+1}`,
                level: Math.floor(10 + Math.random() * 5),
                batch: BATCHES[i % 3],
                power: Math.floor(1000 + Math.random() * 2000),
                raidsToday: Math.floor(Math.random() * 3),
                raidsCap: 3,
            });
        }
        return this.delay(targets);
    }
    
    async raidAttack(targetId: string): Promise<BattleResult> {
        if (MOCK_DB.ap.apNow < 1) {
            throw new Error("Not enough AP.");
        }
        MOCK_DB.ap.apNow -= 1;
        
        const win = Math.random() > 0.4;
        if (win) {
            const coins = Math.floor(Math.random() * 500);
            const xp = Math.floor(Math.random() * 100);
            if (MOCK_DB.profile) {
                MOCK_DB.profile.coins += coins;
                MOCK_DB.profile.xp += xp;
            }
            return this.delay({ win: true, xp, coins, defenderCoinLoss: coins, message: "Raid successful! Resources plundered." });
        } else {
            const xp = Math.floor(Math.random() * 20);
             if (MOCK_DB.profile) {
                MOCK_DB.profile.xp += xp;
            }
            return this.delay({ win: false, xp, coins: 0, message: "Firewall held strong. You were repelled." });
        }
    }

    async getLeaderboard(batch?: string): Promise<Profile[]> {
        if (batch) {
            return this.delay(LEADERBOARD_DATA.filter(p => p.batch === batch));
        }
        return this.delay(LEADERBOARD_DATA);
    }
}

