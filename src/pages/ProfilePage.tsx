
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDataAPI } from '@/services/data';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Coins, Zap, Shield } from '@/components/icons/Icons';

const ProfilePage: React.FC = () => {
    const api = useDataAPI();

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: () => api.whoAmI(),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const { data: apStatus, isLoading: apLoading } = useQuery({
        queryKey: ['apStatus'],
        queryFn: () => api.apStatus(),
        refetchInterval: 1000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    if (profileLoading || apLoading) {
        return <p>Loading profile...</p>;
    }

    if (!profile) {
        return <p>Could not load profile data.</p>;
    }
    
    const xpForNextLevel = profile.level * 100;
    const xpPercentage = (profile.xp / xpForNextLevel) * 100;

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden">
                <div className="relative h-24 bg-[hsl(var(--accent)_/_0.2)]">
                    <img src={`https://picsum.photos/seed/${profile.username}/800/200`} alt="Profile banner" className="object-cover w-full h-full opacity-50"/>
                    <div className="absolute bottom-0 left-4 translate-y-1/2">
                        <img src={profile.avatarUrl} alt={profile.username} className="w-24 h-24 rounded-full border-4 border-background"/>
                    </div>
                </div>
                <CardContent className="pt-16">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold font-heading">{profile.username}</h2>
                            <span className="text-sm px-2 py-1 rounded-full bg-[hsl(var(--primary)_/_0.2)] text-[hsl(var(--primary))]">
                                Batch {profile.batch}
                            </span>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-bold flex items-center gap-2"><Coins className="w-5 h-5 text-yellow-400"/> {profile.coins.toLocaleString()}</p>
                           {profile.shieldActiveUntil && <p className="text-xs text-cyan-400 flex items-center gap-1"><Shield className="w-3 h-3"/> Shield Active</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 space-y-2">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold">Level {profile.level}</span>
                            <span className="text-sm text-muted-foreground">{profile.xp} / {xpForNextLevel} XP</span>
                        </div>
                        <Progress value={xpPercentage} />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-300"/> Action Points</span>
                            <span className="text-sm text-muted-foreground">{apStatus?.apNow} / {apStatus?.apMax}</span>
                        </div>
                        <Progress value={apStatus ? (apStatus.apNow / apStatus.apMax) * 100 : 0} />
                    </div>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="secondary">Start 2h Job</Button>
                <Button variant="secondary">Run Easy PvE</Button>
                <Button variant="secondary">Open Safehouse</Button>
            </div>
        </div>
    );
};

export default ProfilePage;



