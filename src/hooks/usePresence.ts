import * as React from 'react';
import { supa } from '@/SupabaseClient';

export function usePresence(intervalMs = 60_000) {
  React.useEffect(() => {
    let timer: any;

    const tick = async () => {
      // keep session warm & update presence
      await supa.auth.refreshSession().catch(() => {});
      await supa.rpc('touch_presence').catch(() => {});
    };

    // initial
    tick();

    // repeat
    timer = setInterval(tick, intervalMs);

    // refresh immediately on focus
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs]);
}
