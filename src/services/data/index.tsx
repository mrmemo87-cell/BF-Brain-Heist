// src/services/data/index.tsx
import { createSupaAPI } from './supa/SupaAPI';
// If you really need mock later: import { createMockAPI } from './mock/MockAPI';

export const api = createSupaAPI();
export type DataAPI = ReturnType<typeof createSupaAPI>;

// simple provider
import React, { createContext, useContext, useMemo } from 'react';
const Ctx = createContext<{ api: DataAPI } | null>(null);

export function DataAPIProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({ api }), []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDataAPI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDataAPI must be used within DataAPIProvider');
  return ctx.api;
}
