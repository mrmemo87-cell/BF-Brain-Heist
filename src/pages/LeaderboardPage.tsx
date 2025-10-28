
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDataAPI } from "@/hooks/useDataAPI';
import type { Profile, Batch } from '../types';
import { Card, CardContent } from "@/components/ui/Card';
import { Trophy } from "@/components/icons/Icons';

type Tab = 'Global' | Batch;

const LeaderboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('Global');
    const api = useDataAPI();

    const { data: leaderboardData, isLoading } = useQuery({
        queryKey: ['leaderboard', activeTab],
        queryFn: () => api.getLeaderboard(activeTab === 'Global' ? undefined : activeTab),
    });

    const renderPodium = (data: Profile[]) => {
        const podium = [data[1], data[0], data[2]].filter(Boolean); // Silver, Gold, Bronze
        const glowClasses = ['shadow-[var(--glow-silver)]', 'shadow-[var(--glow-gold)]', 'shadow-[var(--glow-bronze)]'];
        const borderClasses = ['border-slate-400', 'border-yellow-400', 'border-amber-700'];
        const heights = ['h-32', 'h-40', 'h-28'];

        return (
            <div className="flex justify-center items-end gap-2 md:gap-4 my-8">
                {podium.map((profile, index) => profile && (
                    <div key={profile.id} className={`flex flex-col items-center space-y-2 ${heights[index]}`}>
                        <img src={profile.avatarUrl} alt={profile.username} className={`w-16 h-16 rounded-full border-4 ${borderClasses[index]}`}/>
                        <p className="font-bold text-sm">{profile.username}</p>
                        <Card className={`p-2 ${glowClasses[index]}`}>
                           <p className="text-xs font-heading text-center">#{index === 1 ? 1 : (index === 0 ? 2 : 3)}</p>
                        </Card>
                    </div>
                ))}
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

            {isLoading ? (
                <p>Loading leaders...</p>
            ) : leaderboardData && (
                <>
                    {renderPodium(leaderboardData)}
                    <div className="space-y-2">
                        {leaderboardData.slice(3).map((profile, index) => (
                            <Card key={profile.id} className="p-3">
                                <div className="flex items-center space-x-4">
                                    <span className="font-bold text-lg w-8 text-center">{index + 4}</span>
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


