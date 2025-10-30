// src/pages/AuthCallback.tsx
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supa } from '@/SupabaseClient';

export default function AuthCallback() {
  const nav = useNavigate();
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) New flow: `?code=...`
        const code = url.searchParams.get('code');
        if (code) {
          try {
            await (supa.auth as any).exchangeCodeForSession?.(code);
          } catch {
            // Fallback for older libs
            if ((supa.auth as any).getSessionFromUrl) {
              await (supa.auth as any).getSessionFromUrl({ storeSession: true });
            } else {
              throw new Error('Could not exchange auth code.');
            }
          }
        } else if (window.location.hash.includes('access_token')) {
          // 2) Legacy flow: `#access_token=...&refresh_token=...`
          const h = new URLSearchParams(window.location.hash.slice(1));
          const at = h.get('access_token');
          const rt = h.get('refresh_token');
          try {
            if ((supa.auth as any).setSession && at && rt) {
              await (supa.auth as any).setSession({ access_token: at, refresh_token: rt });
            } else if ((supa.auth as any).getSessionFromUrl) {
              await (supa.auth as any).getSessionFromUrl({ storeSession: true });
            } else {
              throw new Error('No method available to set session from URL hash.');
            }
          } catch (e) {
            // Some projects use "type=recovery" etc. Still try fallback.
            if ((supa.auth as any).getSessionFromUrl) {
              await (supa.auth as any).getSessionFromUrl({ storeSession: true });
            } else {
              throw e;
            }
          }
        }

        // Clean the URL (remove code/hash/state) so refreshes are safe
        ['code', 'state', 'error', 'error_description', 'type'].forEach(k =>
          url.searchParams.delete(k)
        );
        window.history.replaceState({}, '', url.toString());

        // 3) Done → go home (full reload so queries refetch)
        if (!alive) return;
        window.location.replace('/');
      } catch (e: any) {
        setErr(e?.message || 'Auth callback failed.');
      }
    })();

    return () => {
      alive = false;
    };
    // IMPORTANT: do not add `supa` to deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  return (
    <div className="w-full h-screen grid place-items-center text-white">
      <div className="text-center">
        <div className="text-xl mb-2">Finishing sign-in…</div>
        {err && <div className="text-rose-300 text-sm">{err}</div>}
      </div>
    </div>
  );
}
