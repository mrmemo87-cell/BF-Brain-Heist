// src/services/data/index.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { createSupaAPI } from './supa/SupaAPI';

export type DataAPI = ReturnType<typeof createSupaAPI>;

const Ctx = createContext<DataAPI | null>(null);

export function DataAPIProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo(() => createSupaAPI(), []);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useDataAPI(): DataAPI {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDataAPI must be used within a DataProvider');
  return ctx;
}
