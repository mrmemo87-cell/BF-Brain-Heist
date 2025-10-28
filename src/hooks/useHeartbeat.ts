// src/hooks/useHeartbeat.ts
import { useEffect } from 'react';
import { supa } from '@/SupabaseClient';
export function useHeartbeat(ms = 60_000) {
  useEffect(() => {
    let t: any;
    const ping = async () => { try { await supa.rpc('user_ping'); } catch {} };
    ping();
    t = setInterval(ping, ms);
    return () => clearInterval(t);
  }, [ms]);
}

