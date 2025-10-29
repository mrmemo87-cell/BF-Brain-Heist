// src/hooks/useHeartbeat.ts
import * as React from 'react';
import { supa } from '../SupabaseClient';

export function useHeartbeat(intervalMs = 60_000) {
  React.useEffect(() => {
    let stopped = false;

    const ping = async () => {
      if (stopped) return;
      if (document.hidden || !navigator.onLine) return;

      try {
        // If your RPC is 'rpc_touch_online', swap the name below.
        const { error } = await supa.rpc('touch_presence');
        // Keep it silent/lightweight to avoid noise or loops
        if (error) {
          // console.debug('heartbeat error', error);
        }
      } catch {
        // Swallow network/transport errors
      }
    };

    // Trigger once on mount (non-blocking)
    void ping();

    // Interval tick (no .catch anywhere)
    const id = window.setInterval(() => {
      void ping();
    }, intervalMs);

    // Opportunistic tick when the tab becomes “active”
    const onFocusLike = () => { void ping(); };
    window.addEventListener('focus', onFocusLike);
    window.addEventListener('online', onFocusLike);
    document.addEventListener('visibilitychange', onFocusLike);

    return () => {
      stopped = true;
      clearInterval(id);
      window.removeEventListener('focus', onFocusLike);
      window.removeEventListener('online', onFocusLike);
      document.removeEventListener('visibilitychange', onFocusLike);
    };
  }, [intervalMs]); // DO NOT include `supa` here; it's a stable singleton
}
