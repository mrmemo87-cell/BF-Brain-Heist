import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supa } from '@/SupabaseClient';

export default function AuthCallback() {
  const nav = useNavigate();

  React.useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code  = url.searchParams.get('code');
      const err   = url.searchParams.get('error') || url.searchParams.get('error_description');

      try {
        if (err) throw new Error(err);
        if (code) {
          try {
            await (supa.auth as any).exchangeCodeForSession?.(code);
          } catch {
            if ((supa.auth as any).getSessionFromUrl) {
              await (supa.auth as any).getSessionFromUrl({ storeSession: true });
            } else {
              throw new Error('No exchange method available');
            }
          }
        }
      } catch (e) {
        console.error('AuthCallback failed:', e);
      } finally {
        // strip code/state/# fragments then go home
        ['code', 'state', 'error', 'error_description', 'type'].forEach(k => url.searchParams.delete(k));
        window.history.replaceState({}, '', url.pathname); // clean to /auth/callback
        nav('/', { replace: true });
      }
    })();
  }, [nav]);

  return (
    <div className="w-full h-screen grid place-items-center text-white">
      Finishing sign-in…
    </div>
  );
}
