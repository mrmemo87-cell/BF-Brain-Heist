
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataAPI } from '@/services/data';
import { UPGRADE_DETAILS } from '../../constants';
import type { UpgradeTrack } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToasts } from '@/store/toastStore';
import { motion } from 'framer-motion';

const SafehousePage: React.FC = () => {
    const api = useDataAPI();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToasts();
    
    const { data: upgrades, isLoading } = useQuery({
        queryKey: ['upgrades'],
        queryFn: () => api.upgrades()
    });
    
    const upgradeMutation = useMutation({
        mutationFn: (track: UpgradeTrack) => api.upgrade(track),
        onSuccess: (data) => {
            const details = UPGRADE_DETAILS[data.track];
            showSuccess(`${details.name} Upgraded!`, `Now at Level ${data.level}.`);
            queryClient.invalidateQueries({ queryKey: ['upgrades'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (e: Error) => showError('Upgrade Failed', e.message),
    });

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">Safehouse Upgrades</h1>
            {isLoading ? <p>Loading upgrades...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upgrades?.map(upgrade => {
                    const details = UPGRADE_DETAILS[upgrade.track];
                    const cost = (upgrade.level + 1) * 1000;

                    return (
                        <Card key={upgrade.track}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {details.name}
                                    <motion.span key={upgrade.level} animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.3 }} className="px-2 py-1 text-sm rounded-md bg-secondary">
                                        Lvl {upgrade.level}
                                    </motion.span>
                                </CardTitle>
                                <CardDescription>{details.description(upgrade.level + 1)}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" onClick={() => upgradeMutation.mutate(upgrade.track)} disabled={upgradeMutation.isPending}>
                                    Upgrade ({cost.toLocaleString()} coins)
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            )}
        </div>
    );
};

export default SafehousePage;



