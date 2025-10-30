// src/pages/AuthCallback.tsx
import * as React from 'react';
import { supa } from '@/SupabaseClient';

export default function AuthCallback() {
  const [err, setErr] = React.useState<string|null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const href = window.location.href;
        const url = new URL(href);

        // 1) New auth code flow
        const code = url.searchParams.get('code');
        if (code) {
          try {
            await (supa.auth as any).exchangeCodeForSession?.(code);
          } catch {
            if ((supa.auth as any).getSessionFromUrl) {
              await (supa.auth as any).getSessionFromUrl({ storeSession: true });
            } else {
              throw new Error('Could not exchange auth code.');
            }
          }
        }

        // 2) Legacy hash tokens
        if (window.location.hash.includes('access_token')) {
          const h = new URLSearchParams(window.location.hash.slice(1));
          const at = h.get('access_token');
          const rt = h.get('refresh_token');
          try {
            if ((supa.auth as any).setSession && at && rt) {
              await (supa.auth as any).setSession({ access_token: at, refresh_token: rt });
            } else if ((supa.auth as any).getSessionFromUrl) {
              await (supa.auth as any).getSessionFromUrl({ storeSession: true });
            }
          } catch {
            if ((supa.auth as any).getSessionFromUrl) {
              await (supa.auth as any).getSessionFromUrl({ storeSession: true });
            }
          }
        }

        // 3) Some links hit /auth/v1/verify?type=...&token=...
        // Supabase usually verifies then redirects to redirectTo. In case we’re here directly:
        const token = url.searchParams.get('token');
        const type  = url.searchParams.get('type'); // 'signup' | 'recovery' | 'magiclink' | ...
        if (token && (supa.auth as any).verifyOtp) {
          // This path is rare for magic links, but safe to attempt
          await (supa.auth as any).verifyOtp({ token, type: (type as any) || 'magiclink', email: '' }).catch(() => {});
        }

        // Clean URL
        ['code','state','error','error_description','type','token'].forEach(k => url.searchParams.delete(k));
        window.history.replaceState({}, '', url.toString());

        // Done → hard reload to refresh queries
        if (!alive) return;
        window.location.replace('/');
      } catch (e: any) {
        setErr(e?.message || 'Auth callback failed.');
      }
    })();

    return () => { alive = false; };
  }, []);

  return (
    <div className="w-full h-screen grid place-items-center text-white">
      <div className="text-center">
        <div className="text-xl mb-2">Finishing sign-in…</div>
        {err && <div className="text-rose-300 text-sm">{err}</div>}
      </div>
    </div>
  );
}
