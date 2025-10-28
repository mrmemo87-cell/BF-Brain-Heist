
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DataProvider } from '@/lib/api';
import { ToastProvider } from '@/components/common/ToastProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        {children}
        <ToastProvider />
      </DataProvider>
    </QueryClientProvider>
  );
}

