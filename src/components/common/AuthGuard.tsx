
'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);
    
    if (!isAuthenticated) {
        return <div className="flex justify-center items-center h-screen">Authenticating...</div>;
    }

    return <>{children}</>;
}

