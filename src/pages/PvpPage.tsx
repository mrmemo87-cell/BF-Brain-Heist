
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataAPI } from '@/services/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToasts } from '@/store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';

const PvpPage: React.FC = () => {
    const api = useDataAPI();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToasts();
    
    const { data: targets, isLoading } = useQuery({
        queryKey: ['raidTargets'],
        queryFn: () => api.raidTargets(),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const attackMutation = useMutation({
        mutationFn: (targetId: string) => api.raidAttack(targetId),
        onSuccess: (result) => {
            if (result.win) {
                showSuccess('Raid Successful!', result.message);
                // Simple confetti effect could be added here
            } else {
                showError('Raid Failed', result.message);
            }
            queryClient.invalidateQueries({ queryKey: ['raidTargets'] });
            queryClient.invalidateQueries({ queryKey: ['apStatus'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (error: Error) => {
            showError('Attack Error', error.message);
        }
    });

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">PvP Raid Targets</h1>
            {isLoading ? (
                <p>Scanning for targets...</p>
            ) : (
                <AnimatePresence>
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {targets?.map(target => (
                            <motion.div
                                key={target.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle>{target.username}</CardTitle>
                                            <span className={`text-xs px-2 py-1 rounded-full bg-[hsl(var(--primary)_/_0.2)] text-[hsl(var(--primary))]`}>
                                                Batch {target.batch}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-around text-center">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Level</p>
                                                <p className="text-xl font-bold">{target.level}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Power</p>
                                                <p className="text-xl font-bold">{target.power}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Raids</p>
                                                <p className="text-xl font-bold">{target.raidsToday}/{target.raidsCap}</p>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={() => attackMutation.mutate(target.id)}
                                            disabled={target.raidsToday >= target.raidsCap || attackMutation.isPending}
                                        >
                                            {target.raidsToday >= target.raidsCap ? 'Bashing Limit Reached' : 'Attack (1 AP)'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default PvpPage;



