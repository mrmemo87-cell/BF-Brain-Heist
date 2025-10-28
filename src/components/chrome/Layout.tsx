
import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="flex">
        <SideNav />
        <main className="flex-1 md:ml-48 pb-16 md:pb-0">
          <div className="container p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

