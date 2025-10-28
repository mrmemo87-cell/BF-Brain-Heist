'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useDataAPI } from '@/lib/hooks/useDataAPI';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Coins, Zap, Shield } from '@/components/icons/Icons';
import { useToasts } from '@/lib/store/toastStore';

const ProfilePage: React.FC = () => {
    const api = useDataAPI();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToasts();

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: () => api.whoAmI(),
    });

    const { data: apStatus, isLoading: apLoading } = useQuery({
        queryKey: ['apStatus'],
        queryFn: () => api.apStatus(),
        refetchInterval: 5000,
    });
    
    const startJobMutation = useMutation({
        mutationFn: () => api.jobStart('job-2', false), // 'job-2' is the 2h job
        onSuccess: () => {
            showSuccess('Job Started', '2-hour job is now in progress.');
            queryClient.invalidateQueries({ queryKey: ['activeJob'] });
            router.push('/jobs');
        },
        onError: (error: Error) => {
            showError('Failed to Start Job', error.message);
        }
    });

    const pveRunMutation = useMutation({
        mutationFn: () => api.pveRun('easy'),
        onSuccess: (data) => {
            if (data.outcome === 'success') {
                showSuccess('PvE Op Complete', `Gained ${data.coins} coins and ${data.xp} XP.`);
            } else {
                showError('PvE Op Failed', 'No rewards gained.');
            }
            queryClient.invalidateQueries({ queryKey: ['apStatus'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (error: Error) => {
            showError('PvE Error', error.message);
        }
    });
    
    const refillApMutation = useMutation({
        mutationFn: () => api.refillAP(),
        onSuccess: () => {
            showSuccess('AP Refilled!', 'Your Action Points are full.');
            queryClient.invalidateQueries({ queryKey: ['apStatus'] });
        },
        onError: (error: Error) => {
            showError('Refill Failed', error.message);
        }
    });

    if (profileLoading || apLoading) {
        return (
            <div className="space-y-6">
                <Card className="overflow-hidden">
                    <div className="h-24 bg-secondary animate-pulse" />
                    <CardContent className="pt-16">
                        <div className="h-8 w-1/2 bg-secondary rounded animate-pulse" />
                        <div className="h-4 w-1/4 bg-secondary rounded animate-pulse mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="h-10 w-full bg-secondary rounded animate-pulse" />
                        <div className="h-10 w-full bg-secondary rounded animate-pulse" />
                    </CardContent>
                </Card>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-10 w-full bg-secondary rounded-md animate-pulse" />
                    <div className="h-10 w-full bg-secondary rounded-md animate-pulse" />
                    <div className="h-10 w-full bg-secondary rounded-md animate-pulse" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return <p>Could not load profile data. Please try logging in again.</p>;
    }
    
    const xpForNextLevel = profile.level * 100;
    const xpPercentage = Math.min((profile.xp / xpForNextLevel) * 100, 100);

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
                        <Progress value={xpPercentage} aria-valuenow={xpPercentage} aria-valuemin={0} aria-valuemax={100} />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-300"/> Action Points</span>
                             { profile.premiumFeatures?.apRefill && (
                                <Button size="sm" variant="ghost" onClick={() => refillApMutation.mutate()} disabled={refillApMutation.isPending}>
                                    {refillApMutation.isPending ? 'Refilling...' : 'Refill'}
                                </Button>
                             )}
                        </div>
                         <div className="flex items-center gap-2">
                            <Progress className="flex-1" value={apStatus ? (apStatus.apNow / apStatus.apMax) * 100 : 0} aria-valuenow={apStatus?.apNow} aria-valuemin={0} aria-valuemax={apStatus?.apMax} />
                            <span className="text-sm text-muted-foreground font-mono w-16 text-right">{apStatus?.apNow} / {apStatus?.apMax}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="secondary" onClick={() => startJobMutation.mutate()} disabled={startJobMutation.isPending}>
                    {startJobMutation.isPending ? 'Starting...' : 'Start 2h Job'}
                </Button>
                <Button variant="secondary" onClick={() => pveRunMutation.mutate()} disabled={pveRunMutation.isPending}>
                    {pveRunMutation.isPending ? 'Running...' : 'Run Easy PvE'}
                </Button>
                <Button variant="secondary" onClick={() => router.push('/safehouse')}>
                    Open Safehouse
                </Button>
            </div>
        </div>
    );
};

export default ProfilePage;
