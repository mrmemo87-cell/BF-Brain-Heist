import React from 'react';
import type { Profile, APStatus, Job, UserJob, UpgradeState, PvETier, RaidTarget, BattleResult, UpgradeTrack } from '../types';
import { MockAPI } from './mockApi';

export interface DataAPI {
  whoAmI(): Promise<Profile | null>;
  login(username: string, password: string): Promise<{ token: string }>;
  logout(): Promise<void>;
  apStatus(): Promise<APStatus>;
  jobsCatalog(): Promise<Job[]>;
  getActiveJob(): Promise<UserJob | null>;
  jobStart(jobId: string, autoqueue: boolean): Promise<UserJob>;
  jobClaim(): Promise<{ coins: number; xp: number; bondNotes?: number }>;
  upgrades(): Promise<UpgradeState[]>;
  upgrade(track: UpgradeTrack): Promise<UpgradeState>;
  pveRun(tier: PvETier): Promise<{ xp: number; coins: number; outcome: 'success' | 'fail'; }>;
  raidTargets(): Promise<RaidTarget[]>;
  raidAttack(targetId: string): Promise<BattleResult>;
  getLeaderboard(batch?: string): Promise<Profile[]>;
}

export const DataContext = React.createContext<DataAPI | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In a real app, you would swap this based on environment variables.
  const api = new MockAPI();
  // FIX: Replaced JSX with React.createElement to be compatible with the .ts file extension.
  return React.createElement(DataContext.Provider, { value: api }, children);
};
