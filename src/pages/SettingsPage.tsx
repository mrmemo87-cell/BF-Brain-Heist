
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useDataAPI } from '@/hooks/useDataAPI';
import { useMutation } from '@tanstack/react-query';

const SettingsPage: React.FC = () => {
  const setToken = useAuthStore(state => state.setToken);
  const navigate = useNavigate();
  const api = useDataAPI();

  const logoutMutation = useMutation({
      mutationFn: () => api.logout(),
      onSuccess: () => {
          setToken(null);
          navigate('/login');
      }
  });

  return (
    <div className="space-y-4">
        <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">Settings</h1>
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
                    {logoutMutation.isPending ? 'Logging out...' : 'Log Out'}
                </Button>
            </CardContent>
        </Card>
    </div>
  );
};

export default SettingsPage;


