'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDataAPI } from '@/lib/hooks/useDataAPI';
import type { Profile, Batch } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Trophy } from '@/components/icons/Icons';

type Tab = 'Global' | Batch;

const LeaderboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('Global');
    const api = useDataAPI();

    const { data: leaderboardData, isLoading } = useQuery({
        queryKey: ['leaderboard', activeTab],
        queryFn: () => api.getLeaderboard(activeTab === 'Global' ? undefined : activeTab),
        placeholderData: (prevData) => prevData, // Keep old data visible while new data loads
    });

    const renderPodium = (data: Profile[]) => {
        const podiumSpots = [
            { rank: 2, profile: data[1], glow: 'shadow-[var(--glow-silver)]', border: 'border-slate-400', height: 'h-32' },
            { rank: 1, profile: data[0], glow: 'shadow-[var(--glow-gold)]', border: 'border-yellow-400', height: 'h-40' },
            { rank: 3, profile: data[2], glow: 'shadow-[var(--glow-bronze)]', border: 'border-amber-700', height: 'h-28' },
        ];

        return (
            <div className="flex justify-center items-end gap-2 md:gap-4 my-8 min-h-[10rem]">
                {podiumSpots.map(({ rank, profile, glow, border, height }) => profile ? (
                    <div key={profile.id} className={`flex flex-col items-center justify-end space-y-2 ${height}`}>
                        <img src={profile.avatarUrl} alt={profile.username} className={`w-16 h-16 rounded-full border-4 ${border}`}/>
                        <p className="font-bold text-sm text-center truncate w-24">{profile.username}</p>
                        <Card className={`p-2 ${glow}`}>
                           <p className="text-xs font-heading text-center flex items-center gap-1"><Trophy className="w-4 h-4" /> #{rank}</p>
                        </Card>
                    </div>
                ) : <div className="w-24" />)}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">Leaderboard</h1>

            <div className="flex space-x-1 p-1 rounded-lg bg-muted/50">
                {(['Global', '8A', '8B', '8C'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-primary-foreground shadow-[var(--glow-primary)]' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {isLoading && !leaderboardData ? (
                <div className="text-center p-8">Loading leaders...</div>
            ) : leaderboardData && (
                <>
                    {renderPodium(leaderboardData)}
                    <div className="space-y-2">
                        {leaderboardData.slice(3).map((profile, index) => (
                            <Card key={profile.id} className="p-3">
                                <div className="flex items-center space-x-4">
                                    <span className="font-bold text-lg w-8 text-center text-muted-foreground">{index + 4}</span>
                                    <img src={profile.avatarUrl} alt={profile.username} className="w-10 h-10 rounded-full" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{profile.username}</p>
                                        <p className="text-sm text-muted-foreground">Level {profile.level}</p>
                                    </div>
                                    <p className="font-bold text-cyan-400">{profile.xp.toLocaleString()} XP</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LeaderboardPage;

