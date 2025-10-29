// src/hooks/useHeartbeat.ts
import { useEffect } from 'react';
import { supa } from '@/SupabaseClient';
export function useHeartbeat(ms = 60_000) {
  React.useEffect(() => {
    const id = setInterval(() => {
      supa.rpc('session_start').catch(() => {}); // swallow; don't crash UI
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}