
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useDataAPI } from '@/lib/hooks/useDataAPI';
import { useAuthStore } from '@/lib/store/authStore';
import { useToasts } from '@/lib/store/toastStore';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const api = useDataAPI();
  const setToken = useAuthStore((state) => state.setToken);
  const { showError } = useToasts();

  const loginMutation = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: (data) => {
      setToken(data.token);
      router.push('/profile');
    },
    onError: (error: Error) => {
      showError('Login Failed', error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-sm mx-auto shadow-[var(--glow-accent)]">
          <CardHeader className="text-center">
            <CardTitle>Welcome, Agent</CardTitle>
            <CardDescription>Your next operation awaits.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Your handle"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loginMutation.isPending}
                  aria-required="true"
                  aria-label="Username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Secret key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loginMutation.isPending}
                  aria-required="true"
                  aria-label="Password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending} aria-live="polite">
                {loginMutation.isPending ? 'Connecting...' : 'Enter the Heist'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;

