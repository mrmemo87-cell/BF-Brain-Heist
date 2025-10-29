
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataAPI } from '@/services/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToasts } from '@/store/toastStore';
import type { Job } from '../../types';

const JobTimer: React.FC<{ endsAt: string }> = ({ endsAt }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endsAt) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft as { hours: number; minutes: number; seconds: number } | undefined;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    if (!timeLeft || !timeLeft.hours && !timeLeft.minutes && !timeLeft.seconds) {
        return <p className="text-2xl font-bold text-green-400">Ready to Claim</p>;
    }
    
    return (
        <p className="text-2xl font-bold text-cyan-400 font-mono">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
        </p>
    );
};

const JobsPage: React.FC = () => {
    const api = useDataAPI();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToasts();
    
    const { data: jobs, isLoading: jobsLoading } = useQuery({ 
        queryKey: ['jobsCatalog'], 
        queryFn: () => api.jobsCatalog(),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });
    const { data: activeJob, isLoading: activeJobLoading } = useQuery({ 
        queryKey: ['activeJob'], 
        queryFn: () => api.getActiveJob(), 
        refetchInterval: 1000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const startJobMutation = useMutation({
        mutationFn: ({ jobId, autoqueue }: { jobId: string, autoqueue: boolean }) => api.jobStart(jobId, autoqueue),
        onSuccess: () => {
            showSuccess("Job Started", "Your operation is underway.");
            queryClient.invalidateQueries({ queryKey: ['activeJob'] });
        },
        onError: (e: Error) => showError("Start Failed", e.message)
    });

    const claimJobMutation = useMutation({
        mutationFn: () => api.jobClaim(),
        onSuccess: (reward) => {
            showSuccess("Job Claimed!", `You received ${reward.coins} coins and ${reward.xp} XP.`);
            queryClient.invalidateQueries({ queryKey: ['activeJob'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (e: Error) => showError("Claim Failed", e.message)
    });

    if (activeJob) {
        const jobDetails = jobs?.find(j => j.id === activeJob.jobId);
        return (
            <div className="flex flex-col items-center justify-center space-y-6 text-center h-full">
                 <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">Job in Progress</h1>
                <Card className="w-full max-w-md">
                    <CardHeader><CardTitle>{jobDetails?.name}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <JobTimer endsAt={activeJob.endsAt} />
                        <Button
                            className="w-full"
                            onClick={() => claimJobMutation.mutate()}
                            disabled={claimJobMutation.isPending || new Date(activeJob.endsAt) > new Date()}
                        >
                            {claimJobMutation.isPending ? "Claiming..." : "Claim Rewards"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">Available Jobs</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobsLoading ? <p>Loading jobs...</p> : jobs?.map(job => (
                <Card key={job.id}>
                    <CardHeader><CardTitle>{job.name}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <p>Duration: {job.durationMin / 60} hours</p>
                        <p>Rewards: {job.coinReward} coins, {job.xpReward} XP</p>
                        <Button className="w-full" onClick={() => startJobMutation.mutate({ jobId: job.id, autoqueue: false })} disabled={startJobMutation.isPending}>Start Job</Button>
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>
    );
};

export default JobsPage;



