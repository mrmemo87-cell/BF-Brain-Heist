
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';

export const SideNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block w-48 fixed left-0 top-16 h-[calc(100vh-4rem)] border-r border-border/40">
      <nav className="flex flex-col space-y-2 p-4">
        {NAV_ITEMS.map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors ${isActive ? 'text-[hsl(var(--primary))] bg-muted/50' : 'text-muted-foreground'}`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

