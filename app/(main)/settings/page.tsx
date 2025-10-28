'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-4">
        <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">Settings</h1>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Adjust your game settings here soon. For now, focus on the heist!</p>
            </CardContent>
        </Card>
    </div>
  );
};

export default SettingsPage;

