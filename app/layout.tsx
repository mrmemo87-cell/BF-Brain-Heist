import * as React from 'react';

import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Brain Heist',
  description: 'A mobile-first game UI built with Next.js, featuring a neon/glass theme.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


