
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataAPI } from '@/hooks/useDataAPI';
import type { PvETier } from '../../types';
import { NeonCard } from '@/components/common/NeonCard';
import { Button } from '@/components/ui/Button';
import { useToasts } from '@/store/toastStore';

const PvePage: React.FC = () => {
    const api = useDataAPI();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToasts();

    const pveRunMutation = useMutation({
        mutationFn: (tier: PvETier) => api.pveRun(tier),
        onSuccess: (data, tier) => {
            if (data.outcome === 'success') {
                showSuccess(`Operation Successful!`, `Gained ${data.coins} coins and ${data.xp} XP.`);
            } else {
                showError('Operation Failed', 'No rewards gained.');
            }
            queryClient.invalidateQueries({ queryKey: ['apStatus'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (error: Error) => {
            showError('Operation Error', error.message);
        }
    });

    const tasks = [
        { tier: 'easy', title: 'Data Intercept', ap: 2, rewards: 'Low', glow: 'primary' as const },
        { tier: 'standard', title: 'Node Crack', ap: 3, rewards: 'Medium', glow: 'primary' as const },
        { tier: 'hard', title: 'Mainframe Assault', ap: 4, rewards: 'High', glow: 'accent' as const },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">PvE Operations</h1>
            <div className="p-4 text-center rounded-lg bg-primary/20 border border-primary/50">
                <p className="font-bold text-primary">TodayвЂ™s 3 Ops +10% XP</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tasks.map(task => (
                    <NeonCard
                        key={task.tier}
                        title={task.title}
                        glowColor={task.glow}
                    >
                        <div className="space-y-4 text-center">
                            <p className="text-muted-foreground">Expected rewards: <span className="font-bold text-foreground">{task.rewards}</span></p>
                            <p className="text-2xl font-bold text-yellow-300">{task.ap} AP</p>
                            <Button
                                className="w-full"
                                onClick={() => pveRunMutation.mutate(task.tier as PvETier)}
                                disabled={pveRunMutation.isPending && pveRunMutation.variables === task.tier}
                            >
                                {pveRunMutation.isPending && pveRunMutation.variables === task.tier ? 'Executing...' : 'Run Op'}
                            </Button>
                        </div>
                    </NeonCard>
                ))}
            </div>
        </div>
    );
};

export default PvePage;


