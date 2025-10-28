
import React from 'react';
import { TopBar } from '@/components/chrome/TopBar';
import { BottomNav } from '@/components/chrome/BottomNav';
import { SideNav } from '@/components/chrome/SideNav';
import { AuthGuard } from '@/components/common/AuthGuard';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground">
        <TopBar />
        <div className="flex">
          <SideNav />
          <main className="flex-1 md:ml-48 pb-16 md:pb-0">
            <div className="container p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
};

