
import { User, Shield, BarChart3, FileText, ShoppingCart, Swords, Home, Settings, Briefcase } from '@/components/icons/Icons';
import type { UpgradeTrack, UpgradeInfo } from './types';

export const NAV_ITEMS = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/pve', label: 'Tasks', icon: FileText },
  { href: '/pvp', label: 'PvP', icon: Swords },
  { href: '/safehouse', label: 'Safehouse', icon: Home },
  { href: '/leaderboard', label: 'Leaders', icon: BarChart3 },
  { href: '/shop', label: 'Shop', icon: ShoppingCart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const UPGRADE_DETAILS: Record<UpgradeTrack, UpgradeInfo> = {
    locker: {
        name: 'Locker',
        description: (level) => `Increases coin storage by ${level * 10}%.`
    },
    firewall: {
        name: 'Firewall',
        description: (level) => `Protects ${level * 5}% more coins from raids.`
    },
    sprint_path: {
        name: 'Sprint Path',
        description: (level) => `Reduces job duration by ${level * 2}%.`
    },
    war_chest: {
        name: 'War Chest',
        description: (level) => `Gain ${level * 3}% more coins from jobs.`
    },
    heist_codex: {
        name: 'Heist Codex',
        description: (level) => `Gain ${level * 3}% more XP from jobs.`
    },
    sentinel: {
        name: 'Sentinel',
        description: (level) => `Increases AP regeneration by ${level * 2}%.`
    }
};

